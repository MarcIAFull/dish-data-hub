// 📋 Menu Agent - Simplified

import { getMenuPrompt } from '../utils/prompts.ts';
import { getProductTools } from '../tools/product-tools.ts';

// 🔍 FASE 1: Detectar perguntas sobre produtos para forçar check_product_availability
function isProductInquiry(message: string): boolean {
  const msg = message.toLowerCase();
  const inquiryKeywords = [
    /\b(quanto custa|qual o preço|preço|tem|quais|cardápio|menu)\b/,
    /\bquanto (é|fica|sai|custa)\b/,
    /\btem\s+\w+/  // "tem açaí", "tem tapioca"
  ];
  return inquiryKeywords.some(pattern => pattern.test(msg));
}

export async function processMenuAgent(
  userMessage: string,
  conversationHistory: any[],
  context: {
    restaurantName: string;
    menuLink?: string;
    enrichedContext?: any;
  },
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('OPENAI_API_KEY not configured');
  
  console.log(`[${requestId}] [3/5] 📋 Agente MENU processando (consulta de produtos)...`);
  
  // 🔍 FASE 2: Incluir produtos pendentes no prompt
  const metadata = context.enrichedContext?.metadata || {};
  const pendingProducts = metadata.pending_products || [];
  const pendingProductsNote = pendingProducts.length > 0
    ? `\n\n⚠️ PRODUTOS MENCIONADOS ANTERIORMENTE: ${pendingProducts.map((p: any) => `${p.name} (R$ ${p.price})`).join(', ')}\nSe o cliente perguntar sobre "esses produtos" ou usar pronomes, refira-se a esta lista.`
    : '';
  
  const systemPrompt = getMenuPrompt(context, context.enrichedContext) + pendingProductsNote;
  
  // MENU agent only has product inquiry tools - NO cart manipulation
  const tools = [
    ...getProductTools(),
    {
      type: "function",
      function: {
        name: "send_menu_link",
        description: "Envia link do cardápio completo (usar apenas quando cliente pedir explicitamente)",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    }
  ];
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-3).map((msg: any) => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];
  
  // 🔍 FASE 1: Forçar check_product_availability em perguntas sobre produtos
  const isInquiry = isProductInquiry(userMessage);
  const requestBody: any = {
    model: 'gpt-4o',
    messages,
    tools,
    max_tokens: 400
  };
  
  if (isInquiry) {
    requestBody.tool_choice = {
      type: "function",
      function: { name: "check_product_availability" }
    };
    console.log(`[${requestId}] 🎯 MENU: Pergunta sobre produto detectada, forçando check_product_availability`);
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
  
  console.log(`[${requestId}] ✅ MENU agent processou`);
  
  return {
    content: message.content || '',
    toolCalls: message.tool_calls
  };
}
