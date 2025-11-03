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
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] ============ NEW REQUEST ============`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] CORS preflight - responding with headers`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');
      const challenge = url.searchParams.get('challenge');
      
      console.log(`[${requestId}] GET request - token: ${token ? 'present' : 'missing'}, challenge: ${challenge ? 'present' : 'missing'}`);
      
      if (token && challenge) {
        console.log(`[${requestId}] ✅ Webhook verification successful`);
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      
      console.log(`[${requestId}] ℹ️ Health check request`);
      return new Response(JSON.stringify({ 
        status: 'Webhook is active',
        timestamp: new Date().toISOString(),
        requestId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (req.method === 'POST') {
      const body = await req.json();
      console.log(`[${requestId}] ========== WEBHOOK PAYLOAD ==========`);
      console.log(`[${requestId}] Payload:`, JSON.stringify(body, null, 2));
      console.log(`[${requestId}] Payload keys:`, Object.keys(body));
      
      const { data, instance, key, event } = body;
      
      if (!data || !data.message) {
        console.warn(`[${requestId}] ⚠️ No message data found - ignoring webhook`);
        return new Response(JSON.stringify({ status: 'ignored', requestId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const message = data.message;
      const remoteJid = data.key.remoteJid;
      const customerPhone = remoteJid.replace('@s.whatsapp.net', '');
      
      console.log(`[${requestId}] 📱 Customer Phone: ${customerPhone}`);
      console.log(`[${requestId}] 📧 Instance: ${instance}`);
      
      // Find agent with enhanced AI configuration
      console.log(`[${requestId}] 🔍 Searching for agent - Phone: ${customerPhone}, Instance: ${instance}`);
      
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
      
      console.log(`[${requestId}] Agent query result - Found: ${agent ? 'YES' : 'NO'}, Error: ${agentError?.message || 'none'}`);
      
      if (agentError || !agent) {
        console.error(`[${requestId}] ❌ No enhanced agent found - Phone: ${customerPhone}, Instance: ${instance}`);
        return new Response(JSON.stringify({ 
          status: 'no_agent',
          requestId,
          searchCriteria: { customerPhone, instance }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[${requestId}] ✅ Agent found - ID: ${agent.id}, Restaurant: ${agent.restaurants?.name}, Name: ${agent.name}`);

      // Find or create conversation with enhanced tracking
      console.log(`[${requestId}] 🔍 Looking for conversation - Phone: ${customerPhone}, Agent: ${agent.id}`);
      
      let { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('phone', customerPhone)
        .eq('status', 'active')
        .maybeSingle();
      
      if (!chat) {
        console.log(`[${requestId}] 🆕 Creating new chat`);
        
        const { data: newChat, error: createError } = await supabase
          .from('chats')
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
          console.error(`[${requestId}] ❌ Error creating chat:`, createError);
          return new Response(JSON.stringify({ error: 'Failed to create chat', requestId }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        chat = newChat;
        console.log(`[${requestId}] ✅ Chat created - ID: ${chat.id}`);
      } else {
        console.log(`[${requestId}] ♻️ Using existing chat - ID: ${chat.id}`);
      }

      // Get chat history for context memory
      console.log(`[${requestId}] 📚 Fetching chat history`);
      
      const { data: messageHistory } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(agent.context_memory_turns || 10);

      console.log(`[${requestId}] Found ${messageHistory?.length || 0} previous messages`);

      // Save incoming message
      const messageContent = message.conversation || message.extendedTextMessage?.text || 'Mensagem não suportada';
      
      console.log(`[${requestId}] 💬 Customer message: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"`);
      console.log(`[${requestId}] 💾 Saving customer message to database`);
      
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender_type: 'customer',
          content: messageContent,
          message_type: 'text',
          whatsapp_message_id: data.key.id
        });
      
      if (msgError) {
        console.error(`[${requestId}] ❌ Error saving message:`, msgError);
      } else {
        console.log(`[${requestId}] ✅ Customer message saved`);
      }

      // Enhanced AI response generation
      console.log(`[${requestId}] 🤖 Checking AI configuration`);
      console.log(`[${requestId}] OpenAI Key: ${openAIApiKey ? 'PRESENT' : 'MISSING'}, Chat Status: ${chat.status}`);
      
      if (openAIApiKey && chat.status === 'active') {
        console.log(`[${requestId}] ✅ Starting AI response generation`);
        
        try {
          // Get enhanced restaurant data
          console.log(`[${requestId}] 🏪 Fetching restaurant data for slug: ${agent.restaurants.slug}`);
          
          const trainingResponse = await fetch(`${supabaseUrl.replace('://','s://')}/functions/v1/enhanced-restaurant-data/${agent.restaurants.slug}`);
          const restaurantData = await trainingResponse.json();
          
          console.log(`[${requestId}] ✅ Restaurant data fetched`);
          
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
- Modelo: ${agent.ai_model || 'gpt-4o'}
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

          console.log(`[${requestId}] 🚀 Calling OpenAI API with model: ${agent.ai_model || 'gpt-4o'}`);

          // Call OpenAI with enhanced configuration
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: agent.ai_model || 'gpt-4o',
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

            console.log(`[${requestId}] ✅ OpenAI response received - Length: ${aiMessage.length} chars`);

            // Enhanced AI post-processing
            if (agent.enable_sentiment_analysis) {
              const negativeWords = ['problema', 'ruim', 'péssimo', 'horrível', 'demora'];
              const isNegative = negativeWords.some(word => messageContent.toLowerCase().includes(word));
              
              if (isNegative) {
                console.log(`[${requestId}] 😟 Negative sentiment detected - adjusting response`);
                aiMessage = `Percebo que você pode estar insatisfeito. ${aiMessage} Como posso melhorar sua experiência? 🤝`;
              }
            }

            if (agent.enable_order_intent_detection) {
              const orderWords = ['quero', 'gostaria', 'pedido', 'comprar', 'pedir'];
              const hasOrderIntent = orderWords.some(word => messageContent.toLowerCase().includes(word));
              
              if (hasOrderIntent && !aiMessage.includes('pedido')) {
                console.log(`[${requestId}] 🛒 Order intent detected - adding prompt`);
                aiMessage += '\n\n🛒 Vejo que você tem interesse em fazer um pedido! Posso ajudar você a finalizar?';
              }
            }
            
            // Save enhanced AI response
            console.log(`[${requestId}] 💾 Saving AI response to database`);
            
            const { error: aiMsgError } = await supabase
              .from('messages')
              .insert({
                chat_id: chat.id,
                sender_type: 'agent',
                content: aiMessage,
                message_type: 'text'
              });
            
            if (aiMsgError) {
              console.error(`[${requestId}] ❌ Error saving AI message:`, aiMsgError);
            } else {
              console.log(`[${requestId}] ✅ AI response saved`);
            }

            // Send response via Evolution API
            if (agent.evolution_api_token && agent.evolution_api_instance) {
              console.log(`[${requestId}] 📤 Sending response via Evolution API - Instance: ${agent.evolution_api_instance}`);
              
              try {
                const sendResponse = await fetch(`https://evolution.fullbpo.com/message/sendText/${agent.evolution_api_instance}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': agent.evolution_api_token
                  },
                  body: JSON.stringify({
                    number: customerPhone,
                    text: aiMessage
                  })
                });
                
                if (!sendResponse.ok) {
                  const errorText = await sendResponse.text();
                  console.error(`[${requestId}] ❌ Failed to send WhatsApp message:`, errorText);
                } else {
                  console.log(`[${requestId}] ✅ Message sent successfully via Evolution API`);
                }
              } catch (sendError) {
                console.error(`[${requestId}] ❌ Error sending WhatsApp message:`, sendError);
              }
            } else {
              console.warn(`[${requestId}] ⚠️ Evolution API credentials missing - Token: ${!!agent.evolution_api_token}, Instance: ${!!agent.evolution_api_instance}`);
            }

            // Update chat analytics
            console.log(`[${requestId}] 🔄 Updating chat timestamp`);
            
            await supabase
              .from('chats')
              .update({ 
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', chat.id);

            // Save chat insights if enabled
            if (agent.enable_conversation_summary) {
              console.log(`[${requestId}] 📊 Saving chat insights`);
              
              const { error: insightError } = await supabase
                .from('conversation_insights')
                .upsert({
                  conversation_id: chat.conversation_id || `chat_${chat.id}`,
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
                console.error(`[${requestId}] ❌ Error saving chat insights:`, insightError);
              }
            }
          } else {
            console.error(`[${requestId}] ❌ OpenAI API error:`, await response.text());
          }
        } catch (aiError) {
          console.error(`[${requestId}] ❌ Error generating enhanced AI response:`, aiError);
        }
      } else {
        console.warn(`[${requestId}] ⚠️ AI response skipped - OpenAI Key: ${!!openAIApiKey}, Status: ${chat.status}`);
      }
      
      console.log(`[${requestId}] ============ REQUEST COMPLETE ============`);
      
      return new Response(JSON.stringify({ 
        status: 'processed', 
        enhanced: true,
        requestId,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[${requestId}] ❌ Method not allowed: ${req.method}`);
    
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      requestId 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
    
  } catch (error) {
    console.error(`❌ Error in enhanced AI webhook function:`, error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
