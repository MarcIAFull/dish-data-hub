// Checkout Agent - Specialized in order finalization

import { getCheckoutPrompt } from '../utils/prompt-templates.ts';
import type { CheckoutContext } from '../utils/context-builder.ts';

/**
 * Checkout Agent tools - focused on delivery and payment
 */
export function getCheckoutTools() {
  return [
    {
      type: "function",
      function: {
        name: "validate_delivery_address",
        description: "Valida endereço de entrega e calcula taxa baseado em zona de entrega",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Endereço completo (rua, número)"
            },
            city: {
              type: "string",
              description: "Cidade"
            },
            zip_code: {
              type: "string",
              description: "CEP (opcional)"
            }
          },
          required: ["address", "city"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_payment_methods",
        description: "Lista formas de pagamento aceitas pelo restaurante",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    },
    {
      type: "function",
      function: {
        name: "check_order_prerequisites",
        description: "Verifica se todos os pré-requisitos foram atendidos antes de criar pedido (carrinho, endereço, pagamento)",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    },
    {
      type: "function",
      function: {
        name: "create_order",
        description: "Cria o pedido final com todos os dados coletados",
        parameters: {
          type: "object",
          properties: {
            customer_name: {
              type: "string",
              description: "Nome completo do cliente"
            },
            customer_phone: {
              type: "string",
              description: "Telefone do cliente"
            },
            delivery_address: {
              type: "string",
              description: "Endereço completo de entrega"
            },
            payment_method: {
              type: "string",
              description: "Forma de pagamento escolhida"
            },
            change_for: {
              type: "number",
              description: "Valor para troco (se pagamento em dinheiro)"
            },
            notes: {
              type: "string",
              description: "Observações gerais do pedido"
            }
          },
          required: ["customer_name", "customer_phone", "delivery_address", "payment_method"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_cart_summary",
        description: "Retorna resumo completo do carrinho atual",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    }
  ];
}

/**
 * Process Checkout Agent response
 */
export async function processCheckoutAgent(
  context: CheckoutContext,
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

  console.log(`[${requestId}] 💳 Checkout Agent activated`);

  const systemPrompt = getCheckoutPrompt(context);
  const tools = getCheckoutTools();

  // Prepare conversation history (last 8 messages for checkout context)
  const conversationHistory = messages.slice(-8).map(m => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  console.log(`[${requestId}] 🤖 Calling OpenAI (Checkout Agent, ${conversationHistory.length} messages)...`);

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
      max_completion_tokens: 1500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message;

  console.log(`[${requestId}] 📊 Checkout Agent Response:`, {
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
