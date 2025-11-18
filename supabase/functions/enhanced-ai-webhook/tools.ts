// Tool executor functions for AI agent

// FASE 5: Interface atualizada para suportar modifiers
interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  modifiers?: Array<{
    name: string;
    price: number;
  }>;
}

export async function executeCheckOrderPrerequisites(
  supabase: any,
  chatId: number,
  args: any
) {
  try {
    console.log('[CHECK_PREREQUISITES] Starting validation...');
    
    // Buscar metadata atual
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    const metadata = chat?.metadata || {};
    
    console.log('[CHECK_PREREQUISITES] Current metadata:', JSON.stringify(metadata, null, 2));
    
    // Verificar dados obrigatórios
    const missing = [];
    
    if (!metadata.customer_name || metadata.customer_name.trim() === '') {
      missing.push("nome do cliente");
    }
    
    if (args.delivery_type === 'delivery') {
      if (!metadata.validated_address_token) {
        missing.push("endereço validado (use validate_delivery_address)");
      }
      if (!metadata.delivery_fee) {
        missing.push("taxa de entrega");
      }
      if (!metadata.delivery_address) {
        missing.push("endereço completo");
      }
    }
    
    if (missing.length > 0) {
      console.log('[CHECK_PREREQUISITES] ❌ Missing data:', missing);
      return {
        ready: false,
        missing_data: missing,
        message: `Faltam os seguintes dados para finalizar o pedido: ${missing.join(', ')}.`,
        action: "Colete esses dados antes de mostrar o resumo ao cliente."
      };
    }
    
    console.log('[CHECK_PREREQUISITES] ✅ All prerequisites met');
    
    return {
      ready: true,
      message: "Todos os dados necessários foram coletados. Pode mostrar o resumo.",
      customer_name: metadata.customer_name,
      delivery_type: args.delivery_type,
      delivery_address: metadata.delivery_address,
      delivery_fee: metadata.delivery_fee,
      validated_address_token: metadata.validated_address_token
    };
  } catch (error) {
    console.error('[CHECK_PREREQUISITES] ❌ Error:', error);
    return {
      ready: false,
      error: 'validation_error',
      message: 'Erro ao validar pré-requisitos do pedido.'
    };
  }
}

export async function executeCreateOrder(
  supabase: any,
  agent: any,
  args: any,
  chatId: number,
  customerPhone: string
) {
  try {
    // Determinar moeda baseada no país do restaurante
    const currency = agent.restaurants?.country === 'PT' ? '€' : 'R$';
    
    console.log('[CREATE_ORDER] ========== STARTING VALIDATION ==========');
    console.log('[CREATE_ORDER] Args:', JSON.stringify(args, null, 2));
    
    // ============= VALIDATION LAYER -1: FETCH METADATA (FASE 6) =============
    
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    const metadata = chat?.metadata || {};
    
    console.log('[CREATE_ORDER] 📊 Current metadata:', JSON.stringify(metadata, null, 2));
    
    // ✅ DADOS DO METADATA SOBRESCREVEM ARGS (fonte da verdade)
    const customerName = metadata.customer_name || args.customer_name;
    const validatedToken = metadata.validated_address_token;
    const deliveryFee = metadata.delivery_fee;
    const deliveryAddress = metadata.delivery_address;
    
    console.log('[CREATE_ORDER] Using data from metadata:', {
      customerName,
      hasValidatedToken: !!validatedToken,
      deliveryFee,
      deliveryAddress
    });
    
    // ============= VALIDATION LAYER 0: MANDATORY DATA CHECK (FASE 6) =============
    
    if (!customerName || customerName.trim() === '') {
      console.error('[CREATE_ORDER] ❌ Customer name not collected');
      return {
        success: false,
        error: 'Nome não coletado',
        message: 'Não foi possível criar o pedido porque não temos o nome do cliente. Por favor, informe seu nome.'
      };
    }
    
    console.log('[CREATE_ORDER] ✓ Customer name validated:', customerName);
    
    if (args.delivery_type === 'delivery') {
      if (!validatedToken) {
        console.error('[CREATE_ORDER] ❌ Address not validated - missing token');
        return {
          success: false,
          error: 'Endereço não validado',
          message: 'O endereço precisa ser validado antes de criar o pedido. Por favor, forneça um endereço completo com CEP.'
        };
      }
      
      if (!deliveryAddress) {
        console.error('[CREATE_ORDER] ❌ Delivery address not collected');
        return {
          success: false,
          error: 'Endereço incompleto',
          message: 'Endereço de entrega não foi coletado.'
        };
      }
      
      console.log('[CREATE_ORDER] ✓ Delivery address validated');
    }
    
    // ============= VALIDATION LAYER 1: CONFIRMATION CHECK (FASE 3) =============
    
    if (!args._confirmed_by_customer) {
      console.error('[CREATE_ORDER] ❌ Order not confirmed by customer');
      return {
        success: false,
        error: 'Pedido não confirmado',
        message: 'Por favor, revise os itens, valores e confirme o pedido antes de finalizar. Diga "confirmo" ou "pode fazer" para prosseguir.'
      };
    }
    
    console.log('[CREATE_ORDER] ✓ Customer confirmation verified');
    
    // ============= VALIDATION LAYER 2: DATA TYPES =============
    
    if (!args.items || !Array.isArray(args.items) || args.items.length === 0) {
      return { success: false, error: 'Lista de itens inválida ou vazia' };
    }
    
    if (!['delivery', 'pickup'].includes(args.delivery_type)) {
      return { success: false, error: 'Tipo de entrega inválido' };
    }
    
    if (args.delivery_type === 'delivery' && !args.delivery_address) {
      return { success: false, error: 'Endereço obrigatório para delivery' };
    }
    
    // Address validation was already checked in LAYER 0
    
    // ============= VALIDATION LAYER 3: SANITIZATION =============
    
    const sanitizedName = customerName.trim().substring(0, 100);
    const sanitizedAddress = deliveryAddress ? 
      deliveryAddress.trim().substring(0, 200) : null;
    const sanitizedNotes = args.notes ? 
      args.notes.trim().substring(0, 500) : null;
    const sanitizedPayment = args.payment_method ? 
      args.payment_method.trim().substring(0, 50) : 'cash';
    
    console.log('[CREATE_ORDER] ✓ Data types and sanitization passed');
    
    // ============= VALIDATION LAYER 4: PRODUCT DATABASE LOOKUP =============
    
    console.log('[CREATE_ORDER] Fetching valid products from database...');
    
    const { data: validProducts, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        categories!inner(restaurant_id)
      `)
      .eq('categories.restaurant_id', agent.restaurants.id)
      .eq('is_active', true);
    
    if (productsError) {
      console.error('[CREATE_ORDER] Database error:', productsError);
      return {
        success: false,
        error: 'Erro ao validar produtos',
        message: 'Não foi possível validar os produtos. Tente novamente.'
      };
    }
    
    console.log(`[CREATE_ORDER] Found ${validProducts.length} valid products in database`);
    
    // Create normalized map: lowercase name -> product data
    const productsMap = new Map(
      validProducts.map(p => [
        p.name.toLowerCase().trim(), 
        { id: p.id, name: p.name, price: parseFloat(p.price) }
      ])
    );
    
    // ============= VALIDATION LAYER 5: VALIDATE EACH ITEM =============
    
    const invalidItems: string[] = [];
    const priceMismatchItems: string[] = [];
    const validatedItems: any[] = [];
    
    for (const item of args.items) {
      const normalizedName = item.product_name.toLowerCase().trim();
      const dbProduct = productsMap.get(normalizedName);
      
      // Check if product exists
      if (!dbProduct) {
        invalidItems.push(item.product_name);
        console.error(`[CREATE_ORDER] ❌ Product not found: "${item.product_name}"`);
        continue;
      }
      
      // Check quantity
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        invalidItems.push(`${item.product_name} (quantidade inválida: ${item.quantity})`);
        console.error(`[CREATE_ORDER] ❌ Invalid quantity for ${item.product_name}: ${item.quantity}`);
        continue;
      }
      
      // Check price match (tolerance: 0.01)
      const dbPrice = dbProduct.price;
      const providedPrice = parseFloat(item.unit_price);
      
      if (Math.abs(dbPrice - providedPrice) > 0.01) {
        console.warn(`[CREATE_ORDER] ⚠️ Price mismatch for "${dbProduct.name}": DB=${dbPrice}, Provided=${providedPrice}`);
        priceMismatchItems.push(`${dbProduct.name} (preço correto: ${currency} ${dbPrice.toFixed(2)})`);
      }
      
      // Use validated data from database
      validatedItems.push({
        product_id: dbProduct.id,
        product_name: dbProduct.name, // Use exact DB name
        quantity: item.quantity,
        unit_price: dbPrice, // Use exact DB price
        notes: item.notes ? item.notes.trim().substring(0, 200) : null
      });
      
      console.log(`[CREATE_ORDER] ✓ Validated: ${dbProduct.name} x${item.quantity} @ ${currency} ${dbPrice.toFixed(2)}`);
    }
    
    // ============= VALIDATION LAYER 6: REJECT IF INVALID ITEMS =============
    
    if (invalidItems.length > 0) {
      console.error('[CREATE_ORDER] ❌ VALIDATION FAILED - Invalid products:', invalidItems);
      return {
        success: false,
        error: 'Produtos inválidos detectados',
        message: `Os seguintes itens não estão no cardápio:\n${invalidItems.join('\n')}\n\nPor favor, escolha apenas produtos disponíveis no menu.`,
        invalid_items: invalidItems
      };
    }
    
    if (validatedItems.length === 0) {
      console.error('[CREATE_ORDER] ❌ No valid items after validation');
      return {
        success: false,
        error: 'Nenhum produto válido',
        message: 'Não foi possível validar os produtos do pedido.'
      };
    }
    
    // ============= VALIDATION LAYER 7: CALCULATE TOTALS (FASE 5: include modifiers) =============
    
    const subtotal = args.items.reduce((sum: number, item: OrderItem) => {
      const itemTotal = item.quantity * item.unit_price;
      const modifiersTotal = (item.modifiers || []).reduce(
        (modSum, mod) => modSum + mod.price,
        0
      ) * item.quantity;
      return sum + itemTotal + modifiersTotal;
    }, 0);
    
    // FASE 6: Use validated delivery fee from metadata (prioritize over args)
    const finalDeliveryFee = args.delivery_type === 'delivery' ? (deliveryFee || args.delivery_fee || 5.00) : 0;
    const total = subtotal + finalDeliveryFee;
    
    console.log('[CREATE_ORDER] ✓ Totals calculated:', { subtotal, deliveryFee: finalDeliveryFee, total });
    
    // Sanity check: reasonable total
    if (total < 0 || total > 10000) {
      console.error(`[CREATE_ORDER] ❌ Unreasonable total: ${currency} ${total}`);
      return {
        success: false,
        error: 'Valor total inválido',
        message: 'O valor do pedido está fora do limite permitido.'
      };
    }
    
    // ============= VALIDATION COMPLETE - CREATE ORDER =============
    
    console.log('[CREATE_ORDER] ========== ALL VALIDATIONS PASSED ==========');
    
    // 1. Find or create customer
    const cleanPhone = customerPhone.replace(/\D/g, '');
    
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('restaurant_id', agent.restaurants.id)
      .maybeSingle();
    
    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          cliente_name: sanitizedName,
          phone: cleanPhone,
          restaurant_id: agent.restaurants.id,
          app: 'whatsapp',
          location: sanitizedAddress
        })
        .select()
        .single();
      
      if (customerError) throw customerError;
      customer = newCustomer;
    }
    
    // 2. Create order payload
    const orderPayload = {
      customer_name: sanitizedName,
      customer_phone: cleanPhone,
      items: validatedItems,
      delivery_type: args.delivery_type,
      payment_method: sanitizedPayment,
      delivery_address: sanitizedAddress,
      notes: sanitizedNotes,
      subtotal,
      delivery_fee: finalDeliveryFee,
      total,
      created_via: 'ai_agent',
      validated_at: new Date().toISOString(),
      validated_address_token: validatedToken
    };
    
    // 3. Insert order with proper fields
    console.log(`[CREATE_ORDER] Creating order in pedidos table with restaurant_id: ${agent.restaurants.id}`);
    console.log(`[CREATE_ORDER] Full order payload:`, JSON.stringify(orderPayload, null, 2));
    
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .insert({
        chat_id: chatId.toString(),
        status: 'pending',
        order_status: 'pending', // New kanban status
        order_source: 'ai_agent', // Tag for AI-created orders
        restaurant_id: agent.restaurants.id,
        customer_name: sanitizedName,
        customer_phone: cleanPhone,
        delivery_type: args.delivery_type,
        total_amount: total,
        notes: sanitizedNotes,
        estimated_time: 30, // Default 30 minutes
        payload: orderPayload,
        created_by: 'ai_agent'
      })
      .select()
      .single();
    
    if (orderError) {
      console.error(`[CREATE_ORDER] ❌ Failed to insert order:`, orderError);
      throw orderError;
    }
    
    console.log(`[CREATE_ORDER] ✅ Order #${order.id} created successfully`);
    console.log(`[CREATE_ORDER] Order details:`, { 
      id: order.id, 
      restaurant_id: order.restaurant_id,
      order_source: order.order_source,
      order_status: order.order_status,
      total_amount: order.total_amount
    });
    
    // 4. Send notification (Formatação WhatsApp nativa)
    if (agent.enable_automatic_notifications && agent.evolution_api_token) {
      const confirmationMessage = 
        `✅ *Pedido #${order.id} confirmado!*\n\n` +
        `📦 *Itens do pedido:*\n` +
        `${validatedItems.map(item => 
          `  ${item.quantity}x ${item.product_name}\n  ${currency} ${(item.quantity * item.unit_price).toFixed(2)}`
        ).join('\n\n')}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💰 Subtotal: ${currency} ${subtotal.toFixed(2)}\n` +
        `🚚 Entrega: ${currency} ${finalDeliveryFee.toFixed(2)}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💵 *TOTAL: ${currency} ${total.toFixed(2)}*\n\n` +
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
        console.log('[CREATE_ORDER] ✓ Confirmation sent');
      } catch (notifError) {
        console.error('[CREATE_ORDER] Notification failed:', notifError);
      }
    }
    
    return {
      success: true,
      order_id: order.id,
      order_number: order.id,
      total: total,
      items_count: validatedItems.length,
      message: `Pedido #${order.id} criado com sucesso! Total: ${currency} ${total.toFixed(2)}`,
      price_corrections: priceMismatchItems.length > 0 ? priceMismatchItems : undefined
    };
    
  } catch (error) {
    console.error('[CREATE_ORDER] ❌ CRITICAL ERROR:', error);
    return {
      success: false,
      error: error.message,
      message: 'Não foi possível criar o pedido. Por favor, tente novamente ou fale com um atendente.'
    };
  }
}

export async function executeCheckAvailability(supabase: any, agent: any, args: any) {
  try {
    console.log('[CHECK_AVAILABILITY] Checking product:', args.product_name, 'Category:', args.category);
    
    let query = supabase
      .from('products')
      .select(`
        id, 
        name, 
        price, 
        description,
        is_active,
        categories!inner(name, restaurant_id)
      `)
      .eq('categories.restaurant_id', agent.restaurants.id)
      .eq('is_active', true);
    
    // Filter by category if provided (FASE 4 - Menu Presentation)
    if (args.category) {
      query = query.eq('categories.name', args.category);
    }
    
    // Filter by product name if provided
    if (args.product_name) {
      query = query.ilike('name', `%${args.product_name}%`);
    }
    
    const { data: products, error } = await query;
    
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
