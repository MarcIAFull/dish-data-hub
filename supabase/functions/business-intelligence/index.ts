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
    const { restaurantId, timeframe, type } = await req.json();
    console.log(`Fetching business intelligence for restaurant: ${restaurantId}, timeframe: ${timeframe}, type: ${type}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Mock business metrics for now - in real implementation would calculate from actual data
    const businessMetrics = {
      totalRevenue: 45000 + Math.random() * 20000,
      totalOrders: 150 + Math.floor(Math.random() * 100),
      avgOrderValue: 280 + Math.random() * 100,
      uniqueCustomers: 80 + Math.floor(Math.random() * 50),
      revenueGrowth: (Math.random() - 0.5) * 40,
      orderGrowth: (Math.random() - 0.5) * 30,
      customerGrowth: (Math.random() - 0.5) * 25,
      conversionRate: 65 + Math.random() * 20
    };

    console.log('Business metrics calculated:', businessMetrics);

    return new Response(JSON.stringify({ 
      metrics: businessMetrics,
      timeframe 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in business-intelligence function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});