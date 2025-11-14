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
        description: "SEMPRE use quando cliente fornecer endereço de entrega (ex: 'Rua ABC 123', 'moro na rua X'). Valida o endereço e retorna taxa de entrega calculada baseada nas zonas de entrega cadastradas.",
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
        description: "SEMPRE use quando cliente perguntar sobre pagamento (ex: 'como posso pagar?', 'aceita cartão?', 'formas de pagamento', 'qual o PIX?'). Busca métodos de pagamento atualizados do banco de dados.",
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
        description: "SEMPRE use ANTES de create_order. Valida se todos os pré-requisitos foram atendidos: carrinho não vazio, endereço validado, forma de pagamento escolhida. Retorna status detalhado de cada requisito.",
        parameters: {
          type: "object",
          properties: {}
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
    },
    {
      type: "function",
      function: {
        name: "create_order",
        description: "Use APENAS quando check_order_prerequisites retornar sucesso. Cria o pedido final no sistema com todos os dados coletados (carrinho, endereço validado, pagamento escolhido).",
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

  console.log(`[${requestId}] 💳 Checkout Agent - Starting processing...`);
  console.log(`[${requestId}] 📊 Context:`);
  console.log(`  - Restaurant: ${context.restaurantName}`);
  console.log(`  - Cart items: ${context.currentCart?.length || 0}`);
  console.log(`  - Cart total: R$ ${context.cartTotal || 0}`);
  console.log(`  - Delivery zones: ${context.deliveryZones?.length || 0}`);
  console.log(`  - Payment methods: ${context.paymentMethods?.length || 0}`);

  const systemPrompt = getCheckoutPrompt(context, agent?.personality, agent?.tone);
  const tools = getCheckoutTools();

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
