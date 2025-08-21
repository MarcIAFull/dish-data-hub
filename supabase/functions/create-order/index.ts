import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      restaurantId, 
      customerName, 
      customerPhone, 
      customerEmail, 
      customerAddress,
      items, 
      deliveryType = 'delivery',
      paymentMethod = 'cash',
      notes 
    } = await req.json();

    if (!restaurantId || !customerName || !customerPhone || !items || items.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'restaurantId, customerName, customerPhone, and items are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify restaurant belongs to user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, user_id')
      .eq('id', restaurantId)
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', customerPhone)
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      customer = newCustomer;
    } else {
      // Update customer info if provided
      const updates: any = {};
      if (customerName !== customer.name) updates.name = customerName;
      if (customerEmail && customerEmail !== customer.email) updates.email = customerEmail;
      if (customerAddress && customerAddress !== customer.address) updates.address = customerAddress;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('customers')
          .update(updates)
          .eq('id', customer.id);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Verify product exists and get current price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return new Response(JSON.stringify({ 
          error: `Product not found: ${item.productId}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const quantity = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(product.price);
      const totalPrice = quantity * unitPrice;

      subtotal += totalPrice;

      orderItems.push({
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        notes: item.notes || null
      });
    }

    const deliveryFee = deliveryType === 'delivery' ? 5.00 : 0; // R$ 5 delivery fee
    const total = subtotal + deliveryFee;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        customer_id: customer.id,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: paymentMethod,
        payment_status: 'pending',
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? (customerAddress || customer.address) : null,
        notes
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Clean up order if items creation failed
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(JSON.stringify({ error: 'Failed to create order items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get complete order with items for response
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`
        *,
        customers (*),
        order_items (
          *,
          products (id, name, price)
        )
      `)
      .eq('id', order.id)
      .single();

    return new Response(JSON.stringify({ 
      success: true, 
      order: completeOrder 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-order function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});