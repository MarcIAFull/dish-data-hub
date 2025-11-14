// State Machine - Manages conversation flow states

export type ConversationState = 
  | 'STATE_1_GREETING'
  | 'STATE_2_DISCOVERY'
  | 'STATE_3_PRODUCT'
  | 'STATE_4_UPSELL'
  | 'STATE_5_LOGISTICS'
  | 'STATE_6_ADDRESS'
  | 'STATE_7_PAYMENT'
  | 'STATE_8_CALCULATE'
  | 'STATE_9_CONFIRM';

export function getNextState(
  currentState: ConversationState,
  userMessage: string,
  toolResults: any[],
  metadata: any
): ConversationState {
  
  const lowerMessage = userMessage.toLowerCase();
  
  switch (currentState) {
    case 'STATE_1_GREETING':
      // Se cliente já conhece produto → STATE_3
      if (detectsProductRequest(lowerMessage)) {
        return 'STATE_3_PRODUCT';
      }
      // Se cliente pede menu → STATE_2
      if (lowerMessage.includes('cardápio') || lowerMessage.includes('menu') || lowerMessage.includes('o que tem')) {
        return 'STATE_2_DISCOVERY';
      }
      // Default: Discovery
      return 'STATE_2_DISCOVERY';
      
    case 'STATE_2_DISCOVERY':
      // Se cliente escolheu produto específico → STATE_3
      if (detectsProductRequest(lowerMessage)) {
        return 'STATE_3_PRODUCT';
      }
      return 'STATE_2_DISCOVERY';
      
    case 'STATE_3_PRODUCT':
      // Se produto foi adicionado → STATE_4 (upsell)
      const productAdded = toolResults.some(t => 
        t.tool_name === 'add_item_to_order' && t.result?.success
      );
      
      if (productAdded) {
        return 'STATE_4_UPSELL';
      }
      return 'STATE_3_PRODUCT';
      
    case 'STATE_4_UPSELL':
      // Após 2 tentativas de upsell OU cliente recusar → STATE_5
      const upsellAttempts = metadata?.upsell_attempts || 0;
      const clientRefused = lowerMessage.includes('só isso') || 
                           lowerMessage.includes('não') || 
                           lowerMessage.includes('nada mais');
      
      if (upsellAttempts >= 2 || clientRefused) {
        return 'STATE_5_LOGISTICS';
      }
      
      // Se cliente aceitou upsell → continua no STATE_4 ou volta ao STATE_3
      const upsellAccepted = toolResults.some(t => 
        t.tool_name === 'add_item_to_order' && t.result?.success
      );
      
      if (upsellAccepted) {
        // Incrementa tentativas mas continua no upsell
        return 'STATE_4_UPSELL';
      }
      
      return 'STATE_4_UPSELL';
      
    case 'STATE_5_LOGISTICS':
      // Se escolheu entrega → STATE_6 (endereço)
      if (lowerMessage.includes('entrega') || lowerMessage.includes('entregar')) {
        return 'STATE_6_ADDRESS';
      }
      // Se escolheu retirada → STATE_7 (pagamento)
      if (lowerMessage.includes('retirar') || lowerMessage.includes('buscar') || lowerMessage.includes('pegar')) {
        return 'STATE_7_PAYMENT';
      }
      // Se metadata já tem delivery_type definido
      if (metadata?.delivery_type === 'delivery') {
        return 'STATE_6_ADDRESS';
      }
      if (metadata?.delivery_type === 'pickup') {
        return 'STATE_7_PAYMENT';
      }
      return 'STATE_5_LOGISTICS';
      
    case 'STATE_6_ADDRESS':
      // Se endereço foi validado → STATE_7
      const addressValidated = toolResults.some(t => 
        t.tool_name === 'validate_delivery_address' && t.result?.valid
      );
      
      if (addressValidated || metadata?.validated_address) {
        return 'STATE_7_PAYMENT';
      }
      return 'STATE_6_ADDRESS';
      
    case 'STATE_7_PAYMENT':
      // Se payment_method foi definido → STATE_8
      if (metadata?.payment_method) {
        return 'STATE_8_CALCULATE';
      }
      // Se cliente mencionou forma de pagamento
      const paymentMentioned = lowerMessage.includes('mb way') || 
                              lowerMessage.includes('multibanco') || 
                              lowerMessage.includes('cartão') || 
                              lowerMessage.includes('dinheiro') ||
                              lowerMessage.includes('pix');
      
      if (paymentMentioned) {
        return 'STATE_8_CALCULATE';
      }
      return 'STATE_7_PAYMENT';
      
    case 'STATE_8_CALCULATE':
      // Após criar pedido ou confirmar cálculo → STATE_9
      const orderCalculated = toolResults.some(t => 
        t.tool_name === 'calculate_order_total'
      );
      
      if (orderCalculated || metadata?.calculated_total) {
        return 'STATE_9_CONFIRM';
      }
      return 'STATE_8_CALCULATE';
      
    case 'STATE_9_CONFIRM':
      // Se cliente confirma → criar pedido e resetar para STATE_1
      const confirmed = lowerMessage.includes('sim') || 
                       lowerMessage.includes('confirmo') || 
                       lowerMessage.includes('pode ser') ||
                       lowerMessage.includes('ok') ||
                       lowerMessage.includes('tá bom');
      
      const orderCreated = toolResults.some(t => 
        t.tool_name === 'create_order' && t.result?.success
      );
      
      if (confirmed || orderCreated) {
        return 'STATE_1_GREETING'; // Reset para nova conversa
      }
      
      // Se cliente quer mudar algo → volta para STATE_3 (produto)
      if (lowerMessage.includes('mudar') || lowerMessage.includes('alterar') || lowerMessage.includes('remover')) {
        return 'STATE_3_PRODUCT';
      }
      
      return 'STATE_9_CONFIRM';
      
    default:
      return 'STATE_1_GREETING';
  }
}

function detectsProductRequest(message: string): boolean {
  const productKeywords = [
    'quero',
    'gostaria',
    'me dá',
    'vou querer',
    'pode ser',
    'me manda',
    'quanto custa',
    'tem ',
    'tem?',
    'me fala d'
  ];
  
  return productKeywords.some(kw => message.includes(kw));
}

export function getStateDescription(state: ConversationState): string {
  const descriptions: Record<ConversationState, string> = {
    'STATE_1_GREETING': 'Você está CUMPRIMENTANDO. Seja caloroso e descubra se é primeira vez.',
    'STATE_2_DISCOVERY': 'Você está DESCOBRINDO necessidades. Apresente categorias ou ajude a escolher.',
    'STATE_3_PRODUCT': 'Você está APRESENTANDO produtos. Mostre opções com preços e descrições.',
    'STATE_4_UPSELL': 'Você está OFERECENDO complementos (max 2 tentativas). Seja breve e relevante.',
    'STATE_5_LOGISTICS': 'Você está COLETANDO forma de entrega. Pergunte: "Entrega ou retirada?"',
    'STATE_6_ADDRESS': 'Você está VALIDANDO endereço. Confirme dados completos e calcule taxas.',
    'STATE_7_PAYMENT': 'Você está COLETANDO pagamento. Mostre todas as opções disponíveis.',
    'STATE_8_CALCULATE': 'Você está MOSTRANDO total. Apresente resumo completo do pedido.',
    'STATE_9_CONFIRM': 'Você está CONFIRMANDO pedido. Pergunte: "Confirma o pedido?"'
  };
  
  return descriptions[state] || 'Estado desconhecido.';
}
