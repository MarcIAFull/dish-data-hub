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
  console.log(`[ADD_ITEM] 🛒 Iniciando adição de item ao carrinho chatId=${chatId}`);
  console.log(`[ADD_ITEM] 📦 Item: ${args.product_name} x${args.quantity} @ R$${args.unit_price}`);
  
  try {
    // Buscar metadata atual
    console.log(`[ADD_ITEM] 📖 Buscando metadata do chat ${chatId}...`);
    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    if (fetchError) {
      console.error(`[ADD_ITEM] ❌ Erro ao buscar chat:`, fetchError);
      throw fetchError;
    }
    
    const metadata = chat?.metadata || {};
    const orderItems = metadata.order_items || [];
    
    console.log(`[ADD_ITEM] 📊 Carrinho atual: ${orderItems.length} itens`);
    
    // Adicionar novo item
    const newItem = {
      product_name: args.product_name,
      quantity: args.quantity,
      unit_price: args.unit_price,
      notes: args.notes || null,
      added_at: new Date().toISOString()
    };
    
    orderItems.push(newItem);
    console.log(`[ADD_ITEM] ➕ Item adicionado ao array. Novo total: ${orderItems.length} itens`);
    
    // Atualizar metadata preservando outros campos
    const updatedMetadata = {
      ...metadata,
      order_items: orderItems,
      order_total: orderItems.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0
      )
    };
    
    console.log(`[ADD_ITEM] 💾 Atualizando metadata no banco...`);
    console.log(`[ADD_ITEM] 📝 Metadata atualizado:`, JSON.stringify(updatedMetadata, null, 2));
    
    const { error: updateError } = await supabase
      .from('chats')
      .update({ 
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
    
    if (updateError) {
      console.error(`[ADD_ITEM] ❌ Erro ao atualizar metadata:`, updateError);
      throw updateError;
    }
    
    const total = updatedMetadata.order_total;
    
    console.log(`[ADD_ITEM] ✅ Item adicionado com sucesso!`);
    console.log(`[ADD_ITEM] 📊 Carrinho final: ${orderItems.length} itens, Total: R$ ${total.toFixed(2)}`);
    
    return {
      success: true,
      data: {
        item_added: args.product_name,
        quantity: args.quantity,
        items_count: orderItems.length,
        current_total: total,
        metadata: updatedMetadata
      },
      message: `${args.product_name} adicionado! Total: R$ ${total.toFixed(2)} (${orderItems.length} ${orderItems.length === 1 ? 'item' : 'itens'})`
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
