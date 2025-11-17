// 📦 Order-related tools

export function getOrderTools() {
  return [
    {
      type: "function",
      function: {
        name: "add_item_to_order",
        description: "Adiciona um produto ao carrinho do cliente",
        parameters: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            quantity: { type: "number" },
            unit_price: { type: "number" },
            notes: { type: "string" }
          },
          required: ["product_name", "quantity", "unit_price"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_cart_summary",
        description: "Retorna resumo atual do carrinho",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    }
  ];
}

export async function executeAddItemToOrder(
  supabase: any,
  chatId: number,
  args: { product_name: string; quantity: number; unit_price: number; notes?: string }
) {
  console.log(`[ADD_ITEM] 🛒 Usando função SQL atômica chatId=${chatId}`);
  console.log(`[ADD_ITEM] 📦 Item: ${args.product_name} x${args.quantity} @ R$${args.unit_price}`);
  
  try {
    // Gerar product_id único para idempotência
    const productId = `${args.product_name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    console.log(`[ADD_ITEM] 🔑 Product ID gerado: ${productId}`);
    
    // Usar função SQL atômica para prevenir race conditions
    const { data, error } = await supabase.rpc('atomic_add_item_to_cart', {
      p_chat_id: chatId,
      p_product_name: args.product_name,
      p_product_id: productId,
      p_quantity: args.quantity,
      p_unit_price: args.unit_price,
      p_notes: args.notes || null
    });

    if (error) {
      console.error(`[ADD_ITEM] ❌ Erro na função SQL:`, error);
      throw error;
    }

    console.log(`[ADD_ITEM] ✅ ${data.was_updated ? 'Atualizado' : 'Adicionado'} com sucesso!`);
    console.log(`[ADD_ITEM] 📊 Carrinho: ${data.cart_item_count} itens, Total: R$ ${data.cart_total}`);

    return {
      success: true,
      data: {
        item_added: args.product_name,
        quantity: args.quantity,
        items_count: data.cart_item_count,
        current_total: data.cart_total,
        was_updated: data.was_updated
      },
      message: `${args.product_name} ${data.was_updated ? 'atualizado' : 'adicionado'}! Total: R$ ${data.cart_total} (${data.cart_item_count} ${data.cart_item_count === 1 ? 'item' : 'itens'})`
    };
    
  } catch (error) {
    console.error(`[ADD_ITEM] ❌ ERRO FATAL:`, error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao adicionar item ao carrinho'
    };
  }
}

export async function executeGetCartSummary(
  supabase: any,
  chatId: number
) {
  try {
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    const orderItems = chat?.metadata?.order_items || [];
    const total = orderItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    return {
      success: true,
      data: {
        items: orderItems,
        items_count: orderItems.length,
        total: total
      },
      message: `Carrinho: ${orderItems.length} itens - R$ ${total.toFixed(2)}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Erro ao buscar carrinho'
    };
  }
}
