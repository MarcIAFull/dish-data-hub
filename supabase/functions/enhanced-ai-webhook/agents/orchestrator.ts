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

    // Get last 3 messages for context
    const recentMessages = lastMessages.slice(-3);
    const messagesText = recentMessages
      .map(m => `${m.sender_type === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`)
      .join('\n');

    const prompt = getOrchestratorPrompt(messagesText, conversationState);

    console.log(`[${requestId}] 🎯 Classifying intent with orchestrator...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        messages: [
          { role: 'system', content: prompt }
        ],
        max_completion_tokens: 10,
        temperature: 0.3 // Low temperature for consistent classification
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
      return 'UNCLEAR';
    }

    const data = await response.json();
    const intent = data.choices[0].message.content.trim().toUpperCase() as Intent;

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
  // Also route to CHECKOUT if has items and intent is CHECKOUT
  if (intent === 'CHECKOUT' || (conversationState.hasItemsInCart && intent === 'UNCLEAR')) {
    return 'CHECKOUT';
  }

  // SUPPORT → Customer support (SUPPORT agent)
  if (intent === 'SUPPORT') {
    return 'SUPPORT';
  }

  // UNCLEAR - route based on conversation state
  if (intent === 'UNCLEAR') {
    // Has greeted but no items → probably wants menu
    if (conversationState.hasGreeted && !conversationState.hasItemsInCart) {
      return 'MENU';
    }
    // Has items → probably wants to continue shopping
    if (conversationState.hasItemsInCart) {
      return 'SALES';
    }
    // First contact → welcome with menu
    if (!conversationState.hasGreeted) {
      return 'MENU';
    }
  }

  // Default fallback (should rarely happen now)
  return 'FALLBACK';
}
