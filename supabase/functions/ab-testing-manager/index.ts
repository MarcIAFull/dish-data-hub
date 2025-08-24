import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...data } = await req.json();
    console.log(`A/B Testing Manager - Action: ${action}`);

    switch (action) {
      case 'getVariant':
        return await getVariantForConversation(supabaseClient, data);
      case 'recordResult':
        return await recordTestResult(supabaseClient, data);
      case 'getTestResults':
        return await getTestResults(supabaseClient, data);
      case 'createTest':
        return await createABTest(supabaseClient, data);
      case 'endTest':
        return await endABTest(supabaseClient, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in A/B testing manager:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getVariantForConversation(supabaseClient: any, data: any) {
  const { restaurantId, agentId, conversationId, testName } = data;
  
  // Get active test variants for this agent
  const { data: variants, error: variantsError } = await supabaseClient
    .from('ab_test_variants')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('agent_id', agentId)
    .eq('test_name', testName)
    .eq('is_active', true)
    .lte('start_date', new Date().toISOString())
    .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

  if (variantsError) throw variantsError;

  if (!variants || variants.length === 0) {
    return new Response(JSON.stringify({ 
      variant: null,
      message: 'No active variants found' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Weighted random selection based on traffic percentage
  const totalWeight = variants.reduce((sum: number, variant: any) => sum + variant.traffic_percentage, 0);
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  let selectedVariant = variants[0]; // fallback
  
  for (const variant of variants) {
    currentWeight += variant.traffic_percentage;
    if (random <= currentWeight) {
      selectedVariant = variant;
      break;
    }
  }

  console.log(`Selected variant: ${selectedVariant.variant_name} for conversation: ${conversationId}`);

  return new Response(JSON.stringify({ 
    variant: selectedVariant,
    message: 'Variant selected successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function recordTestResult(supabaseClient: any, data: any) {
  const { 
    restaurantId, 
    variantId, 
    conversationId, 
    customerPhone, 
    responseUsed,
    userSatisfaction,
    conversionAchieved,
    interactionDuration 
  } = data;

  const { data: result, error } = await supabaseClient
    .from('ab_test_results')
    .insert({
      restaurant_id: restaurantId,
      variant_id: variantId,
      conversation_id: conversationId,
      customer_phone: customerPhone,
      response_used: responseUsed,
      user_satisfaction: userSatisfaction,
      conversion_achieved: conversionAchieved,
      interaction_duration_seconds: interactionDuration
    })
    .select()
    .single();

  if (error) throw error;

  console.log(`Recorded A/B test result for variant: ${variantId}`);

  return new Response(JSON.stringify({ 
    result,
    message: 'Test result recorded successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getTestResults(supabaseClient: any, data: any) {
  const { restaurantId, testName, agentId } = data;

  // Get test variants and their results
  const { data: testData, error } = await supabaseClient
    .from('ab_test_variants')
    .select(`
      *,
      ab_test_results (
        user_satisfaction,
        conversion_achieved,
        interaction_duration_seconds,
        created_at
      )
    `)
    .eq('restaurant_id', restaurantId)
    .eq('test_name', testName)
    .eq('agent_id', agentId);

  if (error) throw error;

  // Calculate metrics for each variant
  const results = testData.map((variant: any) => {
    const results = variant.ab_test_results || [];
    const totalResults = results.length;
    const conversions = results.filter((r: any) => r.conversion_achieved).length;
    const avgSatisfaction = results.length > 0 
      ? results.reduce((sum: number, r: any) => sum + (r.user_satisfaction || 0), 0) / results.length
      : 0;
    const avgDuration = results.length > 0
      ? results.reduce((sum: number, r: any) => sum + (r.interaction_duration_seconds || 0), 0) / results.length
      : 0;

    return {
      variant_id: variant.id,
      variant_name: variant.variant_name,
      response_template: variant.response_template,
      traffic_percentage: variant.traffic_percentage,
      total_interactions: totalResults,
      conversions: conversions,
      conversion_rate: totalResults > 0 ? (conversions / totalResults) * 100 : 0,
      avg_satisfaction: avgSatisfaction,
      avg_duration: avgDuration,
      is_active: variant.is_active,
      start_date: variant.start_date,
      end_date: variant.end_date
    };
  });

  // Calculate statistical significance if we have enough data
  const significance = calculateStatisticalSignificance(results);

  return new Response(JSON.stringify({ 
    testName,
    results,
    significance,
    message: 'Test results retrieved successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createABTest(supabaseClient: any, data: any) {
  const { restaurantId, agentId, testName, variants } = data;

  // Insert all variants
  const { data: createdVariants, error } = await supabaseClient
    .from('ab_test_variants')
    .insert(
      variants.map((variant: any) => ({
        restaurant_id: restaurantId,
        agent_id: agentId,
        test_name: testName,
        variant_name: variant.name,
        response_template: variant.template,
        traffic_percentage: variant.trafficPercentage,
        is_active: true
      }))
    )
    .select();

  if (error) throw error;

  console.log(`Created A/B test: ${testName} with ${variants.length} variants`);

  return new Response(JSON.stringify({ 
    test: {
      name: testName,
      variants: createdVariants
    },
    message: 'A/B test created successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function endABTest(supabaseClient: any, data: any) {
  const { restaurantId, testName, agentId } = data;

  const { data: updatedVariants, error } = await supabaseClient
    .from('ab_test_variants')
    .update({ 
      is_active: false,
      end_date: new Date().toISOString()
    })
    .eq('restaurant_id', restaurantId)
    .eq('agent_id', agentId)
    .eq('test_name', testName)
    .select();

  if (error) throw error;

  console.log(`Ended A/B test: ${testName}`);

  return new Response(JSON.stringify({ 
    endedVariants: updatedVariants,
    message: 'A/B test ended successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function calculateStatisticalSignificance(results: any[]) {
  if (results.length < 2) return null;

  // Simple significance calculation for two variants
  const [variantA, variantB] = results.slice(0, 2);
  
  if (variantA.total_interactions < 30 || variantB.total_interactions < 30) {
    return {
      significant: false,
      confidence: 0,
      message: 'Need at least 30 interactions per variant for statistical significance'
    };
  }

  // Calculate z-score for conversion rate difference
  const p1 = variantA.conversion_rate / 100;
  const p2 = variantB.conversion_rate / 100;
  const n1 = variantA.total_interactions;
  const n2 = variantB.total_interactions;
  
  const pooledP = (variantA.conversions + variantB.conversions) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
  const zScore = Math.abs(p1 - p2) / se;
  
  // 95% confidence = z-score > 1.96
  const significant = zScore > 1.96;
  const confidence = significant ? 95 : Math.min(90, zScore * 45);

  return {
    significant,
    confidence,
    zScore,
    winner: p1 > p2 ? variantA.variant_name : variantB.variant_name,
    message: significant ? 'Results are statistically significant' : 'Need more data for significance'
  };
}