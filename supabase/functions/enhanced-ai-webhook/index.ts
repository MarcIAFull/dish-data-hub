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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Enhanced AI Webhook received:', req.method, req.url);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'GET') {
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
      console.log('Enhanced WhatsApp message received:', JSON.stringify(body, null, 2));
      
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
      
      // Find agent with enhanced AI configuration
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select(`
          *,
          restaurants (
            id,
            name,
            slug,
            description,
            address,
            phone,
            whatsapp
          )
        `)
        .eq('is_active', true)
        .or(`whatsapp_number.eq.${customerPhone},evolution_api_instance.eq.${instance}`)
        .single();
      
      if (agentError || !agent) {
        console.log('No enhanced agent found for this WhatsApp number/instance');
        return new Response(JSON.stringify({ status: 'no_agent' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find or create conversation with enhanced tracking
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

      // Get conversation history for context memory
      const { data: messageHistory } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(agent.context_memory_turns || 10);

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

      // Enhanced AI response generation
      if (openAIApiKey && conversation.status === 'active') {
        try {
          // Get enhanced restaurant data
          const trainingResponse = await fetch(`${supabaseUrl.replace('://','s://')}/functions/v1/enhanced-restaurant-data/${agent.restaurants.slug}`);
          const restaurantData = await trainingResponse.json();
          
          // Build conversation context
          let conversationContext = '';
          if (messageHistory && messageHistory.length > 0) {
            conversationContext = '\n\nHISTÓRICO DA CONVERSA (últimas mensagens):\n';
            messageHistory.reverse().forEach((msg, index) => {
              const sender = msg.sender_type === 'customer' ? 'Cliente' : 'Assistente';
              conversationContext += `${sender}: ${msg.content}\n`;
            });
          }

          // Enhanced system prompt with AI configuration
          const systemPrompt = `${agent.personality}

CONFIGURAÇÃO DE IA AVANÇADA:
- Modelo: ${agent.ai_model || 'gpt-5-2025-08-07'}
- Estilo: ${agent.response_style || 'friendly'}
- Idioma: ${agent.language || 'pt-BR'}
- Análise de sentimento: ${agent.enable_sentiment_analysis ? 'ATIVADA' : 'DESATIVADA'}
- Detecção de pedidos: ${agent.enable_order_intent_detection ? 'ATIVADA' : 'DESATIVADA'}
- Sugestões proativas: ${agent.enable_proactive_suggestions ? 'ATIVADAS' : 'DESATIVADAS'}
- Suporte multilíngue: ${agent.enable_multilingual_support ? 'ATIVADO' : 'DESATIVADO'}

DADOS DO RESTAURANTE:
${JSON.stringify(restaurantData, null, 2)}

INSTRUÇÕES ESPECIAIS:
${agent.instructions || ''}

COMPORTAMENTO INTELIGENTE:
- Mantenha memória dos últimos ${agent.context_memory_turns || 10} turnos da conversa
${agent.enable_sentiment_analysis ? '- Analise o sentimento do cliente e adapte sua resposta (positivo, neutro, negativo)' : ''}
${agent.enable_order_intent_detection ? '- Detecte intenções de pedido e guie o cliente naturalmente para finalizar' : ''}
${agent.enable_proactive_suggestions ? '- Faça sugestões proativas baseadas no histórico e contexto' : ''}
${agent.enable_multilingual_support ? '- Detecte o idioma do cliente e responda no mesmo idioma' : ''}
- Seja natural, direto e útil via WhatsApp
- Mantenha respostas concisas mas completas
- Use emojis apropriados para o contexto

${conversationContext}

MENSAGEM ATUAL DO CLIENTE: ${messageContent}`;

          // Call OpenAI with enhanced configuration
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
            let aiMessage = aiResponse.choices[0].message.content;

            // Enhanced AI post-processing
            if (agent.enable_sentiment_analysis) {
              // Simple sentiment analysis
              const negativeWords = ['problema', 'ruim', 'péssimo', 'horrível', 'demora'];
              const isNegative = negativeWords.some(word => messageContent.toLowerCase().includes(word));
              
              if (isNegative) {
                aiMessage = `Percebo que você pode estar insatisfeito. ${aiMessage} Como posso melhorar sua experiência? 🤝`;
              }
            }

            if (agent.enable_order_intent_detection) {
              const orderWords = ['quero', 'gostaria', 'pedido', 'comprar', 'pedir'];
              const hasOrderIntent = orderWords.some(word => messageContent.toLowerCase().includes(word));
              
              if (hasOrderIntent && !aiMessage.includes('pedido')) {
                aiMessage += '\n\n🛒 Vejo que você tem interesse em fazer um pedido! Posso ajudar você a finalizar?';
              }
            }
            
            // Save enhanced AI response
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

            // Send response via Evolution API
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

            // Update conversation analytics
            await supabase
              .from('conversations')
              .update({ 
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', conversation.id);

            // Save conversation insights if enabled
            if (agent.enable_conversation_summary) {
              const { error: insightError } = await supabase
                .from('conversation_insights')
                .upsert({
                  conversation_id: conversation.id,
                  restaurant_id: agent.restaurants.id,
                  sentiment_score: agent.enable_sentiment_analysis ? 
                    (messageContent.toLowerCase().includes('bom') || messageContent.toLowerCase().includes('ótimo') ? 0.8 : 
                     messageContent.toLowerCase().includes('ruim') || messageContent.toLowerCase().includes('péssimo') ? 0.2 : 0.5) : null,
                  intent_detected: agent.enable_order_intent_detection && messageContent.toLowerCase().includes('quero') ? 'order' : 'inquiry',
                  analysis_data: {
                    ai_model_used: agent.ai_model,
                    response_length: aiMessage.length,
                    context_turns: messageHistory?.length || 0
                  }
                });

              if (insightError) {
                console.error('Error saving conversation insights:', insightError);
              }
            }
          }
        } catch (aiError) {
          console.error('Error generating enhanced AI response:', aiError);
        }
      }
      
      return new Response(JSON.stringify({ status: 'processed', enhanced: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
    
  } catch (error) {
    console.error('Error in enhanced AI webhook function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});