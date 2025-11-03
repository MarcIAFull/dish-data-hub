import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const { conversationId, message, messageType = 'text' } = await req.json();

    console.log('Request data:', { conversationId, messageType, messageLength: message?.length });

    if (!conversationId || !message) {
      return new Response(JSON.stringify({ error: 'conversationId and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse conversation ID
    const chatId = parseInt(conversationId);
    console.log('Parsed chat ID:', chatId);

    // Verify conversation belongs to user's restaurant
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*, restaurant_id, agent_id, phone')
      .eq('id', chatId)
      .single();

    console.log('Chat query result:', { chat, chatError });

    if (chatError || !chat) {
      console.error('Chat not found:', chatError);
      return new Response(JSON.stringify({ error: 'Conversation not found', details: chatError?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns this restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, user_id')
      .eq('id', chat.restaurant_id)
      .single();

    console.log('Restaurant query result:', { restaurant, restaurantError });

    if (restaurantError || !restaurant || restaurant.user_id !== user.id) {
      console.error('Access denied:', { restaurantError, hasRestaurant: !!restaurant, userMatch: restaurant?.user_id === user.id });
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save customer message (usando sender_type 'customer' conforme schema)
    const { data: savedMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: 'customer',
        content: message,
        message_type: messageType
      })
      .select()
      .single();

    console.log('Message save result:', { savedMessage, msgError });

    if (msgError) {
      console.error('Error saving message:', msgError);
      return new Response(JSON.stringify({ error: 'Failed to save message', details: msgError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send message via Evolution API
    if (chat.agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('evolution_api_token, evolution_api_instance')
        .eq('id', chat.agent_id)
        .single();

      console.log('Agent query result:', { agent, agentError });

      if (agent?.evolution_api_token && agent?.evolution_api_instance) {
        try {
          const sendResponse = await fetch(`https://api.evolutionapi.com/message/sendText/${agent.evolution_api_instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': agent.evolution_api_token
            },
            body: JSON.stringify({
              number: chat.phone,
              textMessage: {
                text: message
              }
            })
          });

          console.log('WhatsApp send response status:', sendResponse.status);

          if (!sendResponse.ok) {
            console.error('Failed to send WhatsApp message:', await sendResponse.text());
          }
        } catch (sendError) {
          console.error('Error sending WhatsApp message:', sendError);
        }
      } else {
        console.log('Agent credentials not configured');
      }
    }

    // Update conversation status and timestamp
    const { error: updateError } = await supabase
      .from('chats')
      .update({ 
        status: 'human_handoff',
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Error updating chat status:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: savedMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-whatsapp-message function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});