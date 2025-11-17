// 🛍️ Product-related tools

export function getProductTools() {
  return [
    {
      type: "function",
      function: {
        name: "check_product_availability",
        description: "Verifica disponibilidade e detalhes de um produto específico",
        parameters: {
          type: "object",
          properties: {
            product_name: {
              type: "string",
              description: "Nome do produto a consultar"
            }
          },
          required: ["product_name"]
        }
      }
    }
  ];
}

export async function executeCheckProductAvailability(
  supabase: any,
  restaurantId: string,
  args: { product_name: string }
) {
  try {
    console.log('[PRODUCT_TOOL] Checking:', args.product_name);
    
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);
    
    if (!categories || categories.length === 0) {
      return {
        success: false,
        error: 'NO_CATEGORIES',
        message: 'Nenhuma categoria encontrada'
      };
    }
    
    const categoryIds = categories.map((c: any) => c.id);
    
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, category_id')
      .in('category_id', categoryIds)
      .eq('is_active', true)
      .ilike('name', `%${args.product_name}%`);
    
    if (!products || products.length === 0) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: `Produto "${args.product_name}" não encontrado`
      };
    }
    
    const product = products[0];
    
    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price
      },
      message: `${product.name} - R$ ${product.price.toFixed(2)}`
    };
    
  } catch (error) {
    console.error('[PRODUCT_TOOL] Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao buscar produto'
    };
  }
}
