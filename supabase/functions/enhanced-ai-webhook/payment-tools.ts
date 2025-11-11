// Payment methods management tools for AI agent

export async function executeListPaymentMethods(
  supabase: any,
  agent: any
) {
  try {
    console.log('[LIST_PAYMENT_METHODS] Fetching payment methods for restaurant:', agent.restaurants.id);
    
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('restaurant_id', agent.restaurants.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('[LIST_PAYMENT_METHODS] Error:', error);
      return {
        success: false,
        error: 'Erro ao buscar formas de pagamento',
        message: 'Não foi possível listar as formas de pagamento disponíveis.'
      };
    }
    
    if (!methods || methods.length === 0) {
      // Fallback to generic payment methods if none configured
      return {
        success: true,
        methods: [
          { name: 'dinheiro', display_name: 'Dinheiro', requires_data: false },
          { name: 'cartao', display_name: 'Cartão', requires_data: false },
          { 
            name: 'pix', 
            display_name: 'PIX', 
            requires_data: true, 
            data_type: 'pix_key',
            data_value: 'Chave PIX CPF: 123.456.789-00',
            instructions: 'Forneça a chave PIX ao cliente imediatamente após ele escolher esta forma de pagamento'
          }
        ],
        count: 3,
        message: 'Aceitamos dinheiro, cartão e PIX.'
      };
    }
    
    const formattedMethods = methods.map(m => ({
      name: m.method_name,
      display_name: m.display_name,
      requires_data: m.requires_data,
      data_type: m.data_type,
      data_value: m.data_value,
      instructions: m.instructions
    }));
    
    console.log('[LIST_PAYMENT_METHODS] ✅ Found', methods.length, 'active payment methods');
    
    return {
      success: true,
      methods: formattedMethods,
      count: methods.length,
      message: `${methods.length} formas de pagamento disponíveis.`
    };
    
  } catch (error) {
    console.error('[LIST_PAYMENT_METHODS] ❌ Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao listar formas de pagamento.'
    };
  }
}
