import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Starting FULL system reset - DELETING all data...');

    // 1. Delete all AI processing logs
    const { error: logsError } = await supabaseClient
      .from('ai_processing_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (logsError) {
      console.error('Error deleting AI logs:', logsError);
    } else {
      console.log('✅ Deleted all AI processing logs');
    }

    // 2. Delete all session summaries
    const { error: summariesError } = await supabaseClient
      .from('session_summaries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (summariesError) {
      console.error('Error deleting session summaries:', summariesError);
    } else {
      console.log('✅ Deleted all session summaries');
    }

    // 3. Delete all messages
    const { error: messagesError } = await supabaseClient
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
    } else {
      console.log('✅ Deleted all messages');
    }

    // 4. Delete all order status history
    const { error: historyError } = await supabaseClient
      .from('order_status_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (historyError) {
      console.error('Error deleting order history:', historyError);
    } else {
      console.log('✅ Deleted all order status history');
    }

    // 5. Delete all orders (pedidos)
    const { error: ordersError } = await supabaseClient
      .from('pedidos')
      .delete()
      .neq('id', 0);

    if (ordersError) {
      console.error('Error deleting orders:', ordersError);
      throw ordersError;
    }

    console.log('✅ Deleted all orders');

    // 6. Delete all chat tags
    const { error: tagsError } = await supabaseClient
      .from('chat_tags')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (tagsError) {
      console.error('Error deleting chat tags:', tagsError);
    } else {
      console.log('✅ Deleted all chat tags');
    }

    // 7. Delete all conversation notes
    const { error: notesError } = await supabaseClient
      .from('conversation_notes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (notesError) {
      console.error('Error deleting conversation notes:', notesError);
    } else {
      console.log('✅ Deleted all conversation notes');
    }

    // 8. Delete all chats
    const { error: chatsError } = await supabaseClient
      .from('chats')
      .delete()
      .neq('id', 0);

    if (chatsError) {
      console.error('Error deleting chats:', chatsError);
      throw chatsError;
    }

    console.log('✅ Deleted all chats');

    const result = {
      success: true,
      message: '🧹 Sistema completamente limpo! Todos os chats, mensagens, pedidos e logs foram deletados.',
      deleted: {
        chats: 'all',
        messages: 'all',
        orders: 'all',
        ai_logs: 'all',
        session_summaries: 'all',
        order_history: 'all',
        chat_tags: 'all',
        conversation_notes: 'all'
      }
    };

    console.log('✅ System reset completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error resetting system:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
