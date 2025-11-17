// 🛒 Sales Agent - Simplified

import { getSalesPrompt } from '../utils/prompts.ts';
import { getProductTools } from '../tools/product-tools.ts';
import { getOrderTools } from '../tools/order-tools.ts';
import { getSalesSpecificTools } from '../tools/sales-tools.ts'; // ✅ FASE 3

export async function processSalesAgent(
  userMessage: string,
  conversationHistory: any[],
  context: {
    restaurantName: string;
    currentCart: any[];
    cartTotal: number;
    currentState: string;
    enrichedContext?: any;  // ✅ FASE 5
  },
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('OPENAI_API_KEY not configured');
  
  console.log(`[${requestId}] [3/5] 🛒 Agente SALES processando:`, {
    message: userMessage.substring(0, 50) + '...',
    cartItems: context.currentCart.length,
    cartTotal: context.cartTotal,
    currentState: context.currentState
  });
  
  const systemPrompt = getSalesPrompt(context, context.enrichedContext);  // ✅ FASE 5
  
  const tools = [
    ...getProductTools(),
    ...getOrderTools(),
    ...getSalesSpecificTools() // ✅ FASE 3: Ferramentas inteligentes
  ];
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-5).map((msg: any) => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      tools,
      max_tokens: 500
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  const message = data.choices[0].message;
  
  console.log(`[${requestId}] ✅ SALES agent processou`);
  
  return {
    content: message.content || '',
    toolCalls: message.tool_calls
  };
}
