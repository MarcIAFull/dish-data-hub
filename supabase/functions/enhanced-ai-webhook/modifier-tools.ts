// FASE 5: Product modifiers management tools for AI agent

export async function executeListProductModifiers(
  supabase: any,
  agent: any,
  args: {
    category?: string;
    product_id?: string;
  }
) {
  try {
    console.log('[LIST_PRODUCT_MODIFIERS] Fetching modifiers for restaurant:', agent.restaurants.id);
    console.log('[LIST_PRODUCT_MODIFIERS] Filters:', args);
    
    let query = supabase
      .from('product_modifiers')
      .select('*')
      .eq('restaurant_id', agent.restaurants.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    // Filter by category if provided
    if (args.category) {
      // Check if category is in applicable_categories OR if applicable_categories is null (applies to all)
      query = query.or(`applicable_categories.cs.{${args.category}},applicable_categories.is.null`);
    }
    
    // Filter by product if provided
    if (args.product_id) {
      query = query.or(`applicable_products.cs.{${args.product_id}},applicable_products.is.null`);
    }
    
    const { data: modifiers, error } = await query;
    
    if (error) {
      console.error('[LIST_PRODUCT_MODIFIERS] Error:', error);
      return {
        success: false,
        error: 'Erro ao buscar complementos',
        message: 'Não foi possível listar os complementos disponíveis.'
      };
    }
    
    if (!modifiers || modifiers.length === 0) {
      console.log('[LIST_PRODUCT_MODIFIERS] No modifiers found');
      return {
        success: true,
        modifiers: [],
        count: 0,
        message: 'Não há complementos disponíveis para este produto.'
      };
    }
    
    // Group by type for better presentation
    const groupedModifiers = modifiers.reduce((acc, mod) => {
      if (!acc[mod.modifier_type]) {
        acc[mod.modifier_type] = [];
      }
      acc[mod.modifier_type].push({
        id: mod.id,
        name: mod.name,
        price: mod.price,
        max_quantity: mod.max_quantity,
        description: mod.description
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log('[LIST_PRODUCT_MODIFIERS] ✅ Found', modifiers.length, 'active modifiers');
    
    return {
      success: true,
      modifiers: groupedModifiers,
      all_modifiers: modifiers.map(m => ({
        id: m.id,
        name: m.name,
        type: m.modifier_type,
        price: m.price,
        max_quantity: m.max_quantity,
        description: m.description
      })),
      count: modifiers.length,
      message: `${modifiers.length} complementos disponíveis.`
    };
    
  } catch (error) {
    console.error('[LIST_PRODUCT_MODIFIERS] ❌ Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao listar complementos.'
    };
  }
}
