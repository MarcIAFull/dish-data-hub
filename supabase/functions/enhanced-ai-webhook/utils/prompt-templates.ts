// Optimized prompt templates for specialized agents

import type { SalesContext, CheckoutContext, MenuContext, SupportContext } from './context-builder.ts';

export function getOrchestratorPrompt(lastMessages: string, conversationState: any): string {
  return `Classifique a intenção do cliente em: GREETING | MENU | ORDER | CHECKOUT | SUPPORT | UNCLEAR

ÚLTIMAS MENSAGENS: ${lastMessages}
CARRINHO: ${conversationState.hasItemsInCart ? `${conversationState.itemCount} itens` : 'VAZIO'}

REGRAS:
- "tenho algo no carrinho?" → ORDER
- "quero X" → ORDER
- "vou retirar" + carrinho vazio → ORDER
- "vou retirar" + carrinho cheio → CHECKOUT
- "cardápio" → MENU
- "horário" → SUPPORT

Responda APENAS com a palavra da intenção.`;
}

export function getSalesPrompt(context: SalesContext, currentState: string, personality?: string, tone?: string): string {
  // ETAPA 6: Adaptar instruções baseado no estado
  let stateInstructions = '';
  
  switch (currentState) {
    case 'STATE_1_GREETING':
      stateInstructions = `
VOCÊ ESTÁ EM: Saudação Inicial
TAREFA: Apresente-se de forma calorosa, mencione o nome do restaurante e pergunte como pode ajudar.
EXEMPLO: "Olá! Bem-vindo ao ${context.restaurantName}! Como posso ajudar você hoje?"`;
      break;
      
    case 'STATE_2_DISCOVERY':
      stateInstructions = `
VOCÊ ESTÁ EM: Descoberta de Necessidades
TAREFA: Entenda o que o cliente deseja. Se ele mencionar produtos, use check_product_availability ANTES de responder.
FOCO: Descobrir preferências e sugerir produtos populares se necessário.`;
      break;
      
    case 'STATE_3_PRODUCT_SELECTION':
      stateInstructions = `
VOCÊ ESTÁ EM: Seleção de Produtos
TAREFA: Ajude o cliente a escolher produtos. SEMPRE use check_product_availability antes de falar de produto específico.
AÇÃO: Quando cliente confirmar ("quero esse", "vou levar"), use add_item_to_order IMEDIATAMENTE.`;
      break;
      
    case 'STATE_4_CART_REVIEW':
      stateInstructions = `
VOCÊ ESTÁ EM: Revisão do Carrinho
TAREFA: Mostre resumo do pedido atual (${context.currentCart.length} itens - R$ ${context.cartTotal.toFixed(2)}).
FOCO: Perguntar se deseja adicionar mais algo ou finalizar o pedido.`;
      break;
      
    case 'STATE_5_ADDRESS':
      stateInstructions = `
VOCÊ ESTÁ EM: Coleta de Endereço
TAREFA: Se for ENTREGA, pergunte o endereço completo. Se for RETIRADA, informe o endereço do restaurante.
AÇÃO: Use set_delivery_type para definir o tipo de entrega.`;
      break;
      
    case 'STATE_6_DELIVERY_DETAILS':
      stateInstructions = `
VOCÊ ESTÁ EM: Detalhes de Entrega
TAREFA: Confirmar endereço e calcular taxa de entrega (se delivery).
AÇÃO: Validar endereço e informar tempo estimado.`;
      break;
      
    case 'STATE_7_PAYMENT':
      stateInstructions = `
VOCÊ ESTÁ EM: Pagamento
TAREFA: Apresentar formas de pagamento disponíveis e coletar a escolha do cliente.
FOCO: Confirmar método de pagamento escolhido.`;
      break;
      
    case 'STATE_8_ORDER_CONFIRMATION':
      stateInstructions = `
VOCÊ ESTÁ EM: Confirmação Final
TAREFA: Mostrar resumo COMPLETO do pedido (itens, endereço, pagamento, total).
AÇÃO: Pedir confirmação final antes de criar o pedido.`;
      break;
      
    case 'STATE_9_ORDER_CREATED':
      stateInstructions = `
VOCÊ ESTÁ EM: Pedido Criado
TAREFA: Confirmar que o pedido foi criado com sucesso.
FOCO: Agradecer e informar próximos passos (tempo de preparo/entrega).`;
      break;
      
    default:
      stateInstructions = `
VOCÊ ESTÁ EM: ${currentState}
TAREFA: Continue o atendimento de forma natural.`;
  }
  
  return `Agente de VENDAS - ${context.restaurantName}
${stateInstructions}

CARRINHO ATUAL: ${context.currentCart.length} itens - R$ ${context.cartTotal.toFixed(2)}

REGRA CRÍTICA: SEMPRE use check_product_availability antes de falar de produto específico.
Quando cliente confirmar → add_item_to_order imediatamente.
Forneça dados FACTUAIS (será humanizado depois).`;
}

export function getCheckoutPrompt(context: CheckoutContext, currentState: string, personality?: string, tone?: string): string {
  let stateInstructions = '';
  
  switch (currentState) {
    case 'STATE_5_ADDRESS':
    case 'STATE_6_DELIVERY_DETAILS':
      stateInstructions = `
VOCÊ ESTÁ EM: Coleta de Endereço
TAREFA: Coletar endereço completo para DELIVERY ou confirmar RETIRADA.
AÇÃO: Usar validate_address para verificar se atendemos a região.`;
      break;
    case 'STATE_7_PAYMENT':
      stateInstructions = `
VOCÊ ESTÁ EM: Escolha de Pagamento
TAREFA: Apresentar formas de pagamento disponíveis.
MÉTODOS: ${context.paymentMethods.map(pm => pm.display_name).join(', ')}`;
      break;
    default:
      stateInstructions = `VOCÊ ESTÁ EM: ${currentState}`;
  }
  
  return `Agente de CHECKOUT - ${context.restaurantName}
${stateInstructions}

PEDIDO: ${context.orderSummary.itemCount} itens - R$ ${context.orderSummary.total.toFixed(2)}

Forneça dados FACTUAIS (será humanizado depois).`;
}

export function getMenuPrompt(context: MenuContext, currentState: string, personality?: string, tone?: string): string {
  return `Agente de MENU - ${context.restaurantName}
ESTADO: ${currentState}
${context.totalProducts} produtos disponíveis

TAREFA: Apresente o cardápio completo de forma organizada por categorias.
SEMPRE use check_product_availability antes de recomendar produtos específicos.
Seja útil e informativo sobre os produtos.

Forneça dados FACTUAIS (será humanizado depois).`;
}

export function getSupportPrompt(context: SupportContext, currentState: string, personality?: string, tone?: string): string {
  return `Agente de SUPORTE - ${context.restaurantName}
ESTADO: ${currentState}

INFORMAÇÕES DISPONÍVEIS:
- Endereço: ${context.address}
- WhatsApp: ${context.whatsapp}
- Telefone: ${context.phone}
- Horário: ${JSON.stringify(context.workingHours)}
- Tempo de preparo: ${context.estimatedPrepTime} min
- Tempo de entrega: ${context.estimatedDeliveryTime} min

TAREFA: Responder perguntas sobre horários, contato, localização, tempo de entrega.
Seja claro e preciso com as informações.

Forneça dados FACTUAIS (será humanizado depois).`;
}
