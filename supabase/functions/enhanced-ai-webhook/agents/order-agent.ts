// 🛒 Order Agent - Builds the customer's cart

import { getOrderPrompt } from '../utils/prompts.ts';
import { getCartTools } from '../tools/cart-tools.ts';
import { getProductTools } from '../tools/product-tools.ts';

export async function processOrderAgent(
  userMessage: string,
  conversationHistory: any[],
  context: {
    restaurantName: string;
    currentCart: any[];
    cartTotal: number;
    currentState: string;
    enrichedContext?: any;
  },
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('OPENAI_API_KEY not configured');
  
  console.log(`[${requestId}] [3/5] 🛒 Agente ORDER processando:`, {
    message: userMessage.substring(0, 50) + '...',
    cartItems: context.currentCart.length,
    cartTotal: context.cartTotal,
    currentState: context.currentState
  });
  
  const systemPrompt = getOrderPrompt(context, context.enrichedContext);
  
  const tools = [
    ...getCartTools(),
    ...getProductTools() // Para consultar preço se necessário
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
  
  console.log(`[${requestId}] ✅ ORDER agent processou`);
  
  return {
    content: message.content || '',
    toolCalls: message.tool_calls
  };
}
