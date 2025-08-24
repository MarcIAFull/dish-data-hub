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
    console.log('Advanced AI Engine received:', req.method, req.url);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Advanced AI processing:', JSON.stringify(body, null, 2));
      
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
      
      // Find enhanced agent with full configuration
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

      // Find or create conversation
      let { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('customer_phone', customerPhone)
        .eq('status', 'active')
        .maybeSingle();
      
      if (!conversation) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            agent_id: agent.id,
            customer_phone: customerPhone,
            customer_name: data.pushName || 'Cliente',
            status: 'active'
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

      // 1. DYNAMIC CONTEXT SYSTEM - Get real-time inventory and promotions
      const [inventoryData, promotionsData, learningPatternsData] = await Promise.all([
        supabase
          .from('product_inventory')
          .select(`
            *,
            products (name, price, category_id, categories(name))
          `)
          .eq('restaurant_id', agent.restaurants.id),
        
        supabase
          .from('dynamic_promotions')
          .select('*')
          .eq('restaurant_id', agent.restaurants.id)
          .eq('is_active', true)
          .gte('end_time', new Date().toISOString())
          .or('end_time.is.null'),
          
        supabase
          .from('ai_learning_patterns')
          .select('*')
          .eq('restaurant_id', agent.restaurants.id)
          .order('frequency_count', { ascending: false })
          .limit(10)
      ]);

      // Get conversation history for context
      const { data: messageHistory } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(agent.context_memory_turns || 10);

      // Save incoming message
      const messageContent = message.conversation || message.extendedTextMessage?.text || 'Mensagem não suportada';
      
      const { data: savedMessage, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'customer',
          content: messageContent,
          message_type: 'text',
          whatsapp_message_id: data.key.id
        })
        .select()
        .single();
      
      if (msgError) {
        console.error('Error saving message:', msgError);
      }

      // 2. SENTIMENT ANALYSIS
      let sentimentData = null;
      if (agent.enable_sentiment_analysis && openAIApiKey) {
        try {
          const sentimentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5-mini-2025-08-07',
              messages: [
                {
                  role: 'system', 
                  content: `Analise o sentimento da mensagem do cliente. Responda APENAS com um JSON válido no formato:
{
  "sentiment_score": (número de -1 a 1),
  "sentiment_label": "negative|neutral|positive",
  "confidence_score": (número de 0 a 1),
  "emotional_indicators": {
    "anger": (0-1),
    "satisfaction": (0-1),
    "urgency": (0-1),
    "confusion": (0-1)
  },
  "response_strategy": "empathetic|promotional|informational"
}`
                },
                { role: 'user', content: messageContent }
              ],
              max_completion_tokens: 200
            }),
          });
          
          if (sentimentResponse.ok) {
            const sentimentResult = await sentimentResponse.json();
            sentimentData = JSON.parse(sentimentResult.choices[0].message.content);
            
            // Save sentiment analysis
            await supabase
              .from('sentiment_analytics')
              .insert({
                restaurant_id: agent.restaurants.id,
                conversation_id: conversation.id,
                customer_phone: customerPhone,
                message_id: savedMessage.id,
                sentiment_score: sentimentData.sentiment_score,
                sentiment_label: sentimentData.sentiment_label,
                confidence_score: sentimentData.confidence_score,
                emotional_indicators: sentimentData.emotional_indicators,
                response_strategy: sentimentData.response_strategy,
                escalation_triggered: sentimentData.sentiment_score < -0.5
              });
          }
        } catch (error) {
          console.error('Error analyzing sentiment:', error);
        }
      }

      // 3. INTELLIGENT FALLBACK SYSTEM
      if (sentimentData && sentimentData.sentiment_score < -0.5) {
        // Check for fallback scenarios
        const { data: fallbackScenarios } = await supabase
          .from('fallback_scenarios')
          .select('*')
          .eq('restaurant_id', agent.restaurants.id)
          .eq('agent_id', agent.id)
          .eq('auto_trigger', true)
          .order('priority_level', { ascending: false });

        for (const scenario of fallbackScenarios || []) {
          const conditions = scenario.trigger_conditions;
          if (conditions.sentiment_threshold && sentimentData.sentiment_score <= conditions.sentiment_threshold) {
            console.log(`Triggering fallback scenario: ${scenario.scenario_name}`);
            
            // Update conversation status
            await supabase
              .from('conversations')
              .update({ status: 'human_handoff', assigned_human_id: null })
              .eq('id', conversation.id);
              
            // Send fallback message
            const fallbackMessage = scenario.custom_message || 
              "Percebo que você pode estar com alguma dificuldade. Vou transferir você para um atendente humano que poderá ajudar melhor. Por favor, aguarde um momento. 🤝";
              
            await supabase
              .from('messages')
              .insert({
                conversation_id: conversation.id,
                sender_type: 'agent',
                content: fallbackMessage,
                message_type: 'text'
              });
              
            return new Response(JSON.stringify({ 
              status: 'fallback_triggered', 
              scenario: scenario.scenario_name 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      // Enhanced AI response generation with all advanced features
      if (openAIApiKey && conversation.status === 'active') {
        try {
          // Build dynamic context
          let dynamicContext = '\n\n=== CONTEXTO DINÂMICO ===\n';
          
          // Inventory context
          if (inventoryData.data && inventoryData.data.length > 0) {
            dynamicContext += '\nESTOQUE ATUAL:\n';
            inventoryData.data.forEach(item => {
              const status = item.current_stock <= item.low_stock_threshold ? 'ESTOQUE BAIXO' : 
                            item.current_stock === 0 ? 'ESGOTADO' : 'DISPONÍVEL';
              dynamicContext += `- ${item.products.name}: ${item.current_stock} unidades (${status})\n`;
            });
          }
          
          // Promotions context
          if (promotionsData.data && promotionsData.data.length > 0) {
            dynamicContext += '\nPROMOÇÕES ATIVAS:\n';
            promotionsData.data.forEach(promo => {
              dynamicContext += `- ${promo.title}: ${promo.description} (${promo.discount_value}${promo.discount_type === 'percentage' ? '%' : 'R$'} de desconto)\n`;
            });
          }
          
          // Learning patterns context
          if (learningPatternsData.data && learningPatternsData.data.length > 0) {
            dynamicContext += '\nPADRÕES APRENDIDOS:\n';
            learningPatternsData.data.forEach(pattern => {
              dynamicContext += `- ${pattern.pattern_type}: ${JSON.stringify(pattern.pattern_data)} (${pattern.frequency_count} ocorrências)\n`;
            });
          }

          // Build conversation history
          let conversationContext = '';
          if (messageHistory && messageHistory.length > 0) {
            conversationContext = '\n\nHISTÓRICO DA CONVERSA:\n';
            messageHistory.reverse().forEach((msg, index) => {
              const sender = msg.sender_type === 'customer' ? 'Cliente' : 'Assistente';
              conversationContext += `${sender}: ${msg.content}\n`;
            });
          }

          // Sentiment-aware system prompt
          let sentimentInstructions = '';
          if (sentimentData) {
            sentimentInstructions = `\n\nANÁLISE DE SENTIMENTO ATUAL:
- Score: ${sentimentData.sentiment_score} (${sentimentData.sentiment_label})
- Estratégia recomendada: ${sentimentData.response_strategy}
- Indicadores emocionais: ${JSON.stringify(sentimentData.emotional_indicators)}

INSTRUÇÕES BASEADAS NO SENTIMENTO:
${sentimentData.sentiment_label === 'negative' ? 
  '- PRIORIDADE: Seja empático, reconheça a frustração, ofereça soluções concretas' :
  sentimentData.sentiment_label === 'positive' ? 
  '- Continue o tom positivo, aproveite para fazer sugestões ou upsell' :
  '- Mantenha um tom profissional e informativo'
}`;
          }

          // Enhanced system prompt
          const systemPrompt = `${agent.personality}

CONFIGURAÇÃO DE IA AVANÇADA:
- Modelo: ${agent.ai_model || 'gpt-5-2025-08-07'}
- Estilo: ${agent.response_style || 'friendly'}
- Idioma: ${agent.language || 'pt-BR'}
- Análise de sentimento: ${agent.enable_sentiment_analysis ? 'ATIVADA' : 'DESATIVADA'}
- Detecção de pedidos: ${agent.enable_order_intent_detection ? 'ATIVADA' : 'DESATIVADA'}
- Sugestões proativas: ${agent.enable_proactive_suggestions ? 'ATIVADAS' : 'DESATIVADAS'}

${dynamicContext}

INSTRUÇÕES ESPECIAIS:
${agent.instructions || ''}

COMPORTAMENTO INTELIGENTE:
- Use o contexto dinâmico para dar respostas precisas sobre estoque e promoções
- Aprenda com os padrões identificados para melhorar respostas
- Adapte seu tom baseado na análise de sentimento
- Seja proativo com sugestões quando apropriado
${sentimentInstructions}

${conversationContext}

MENSAGEM ATUAL DO CLIENTE: ${messageContent}

Responda de forma natural, considerando todo o contexto acima.`;

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

            // 4. LEARNING SYSTEM - Detect interaction patterns
            const interactionType = messageContent.toLowerCase().includes('pedido') || 
                                   messageContent.toLowerCase().includes('quero') ? 'order' :
                                   messageContent.toLowerCase().includes('problema') ||
                                   messageContent.toLowerCase().includes('reclamação') ? 'complaint' :
                                   messageContent.toLowerCase().includes('obrigado') ||
                                   messageContent.toLowerCase().includes('ótimo') ? 'compliment' : 'question';

            // Save learning interaction
            await supabase
              .from('ai_learning_interactions')
              .insert({
                restaurant_id: agent.restaurants.id,
                agent_id: agent.id,
                conversation_id: conversation.id,
                customer_phone: customerPhone,
                interaction_type: interactionType,
                user_message: messageContent,
                ai_response: aiMessage,
                sentiment_score: sentimentData?.sentiment_score,
                intent_detected: interactionType,
                context_data: {
                  inventory_consulted: inventoryData.data?.length > 0,
                  promotions_mentioned: promotionsData.data?.length > 0,
                  sentiment_strategy: sentimentData?.response_strategy
                },
                learning_tags: [interactionType, sentimentData?.sentiment_label].filter(Boolean)
              });

            // Update learning patterns
            if (agent.enable_conversation_summary) {
              const patternKey = `${interactionType}_${sentimentData?.sentiment_label || 'neutral'}`;
              await supabase.rpc('upsert_learning_pattern', {
                p_restaurant_id: agent.restaurants.id,
                p_pattern_type: patternKey,
                p_pattern_data: {
                  common_phrases: [messageContent.substring(0, 50)],
                  response_strategy: sentimentData?.response_strategy,
                  sentiment_distribution: sentimentData?.sentiment_label
                }
              });
            }
            
            // Save enhanced AI response
            await supabase
              .from('messages')
              .insert({
                conversation_id: conversation.id,
                sender_type: 'agent',
                content: aiMessage,
                message_type: 'text'
              });

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
          }
        } catch (aiError) {
          console.error('Error generating advanced AI response:', aiError);
        }
      }
      
      return new Response(JSON.stringify({ 
        status: 'processed', 
        features: {
          dynamic_context: true,
          sentiment_analysis: !!sentimentData,
          learning_enabled: true,
          fallback_intelligent: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
    
  } catch (error) {
    console.error('Error in advanced AI engine function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});