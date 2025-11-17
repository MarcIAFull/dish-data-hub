// 🔄 Order Status Webhook - Auto-manage chats based on order status
// Reage a mudanças de status de pedidos para reabrir ou arquivar chats

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();
    
    console.log('[ORDER_STATUS_WEBHOOK] Received:', payload);
    
    const { type, table, record, old_record } = payload;
    
    // Apenas processar updates na tabela pedidos
    if (type !== 'UPDATE' || table !== 'pedidos') {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const oldStatus = old_record?.order_status;
    const newStatus = record?.order_status;
    const chatId = record?.chat_id;
    
    // Apenas processar se houve mudança de status
    if (oldStatus === newStatus || !chatId) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[ORDER_STATUS_WEBHOOK] Status change: ${oldStatus} → ${newStatus} (chat: ${chatId})`);
    
    // 🔄 PEDIDO CANCELADO → Reabrir chat para novo pedido
    if (newStatus === 'cancelled') {
      console.log(`[ORDER_STATUS_WEBHOOK] 🔄 Reabrindo chat ${chatId} (pedido cancelado)...`);
      
      const { error } = await supabase
        .from('chats')
        .update({
          status: 'active',
          session_status: 'active',
          conversation_state: 'greeting',
          archived_at: null,
          reopened_at: new Date().toISOString(),
          metadata: supabase.rpc('jsonb_set', {
            target: 'metadata',
            path: '{order_items}',
            new_value: '[]'
          })
        })
        .eq('id', parseInt(chatId));
      
      if (error) {
        console.error('[ORDER_STATUS_WEBHOOK] ❌ Erro ao reabrir chat:', error);
        throw error;
      }
      
      console.log(`[ORDER_STATUS_WEBHOOK] ✅ Chat ${chatId} reaberto`);
      
      return new Response(JSON.stringify({ 
        action: 'chat_reopened',
        chat_id: chatId,
        reason: 'order_cancelled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // ✅ PEDIDO COMPLETADO → Arquivar chat
    if (newStatus === 'completed') {
      console.log(`[ORDER_STATUS_WEBHOOK] ✅ Arquivando chat ${chatId} (pedido completo)...`);
      
      const { error } = await supabase
        .from('chats')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          session_status: 'completed',
          conversation_state: 'completed'
        })
        .eq('id', parseInt(chatId));
      
      if (error) {
        console.error('[ORDER_STATUS_WEBHOOK] ❌ Erro ao arquivar chat:', error);
        throw error;
      }
      
      console.log(`[ORDER_STATUS_WEBHOOK] ✅ Chat ${chatId} arquivado`);
      
      return new Response(JSON.stringify({ 
        action: 'chat_archived',
        chat_id: chatId,
        reason: 'order_completed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Outras mudanças de status não afetam o chat
    return new Response(JSON.stringify({ 
      action: 'no_action',
      status_change: `${oldStatus} → ${newStatus}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[ORDER_STATUS_WEBHOOK] ❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});