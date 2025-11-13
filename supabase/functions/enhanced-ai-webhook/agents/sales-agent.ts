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
        description: "Verifica se um produto está disponível e retorna informações detalhadas (nome, preço, descrição)",
        parameters: {
          type: "object",
          properties: {
            product_name: {
              type: "string",
              description: "Nome do produto que o cliente quer verificar (ex: 'pizza margherita', 'coca cola')"
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
        description: "Adiciona um produto ao carrinho/pedido do cliente",
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
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log(`[${requestId}] 🛒 Sales Agent activated`);

  const systemPrompt = getSalesPrompt(context, agent.personality, agent.tone);

  console.log(`[${requestId}] 🛒 Sales Agent activated`);

  const systemPrompt = getSalesPrompt(context);
  const tools = getSalesTools();

  // Prepare conversation history (last 10 messages)
  const conversationHistory = messages.slice(-10).map(m => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  console.log(`[${requestId}] 🤖 Calling OpenAI (Sales Agent, ${conversationHistory.length} messages)...`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      tools,
      tool_choice: 'auto',
      max_completion_tokens: 1000
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
