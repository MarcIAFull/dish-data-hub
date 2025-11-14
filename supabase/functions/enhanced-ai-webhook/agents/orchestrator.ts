// Orchestrator Agent - Intent Classification

import { getOrchestratorPrompt } from '../utils/prompt-templates.ts';
import type { ConversationState } from '../utils/context-builder.ts';

export type Intent = 'GREETING' | 'MENU' | 'ORDER' | 'CHECKOUT' | 'SUPPORT' | 'UNCLEAR';

/**
 * Classifies user intent using lightweight AI call
 */
export async function classifyIntent(
  lastMessages: any[],
  conversationState: ConversationState,
  requestId: string
): Promise<Intent> {
  try {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error(`[${requestId}] ❌ OPENAI_API_KEY not configured`);
      return 'UNCLEAR';
    }

    // Usar TODAS as mensagens (não fazer slice)
    const recentMessages = lastMessages;
    const messagesText = recentMessages
      .map(m => `${m.sender_type === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`)
      .join('\n');

    const prompt = getOrchestratorPrompt(messagesText, conversationState);

    console.log(`[${requestId}] 🎯 Orchestrator - Starting classification...`);
    console.log(`[${requestId}] 📊 Input:`);
    console.log(`  - Total messages: ${lastMessages.length}`);
    console.log(`  - Last message: "${lastMessages[lastMessages.length - 1]?.content?.substring(0, 100)}"`);
    console.log(`  - Cart: ${conversationState.itemCount} items (R$ ${conversationState.cartTotal})`);
    console.log(`  - Has greeted: ${conversationState.hasGreeted}`);
    console.log(`[${requestId}] 🤖 Calling OpenAI (gpt-4o)...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt }
        ],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
      return 'UNCLEAR';
    }

    const data = await response.json();
    const rawIntent = data.choices[0].message.content.trim().toUpperCase();
    
    console.log(`[${requestId}] 📥 OpenAI Response: "${rawIntent}"`);
    console.log(`[${requestId}] 📊 Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
    
    const intent = rawIntent as Intent;

    console.log(`[${requestId}] ✅ Intent classified: ${intent}`);

    // Validate intent
    const validIntents: Intent[] = ['GREETING', 'MENU', 'ORDER', 'CHECKOUT', 'SUPPORT', 'UNCLEAR'];
    if (!validIntents.includes(intent)) {
      console.warn(`[${requestId}] ⚠️ Invalid intent: ${intent}, defaulting to UNCLEAR`);
      return 'UNCLEAR';
    }

    return intent;

  } catch (error) {
    console.error(`[${requestId}] ❌ Error classifying intent:`, error);
    return 'UNCLEAR';
  }
}

/**
 * Routes to appropriate agent based on intent and conversation state
 */
export function routeToAgent(
  intent: Intent,
  conversationState: ConversationState
): 'SALES' | 'CHECKOUT' | 'MENU' | 'SUPPORT' | 'FALLBACK' {
  // GREETING → Welcome + present menu (MENU agent)
  if (intent === 'GREETING' && !conversationState.hasGreeted) {
    return 'MENU';
  }

  // MENU → Show menu (MENU agent)
  if (intent === 'MENU') {
    return 'MENU';
  }

  // ORDER → Sales specialist (SALES agent)
  if (intent === 'ORDER') {
    return 'SALES';
  }

  // CHECKOUT → Finalize order (CHECKOUT agent)
  if (intent === 'CHECKOUT') {
    return 'CHECKOUT';
  }

  // SUPPORT → Customer support (SUPPORT agent)
  if (intent === 'SUPPORT') {
    return 'SUPPORT';
  }

  // UNCLEAR - route based on conversation state
  if (intent === 'UNCLEAR') {
    // First contact → welcome with menu
    if (!conversationState.hasGreeted) {
      console.log(`[Routing] UNCLEAR + no greeting → MENU Agent`);
      return 'MENU';
    }
    
    // Cart empty → probably wants menu/order
    if (!conversationState.hasItemsInCart) {
      console.log(`[Routing] UNCLEAR + cart empty → MENU Agent`);
      return 'MENU';
    }
    
    // Has cart but not finalized → continue selling
    if (conversationState.hasItemsInCart && !conversationState.hasValidatedAddress) {
      console.log(`[Routing] UNCLEAR + cart not finalized → SALES Agent`);
      return 'SALES';
    }
    
    // Default safe option
    console.log(`[Routing] UNCLEAR default → SALES Agent`);
    return 'SALES';
  }

  // Default fallback (should rarely happen now)
  return 'FALLBACK';
}
