import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { p_restaurant_id, p_pattern_type, p_pattern_data } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if pattern already exists
    const { data: existingPattern } = await supabase
      .from('ai_learning_patterns')
      .select('*')
      .eq('restaurant_id', p_restaurant_id)
      .eq('pattern_type', p_pattern_type)
      .maybeSingle();

    if (existingPattern) {
      // Update existing pattern
      const { data, error } = await supabase
        .from('ai_learning_patterns')
        .update({
          frequency_count: existingPattern.frequency_count + 1,
          last_occurrence: new Date().toISOString(),
          pattern_data: p_pattern_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPattern.id)
        .select()
        .single();

      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Create new pattern
      const { data, error } = await supabase
        .from('ai_learning_patterns')
        .insert({
          restaurant_id: p_restaurant_id,
          pattern_type: p_pattern_type,
          pattern_data: p_pattern_data,
          frequency_count: 1,
          confidence_level: 0.5,
          last_occurrence: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in upsert-learning-pattern function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});