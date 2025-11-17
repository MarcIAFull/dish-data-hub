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
  try {
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    const metadata = chat?.metadata || {};
    const orderItems = metadata.order_items || [];
    
    orderItems.push({
      product_name: args.product_name,
      quantity: args.quantity,
      unit_price: args.unit_price,
      notes: args.notes || null,
      added_at: new Date().toISOString()
    });
    
    await supabase
      .from('chats')
      .update({ 
        metadata: { ...metadata, order_items: orderItems },
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
    
    const total = orderItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    return {
      success: true,
      data: {
        item_added: args.product_name,
        quantity: args.quantity,
        items_count: orderItems.length,
        current_total: total
      },
      message: `${args.product_name} adicionado! Total: R$ ${total.toFixed(2)}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Erro ao adicionar item'
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
