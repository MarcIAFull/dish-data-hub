// 🔧 Core tools - Create order

export async function executeCreateOrder(
  supabase: any,
  chatId: number,
  args: { payment_method: string; delivery_type: string }
) {
  try {
    console.log('[CREATE_ORDER] Starting...');
    
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata, phone, agents!inner(restaurants!inner(*))')
      .eq('id', chatId)
      .single();
    
    if (!chat) {
      return { success: false, error: 'CHAT_NOT_FOUND', message: 'Chat não encontrado' };
    }
    
    const metadata = chat.metadata || {};
    const orderItems = metadata.order_items || [];
    const restaurant = chat.agents.restaurants;
    
    if (orderItems.length === 0) {
      return { success: false, error: 'EMPTY_CART', message: 'Carrinho vazio' };
    }
    
    if (!metadata.customer_name) {
      return { success: false, error: 'MISSING_NAME', message: 'Nome não informado' };
    }
    
    const itemsTotal = orderItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    const deliveryFee = args.delivery_type === 'delivery' ? (metadata.delivery_fee || 0) : 0;
    const totalAmount = itemsTotal + deliveryFee;
    
    const payload = {
      items: orderItems,
      customer_name: metadata.customer_name,
      customer_phone: chat.phone,
      delivery_type: args.delivery_type,
      delivery_address: args.delivery_type === 'delivery' ? metadata.delivery_address : null,
      delivery_fee: deliveryFee,
      payment_method: args.payment_method,
      subtotal: itemsTotal,
      total: totalAmount
    };
    
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .insert({
        chat_id: chatId.toString(),
        restaurant_id: restaurant.id,
        customer_name: metadata.customer_name,
        customer_phone: chat.phone,
        delivery_type: args.delivery_type,
        total_amount: totalAmount,
        order_status: 'pending',
        order_source: 'ai_agent',
        payload: payload,
        status: 'pending'
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('[CREATE_ORDER] DB error:', orderError);
      return { success: false, error: 'DB_ERROR', message: 'Erro ao criar pedido' };
    }
    
    // 🆕 Arquivar chat após criar pedido
    await supabase.from('chats').update({
      metadata: {
        ...metadata,
        order_items: [],
        last_order_id: order.id,
        order_completed_at: new Date().toISOString()
      },
      status: 'archived',
      archived_at: new Date().toISOString(),
      session_status: 'completed',
      conversation_state: 'completed'
    }).eq('id', chatId);
    
    console.log('[CREATE_ORDER] ✅ Order created and chat archived:', order.id);
    
    return {
      success: true,
      data: {
        order_id: order.id,
        total: totalAmount,
        items_count: orderItems.length
      },
      message: `Pedido #${order.id} criado! Total: R$ ${totalAmount.toFixed(2)}`
    };
    
  } catch (error) {
    console.error('[CREATE_ORDER] ❌ Error:', error);
    return { success: false, error: error.message, message: 'Erro ao criar pedido' };
  }
}
