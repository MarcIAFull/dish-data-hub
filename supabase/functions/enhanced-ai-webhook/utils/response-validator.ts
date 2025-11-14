// Response Validator - Pre-response checklist validation

import type { ConversationState } from './state-machine.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateResponse(
  response: string,
  currentState: ConversationState,
  toolResults: any[],
  userMessage: string,
  metadata: any
): ValidationResult {
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const lowerResponse = response.toLowerCase();
  const lowerUserMessage = userMessage.toLowerCase();
  
  // ✅ VALIDAÇÃO 1: Role Confusion - Não está respondendo como cliente?
  const clientResponsePatterns = [
    'boa, pode ser',
    'vou querer',
    'me manda',
    'quero esse',
    'pode mandar',
    'vou pegar',
    'vou levar'
  ];
  
  if (clientResponsePatterns.some(pattern => lowerResponse.includes(pattern))) {
    errors.push('ROLE_CONFUSION: Response sounds like customer, not attendant. Never say "vou querer", "me manda", etc.');
  }
  
  // ✅ VALIDAÇÃO 2: Estado correto?
  if (currentState === 'STATE_3_PRODUCT') {
    // Se está apresentando produto, deveria ter chamado check_product_availability
    const hasProductCheck = toolResults.some(t => t.tool_name === 'check_product_availability');
    
    if (!hasProductCheck && lowerUserMessage.includes('quero') && !lowerResponse.includes('qual')) {
      warnings.push('STATE_3: User requested product but no check_product_availability called');
    }
  }
  
  if (currentState === 'STATE_8_CALCULATE') {
    // Se está calculando, deveria mostrar valores
    const hasPrices = lowerResponse.includes('€') || lowerResponse.includes('r$') || lowerResponse.includes('total');
    
    if (!hasPrices) {
      warnings.push('STATE_8: Should show prices/total but response has no monetary values');
    }
  }
  
  if (currentState === 'STATE_9_CONFIRM') {
    // Se está confirmando, deveria ter criado pedido ou estar pedindo confirmação
    const hasOrderCreation = toolResults.some(t => t.tool_name === 'create_order');
    const asksConfirmation = lowerResponse.includes('confirma') || lowerResponse.includes('ok?') || lowerResponse.includes('tá bom?');
    
    if (!hasOrderCreation && !asksConfirmation) {
      warnings.push('STATE_9: Should create order or ask for confirmation');
    }
  }
  
  // ✅ VALIDAÇÃO 3: Não está inventando dados (hallucination)?
  if (lowerResponse.includes('€') || lowerResponse.includes('r$')) {
    // Se menciona preços, deve ter vindo de alguma tool
    const hasPriceFromTool = toolResults.some(t => {
      const resultStr = JSON.stringify(t.result || {}).toLowerCase();
      return resultStr.includes('price') || resultStr.includes('total') || resultStr.includes('preço');
    });
    
    if (!hasPriceFromTool && toolResults.length > 0) {
      warnings.push('Response has prices but no tool returned price data - possible hallucination');
    }
  }
  
  // ✅ VALIDAÇÃO 4: Resposta coerente com pergunta do usuário?
  if (lowerUserMessage.includes('carrinho') && !lowerResponse.includes('carrinho')) {
    warnings.push('User asked about cart but response doesn\'t mention cart');
  }
  
  if (lowerUserMessage.includes('quanto') && !lowerResponse.includes('€') && !lowerResponse.includes('r$')) {
    warnings.push('User asked about price but response has no prices');
  }
  
  // ✅ VALIDAÇÃO 5: MB Way number correto?
  if (lowerResponse.includes('mb way') || lowerResponse.includes('mbway')) {
    const mbwayNumbers = ['915 817 565', '915817565'];
    const hasCorrectNumber = mbwayNumbers.some(num => response.includes(num));
    
    if (!hasCorrectNumber) {
      errors.push('MB_WAY_NUMBER: Response mentions MB Way but doesn\'t show correct number (915 817 565)');
    }
  }
  
  // ✅ VALIDAÇÃO 6: Não está oferecendo descontos inexistentes?
  const discountKeywords = ['desconto', 'promoção', '% off', 'por cento'];
  if (discountKeywords.some(kw => lowerResponse.includes(kw))) {
    warnings.push('Response mentions discount/promotion - verify if it actually exists');
  }
  
  // ✅ VALIDAÇÃO 7: Tamanho da resposta (não muito longo)?
  if (response.length > 500) {
    warnings.push(`Response is very long (${response.length} chars) - should be concise (2-4 lines)`);
  }
  
  // ✅ VALIDAÇÃO 8: Upsell excessivo?
  if (currentState === 'STATE_4_UPSELL') {
    const upsellAttempts = metadata?.upsell_attempts || 0;
    
    if (upsellAttempts >= 2 && (lowerResponse.includes('quer') || lowerResponse.includes('gostaria'))) {
      errors.push('UPSELL_LIMIT: Already made 2 upsell attempts, should not insist anymore');
    }
  }
  
  // ✅ VALIDAÇÃO 9: Não está pedindo dados já coletados?
  if (metadata?.customer_name && lowerResponse.includes('qual seu nome')) {
    warnings.push('Customer name already in metadata, no need to ask again');
  }
  
  if (metadata?.validated_address && lowerResponse.includes('qual o endereço')) {
    warnings.push('Address already validated in metadata, no need to ask again');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
