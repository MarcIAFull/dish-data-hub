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

    console.log('🧹 Starting system reset...');

    // 1. Archive all active chats
    const { data: archivedChats, error: chatError } = await supabaseClient
      .from('chats')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        session_status: 'completed',
        metadata: {
          archived_reason: 'System reset for testing',
          archived_at: new Date().toISOString()
        }
      })
      .neq('status', 'archived')
      .select('id, phone');

    if (chatError) {
      console.error('Error archiving chats:', chatError);
      throw chatError;
    }

    console.log(`✅ Archived ${archivedChats?.length || 0} chats`);

    // 2. Cancel pending/preparing orders
    const { data: cancelledOrders, error: orderError } = await supabaseClient
      .from('pedidos')
      .update({
        order_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Sistema resetado para testes'
      })
      .in('order_status', ['pending', 'confirmed', 'preparing', 'ready', 'in_delivery'])
      .select('id, order_status');

    if (orderError) {
      console.error('Error cancelling orders:', orderError);
      throw orderError;
    }

    console.log(`✅ Cancelled ${cancelledOrders?.length || 0} orders`);

    // 3. Get statistics
    const { count: totalChats } = await supabaseClient
      .from('chats')
      .select('*', { count: 'exact', head: true });

    const { count: totalMessages } = await supabaseClient
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { count: totalOrders } = await supabaseClient
      .from('pedidos')
      .select('*', { count: 'exact', head: true });

    const result = {
      success: true,
      archived_chats: archivedChats?.length || 0,
      cancelled_orders: cancelledOrders?.length || 0,
      statistics: {
        total_chats: totalChats || 0,
        total_messages: totalMessages || 0,
        total_orders: totalOrders || 0
      },
      message: 'Sistema resetado com sucesso! Todas as conversas foram arquivadas e pedidos pendentes foram cancelados.'
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
