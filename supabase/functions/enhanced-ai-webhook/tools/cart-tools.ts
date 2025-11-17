// 🛒 Cart-related tools - Dedicated to ORDER Agent

export function getCartTools() {
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
        name: "remove_item_from_order",
        description: "Remove um produto do carrinho do cliente",
        parameters: {
          type: "object",
          properties: {
            product_name: { type: "string" }
          },
          required: ["product_name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_item_quantity",
        description: "Atualiza a quantidade de um produto no carrinho",
        parameters: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            new_quantity: { type: "number" }
          },
          required: ["product_name", "new_quantity"]
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
    },
    {
      type: "function",
      function: {
        name: "clear_cart",
        description: "Limpa completamente o carrinho (usar apenas se cliente pedir para recomeçar)",
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
    const productId = `${args.product_name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    console.log(`[ADD_ITEM] 🔑 Product ID gerado: ${productId}`);
    
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

export async function executeRemoveItemFromOrder(
  supabase: any,
  chatId: number,
  args: { product_name: string }
) {
  try {
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    const orderItems = chat?.metadata?.order_items || [];
    const filteredItems = orderItems.filter((item: any) => 
      item.product_name.toLowerCase() !== args.product_name.toLowerCase()
    );
    
    const newTotal = filteredItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    await supabase
      .from('chats')
      .update({
        metadata: {
          ...chat.metadata,
          order_items: filteredItems,
          cart_total: newTotal
        }
      })
      .eq('id', chatId);
    
    return {
      success: true,
      data: {
        removed_item: args.product_name,
        items_count: filteredItems.length,
        new_total: newTotal
      },
      message: `${args.product_name} removido! Total: R$ ${newTotal.toFixed(2)} (${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'itens'})`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Erro ao remover item do carrinho'
    };
  }
}

export async function executeUpdateItemQuantity(
  supabase: any,
  chatId: number,
  args: { product_name: string; new_quantity: number }
) {
  try {
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    const orderItems = chat?.metadata?.order_items || [];
    const updatedItems = orderItems.map((item: any) => 
      item.product_name.toLowerCase() === args.product_name.toLowerCase()
        ? { ...item, quantity: args.new_quantity }
        : item
    );
    
    const newTotal = updatedItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    await supabase
      .from('chats')
      .update({
        metadata: {
          ...chat.metadata,
          order_items: updatedItems,
          cart_total: newTotal
        }
      })
      .eq('id', chatId);
    
    return {
      success: true,
      data: {
        updated_item: args.product_name,
        new_quantity: args.new_quantity,
        items_count: updatedItems.length,
        new_total: newTotal
      },
      message: `${args.product_name} atualizado para ${args.new_quantity}x! Total: R$ ${newTotal.toFixed(2)}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Erro ao atualizar quantidade'
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

export async function executeClearCart(
  supabase: any,
  chatId: number
) {
  try {
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    await supabase
      .from('chats')
      .update({
        metadata: {
          ...chat.metadata,
          order_items: [],
          cart_total: 0
        }
      })
      .eq('id', chatId);
    
    return {
      success: true,
      data: {
        items_count: 0,
        total: 0
      },
      message: 'Carrinho limpo com sucesso!'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Erro ao limpar carrinho'
    };
  }
}
