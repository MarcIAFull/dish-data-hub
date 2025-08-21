import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { conversationId, restaurantId } = await req.json();

    if (!conversationId || !restaurantId) {
      return new Response(JSON.stringify({ error: 'Conversation ID and Restaurant ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing conversation:', conversationId);

    // Fetch conversation and messages
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        customer_name,
        customer_phone,
        created_at,
        last_message_at,
        messages(
          id,
          content,
          sender_type,
          created_at
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError);
      throw new Error('Conversation not found');
    }

    // Check if order was created from this conversation
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('conversation_id', conversationId)
      .single();

    const convertedToOrder = !!order;

    // Prepare conversation text for AI analysis
    const conversationText = conversation.messages
      ?.map((msg: any) => `${msg.sender_type}: ${msg.content}`)
      .join('\n') || '';

    let sentimentScore = 0;
    let keyTopics: string[] = [];
    let intentDetected = 'unknown';
    let satisfactionScore = 0;

    // Analyze with OpenAI if API key is available
    if (openAIApiKey && conversationText.length > 0) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Analyze this restaurant customer conversation and return a JSON object with:
                - sentiment_score: number between -1.0 (very negative) and 1.0 (very positive)
                - key_topics: array of main topics discussed (max 5)
                - intent_detected: main customer intent (ordering, inquiry, complaint, etc.)
                - satisfaction_score: number between 0.0 and 1.0 based on customer satisfaction
                
                Return only valid JSON.`
              },
              {
                role: 'user',
                content: conversationText
              }
            ],
            temperature: 0.3,
            max_tokens: 500
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const analysis = JSON.parse(aiData.choices[0].message.content);
          
          sentimentScore = analysis.sentiment_score || 0;
          keyTopics = analysis.key_topics || [];
          intentDetected = analysis.intent_detected || 'unknown';
          satisfactionScore = analysis.satisfaction_score || 0;
        }
      } catch (aiError) {
        console.warn('OpenAI analysis failed:', aiError);
      }
    }

    // Calculate fallback count and resolution time
    const fallbackCount = conversation.messages?.filter((msg: any) => 
      msg.sender_type === 'human'
    ).length || 0;

    const resolutionTimeMinutes = conversation.last_message_at && conversation.created_at
      ? Math.round((new Date(conversation.last_message_at).getTime() - new Date(conversation.created_at).getTime()) / (1000 * 60))
      : null;

    // Upsert conversation insights
    const { data: insights, error: insightsError } = await supabase
      .from('conversation_insights')
      .upsert({
        conversation_id: conversationId,
        restaurant_id: restaurantId,
        sentiment_score: sentimentScore,
        key_topics: keyTopics,
        intent_detected: intentDetected,
        satisfaction_score: satisfactionScore,
        fallback_count: fallbackCount,
        resolution_time_minutes: resolutionTimeMinutes,
        converted_to_order: convertedToOrder,
        analysis_data: {
          message_count: conversation.messages?.length || 0,
          last_analyzed: new Date().toISOString()
        }
      }, {
        onConflict: 'conversation_id'
      })
      .select()
      .single();

    if (insightsError) {
      console.error('Error saving insights:', insightsError);
      throw insightsError;
    }

    console.log('Conversation insights saved:', insights);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in conversation-insights function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});