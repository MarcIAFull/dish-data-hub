// Sales Agent - Specialized in selling products

import { getSalesPrompt } from '../utils/prompt-templates.ts';
import type { SalesContext } from '../utils/context-builder.ts';

/**
 * Sales Agent tools - focused on product discovery and cart management
 */
export function getSalesTools() {
  return [
    {
      type: "function",
      function: {
        name: "check_product_availability",
        description: "SEMPRE use quando cliente perguntar sobre produto ESPECÍFICO (ex: 'quero pizza margherita', 'tem coca cola?', 'quanto custa X?', 'me fala do produto Y'). Busca dados atualizados do banco de dados: nome completo, preço, descrição detalhada, disponibilidade, modificadores disponíveis.",
        parameters: {
          type: "object",
          properties: {
            product_name: {
              type: "string",
              description: "Nome do produto que o cliente quer saber (ex: 'pizza margherita', 'coca cola')"
            }
          },
          required: ["product_name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "add_item_to_order",
        description: "SEMPRE use IMEDIATAMENTE após cliente confirmar que quer um produto (ex: 'quero', 'pode ser', 'sim', 'quero X', 'me manda'). Adiciona o produto ao carrinho/pedido. OBRIGATÓRIO para processar vendas. NÃO confirme vendas sem adicionar ao carrinho!",
        parameters: {
          type: "object",
          properties: {
            product_name: {
              type: "string",
              description: "Nome EXATO do produto conforme aparece no cardápio"
            },
            quantity: {
              type: "integer",
              description: "Quantidade do produto (padrão: 1)"
            },
            unit_price: {
              type: "number",
              description: "Preço unitário do produto"
            },
            notes: {
              type: "string",
              description: "Observações do cliente (ex: 'sem cebola', 'ponto da carne mal passado')"
            }
          },
          required: ["product_name", "unit_price"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_cart_summary",
        description: "Retorna resumo completo do carrinho atual (itens, quantidades, valores, total)",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    }
  ];
}

/**
 * Process Sales Agent response
 */
export async function processSalesAgent(
  context: SalesContext,
  messages: any[],
  chatId: number,
  supabase: any,
  agent: any,
  currentState: string,
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log(`[${requestId}] 🛒 Sales Agent - Starting processing...`);
  console.log(`[${requestId}] 📊 Context:`);
  console.log(`  - Restaurant: ${context.restaurantName}`);
  console.log(`  - Categories: ${context.categories?.length || 0}`);
  console.log(`  - Popular products: ${context.popularProducts?.length || 0}`);
  console.log(`  - Cart items: ${context.currentCart?.length || 0}`);
  console.log(`  - Cart total: R$ ${context.cartTotal || 0}`);

  const systemPrompt = getSalesPrompt(context, currentState, agent?.personality, agent?.tone);
  const tools = getSalesTools();

  // Usar histórico completo (não fazer slice)
  const conversationHistory = messages.map(m => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  console.log(`[${requestId}] 📥 Conversation history: ${conversationHistory.length} messages`);
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
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      tools,
      tool_choice: 'auto',
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message;

  console.log(`[${requestId}] 📊 Sales Agent Response:`, {
    has_content: !!assistantMessage.content,
    content_length: assistantMessage.content?.length || 0,
    has_tool_calls: !!assistantMessage.tool_calls,
    tool_calls_count: assistantMessage.tool_calls?.length || 0,
    finish_reason: data.choices[0].finish_reason,
    tokens: data.usage
  });

  return {
    content: assistantMessage.content || '',
    toolCalls: assistantMessage.tool_calls || []
  };
}
