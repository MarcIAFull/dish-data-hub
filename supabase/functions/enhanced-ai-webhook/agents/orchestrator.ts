// 🎯 Orchestrator Agent - Simplified Architecture
// Decides which specialized agent should handle the user's message

interface OrchestratorDecision {
  agent: 'GREETING' | 'MENU' | 'ORDER' | 'CHECKOUT' | 'SUPPORT';
  reasoning: string;
}

import { ConversationState } from '../types/conversation-states.ts';

export async function decideAgent(
  userMessage: string,
  conversationContext: {
    hasItemsInCart: boolean;
    itemCount: number;
    cartTotal: number;
    currentState: ConversationState | string;
    restaurantName: string;
    messageCount: number;
  },
  requestId: string
): Promise<OrchestratorDecision> {
  
  console.log(`[${requestId}] [2/5] 🤔 Orquestrador analisando mensagem...`);
  
  const msg = userMessage.toLowerCase();
  
  // 1. SUPPORT (prioridade ALTA - sempre que for dúvida geral)
  if (msg.includes('horário') || msg.includes('onde fica') || 
      msg.includes('telefone') || msg.includes('endereço do restaurante') ||
      msg.includes('reclamação') || msg.includes('falar com atendente')) {
    console.log(`[${requestId}] ✅ SUPPORT: Dúvida geral detectada`);
    return { agent: 'SUPPORT', reasoning: 'Pergunta sobre horário/localização/contato' };
  }
  
  // 2. CHECKOUT (se carrinho não vazio + quer finalizar)
  if (conversationContext.hasItemsInCart && 
      (msg.includes('finalizar') || msg.includes('é só isso') || 
       msg.includes('fechar pedido') || msg.includes('só isso') ||
       msg.includes('pode finalizar'))) {
    console.log(`[${requestId}] ✅ CHECKOUT: Cliente quer finalizar (${conversationContext.itemCount} itens)`);
    return { agent: 'CHECKOUT', reasoning: 'Cliente quer finalizar pedido com itens no carrinho' };
  }
  
  // 3. ORDER (se cliente confirma ou pede diretamente)
  const isConfirmation = /^(sim|quero|pode|ok|isso|confirma|pode ser)$/i.test(msg.trim());
  const isDirectOrder = msg.includes('quero') || msg.includes('adiciona') || 
                       msg.includes('me traz') || msg.match(/e uma?/) || 
                       msg.includes('fecha com') || msg.includes('pede');
  const wantsToModify = msg.includes('tira') || msg.includes('remove') || 
                       msg.includes('aumenta') || msg.includes('diminui');
  
  if (isConfirmation || isDirectOrder || wantsToModify) {
    console.log(`[${requestId}] ✅ ORDER: Cliente confirmando/pedindo/modificando`);
    return { agent: 'ORDER', reasoning: 'Cliente confirmou produto, pediu diretamente ou quer modificar carrinho' };
  }
  
  // 4. MENU (se pergunta sobre produtos)
  if (msg.includes('quanto') || msg.includes('preço') || 
      msg.includes('tem ') || msg.includes('quais') ||
      msg.includes('cardápio') || msg.includes('sabores') ||
      msg.includes('tamanhos') || msg.includes('opções')) {
    console.log(`[${requestId}] ✅ MENU: Consulta de produtos`);
    return { agent: 'MENU', reasoning: 'Cliente perguntando sobre produtos/preços/disponibilidade' };
  }
  
  // 5. GREETING (primeiras mensagens ou saudações)
  if (conversationContext.messageCount <= 2 || 
      msg.match(/^(oi|olá|bom dia|boa tarde|boa noite)/i)) {
    console.log(`[${requestId}] ✅ GREETING: Saudação ou início de conversa`);
    return { agent: 'GREETING', reasoning: 'Saudação ou início de conversa' };
  }
  
  // 6. Padrão: MENU (exploração de produtos)
  console.log(`[${requestId}] ✅ MENU (padrão): Nenhum padrão específico detectado`);
  return { agent: 'MENU', reasoning: 'Padrão - exploração de produtos' };
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
