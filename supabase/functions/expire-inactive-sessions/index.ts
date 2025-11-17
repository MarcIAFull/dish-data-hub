import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Encontrar sessões ativas sem mensagens por >12h
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    
    const { data: inactiveSessions, error: fetchError } = await supabase
      .from('chats')
      .select('id, session_id, phone, last_message_at, metadata')
      .eq('session_status', 'active')
      .not('session_id', 'is', null)
      .lt('last_message_at', twelveHoursAgo);

    if (fetchError) throw fetchError;

    console.log(`[CRON] Encontradas ${inactiveSessions?.length || 0} sessões inativas`);

    if (!inactiveSessions || inactiveSessions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'Nenhuma sessão inativa encontrada',
        count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Finalizar sessões e salvar resumos
    for (const chat of inactiveSessions) {
      // Salvar resumo se há dados
      const metadata = chat.metadata || {};
      const hasData = (metadata.order_items?.length > 0) || 
                      metadata.delivery_type || 
                      metadata.payment_method;

      if (hasData) {
        let summary = 'Sessão expirada após 12h. ';
        if (metadata.order_items?.length > 0) {
          const items = metadata.order_items.map((i: any) => 
            `${i.quantity}x ${i.name || i.product_name}`
          ).join(', ');
          summary += `Itens no carrinho: ${items}. `;
        }
        if (metadata.delivery_type) {
          summary += `Tipo de entrega: ${metadata.delivery_type}. `;
        }
        if (metadata.payment_method) {
          summary += `Forma de pagamento: ${metadata.payment_method}. `;
        }

        await supabase.from('session_summaries').insert({
          chat_id: chat.id,
          session_id: chat.session_id,
          summary: summary,
          items_ordered: metadata.order_items || [],
          order_total: metadata.order_total || 0,
          delivery_type: metadata.delivery_type,
          payment_method: metadata.payment_method,
          customer_preferences: metadata.customer_preferences || {}
        });

        console.log(`[CRON] 💾 Resumo salvo para sessão ${chat.session_id}`);
      }

      // Finalizar sessão
      await supabase.from('chats').update({
        session_status: 'expired'
      }).eq('id', chat.id);

      console.log(`[CRON] ✅ Sessão ${chat.session_id} finalizada (phone: ${chat.phone})`);
    }

    return new Response(JSON.stringify({ 
      message: 'Sessões expiradas com sucesso',
      count: inactiveSessions.length,
      expired_sessions: inactiveSessions.map(s => ({
        session_id: s.session_id,
        phone: s.phone,
        last_message_at: s.last_message_at
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[CRON] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
