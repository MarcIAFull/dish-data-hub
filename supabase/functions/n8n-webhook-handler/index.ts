import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: 'chat_created' | 'chat_updated' | 'message_received' | 'order_created' | 'order_updated';
  data: {
    conversation_id?: string;
    chat_id?: string;
    phone?: string;
    status?: string;
    message?: string;
    user_name?: string;
    customer_data?: any;
    order_data?: any;
    restaurant_id?: string;
    agent_id?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook from n8n:', payload.event, payload.data);

    let result;

    switch (payload.event) {
      case 'chat_created':
      case 'chat_updated':
        result = await handleChatEvent(supabase, payload);
        break;
      
      case 'message_received':
        result = await handleMessageEvent(supabase, payload);
        break;
      
      case 'order_created':
      case 'order_updated':
        result = await handleOrderEvent(supabase, payload);
        break;
      
      default:
        console.warn('Unknown event type:', payload.event);
        return new Response(
          JSON.stringify({ error: 'Unknown event type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Webhook processed successfully:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing n8n webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleChatEvent(supabase: any, payload: WebhookPayload) {
  const { conversation_id, phone, status, agent_id } = payload.data;

  // Upsert chat record
  const { data, error } = await supabase
    .from('chats')
    .upsert({
      conversation_id,
      phone,
      status: status || 'indefinido',
      agent_id: agent_id || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'conversation_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleMessageEvent(supabase: any, payload: WebhookPayload) {
  const { conversation_id, message, user_name, phone } = payload.data;

  // Insert message record
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id,
      user_message: message,
      user_name,
      phone,
      message_type: 'incoming',
      active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleOrderEvent(supabase: any, payload: WebhookPayload) {
  const { chat_id, order_data, restaurant_id } = payload.data;

  // Prepare payload with restaurant_id and other order data
  const orderPayload = {
    restaurant_id,
    ...order_data,
  };

  // Upsert order record in pedidos table
  const { data, error } = await supabase
    .from('pedidos')
    .upsert({
      chat_id,
      status: order_data?.status || 'pending',
      payload: orderPayload,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'chat_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
