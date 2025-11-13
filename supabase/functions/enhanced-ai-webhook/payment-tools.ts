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
      console.log('[LIST_PAYMENT_METHODS] ⚠️ No payment methods configured');
      return {
        success: false,
        error: 'NO_DATA',
        missing: 'payment_methods'
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
      count: methods.length
    };
    
  } catch (error) {
    console.error('[LIST_PAYMENT_METHODS] ❌ Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
