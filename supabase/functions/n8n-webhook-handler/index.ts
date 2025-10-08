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

async function getRestaurantIdFromAgent(supabase: any, agent_id: string): Promise<string | null> {
  if (!agent_id) return null;
  
  const { data, error } = await supabase
    .from('agents')
    .select('restaurant_id')
    .eq('id', agent_id)
    .single();
  
  if (error) {
    console.error('Error fetching restaurant_id from agent:', error);
    return null;
  }
  
  return data?.restaurant_id || null;
}

async function handleChatEvent(supabase: any, payload: WebhookPayload) {
  const { conversation_id, phone, status, agent_id } = payload.data;

  // Get restaurant_id from agent
  const restaurant_id = agent_id ? await getRestaurantIdFromAgent(supabase, agent_id) : null;

  // Upsert chat record
  const { data, error } = await supabase
    .from('chats')
    .upsert({
      conversation_id,
      phone,
      status: status || 'indefinido',
      agent_id: agent_id || null,
      restaurant_id,
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

  // Get restaurant_id from conversation's agent
  let restaurant_id = null;
  const { data: chatData } = await supabase
    .from('chats')
    .select('agent_id')
    .eq('conversation_id', conversation_id)
    .single();
  
  if (chatData?.agent_id) {
    restaurant_id = await getRestaurantIdFromAgent(supabase, chatData.agent_id);
  }

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
      restaurant_id,
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
