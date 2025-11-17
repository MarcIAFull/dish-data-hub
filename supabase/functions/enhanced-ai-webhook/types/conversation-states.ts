export enum ConversationState {
  // Estados de Entrada
  GREETING = 'greeting',                    // Primeira interação
  DISCOVERY = 'discovery',                  // Descobrindo necessidades
  
  // Estados de Vendas
  BROWSING_MENU = 'browsing_menu',         // Cliente vendo cardápio
  SELECTING_PRODUCTS = 'selecting_products', // Cliente escolhendo produtos
  BUILDING_ORDER = 'building_order',        // Adicionando itens ao carrinho
  
  // Estados de Checkout
  READY_TO_CHECKOUT = 'ready_to_checkout', // Carrinho pronto, aguardando confirmação
  COLLECTING_ADDRESS = 'collecting_address', // Coletando endereço
  COLLECTING_PAYMENT = 'collecting_payment', // Coletando forma de pagamento
  CONFIRMING_ORDER = 'confirming_order',    // Confirmação final
  
  // Estados Finais
  ORDER_PLACED = 'order_placed',           // Pedido confirmado
  ABANDONED = 'abandoned',                  // Cliente abandonou
  
  // Estados de Suporte
  ASKING_SUPPORT = 'asking_support'        // Dúvidas/suporte
}

export interface StateTransitionRule {
  from: ConversationState[];
  to: ConversationState;
  condition: (context: ConversationContext) => boolean;
  priority: number; // Maior = executa primeiro
}

export interface ConversationContext {
  currentState: ConversationState;
  cartItemCount: number;
  cartTotal: number;
  hasAddress: boolean;
  hasPaymentMethod: boolean;
  lastAgentCalled: string;
  toolsExecuted: string[];
  toolResults: any[];
  metadata: any;
}
