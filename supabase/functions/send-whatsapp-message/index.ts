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

    if (!conversationId || !message) {
      return new Response(JSON.stringify({ error: 'conversationId and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify conversation belongs to user's restaurant
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        agents (
          *,
          restaurants (
            id,
            user_id
          )
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation || conversation.agents.restaurants.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save human message
    const { data: savedMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'human',
        content: message,
        message_type: messageType
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error saving message:', msgError);
      return new Response(JSON.stringify({ error: 'Failed to save message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send message via Evolution API
    const agent = conversation.agents;
    if (agent.evolution_api_token && agent.evolution_api_instance) {
      try {
        const sendResponse = await fetch(`https://api.evolutionapi.com/message/sendText/${agent.evolution_api_instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': agent.evolution_api_token
          },
          body: JSON.stringify({
            number: conversation.customer_phone,
            textMessage: {
              text: message
            }
          })
        });

        if (!sendResponse.ok) {
          console.error('Failed to send WhatsApp message:', await sendResponse.text());
        }
      } catch (sendError) {
        console.error('Error sending WhatsApp message:', sendError);
      }
    }

    // Update conversation status and timestamp
    await supabase
      .from('conversations')
      .update({ 
        status: 'human_handoff',
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

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