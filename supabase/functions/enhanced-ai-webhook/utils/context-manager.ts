import { ConversationState, ConversationContext } from '../types/conversation-states.ts';
import { evaluateStateTransition } from './state-machine.ts';

/**
 * Atualiza o contexto da conversa baseado nos resultados das ferramentas
 */
export async function updateConversationContext(
  supabase: any,
  chatId: number,
  currentChat: any,
  agentCalled: string,
  toolResults: any[],
  requestId: string
): Promise<{
  newState: ConversationState;
  shouldCallNextAgent: boolean;
  suggestedNextAgent?: string;
  contextUpdates: any;
}> {
  console.log(`[${requestId}] 🔄 Context Manager: Analisando resultados...`);
  
  // 1. Coletar informações do chat atual
  const metadata = currentChat.metadata || {};
  const currentState = parseConversationState(currentChat.conversation_state || 'greeting');
  const cartItems = metadata.order_items || [];
  const cartTotal = metadata.order_total || 0;
  
  // 2. Extrair ferramentas executadas
  const toolsExecuted = toolResults.map(r => r.tool);
  
  // 3. Verificar se tem endereço e pagamento
  const hasAddress = Boolean(metadata.delivery_address);
  const hasPaymentMethod = Boolean(metadata.payment_method);
  
  // 4. Criar contexto
  const context: ConversationContext = {
    currentState,
    cartItemCount: cartItems.length,
    cartTotal,
    hasAddress,
    hasPaymentMethod,
    lastAgentCalled: agentCalled,
    toolsExecuted,
    toolResults,
    metadata
  };
  
  console.log(`[${requestId}] 📊 Context:`, {
    state: currentState,
    items: cartItems.length,
    total: cartTotal,
    agent: agentCalled,
    tools: toolsExecuted
  });
  
  // 5. Avaliar transição de estado
  const newState = evaluateStateTransition(context);
  
  // 6. Determinar se deve chamar próximo agente
  const agentRecommendation = shouldCallNextAgent(newState, context);
  
  // 7. Preparar atualizações de contexto
  const contextUpdates = {
    conversation_state: newState,
    metadata: {
      ...metadata,
      conversation_state: newState, // Duplicar para compatibilidade
      last_state_change: new Date().toISOString(),
      last_agent: agentCalled,
      state_history: [
        ...(metadata.state_history || []),
        {
          from: currentState,
          to: newState,
          timestamp: new Date().toISOString(),
          reason: `Tools: ${toolsExecuted.join(', ')}`
        }
      ].slice(-10) // Manter apenas últimos 10
    }
  };
  
  // 8. Atualizar banco de dados
  const { error } = await supabase
    .from('chats')
    .update(contextUpdates)
    .eq('id', chatId);
  
  if (error) {
    console.error(`[${requestId}] ❌ Erro ao atualizar contexto:`, error);
  } else {
    console.log(`[${requestId}] ✅ Contexto atualizado: ${currentState} → ${newState}`);
  }
  
  return {
    newState,
    shouldCallNextAgent: agentRecommendation.shouldCall,
    suggestedNextAgent: agentRecommendation.nextAgent,
    contextUpdates
  };
}

/**
 * Converte string do DB para enum
 */
function parseConversationState(stateStr: string): ConversationState {
  // Mapear estados legados
  const legacyMapping: Record<string, ConversationState> = {
    'greeting': ConversationState.GREETING,
    'discovery': ConversationState.DISCOVERY,
    'presentation': ConversationState.BROWSING_MENU,
    'upsell': ConversationState.BUILDING_ORDER,
    'logistics': ConversationState.READY_TO_CHECKOUT,
    'address': ConversationState.COLLECTING_ADDRESS,
    'payment': ConversationState.COLLECTING_PAYMENT,
    'summary': ConversationState.CONFIRMING_ORDER,
    'confirmed': ConversationState.ORDER_PLACED
  };
  
  return legacyMapping[stateStr] || ConversationState.GREETING;
}

/**
 * Decide se deve chamar outro agente automaticamente
 */
function shouldCallNextAgent(
  newState: ConversationState,
  context: ConversationContext
): { shouldCall: boolean; nextAgent?: string } {
  
  // Regra 1: Estado terminal - não chamar mais ninguém
  if ([ConversationState.ORDER_PLACED, ConversationState.ABANDONED].includes(newState)) {
    return { shouldCall: false };
  }
  
  // Regra 2: MENU → SALES quando cliente escolhe produto
  if (newState === ConversationState.SELECTING_PRODUCTS && context.lastAgentCalled === 'MENU') {
    return { shouldCall: true, nextAgent: 'SALES' };
  }
  
  // Regra 3: SALES adicionou 3+ itens → Sugerir CHECKOUT
  if (newState === ConversationState.READY_TO_CHECKOUT && 
      context.cartItemCount >= 3 && 
      context.lastAgentCalled !== 'CHECKOUT') {
    return { shouldCall: true, nextAgent: 'CHECKOUT' };
  }
  
  // Regra 4: Se chegou em READY_TO_CHECKOUT, sugerir CHECKOUT
  if (newState === ConversationState.READY_TO_CHECKOUT && context.lastAgentCalled !== 'CHECKOUT') {
    return { shouldCall: true, nextAgent: 'CHECKOUT' };
  }
  
  // Regra 5: CHECKOUT precisa de mais itens → Voltar para SALES
  if (context.lastAgentCalled === 'CHECKOUT' && context.cartItemCount === 0) {
    return { shouldCall: true, nextAgent: 'SALES' };
  }
  
  // Regra 6: Se está em COLLECTING_ADDRESS mas não tem endereço, manter CHECKOUT
  if (newState === ConversationState.COLLECTING_ADDRESS && !context.hasAddress) {
    return { shouldCall: false }; // CHECKOUT já está lidando
  }
  
  // Regra 7: Se cliente está apenas navegando, não forçar
  if ([ConversationState.BROWSING_MENU, ConversationState.ASKING_SUPPORT].includes(newState)) {
    return { shouldCall: false };
  }
  
  return { shouldCall: false };
}
