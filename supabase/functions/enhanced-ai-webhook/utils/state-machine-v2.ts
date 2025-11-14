// Smart State Machine - Non-linear state transitions based on completion criteria

export type ConversationState =
  | 'STATE_1_GREETING'
  | 'STATE_2_DISCOVERY'
  | 'STATE_3_PRODUCT'
  | 'STATE_4_UPSELL'
  | 'STATE_5_LOGISTICS'
  | 'STATE_6_ADDRESS'
  | 'STATE_7_PAYMENT'
  | 'STATE_8_CONFIRMATION'
  | 'STATE_9_CONFIRM'
  | 'STATE_10_FINALIZED';

export interface CompletionCriteria {
  hasGreeted: boolean;
  hasProducts: boolean;
  hasDeliveryType: boolean;
  needsAddress: boolean;
  hasAddress: boolean;
  hasPaymentMethod: boolean;
  allRequirementsMet: boolean;
}

/**
 * Calculate what requirements have been met
 */
export function calculateCompletionCriteria(metadata: any): CompletionCriteria {
  const hasProducts = (metadata?.order_items?.length || 0) > 0;
  const deliveryType = metadata?.delivery_type;
  const hasDeliveryType = !!deliveryType;
  const needsAddress = deliveryType === 'delivery';
  const hasAddress = !!metadata?.validated_address || !!metadata?.delivery_address;
  const hasPaymentMethod = !!metadata?.payment_method;

  const allRequirementsMet = 
    hasProducts &&
    hasDeliveryType &&
    (needsAddress ? hasAddress : true) &&
    hasPaymentMethod;

  return {
    hasGreeted: metadata?.hasGreeted || false,
    hasProducts,
    hasDeliveryType,
    needsAddress,
    hasAddress,
    hasPaymentMethod,
    allRequirementsMet
  };
}

/**
 * Determine next state based on current state and completion criteria
 * Smart transitions that can skip states
 */
export function getNextState(
  currentState: ConversationState,
  criteria: CompletionCriteria,
  userMessage?: string
): ConversationState {
  
  // If all requirements met, jump to confirmation
  if (criteria.allRequirementsMet) {
    return 'STATE_9_CONFIRM';
  }

  // State-specific transitions
  switch (currentState) {
    case 'STATE_1_GREETING':
      return 'STATE_2_DISCOVERY';

    case 'STATE_2_DISCOVERY':
      if (criteria.hasProducts) {
        return 'STATE_3_PRODUCT';
      }
      return 'STATE_2_DISCOVERY';

    case 'STATE_3_PRODUCT':
      // Smart skip logic
      if (criteria.hasDeliveryType) {
        // If pickup, skip address and go to payment
        if (!criteria.needsAddress) {
          if (criteria.hasPaymentMethod) {
            return 'STATE_9_CONFIRM';
          }
          return 'STATE_7_PAYMENT';
        }
        // If delivery, check address
        if (criteria.hasAddress) {
          if (criteria.hasPaymentMethod) {
            return 'STATE_9_CONFIRM';
          }
          return 'STATE_7_PAYMENT';
        }
        return 'STATE_6_ADDRESS';
      }
      // No delivery type yet, ask for logistics
      return 'STATE_5_LOGISTICS';

    case 'STATE_4_UPSELL':
      // After upsell, move to logistics
      if (criteria.hasDeliveryType) {
        if (!criteria.needsAddress) {
          return 'STATE_7_PAYMENT';
        }
        return criteria.hasAddress ? 'STATE_7_PAYMENT' : 'STATE_6_ADDRESS';
      }
      return 'STATE_5_LOGISTICS';

    case 'STATE_5_LOGISTICS':
      if (criteria.hasDeliveryType) {
        if (!criteria.needsAddress) {
          // Pickup - skip address
          return criteria.hasPaymentMethod ? 'STATE_9_CONFIRM' : 'STATE_7_PAYMENT';
        }
        // Delivery - need address
        return criteria.hasAddress ? 'STATE_7_PAYMENT' : 'STATE_6_ADDRESS';
      }
      return 'STATE_5_LOGISTICS';

    case 'STATE_6_ADDRESS':
      if (criteria.hasAddress) {
        return criteria.hasPaymentMethod ? 'STATE_9_CONFIRM' : 'STATE_7_PAYMENT';
      }
      return 'STATE_6_ADDRESS';

    case 'STATE_7_PAYMENT':
      if (criteria.hasPaymentMethod) {
        return 'STATE_9_CONFIRM';
      }
      return 'STATE_7_PAYMENT';

    case 'STATE_8_CONFIRMATION':
    case 'STATE_9_CONFIRM':
      // Check if order was confirmed
      if (userMessage && /confirma|sim|isso|pode.*ser|ok|fecha/i.test(userMessage)) {
        return 'STATE_10_FINALIZED';
      }
      return 'STATE_9_CONFIRM';

    case 'STATE_10_FINALIZED':
      return 'STATE_10_FINALIZED';

    default:
      return currentState;
  }
}

/**
 * Get state description for debugging
 */
export function getStateDescription(state: ConversationState): string {
  const descriptions: Record<ConversationState, string> = {
    STATE_1_GREETING: 'Saudação inicial',
    STATE_2_DISCOVERY: 'Descoberta - apresentando menu',
    STATE_3_PRODUCT: 'Seleção de produtos',
    STATE_4_UPSELL: 'Upsell - sugestões adicionais',
    STATE_5_LOGISTICS: 'Definição de entrega/retirada',
    STATE_6_ADDRESS: 'Coleta de endereço',
    STATE_7_PAYMENT: 'Método de pagamento',
    STATE_8_CONFIRMATION: 'Confirmação do pedido',
    STATE_9_CONFIRM: 'Confirmação final',
    STATE_10_FINALIZED: 'Pedido finalizado'
  };

  return descriptions[state] || state;
}
