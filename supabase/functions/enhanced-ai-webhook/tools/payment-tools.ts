// 💳 Payment method tools

export function getPaymentTools() {
  return [
    {
      type: "function",
      function: {
        name: "list_payment_methods",
        description: "Lista formas de pagamento disponíveis",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    }
  ];
}

export async function executeListPaymentMethods(
  supabase: any,
  agent: any
) {
  try {
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('restaurant_id', agent.restaurants.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error || !methods || methods.length === 0) {
      return {
        success: false,
        error: 'NO_PAYMENT_METHODS',
        message: 'Nenhuma forma de pagamento configurada'
      };
    }
    
    const formattedMethods = methods.map((m: any) => ({
      name: m.method_name,
      display_name: m.display_name,
      instructions: m.instructions
    }));
    
    return {
      success: true,
      data: {
        methods: formattedMethods,
        count: methods.length
      },
      message: `${methods.length} forma(s) de pagamento disponível(is)`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Erro ao buscar formas de pagamento'
    };
  }
}
