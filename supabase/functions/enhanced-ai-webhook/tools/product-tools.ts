// 🛍️ Product-related tools

export function getProductTools() {
  return [
    {
      type: "function",
      function: {
        name: "check_product_availability",
        description: "Verifica disponibilidade e detalhes de um produto específico. Tenta encontrar produtos mesmo sem acentos ou com nomes parciais.",
        parameters: {
          type: "object",
          properties: {
            product_name: {
              type: "string",
              description: "Nome do produto a consultar (ex: 'acai', 'hamburguer', 'coca')"
            }
          },
          required: ["product_name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_products_by_category",
        description: "Lista todos os produtos disponíveis de uma categoria específica",
        parameters: {
          type: "object",
          properties: {
            category_name: {
              type: "string",
              description: "Nome da categoria (ex: 'Açaí', 'Hambúrgueres', 'Bebidas', 'Lanches')"
            }
          },
          required: ["category_name"]
        }
      }
    }
  ];
}

// 🔍 Busca inteligente de produtos (com fuzzy search)
async function smartProductSearch(supabase: any, categoryIds: string[], searchTerm: string) {
  // Normalizar termo de busca (sem acentos, lowercase)
  const normalized = searchTerm
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  console.log('[SMART_SEARCH] Normalized:', normalized);
  
  // Estratégia 1: Busca exata com ilike
  let { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, category_id')
    .in('category_id', categoryIds)
    .eq('is_active', true)
    .ilike('name', `%${searchTerm}%`);
  
  if (products && products.length > 0) {
    console.log('[SMART_SEARCH] Estratégia 1 (exata):', products.length, 'encontrados');
    return products;
  }
  
  // Estratégia 2: Busca sem acentos (comparação em JavaScript)
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, description, price, category_id')
    .in('category_id', categoryIds)
    .eq('is_active', true);
  
  if (!allProducts) return [];
  
  products = allProducts.filter((p: any) => {
    const normalizedName = p.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalizedName.includes(normalized);
  });
  
  if (products.length > 0) {
    console.log('[SMART_SEARCH] Estratégia 2 (sem acentos):', products.length, 'encontrados');
    return products;
  }
  
  // Estratégia 3: Busca parcial por palavras-chave
  const keywords = normalized.split(' ').filter((k: string) => k.length > 2);
  
  if (keywords.length > 0) {
    products = allProducts.filter((p: any) => {
      const normalizedName = p.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      return keywords.some((keyword: string) => normalizedName.includes(keyword));
    });
    
    if (products.length > 0) {
      console.log('[SMART_SEARCH] Estratégia 3 (keywords):', products.length, 'encontrados');
      return products;
    }
  }
  
  console.log('[SMART_SEARCH] Nenhum produto encontrado');
  return [];
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
    
    // Usar busca inteligente
    const products = await smartProductSearch(supabase, categoryIds, args.product_name);
    
    if (!products || products.length === 0) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: `Produto "${args.product_name}" não encontrado`,
        suggestion: 'Tente sugerir produtos similares ou perguntar qual categoria o cliente prefere'
      };
    }
    
    // Se encontrou múltiplos produtos
    if (products.length > 1) {
      const productList = products
        .slice(0, 5)
        .map((p: any, idx: number) => `${idx + 1}. ${p.name} - R$ ${p.price.toFixed(2)}`)
        .join('\n');
      
      return {
        success: true,
        multiple: true,
        count: products.length,
        data: products.slice(0, 5),
        message: `Encontrei ${products.length} opções:\n${productList}\n\nPergunte qual o cliente prefere.`
      };
    }
    
    // Produto único encontrado
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

export async function executeListProductsByCategory(
  supabase: any,
  restaurantId: string,
  args: { category_name: string }
) {
  try {
    console.log('[CATEGORY_TOOL] Listing category:', args.category_name);
    
    // Buscar categoria (com busca fuzzy também)
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
    
    // Busca fuzzy da categoria
    const normalized = args.category_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    const category = categories.find((c: any) => {
      const normalizedName = c.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return normalizedName.includes(normalized);
    });
    
    if (!category) {
      const categoryList = categories.map((c: any) => c.name).join(', ');
      return {
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: `Categoria "${args.category_name}" não encontrada. Categorias disponíveis: ${categoryList}`
      };
    }
    
    // Buscar produtos da categoria
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (!products || products.length === 0) {
      return {
        success: false,
        error: 'NO_PRODUCTS',
        message: `Categoria "${category.name}" não possui produtos disponíveis no momento`
      };
    }
    
    const productList = products
      .map((p: any, idx: number) => `${idx + 1}. ${p.name} - R$ ${p.price.toFixed(2)}${p.description ? ` (${p.description})` : ''}`)
      .join('\n');
    
    return {
      success: true,
      category: category.name,
      count: products.length,
      data: products,
      message: `${category.name} (${products.length} produtos):\n${productList}`
    };
    
  } catch (error) {
    console.error('[CATEGORY_TOOL] Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao listar categoria'
    };
  }
}
