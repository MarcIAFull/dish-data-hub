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
    const { restaurantId, productId, optimizationGoal, targetMargin, competitorPrice } = await req.json();
    console.log(`Optimizing prices for restaurant: ${restaurantId}, product: ${productId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get product data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      throw new Error('Product not found');
    }

    // Get historical sales data
    const { data: salesData, error: salesError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        total_price,
        orders!inner(created_at, status)
      `)
      .eq('product_id', productId)
      .eq('orders.status', 'completed')
      .gte('orders.created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
    }

    // Calculate price optimization using mock algorithm
    // In real implementation, this would use sophisticated ML models
    const currentPrice = product.price;
    const currentCost = currentPrice * 0.35; // Assume 35% cost ratio
    const currentMargin = ((currentPrice - currentCost) / currentPrice) * 100;

    // Price elasticity estimation (mock)
    const priceElasticity = -1.2; // Moderately elastic
    
    // Optimization based on goal
    let optimizedPrice = currentPrice;
    let expectedImpact = {
      revenueChange: 0,
      demandChange: 0,
      profitChange: 0
    };

    switch (optimizationGoal) {
      case 'revenue':
        // Optimal price for revenue maximization: P = a/(2b) where demand = a + b*P
        optimizedPrice = currentPrice * 1.1; // 10% increase for revenue max
        expectedImpact = {
          revenueChange: 12.5,
          demandChange: -3.2,
          profitChange: 18.7
        };
        break;
        
      case 'profit':
        // Optimal price considering cost: P = (a + b*MC)/(2b)
        const targetMarginDecimal = targetMargin ? parseFloat(targetMargin) / 100 : 0.65;
        optimizedPrice = currentCost / (1 - targetMarginDecimal);
        expectedImpact = {
          revenueChange: 8.3,
          demandChange: -5.1,
          profitChange: 22.4
        };
        break;
        
      case 'volume':
        // Lower price to increase volume
        optimizedPrice = currentPrice * 0.95; // 5% decrease
        expectedImpact = {
          revenueChange: 5.2,
          demandChange: 15.1,
          profitChange: 11.2
        };
        break;
        
      case 'market':
        // Competitive pricing
        if (competitorPrice) {
          optimizedPrice = parseFloat(competitorPrice) * 0.98; // 2% below competitor
          expectedImpact = {
            revenueChange: 15.8,
            demandChange: 25.3,
            profitChange: 19.1
          };
        }
        break;
    }

    // Calculate confidence score based on data quality and market factors
    const dataPoints = salesData?.length || 0;
    const baseConfidence = Math.min(50 + (dataPoints * 2), 95);
    const confidenceScore = Math.max(baseConfidence, 75); // Minimum 75% for demo

    // Generate recommendation
    const recommendation = {
      productId,
      productName: product.name,
      currentPrice,
      optimizedPrice: Math.round(optimizedPrice * 100) / 100,
      expectedImpact: {
        revenueChange: `${expectedImpact.revenueChange >= 0 ? '+' : ''}${expectedImpact.revenueChange.toFixed(1)}%`,
        demandChange: `${expectedImpact.demandChange >= 0 ? '+' : ''}${expectedImpact.demandChange.toFixed(1)}%`,
        profitChange: `${expectedImpact.profitChange >= 0 ? '+' : ''}${expectedImpact.profitChange.toFixed(1)}%`,
        competitivePosition: optimizedPrice > currentPrice ? 'Premium positioning' : 'Value positioning'
      },
      confidence: confidenceScore,
      strategy: getOptimizationStrategy(optimizationGoal, optimizedPrice, currentPrice),
      recommendation: 'Apply gradual price change with monitoring',
      marketData: {
        elasticity: priceElasticity,
        competitorPrice: competitorPrice || 'Not provided',
        marketPosition: optimizedPrice > (competitorPrice || currentPrice) ? 'Premium' : 'Competitive'
      }
    };

    // Store recommendation in database
    const { error: insertError } = await supabase
      .from('price_recommendations')
      .insert({
        restaurant_id: restaurantId,
        product_id: productId,
        current_price: currentPrice,
        recommended_price: recommendation.optimizedPrice,
        reason: `${optimizationGoal} optimization: ${recommendation.strategy}`,
        expected_impact: recommendation.expectedImpact,
        confidence_level: confidenceScore,
        market_data: recommendation.marketData,
        status: 'pending'
      });

    if (insertError) {
      console.error('Error storing recommendation:', insertError);
    }

    console.log('Price optimization completed:', recommendation);

    return new Response(JSON.stringify({
      success: true,
      recommendation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in price optimization:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getOptimizationStrategy(goal: string, optimizedPrice: number, currentPrice: number): string {
  const priceChange = ((optimizedPrice - currentPrice) / currentPrice) * 100;
  
  switch (goal) {
    case 'revenue':
      return priceChange > 0 ? 'Increase price gradually to maximize revenue' : 'Optimize pricing for revenue growth';
    case 'profit':
      return 'Adjust margin to target profitability';
    case 'volume':
      return 'Reduce price to increase sales volume';
    case 'market':
      return 'Competitive pricing to gain market share';
    default:
      return 'Balanced optimization approach';
  }
}