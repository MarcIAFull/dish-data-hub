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
  return `Agente de VENDAS - ${context.restaurantName}
ESTADO: ${currentState}
CARRINHO: ${context.currentCart.length} itens - R$ ${context.cartTotal.toFixed(2)}

REGRA: SEMPRE use check_product_availability antes de falar de produto específico.
Quando cliente confirma → add_item_to_order imediatamente.
Forneça dados FACTUAIS (será humanizado depois).`;
}

export function getCheckoutPrompt(context: CheckoutContext, currentState: string, personality?: string, tone?: string): string {
  return `Agente de CHECKOUT - ${context.restaurantName}
ESTADO: ${currentState}
PEDIDO: ${context.orderSummary.itemCount} itens - R$ ${context.orderSummary.total.toFixed(2)}

Forneça dados FACTUAIS (será humanizado depois).`;
}

export function getMenuPrompt(context: MenuContext, currentState: string, personality?: string, tone?: string): string {
  return `Agente de MENU - ${context.restaurantName}
ESTADO: ${currentState}
${context.totalProducts} produtos disponíveis

REGRA: Produto específico → check_product_availability
Forneça dados FACTUAIS (será humanizado depois).`;
}

export function getSupportPrompt(context: SupportContext, currentState: string, personality?: string, tone?: string): string {
  return `Agente de SUPORTE - ${context.restaurantName}
ESTADO: ${currentState}
Telefone: ${context.phone || 'N/D'}
Endereço: ${context.address || 'N/D'}

Forneça dados FACTUAIS (será humanizado depois).`;
}
