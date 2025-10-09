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
    console.log('WhatsApp webhook received:', req.method, req.url);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'GET') {
      // Webhook verification for Evolution API
      const url = new URL(req.url);
      const token = url.searchParams.get('token');
      const challenge = url.searchParams.get('challenge');
      
      console.log('Webhook verification:', { token, challenge });
      
      if (token && challenge) {
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      
      return new Response('Webhook verification failed', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('WhatsApp message received:', JSON.stringify(body, null, 2));
      
      // Process incoming WhatsApp message
      const { data, instance, key, event } = body;
      
      if (!data || !data.message) {
        console.log('No message data found');
        return new Response(JSON.stringify({ status: 'ignored' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const message = data.message;
      const remoteJid = data.key.remoteJid;
      const customerPhone = remoteJid.replace('@s.whatsapp.net', '');
      
      // Find agent by WhatsApp number or instance
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select(`
          *,
          restaurants (
            id,
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .or(`whatsapp_number.eq.${customerPhone},evolution_api_instance.eq.${instance}`)
        .single();
      
      if (agentError || !agent) {
        console.log('No agent found for this WhatsApp number/instance');
        return new Response(JSON.stringify({ status: 'no_agent' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Find or create conversation
      let { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('phone', customerPhone)
        .eq('status', 'active')
        .maybeSingle();
      
      if (!conversation) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            agent_id: agent.id,
            restaurant_id: agent.restaurants.id,
            phone: customerPhone,
            status: 'active',
            app: 'whatsapp'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating conversation:', createError);
          return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        conversation = newConv;
      }
      
      // Save incoming message
      const messageContent = message.conversation || message.extendedTextMessage?.text || 'Mensagem não suportada';
      
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'customer',
          content: messageContent,
          message_type: 'text',
          whatsapp_message_id: data.key.id
        });
      
      if (msgError) {
        console.error('Error saving message:', msgError);
      }
      
      // Generate AI response if OpenAI is available
      if (openAIApiKey && conversation.status === 'active') {
        try {
          // Get restaurant menu data for context
          const trainingResponse = await fetch(`${supabaseUrl.replace('://','s://')}/functions/v1/restaurant-training-text/${agent.restaurants.slug}/training.txt`);
          const trainingText = await trainingResponse.text();
          
          // Advanced AI context with dynamic settings
          const systemPrompt = `${agent.personality}

CONFIGURAÇÃO DE IA:
- Modelo: ${agent.ai_model || 'gpt-5-2025-08-07'}
- Estilo: ${agent.response_style || 'friendly'}
- Idioma: ${agent.language || 'pt-BR'}
- Análise de sentimento: ${agent.enable_sentiment_analysis ? 'ATIVADA' : 'DESATIVADA'}
- Detecção de pedidos: ${agent.enable_order_intent_detection ? 'ATIVADA' : 'DESATIVADA'}
- Sugestões proativas: ${agent.enable_proactive_suggestions ? 'ATIVADAS' : 'DESATIVADAS'}

INFORMAÇÕES DO RESTAURANTE:
${trainingText}

INSTRUÇÕES ESPECIAIS:
${agent.instructions || ''}

COMPORTAMENTO AVANÇADO:
- Mantenha memória dos últimos ${agent.context_memory_turns || 10} turnos da conversa
- ${agent.enable_sentiment_analysis ? 'Analise o sentimento do cliente e adapte sua resposta' : ''}
- ${agent.enable_order_intent_detection ? 'Detecte intenções de pedido e guie o cliente naturalmente' : ''}
- ${agent.enable_proactive_suggestions ? 'Faça sugestões proativas baseadas no contexto' : ''}
- Sempre seja natural, direto e útil via WhatsApp

Você está conversando via WhatsApp. Mantenha respostas concisas mas completas.`;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: agent.ai_model || 'gpt-5-2025-08-07',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: messageContent }
              ],
              max_completion_tokens: agent.max_tokens || 500,
              ...(agent.ai_model === 'gpt-4o' || agent.ai_model === 'gpt-4o-mini' ? 
                { temperature: agent.temperature || 0.7 } : {})
            }),
          });
          
          if (response.ok) {
            const aiResponse = await response.json();
            const aiMessage = aiResponse.choices[0].message.content;
            
            // Save AI response
            const { error: aiMsgError } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversation.id,
                sender_type: 'agent',
                content: aiMessage,
                message_type: 'text'
              });
            
            if (aiMsgError) {
              console.error('Error saving AI message:', aiMsgError);
            }
            
            // Send response back to WhatsApp via Evolution API
            if (agent.evolution_api_token && agent.evolution_api_instance) {
              try {
                const sendResponse = await fetch(`https://api.evolutionapi.com/message/sendText/${agent.evolution_api_instance}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': agent.evolution_api_token
                  },
                  body: JSON.stringify({
                    number: customerPhone,
                    textMessage: {
                      text: aiMessage
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
            
            // Update conversation last_message_at
            await supabase
              .from('conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', conversation.id);
          }
        } catch (aiError) {
          console.error('Error generating AI response:', aiError);
        }
      }
      
      return new Response(JSON.stringify({ status: 'processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
    
  } catch (error) {
    console.error('Error in whatsapp-webhook function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});