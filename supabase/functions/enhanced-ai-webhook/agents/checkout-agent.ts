// 💳 Checkout Agent - Simplified

import { getCheckoutPrompt } from '../utils/prompts.ts';
import { getAddressTools } from '../tools/address-tools.ts';
import { getPaymentTools } from '../tools/payment-tools.ts';
import { getCheckoutSpecificTools } from '../tools/checkout-tools.ts'; // ✅ FASE 3

export async function processCheckoutAgent(
  userMessage: string,
  conversationHistory: any[],
  context: {
    restaurantName: string;
    currentCart: any[];
    cartTotal: number;
    deliveryFee: number;
    enrichedContext?: any;  // ✅ FASE 5
  },
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('OPENAI_API_KEY not configured');
  
  console.log(`[${requestId}] [3/5] 💳 Agente CHECKOUT processando...`);
  
  const systemPrompt = getCheckoutPrompt(context, context.enrichedContext);  // ✅ FASE 5
  
  const tools = [
    ...getAddressTools(),
    ...getPaymentTools(),
    ...getCheckoutSpecificTools(), // ✅ FASE 3: Ferramentas inteligentes
    {
      type: "function",
      function: {
        name: "create_order",
        description: "Cria o pedido final (usar apenas quando tiver endereço validado E pagamento escolhido)",
        parameters: {
          type: "object",
          properties: {
            payment_method: { type: "string" },
            delivery_type: { type: "string", enum: ["delivery", "pickup"] }
          },
          required: ["payment_method", "delivery_type"]
        }
      }
    }
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
  
  console.log(`[${requestId}] ✅ CHECKOUT agent processou`);
  
  return {
    content: message.content || '',
    toolCalls: message.tool_calls
  };
}
