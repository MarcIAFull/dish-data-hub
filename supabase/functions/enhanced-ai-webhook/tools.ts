// Tool executor functions for AI agent

export async function executeCreateOrder(
  supabase: any,
  agent: any,
  args: any,
  chatId: number,
  customerPhone: string
) {
  try {
    console.log('[CREATE_ORDER] Starting order creation', { args, chatId, customerPhone });
    
    // 1. Find or create customer
    const cleanPhone = customerPhone.replace(/\D/g, '');
    
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('restaurant_id', agent.restaurants.id)
      .maybeSingle();
    
    if (!customer) {
      console.log('[CREATE_ORDER] Creating new customer');
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          cliente_name: args.customer_name,
          phone: cleanPhone,
          restaurant_id: agent.restaurants.id,
          app: 'whatsapp',
          location: args.delivery_address || null
        })
        .select()
        .single();
      
      if (customerError) throw customerError;
      customer = newCustomer;
    }
    
    console.log('[CREATE_ORDER] Customer:', customer.id);
    
    // 2. Calculate totals
    const subtotal = args.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    const deliveryFee = args.delivery_type === 'delivery' ? 5.00 : 0;
    const total = subtotal + deliveryFee;
    
    console.log('[CREATE_ORDER] Totals:', { subtotal, deliveryFee, total });
    
    // 3. Create order payload for pedidos table
    const orderPayload = {
      customer_name: args.customer_name,
      customer_phone: cleanPhone,
      items: args.items,
      delivery_type: args.delivery_type,
      payment_method: args.payment_method || 'cash',
      delivery_address: args.delivery_address,
      notes: args.notes,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      created_via: 'ai_agent'
    };
    
    // 4. Insert into pedidos table
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .insert({
        chat_id: chatId.toString(),
        status: 'pending',
        restaurant_id: agent.restaurants.id,
        payload: orderPayload,
        created_by: 'ai_agent'
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('[CREATE_ORDER] Error creating order:', orderError);
      throw orderError;
    }
    
    console.log('[CREATE_ORDER] Order created:', order.id);
    
    // 5. Send notification if enabled
    if (agent.enable_automatic_notifications && agent.evolution_api_token && agent.evolution_api_instance) {
      const confirmationMessage = `✅ Pedido #${order.id} confirmado!\n\n` +
        `📦 Itens: ${args.items.map((item: any) => `${item.quantity}x ${item.product_name}`).join(', ')}\n` +
        `💰 Total: R$ ${total.toFixed(2)}\n\n` +
        `Obrigado pela preferência! 🙏`;
      
      try {
        await fetch(`${agent.evolution_api_base_url || 'https://evolution.fullbpo.com'}/message/sendText/${agent.evolution_api_instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': agent.evolution_api_token
          },
          body: JSON.stringify({
            number: customerPhone,
            text: confirmationMessage
          })
        });
        console.log('[CREATE_ORDER] Confirmation notification sent');
      } catch (notifError) {
        console.error('[CREATE_ORDER] Notification failed:', notifError);
      }
    }
    
    return {
      success: true,
      order_id: order.id,
      order_number: order.id,
      total: total,
      items_count: args.items.length,
      message: `Pedido #${order.id} criado com sucesso! Total: R$ ${total.toFixed(2)}`
    };
    
  } catch (error) {
    console.error('[CREATE_ORDER] Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Não foi possível criar o pedido. Por favor, tente novamente ou fale com um atendente.'
    };
  }
}

export async function executeCheckAvailability(supabase: any, agent: any, args: any) {
  try {
    console.log('[CHECK_AVAILABILITY] Checking product:', args.product_name);
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        price, 
        description,
        is_active,
        categories!inner(restaurant_id)
      `)
      .eq('categories.restaurant_id', agent.restaurants.id)
      .ilike('name', `%${args.product_name}%`)
      .eq('is_active', true);
    
    if (error) throw error;
    
    if (!products || products.length === 0) {
      console.log('[CHECK_AVAILABILITY] Product not found');
      return {
        available: false,
        message: `Produto "${args.product_name}" não encontrado no cardápio.`,
        suggestions: []
      };
    }
    
    console.log('[CHECK_AVAILABILITY] Found', products.length, 'products');
    
    return {
      available: true,
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description
      })),
      message: `${products.length} produto(s) encontrado(s) no cardápio`
    };
  } catch (error) {
    console.error('[CHECK_AVAILABILITY] Error:', error);
    return {
      available: false,
      error: error.message,
      message: 'Não foi possível verificar disponibilidade do produto.'
    };
  }
}
