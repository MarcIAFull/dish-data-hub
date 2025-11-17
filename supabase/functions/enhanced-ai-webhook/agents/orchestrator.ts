// 🎯 Orchestrator Agent - Simplified Architecture
// Decides which specialized agent should handle the user's message

interface OrchestratorDecision {
  agent: 'MENU' | 'SALES' | 'CHECKOUT' | 'SUPPORT';
  reasoning: string;
}

/**
 * Decides which specialized agent should handle the message
 * Uses OpenAI to make intelligent routing decision based on:
 * - User message content
 * - Conversation context (cart, state)
 * - Restaurant information
 */
export async function decideAgent(
  userMessage: string,
  conversationContext: {
    hasItemsInCart: boolean;
    itemCount: number;
    cartTotal: number;
    currentState: string;
    restaurantName: string;
  },
  requestId: string
): Promise<OrchestratorDecision> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    console.error(`[${requestId}] ❌ OPENAI_API_KEY not configured`);
    return { agent: 'MENU', reasoning: 'No API key - default to MENU' };
  }

  const prompt = `Você é o Orquestrador do ${conversationContext.restaurantName}.

CONTEXTO ATUAL:
- Carrinho: ${conversationContext.hasItemsInCart ? `${conversationContext.itemCount} itens (R$ ${conversationContext.cartTotal.toFixed(2)})` : 'VAZIO'}
- Estado: ${conversationContext.currentState}

MENSAGEM DO CLIENTE:
"${userMessage}"

AGENTES DISPONÍVEIS:

1. MENU - Quando cliente quer ver cardápio ou produtos disponíveis
   Exemplos: "cardápio", "o que tem?", "quais os pratos?"

2. SALES - Quando cliente quer fazer pedido, adicionar produtos
   Exemplos: "quero X", "vou levar", "me traz", "adiciona"

3. CHECKOUT - Quando cliente quer finalizar pedido (APENAS se carrinho NÃO está vazio)
   Exemplos: "finalizar", "pagar", "qual o endereço?", "qual forma de pagamento?"

4. SUPPORT - Quando cliente tem dúvidas gerais, horário, localização
   Exemplos: "que horas abre?", "onde fica?", "como funciona?"

REGRAS CRÍTICAS:
- Se carrinho está VAZIO → NUNCA escolha CHECKOUT
- Se cliente menciona produto específico → SALES
- Se cliente pede cardápio → MENU
- Se cliente quer finalizar mas carrinho vazio → SALES (ajudar a adicionar produtos primeiro)

RESPONDA EM JSON:
{
  "agent": "MENU" | "SALES" | "CHECKOUT" | "SUPPORT",
  "reasoning": "breve explicação da escolha"
}`;

  console.log(`[${requestId}] [2/5] 🎯 Orquestrador decidindo agente...`);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
      return { agent: 'MENU', reasoning: 'API error - default to MENU' };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log(`[${requestId}] ✅ Agente escolhido: ${result.agent} (${result.reasoning})`);
    
    return {
      agent: result.agent,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error(`[${requestId}] ❌ Error in orchestrator:`, error);
    return { agent: 'MENU', reasoning: 'Error - default to MENU' };
  }
}

/**
 * Orchestrator can call multiple agents sequentially if needed
 * For now, we keep it simple with single agent calls
 * Future enhancement: Support multi-agent workflows
 */
export function shouldCallAdditionalAgents(
  firstAgentResult: any,
  conversationContext: any
): boolean {
  // Example: If SALES added items but cart still needs more info → call CHECKOUT
  // For v1, we keep it simple: one agent per message
  return false;
}
