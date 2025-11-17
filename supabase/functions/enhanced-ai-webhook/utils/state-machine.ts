import { ConversationState, StateTransitionRule, ConversationContext } from '../types/conversation-states.ts';

/**
 * Define todas as regras de transição de estado
 * Executadas em ordem de prioridade (maior primeiro)
 */
export const STATE_TRANSITION_RULES: StateTransitionRule[] = [
  // === PRIORIDADE ALTA: Transições Críticas ===
  
  // Regra 1: Pedido criado com sucesso
  {
    from: [ConversationState.CONFIRMING_ORDER],
    to: ConversationState.ORDER_PLACED,
    priority: 100,
    condition: (ctx) => {
      const hasCreateOrder = ctx.toolsExecuted.includes('create_order');
      const orderSuccess = ctx.toolResults.some(
        r => r.tool === 'create_order' && r.result?.success === true
      );
      return hasCreateOrder && orderSuccess;
    }
  },
  
  // Regra 2: Item adicionado ao carrinho
  {
    from: [ConversationState.DISCOVERY, ConversationState.BROWSING_MENU, ConversationState.SELECTING_PRODUCTS],
    to: ConversationState.BUILDING_ORDER,
    priority: 90,
    condition: (ctx) => {
      const hasAddItem = ctx.toolsExecuted.includes('add_item_to_order');
      const itemAdded = ctx.toolResults.some(
        r => r.tool === 'add_item_to_order' && r.result?.success === true
      );
      return hasAddItem && itemAdded && ctx.cartItemCount > 0;
    }
  },
  
  // Regra 3: Carrinho tem 3+ itens → Sugerir checkout
  {
    from: [ConversationState.BUILDING_ORDER],
    to: ConversationState.READY_TO_CHECKOUT,
    priority: 80,
    condition: (ctx) => ctx.cartItemCount >= 3
  },
  
  // Regra 4: Cliente pediu para finalizar E tem itens
  {
    from: [ConversationState.BUILDING_ORDER, ConversationState.READY_TO_CHECKOUT],
    to: ConversationState.COLLECTING_ADDRESS,
    priority: 85,
    condition: (ctx) => {
      const hasCheckoutAgent = ctx.lastAgentCalled === 'CHECKOUT';
      const hasItems = ctx.cartItemCount > 0;
      return hasCheckoutAgent && hasItems;
    }
  },
  
  // === PRIORIDADE MÉDIA: Fluxo de Checkout ===
  
  // Regra 5: Endereço validado
  {
    from: [ConversationState.COLLECTING_ADDRESS],
    to: ConversationState.COLLECTING_PAYMENT,
    priority: 70,
    condition: (ctx) => {
      const hasValidateAddress = ctx.toolsExecuted.includes('validate_delivery_address');
      const addressValid = ctx.toolResults.some(
        r => r.tool === 'validate_delivery_address' && r.result?.success === true
      );
      return hasValidateAddress && addressValid;
    }
  },
  
  // Regra 6: Forma de pagamento selecionada
  {
    from: [ConversationState.COLLECTING_PAYMENT],
    to: ConversationState.CONFIRMING_ORDER,
    priority: 65,
    condition: (ctx) => {
      const hasPaymentMethod = ctx.toolsExecuted.includes('list_payment_methods');
      return hasPaymentMethod && ctx.hasPaymentMethod;
    }
  },
  
  // === PRIORIDADE BAIXA: Estados de Entrada ===
  
  // Regra 7: Cliente visualizando menu
  {
    from: [ConversationState.GREETING, ConversationState.DISCOVERY],
    to: ConversationState.BROWSING_MENU,
    priority: 50,
    condition: (ctx) => {
      const menuAgent = ctx.lastAgentCalled === 'MENU';
      const hasListProducts = ctx.toolsExecuted.includes('list_products_by_category');
      return menuAgent || hasListProducts;
    }
  },
  
  // Regra 8: Cliente fazendo perguntas de suporte
  {
    from: [ConversationState.GREETING, ConversationState.DISCOVERY, ConversationState.BROWSING_MENU],
    to: ConversationState.ASKING_SUPPORT,
    priority: 40,
    condition: (ctx) => ctx.lastAgentCalled === 'SUPPORT'
  }
];

/**
 * Aplica regras de transição e retorna novo estado
 */
export function evaluateStateTransition(context: ConversationContext): ConversationState {
  // Ordenar regras por prioridade (maior primeiro)
  const sortedRules = [...STATE_TRANSITION_RULES].sort((a, b) => b.priority - a.priority);
  
  // Encontrar primeira regra que aplica
  for (const rule of sortedRules) {
    // Verificar se estado atual está na lista de estados "from"
    if (!rule.from.includes(context.currentState)) {
      continue;
    }
    
    // Verificar condição
    try {
      if (rule.condition(context)) {
        console.log(`✅ State transition: ${context.currentState} → ${rule.to} (priority: ${rule.priority})`);
        return rule.to;
      }
    } catch (error) {
      console.error(`❌ Error evaluating rule ${rule.to}:`, error);
    }
  }
  
  // Nenhuma regra aplicou, manter estado atual
  return context.currentState;
}
