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
  let newState = evaluateStateTransition(context);
  
  // ✅ FALLBACK INTELIGENTE: Se estado não mudou e ferramentas foram executadas
  if (newState === currentState && toolsExecuted.length > 0) {
    console.log(`[${requestId}] ⚠️ State machine não transitou. Aplicando fallback inteligente...`);
    
    // Prioridade 1: Item adicionado ao carrinho
    if (toolsExecuted.includes('add_item_to_order')) {
      newState = ConversationState.BUILDING_ORDER;
      console.log(`[${requestId}] ✅ Fallback: add_item_to_order → BUILDING_ORDER`);
    } 
    // Prioridade 2: Pedido criado
    else if (toolsExecuted.includes('create_order')) {
      newState = ConversationState.ORDER_PLACED;
      console.log(`[${requestId}] ✅ Fallback: create_order → ORDER_PLACED`);
    } 
    // Prioridade 3: Endereço validado
    else if (toolsExecuted.includes('validate_delivery_address') && metadata.address_validated) {
      newState = ConversationState.COLLECTING_PAYMENT;
      console.log(`[${requestId}] ✅ Fallback: validate_delivery_address → COLLECTING_PAYMENT`);
    }
    // Prioridade 4: Apenas consultou produto (sem adicionar)
    else if (toolsExecuted.includes('check_product_availability') && !toolsExecuted.includes('add_item_to_order')) {
      // Se carrinho está vazio, cliente está navegando
      if (cartItems.length === 0) {
        newState = ConversationState.BROWSING_MENU;
        console.log(`[${requestId}] ✅ Fallback: check_product_availability (sem add) → BROWSING_MENU`);
      } else {
        // Se já tem itens, continua construindo pedido
        newState = ConversationState.BUILDING_ORDER;
        console.log(`[${requestId}] ✅ Fallback: check_product_availability (com carrinho) → BUILDING_ORDER`);
      }
    }
    // Prioridade 5: Enviou menu
    else if (toolsExecuted.includes('send_menu_link')) {
      newState = ConversationState.BROWSING_MENU;
      console.log(`[${requestId}] ✅ Fallback: send_menu_link → BROWSING_MENU`);
    }
    // Caso nenhum fallback se aplique
    else {
      console.log(`[${requestId}] ⚠️ Nenhum fallback aplicável. Mantendo estado: ${currentState}`);
    }
  }
  
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
  
  // 8. Atualizar banco de dados com função SQL atômica
  try {
    const { error } = await supabase.rpc('atomic_update_conversation_state', {
      p_chat_id: chatId,
      p_new_state: newState,
      p_metadata_updates: contextUpdates.metadata,
      p_agent_name: agentCalled
    });
    
    if (error) {
      console.error(`[${requestId}] ❌ Erro ao atualizar contexto via RPC:`, error);
      // Fallback: tentar atualização direta
      const { error: updateError } = await supabase
        .from('chats')
        .update({
          conversation_state: newState,
          metadata: contextUpdates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);
      
      if (updateError) {
        console.error(`[${requestId}] ❌ Fallback também falhou:`, updateError);
        throw updateError;
      }
      console.log(`[${requestId}] ⚠️ Atualizado via fallback: ${currentState} → ${newState}`);
    } else {
      console.log(`[${requestId}] ✅ Contexto atualizado: ${currentState} → ${newState}`);
    }
  } catch (err) {
    console.error(`[${requestId}] 💥 Falha crítica ao atualizar contexto:`, err);
    // Não bloquear o fluxo do agente
  }
  
  return {
    newState,
    shouldCallNextAgent: agentRecommendation.shouldCall,
    suggestedNextAgent: agentRecommendation.nextAgent,
    contextUpdates
  };
}

// ============================================
// 🆕 FASE 2: Rastreamento de Produtos Mencionados
// ============================================

/**
 * Adiciona produto mencionado ao metadata para rastreamento
 */
export async function trackPendingProduct(
  supabase: any,
  chatId: number,
  productName: string,
  productId: string,
  price: number,
  requestId: string
): Promise<void> {
  console.log(`[${requestId}] 📌 Rastreando produto mencionado: ${productName}`);
  
  const { data: currentChat, error: fetchError } = await supabase
    .from('chats')
    .select('metadata')
    .eq('id', chatId)
    .single();
  
  if (fetchError) {
    console.error(`[${requestId}] ❌ Erro ao buscar chat para rastrear produto:`, fetchError);
    return;
  }
  
  const metadata = currentChat.metadata || {};
  const pendingProducts = metadata.pending_products || [];
  
  // Evitar duplicatas
  const alreadyTracked = pendingProducts.some((p: any) => p.id === productId);
  if (alreadyTracked) {
    console.log(`[${requestId}] ⚠️ Produto ${productName} já está sendo rastreado`);
    return;
  }
  
  // Adicionar produto
  pendingProducts.push({
    id: productId,
    name: productName,
    price,
    mentioned_at: new Date().toISOString()
  });
  
  const { error: updateError } = await supabase
    .from('chats')
    .update({
      metadata: { ...metadata, pending_products: pendingProducts }
    })
    .eq('id', chatId);
  
  if (updateError) {
    console.error(`[${requestId}] ❌ Erro ao atualizar produtos pendentes:`, updateError);
  } else {
    console.log(`[${requestId}] ✅ Produto ${productName} rastreado com sucesso`);
  }
}

/**
 * Limpa produtos pendentes (após adicionar ao carrinho)
 */
export async function clearPendingProducts(
  supabase: any,
  chatId: number,
  requestId: string
): Promise<void> {
  console.log(`[${requestId}] 🧹 Limpando produtos pendentes`);
  
  const { data: currentChat, error: fetchError } = await supabase
    .from('chats')
    .select('metadata')
    .eq('id', chatId)
    .single();
  
  if (fetchError) {
    console.error(`[${requestId}] ❌ Erro ao buscar chat para limpar produtos:`, fetchError);
    return;
  }
  
  const metadata = currentChat.metadata || {};
  delete metadata.pending_products;
  
  const { error: updateError } = await supabase
    .from('chats')
    .update({ metadata })
    .eq('id', chatId);
  
  if (updateError) {
    console.error(`[${requestId}] ❌ Erro ao limpar produtos pendentes:`, updateError);
  } else {
    console.log(`[${requestId}] ✅ Produtos pendentes limpos`);
  }
}

/**
 * Converte string do DB para enum
 */
export function parseConversationState(stateStr: string): ConversationState {
  // Mapear estados legados
  const legacyMapping: Record<string, ConversationState> = {
    'greeting': ConversationState.GREETING,
    'discovery': ConversationState.DISCOVERY,
    'presentation': ConversationState.BROWSING_MENU,
    'browsing_menu': ConversationState.BROWSING_MENU,
    'upsell': ConversationState.BUILDING_ORDER,
    'building_order': ConversationState.BUILDING_ORDER,
    'logistics': ConversationState.READY_TO_CHECKOUT,
    'ready_to_checkout': ConversationState.READY_TO_CHECKOUT,
    'address': ConversationState.COLLECTING_ADDRESS,
    'collecting_address': ConversationState.COLLECTING_ADDRESS,
    'payment': ConversationState.COLLECTING_PAYMENT,
    'collecting_payment': ConversationState.COLLECTING_PAYMENT,
    'summary': ConversationState.CONFIRMING_ORDER,
    'confirming_order': ConversationState.CONFIRMING_ORDER,
    'confirmed': ConversationState.ORDER_PLACED,
    'order_placed': ConversationState.ORDER_PLACED
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
