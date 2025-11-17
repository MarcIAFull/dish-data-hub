// 🛒 Order Agent - Builds the customer's cart

import { getOrderPrompt } from '../utils/prompts.ts';
import { getCartTools } from '../tools/cart-tools.ts';
import { getProductTools } from '../tools/product-tools.ts';

// 🔍 FASE 1: Detectar pedidos diretos para forçar add_item_to_order
function isDirectOrder(message: string): boolean {
  const msg = message.toLowerCase();
  const directOrderKeywords = [
    /\b(quero|adiciona|me traz|fecha com|pode me mandar|manda|coloca)\b/,
    /\be um(a)?\s+\w+/,  // "e uma coca", "e um açaí"
    /^\w+\s*,?\s*por favor/i  // "tapioca, por favor"
  ];
  return directOrderKeywords.some(pattern => pattern.test(msg));
}

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
  
  // 🔍 FASE 2: Incluir produtos pendentes no prompt
  const metadata = context.enrichedContext?.metadata || {};
  const pendingProducts = metadata.pending_products || [];
  const pendingProductsNote = pendingProducts.length > 0
    ? `\n\n⚠️ PRODUTOS MENCIONADOS ANTERIORMENTE: ${pendingProducts.map((p: any) => `${p.name} (R$ ${p.price})`).join(', ')}\nSe o cliente confirmar, adicione estes produtos ao carrinho.`
    : '';
  
  const systemPrompt = getOrderPrompt(context, context.enrichedContext) + pendingProductsNote;
  
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
  
  // 🔍 FASE 1: Forçar add_item_to_order em pedidos diretos
  const isDirect = isDirectOrder(userMessage);
  const requestBody: any = {
    model: 'gpt-4o',
    messages,
    tools,
    max_tokens: 500
  };
  
  if (isDirect) {
    requestBody.tool_choice = {
      type: "function",
      function: { name: "add_item_to_order" }
    };
    console.log(`[${requestId}] 🎯 ORDER: Pedido direto detectado, forçando add_item_to_order`);
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
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
