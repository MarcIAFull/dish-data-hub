// 🛍️ Sales-Specific Tools - FASE 3
// Ferramentas inteligentes para o agente de vendas

/**
 * Define as ferramentas específicas do agente de vendas
 */
export function getSalesSpecificTools() {
  return [
    {
      type: "function",
      function: {
        name: "suggest_upsell",
        description: "Sugerir produtos complementares baseados no carrinho atual do cliente. Use para aumentar ticket médio.",
        parameters: {
          type: "object",
          properties: {
            current_items: {
              type: "array",
              description: "Itens atualmente no carrinho",
              items: { type: "string" }
            }
          },
          required: []
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_product_modifiers",
        description: "Obter extras/modificadores disponíveis para um produto específico (ex: adicionais, tamanhos, sabores)",
        parameters: {
          type: "object",
          properties: {
            product_id: {
              type: "string",
              description: "ID do produto para buscar modificadores"
            }
          },
          required: ["product_id"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_best_sellers",
        description: "Obter lista dos produtos mais vendidos do restaurante. Use para fazer sugestões ao cliente.",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Número de produtos a retornar",
              default: 5
            },
            category: {
              type: "string",
              description: "Filtrar por categoria específica (opcional)"
            }
          },
          required: []
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_customer_favorites",
        description: "Obter produtos favoritos do cliente baseado em pedidos anteriores",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    }
  ];
}

/**
 * EXECUTORES DAS FERRAMENTAS
 */

/**
 * Sugere upsell baseado nos itens do carrinho
 */
export async function executeSuggestUpsell(
  args: { current_items?: string[] },
  context: {
    supabase: any;
    restaurantId: string;
    enrichedContext: any;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log('[TOOL] suggest_upsell - Iniciando sugestão de upsell');
    
    const currentItems = args.current_items || context.enrichedContext?.cart?.items?.map((i: any) => i.product_name) || [];
    
    // Lógica de upsell inteligente
    const suggestions: any[] = [];
    
    // 1. Se tem comida mas não tem bebida, sugerir bebidas
    const hasFood = currentItems.some((item: string) => 
      !item.toLowerCase().includes('coca') && 
      !item.toLowerCase().includes('suco') &&
      !item.toLowerCase().includes('água')
    );
    const hasDrink = currentItems.some((item: string) => 
      item.toLowerCase().includes('coca') || 
      item.toLowerCase().includes('suco') ||
      item.toLowerCase().includes('água')
    );
    
    if (hasFood && !hasDrink) {
      // Buscar bebidas
      const { data: drinks } = await context.supabase
        .from('products')
        .select('id, name, price, categories(name)')
        .eq('is_active', true)
        .ilike('categories.name', '%bebida%')
        .limit(3);
      
      if (drinks && drinks.length > 0) {
        suggestions.push({
          reason: 'complement_drink',
          message: 'Que tal uma bebida para acompanhar?',
          products: drinks
        });
      }
    }
    
    // 2. Sugerir sobremesas se não tiver
    const hasDessert = currentItems.some((item: string) => 
      item.toLowerCase().includes('sobremesa') ||
      item.toLowerCase().includes('açaí') ||
      item.toLowerCase().includes('sorvete')
    );
    
    if (!hasDessert && currentItems.length > 0) {
      const { data: desserts } = await context.supabase
        .from('products')
        .select('id, name, price, categories(name)')
        .eq('is_active', true)
        .or('categories.name.ilike.%sobremesa%,categories.name.ilike.%doce%')
        .limit(2);
      
      if (desserts && desserts.length > 0) {
        suggestions.push({
          reason: 'add_dessert',
          message: 'Finalize com uma sobremesa deliciosa!',
          products: desserts
        });
      }
    }
    
    // 3. Usar favoritos do cliente
    const customerFavorites = context.enrichedContext?.customer?.favoriteItems || [];
    if (customerFavorites.length > 0) {
      const notInCart = customerFavorites.filter((fav: string) => 
        !currentItems.some((item: string) => item.toLowerCase().includes(fav.toLowerCase()))
      );
      
      if (notInCart.length > 0) {
        suggestions.push({
          reason: 'customer_favorite',
          message: `Você costuma pedir ${notInCart[0]}. Quer adicionar?`,
          products: [{ name: notInCart[0] }]
        });
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      suggestions,
      execution_time_ms: executionTime,
      context_used: {
        current_cart_items: currentItems.length,
        customer_favorites: customerFavorites.length,
        has_food: hasFood,
        has_drink: hasDrink,
        has_dessert: hasDessert
      }
    };
    
  } catch (error) {
    console.error('[TOOL] suggest_upsell - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Busca modificadores de um produto
 */
export async function executeGetProductModifiers(
  args: { product_id: string },
  context: {
    supabase: any;
    restaurantId: string;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log(`[TOOL] get_product_modifiers - Buscando modificadores para ${args.product_id}`);
    
    const { data: modifiers, error } = await context.supabase
      .from('product_modifiers')
      .select('*')
      .eq('restaurant_id', context.restaurantId)
      .eq('is_active', true)
      .or(`applicable_products.cs.{${args.product_id}},applicable_products.is.null`);
    
    if (error) throw error;
    
    // Agrupar por tipo
    const grouped = (modifiers || []).reduce((acc: any, mod: any) => {
      const type = mod.modifier_type || 'outros';
      if (!acc[type]) acc[type] = [];
      acc[type].push(mod);
      return acc;
    }, {});
    
    return {
      success: true,
      modifiers: grouped,
      total_count: modifiers?.length || 0,
      execution_time_ms: Date.now() - startTime,
      context_used: {
        product_id: args.product_id,
        restaurant_id: context.restaurantId
      }
    };
    
  } catch (error) {
    console.error('[TOOL] get_product_modifiers - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Retorna os mais vendidos
 */
export async function executeGetBestSellers(
  args: { limit?: number; category?: string },
  context: {
    supabase: any;
    restaurantId: string;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    const limit = args.limit || 5;
    console.log(`[TOOL] get_best_sellers - Buscando top ${limit} produtos`);
    
    // Por enquanto, retorna produtos ativos ordenados por preço (simulação)
    // TODO: Implementar contagem real de vendas quando tivermos dados históricos
    let query = context.supabase
      .from('products')
      .select('id, name, price, description, categories(name)')
      .eq('is_active', true)
      .order('price', { ascending: false })
      .limit(limit);
    
    if (args.category) {
      query = query.eq('categories.name', args.category);
    }
    
    const { data: products, error } = await query;
    
    if (error) throw error;
    
    return {
      success: true,
      best_sellers: products || [],
      count: products?.length || 0,
      execution_time_ms: Date.now() - startTime,
      context_used: {
        limit,
        category: args.category || 'all',
        restaurant_id: context.restaurantId
      }
    };
    
  } catch (error) {
    console.error('[TOOL] get_best_sellers - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Retorna favoritos do cliente
 */
export async function executeGetCustomerFavorites(
  args: {},
  context: {
    enrichedContext: any;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log('[TOOL] get_customer_favorites - Buscando favoritos');
    
    const favorites = context.enrichedContext?.customer?.favoriteItems || [];
    const lastOrders = context.enrichedContext?.customer?.lastOrders || [];
    
    return {
      success: true,
      favorites,
      last_orders: lastOrders.slice(0, 3),
      total_previous_orders: context.enrichedContext?.customer?.totalOrders || 0,
      execution_time_ms: Date.now() - startTime,
      context_used: {
        has_favorites: favorites.length > 0,
        has_order_history: lastOrders.length > 0
      }
    };
    
  } catch (error) {
    console.error('[TOOL] get_customer_favorites - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}
