// Multi-Intent Orchestrator - Detects multiple user intentions

import type { ConversationState } from '../utils/context-builder.ts';

export type IntentType = 'GREETING' | 'MENU' | 'ORDER' | 'LOGISTICS' | 'PAYMENT' | 'CHECKOUT' | 'SUPPORT' | 'UNCLEAR';

export interface DetectedIntent {
  type: IntentType;
  confidence: number;
  extractedData: Record<string, any>;
  priority: number;
}

/**
 * Classifies multiple user intentions using OpenAI function calling
 */
export async function classifyMultipleIntents(
  lastMessages: any[],
  conversationState: ConversationState,
  requestId: string
): Promise<DetectedIntent[]> {
  try {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error(`[${requestId}] ❌ OPENAI_API_KEY not configured`);
      return [{ type: 'UNCLEAR', confidence: 0.5, extractedData: {}, priority: 1 }];
    }

    const recentMessages = lastMessages.slice(-10);
    const messagesText = recentMessages
      .map(m => `${m.sender_type === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`)
      .join('\n');

    const lastUserMessage = lastMessages[lastMessages.length - 1]?.content || '';

    const systemPrompt = `Você é um classificador de intenções para pedidos de restaurante.

CONTEXTO:
${messagesText}

ESTADO ATUAL: ${conversationState}

ANALISE a última mensagem do cliente e identifique TODAS as intenções presentes.

INTENÇÕES POSSÍVEIS:
- GREETING: Saudações, "oi", "bom dia"
- MENU: Pedir cardápio, ver produtos, "quais pizzas tem?"
- ORDER: Adicionar produtos, "quero X", "me manda Y"
- LOGISTICS: Definir entrega/retirada, endereço, "vou retirar", "entrega em X"
- PAYMENT: Método de pagamento, "vou pagar com cartão"
- CHECKOUT: Finalizar pedido, "confirma", "fechar pedido"
- SUPPORT: Dúvidas, horário, telefone

REGRAS:
1. Uma mensagem pode ter MÚLTIPLAS intenções
2. Extraia dados específicos (nomes de produtos, endereço, etc)
3. Prioridade: 1 (mais urgente) a 5 (menos urgente)
4. Exemplos:
   - "quero hambúrguer e coca, vou retirar" → [ORDER (produtos), LOGISTICS (retirada)]
   - "me mostra as pizzas e já quero calabresa" → [MENU (pizzas), ORDER (calabresa)]
   - "qual o endereço de vocês?" → [SUPPORT]

ÚLTIMA MENSAGEM: "${lastUserMessage}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "detect_intents",
            description: "Detecta múltiplas intenções na mensagem do usuário",
            parameters: {
              type: "object",
              properties: {
                intents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["GREETING", "MENU", "ORDER", "LOGISTICS", "PAYMENT", "CHECKOUT", "SUPPORT", "UNCLEAR"]
                      },
                      confidence: {
                        type: "number",
                        description: "0.0 a 1.0"
                      },
                      extractedData: {
                        type: "object",
                        description: "Dados extraídos (produtos, endereço, tipo de entrega, etc)"
                      },
                      priority: {
                        type: "number",
                        description: "1 (urgente) a 5 (baixo)"
                      }
                    },
                    required: ["type", "confidence", "priority"]
                  }
                }
              },
              required: ["intents"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "detect_intents" } },
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
      return [{ type: 'UNCLEAR', confidence: 0.5, extractedData: {}, priority: 1 }];
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      console.warn(`[${requestId}] ⚠️ No tool call received, defaulting to UNCLEAR`);
      return [{ type: 'UNCLEAR', confidence: 0.5, extractedData: {}, priority: 1 }];
    }

    const args = JSON.parse(toolCall.function.arguments);
    const detectedIntents: DetectedIntent[] = args.intents || [];

    console.log(`[${requestId}] 🎯 Multi-Intent Detection:`);
    detectedIntents.forEach((intent, i) => {
      console.log(`  ${i + 1}. ${intent.type} (conf: ${intent.confidence}, pri: ${intent.priority})`);
      if (Object.keys(intent.extractedData || {}).length > 0) {
        console.log(`     Data:`, JSON.stringify(intent.extractedData));
      }
    });

    // Sort by priority (1 = highest)
    return detectedIntents.sort((a, b) => a.priority - b.priority);

  } catch (error) {
    console.error(`[${requestId}] ❌ Error in multi-intent classification:`, error);
    return [{ type: 'UNCLEAR', confidence: 0.5, extractedData: {}, priority: 1 }];
  }
}
