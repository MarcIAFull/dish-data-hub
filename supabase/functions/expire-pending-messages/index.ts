// ⏰ Cron job para processar mensagens acumuladas após 8 segundos

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const eightSecondsAgo = new Date(Date.now() - 8000).toISOString();
    
    console.log('[CRON] 🕐 Buscando chats com mensagens pendentes...');
    
    // Buscar chats com timer ativo mas última mensagem > 8s
    const { data: expiredChats, error } = await supabase
      .from('chats')
      .select('id, phone, metadata, agent_id, restaurant_id')
      .eq('status', 'active')
      .filter('metadata->debounce_timer_active', 'eq', true)
      .lt('metadata->last_message_timestamp', eightSecondsAgo);
    
    if (error) {
      console.error('[CRON] ❌ Error fetching chats:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    
    console.log(`[CRON] ✅ Encontrados ${expiredChats?.length || 0} chats com mensagens expiradas`);
    
    let processedCount = 0;
    
    for (const chat of expiredChats || []) {
      const pendingMessages = chat.metadata?.pending_messages || [];
      if (pendingMessages.length === 0) continue;
      
      console.log(`[CRON] 🔄 Processando ${pendingMessages.length} msgs expiradas do chat ${chat.id}`);
      
      // Combinar mensagens acumuladas
      const combinedMessage = pendingMessages.map((m: any) => m.content).join('\n');
      
      // Processar imediatamente (chamar webhook com flag _force_process)
      try {
        const webhookResponse = await fetch(
          `${supabaseUrl}/functions/v1/enhanced-ai-webhook`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              data: {
                key: {
                  remoteJid: `${chat.phone}@s.whatsapp.net`
                },
                message: {
                  conversation: combinedMessage
                }
              },
              event: 'messages.upsert',
              _force_process: true
            })
          }
        );
        
        if (!webhookResponse.ok) {
          console.error(`[CRON] ❌ Erro ao processar chat ${chat.id}:`, await webhookResponse.text());
          continue;
        }
        
        console.log(`[CRON] ✅ Chat ${chat.id} processado com sucesso`);
        processedCount++;
        
        // Limpar fila de mensagens pendentes
        await supabase
          .from('chats')
          .update({
            metadata: {
              ...chat.metadata,
              pending_messages: [],
              debounce_timer_active: false
            }
          })
          .eq('id', chat.id);
          
      } catch (error) {
        console.error(`[CRON] ❌ Exception ao processar chat ${chat.id}:`, error);
      }
    }
    
    console.log(`[CRON] 🎯 Processados ${processedCount}/${expiredChats?.length || 0} chats`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        total: expiredChats?.length || 0
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('[CRON] ❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
