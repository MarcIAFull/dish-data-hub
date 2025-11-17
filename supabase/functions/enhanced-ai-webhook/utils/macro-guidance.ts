// 🎯 Macro Guidance System - FASE 2
// Fornece orientações dinâmicas aos agentes baseadas no estado da conversa

import { ConversationState } from '../types/conversation-states.ts';

/**
 * Retorna orientação macro específica para cada estado da conversa
 * Ajuda os agentes a entenderem o contexto e objetivos da fase atual
 */
export function getMacroGuidanceForState(
  state: string,
  enrichedContext: any
): string {
  const cart = enrichedContext?.cart || { items: [], total: 0, count: 0 };
  const customer = enrichedContext?.customer || {};
  const restaurant = enrichedContext?.restaurant || {};
  
  const guidanceMap: Record<string, string> = {
    [ConversationState.GREETING]: `
=== 🎯 OBJETIVO DESTA FASE: Cumprimentar e capturar intenção inicial ===

✅ PODE FAZER:
- Cumprimentar calorosamente (use o nome se disponível)
- Perguntar "Como posso ajudar hoje?"
- Oferecer cardápio ou link
- Sugerir produtos populares ou favoritos do cliente

❌ NÃO PODE:
- Pedir endereço (ainda não tem produtos no carrinho)
- Falar de pagamento (ainda não tem pedido)
- Tentar finalizar pedido (carrinho vazio)
- Ser impaciente

📊 CONTEXTO DO CLIENTE:
${customer.totalOrders > 0 
  ? `✅ Cliente RECORRENTE - ${customer.totalOrders} pedidos anteriores
     Favoritos: ${customer.favoriteItems?.join(', ') || 'N/A'}
     Última compra: ${customer.lastOrders?.[0]?.created_at || 'N/A'}`
  : '🆕 Cliente NOVO - Seja especialmente acolhedor e consultivo'}

💡 PRÓXIMO PASSO ESPERADO: Cliente mencionar produto ou pedir cardápio
`,

    [ConversationState.BROWSING]: `
=== 🎯 OBJETIVO DESTA FASE: Ajudar cliente a explorar cardápio ===

✅ PODE FAZER:
- Responder perguntas sobre produtos e preços
- Sugerir itens baseado em preferências
- Explicar ingredientes e preparo
- Oferecer alternativas se algo não estiver disponível

❌ NÃO PODE:
- Adicionar produtos sem cliente pedir explicitamente
- Pressionar para fechar pedido
- Pedir endereço ou pagamento

📊 HISTÓRICO DO CLIENTE:
${customer.favoriteItems?.length > 0
  ? `Cliente costuma pedir: ${customer.favoriteItems.join(', ')}`
  : 'Primeiro pedido - seja consultivo e ofereça explicações'}

💡 PRÓXIMO PASSO ESPERADO: Cliente pedir um produto específico
`,

    [ConversationState.BUILDING_ORDER]: `
=== 🎯 OBJETIVO DESTA FASE: Construir pedido completo e satisfatório ===

✅ PODE FAZER:
- Adicionar itens ao carrinho quando cliente pedir
- Sugerir complementos (upsell): "Quer uma bebida com isso?"
- Oferecer extras/modificadores disponíveis
- Perguntar se quer mais algo antes de finalizar
- Mostrar resumo do carrinho

❌ NÃO PODE:
- Voltar para saudação (já tem itens)
- Pedir endereço sem cliente confirmar que está pronto
- Criar pedido sem autorização explícita
- Remover itens sem cliente pedir

💡 ESTRATÉGIA DE UPSELL:
${customer.favoriteItems?.length > 0
  ? `Cliente costuma combinar com: ${customer.favoriteItems[0]}`
  : 'Sugira bebidas, sobremesas ou acompanhamentos'}

📦 CARRINHO ATUAL: ${cart.count} itens - R$ ${cart.total?.toFixed(2) || '0.00'}

💡 PRÓXIMO PASSO ESPERADO: Cliente dizer "é só isso" ou "quero finalizar"
`,

    [ConversationState.READY_TO_CHECKOUT]: `
=== 🎯 OBJETIVO DESTA FASE: Conduzir para finalização ===

✅ PODE FAZER:
- Perguntar se está pronto para finalizar
- Sugerir ÚLTIMO item complementar (bebida? sobremesa?)
- Mostrar total do pedido
- Oferecer descontos se aplicável
- Confirmar que quer seguir para checkout

❌ NÃO PODE:
- Remover itens sem autorização
- Começar a pedir endereço sem cliente confirmar
- Adicionar itens sem perguntar

📦 CARRINHO ATUAL:
${cart.count} itens - R$ ${cart.total?.toFixed(2) || '0.00'}
Items: ${cart.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'N/A'}

💡 PRÓXIMO PASSO ESPERADO: Cliente confirmar "sim, pode prosseguir"
`,

    [ConversationState.COLLECTING_ADDRESS]: `
=== 🎯 OBJETIVO DESTA FASE: Coletar endereço válido ===

✅ PODE FAZER:
- Pedir endereço completo (Rua, número, bairro, complemento)
- Sugerir endereço anterior se disponível
- Validar se está na área de entrega
- Calcular taxa de entrega
- Informar tempo estimado

❌ NÃO PODE:
- Voltar para adicionar produtos (pedido confirmado)
- Pedir pagamento antes de validar endereço
- Criar pedido sem endereço válido
- Aceitar endereços incompletos

📍 ENDEREÇO ANTERIOR: ${customer.preferredAddress || 'Nenhum registrado'}

🚚 STATUS DO RESTAURANTE:
${restaurant.isOpen 
  ? `✅ ABERTO - Tempo estimado: ${restaurant.estimatedDeliveryTime || 40} min`
  : `⚠️ FECHADO - Próxima abertura: ${restaurant.nextOpenTime || 'N/A'}`}

💡 PRÓXIMO PASSO ESPERADO: Endereço completo e validado
`,

    [ConversationState.COLLECTING_PAYMENT]: `
=== 🎯 OBJETIVO DESTA FASE: Coletar forma de pagamento ===

✅ PODE FAZER:
- Mostrar formas de pagamento aceitas
- Sugerir última forma usada
- Perguntar se precisa troco (para dinheiro)
- Confirmar método escolhido
- Pedir dados do cartão se necessário (PIX, etc)

❌ NÃO PODE:
- Mudar endereço (já validado e confirmado)
- Voltar para produtos (pedido fechado)
- Criar pedido sem pagamento confirmado

💳 ÚLTIMO PAGAMENTO USADO: ${customer.preferredPayment || 'Nenhum registrado'}

💡 PRÓXIMO PASSO ESPERADO: Cliente escolher forma de pagamento
`,

    [ConversationState.CONFIRMING_ORDER]: `
=== 🎯 OBJETIVO DESTA FASE: Confirmação final e criação do pedido ===

✅ PODE FAZER:
- Mostrar resumo COMPLETO do pedido
- Pedir confirmação EXPLÍCITA ("Confirma o pedido?")
- CRIAR PEDIDO somente após confirmação
- Informar tempo de entrega previsto
- Agradecer e despedir

❌ NÃO PODE:
- Criar pedido sem confirmação clara
- Pular o resumo (cliente PRECISA ver tudo)
- Mudar qualquer dado sem perguntar

✅ RESUMO PARA CONFIRMAR:
📦 Itens: ${cart.count} produtos
💰 Total: R$ ${cart.total?.toFixed(2) || '0.00'}
📍 Endereço: [mostrar endereço validado]
💳 Pagamento: [mostrar forma escolhida]
🕐 Tempo: ${restaurant.estimatedDeliveryTime || 40} min

💡 PRÓXIMO PASSO ESPERADO: Cliente dizer "sim" ou "confirma"
`,

    [ConversationState.ORDER_PLACED]: `
=== 🎯 OBJETIVO DESTA FASE: Confirmação pós-pedido ===

✅ PODE FAZER:
- Agradecer pela compra
- Informar número do pedido
- Reforçar tempo de entrega
- Oferecer acompanhamento
- Despedir cordialmente

❌ NÃO PODE:
- Modificar pedido (já criado)
- Pedir mais produtos (iniciar nova conversa)

💡 PRÓXIMO PASSO: Encerrar conversa ou aguardar nova interação
`,

    [ConversationState.CANCELLED]: `
=== 🎯 OBJETIVO DESTA FASE: Tratamento de cancelamento ===

✅ PODE FAZER:
- Entender motivo do cancelamento
- Oferecer alternativas se aplicável
- Agradecer mesmo assim
- Convidar para voltar outra vez

❌ NÃO PODE:
- Insistir demais
- Ser rude ou ríspido

💡 PRÓXIMO PASSO: Despedir cordialmente
`
  };

  return guidanceMap[state] || `
=== ⚠️ ESTADO DESCONHECIDO: ${state} ===

Proceda com cautela. Use bom senso baseado no contexto da conversa.
`;
}

/**
 * Versão simplificada para uso em logs
 */
export function getMacroGuidanceSummary(state: string): string {
  const summaries: Record<string, string> = {
    [ConversationState.GREETING]: 'Cumprimentar e capturar intenção',
    [ConversationState.BROWSING]: 'Ajudar a explorar cardápio',
    [ConversationState.BUILDING_ORDER]: 'Construir pedido completo',
    [ConversationState.READY_TO_CHECKOUT]: 'Conduzir para finalização',
    [ConversationState.COLLECTING_ADDRESS]: 'Coletar endereço válido',
    [ConversationState.COLLECTING_PAYMENT]: 'Coletar forma de pagamento',
    [ConversationState.CONFIRMING_ORDER]: 'Confirmar e criar pedido',
    [ConversationState.ORDER_PLACED]: 'Confirmação pós-pedido',
    [ConversationState.CANCELLED]: 'Tratar cancelamento'
  };
  
  return summaries[state] || 'Sem orientação';
}
