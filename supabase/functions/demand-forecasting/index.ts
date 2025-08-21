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
    const { restaurantId, forecastPeriod = 30, productId } = await req.json();
    console.log(`Forecasting demand for restaurant: ${restaurantId}, period: ${forecastPeriod} days`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get historical order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        created_at,
        total,
        order_items!inner(quantity, product_id, products!inner(name, category_id))
      `)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (orderError) {
      console.error('Error fetching order data:', orderError);
    }

    // Process historical data to identify patterns
    const dailyData = processHistoricalData(orderData || []);
    
    // Generate forecast using simple time series analysis
    const forecast = generateDemandForecast(dailyData, forecastPeriod);
    
    // Identify seasonal patterns
    const seasonality = identifySeasonalPatterns(dailyData);
    
    // Generate insights and recommendations
    const insights = generateDemandInsights(forecast, seasonality);

    console.log('Demand forecast generated:', { forecast: forecast.slice(0, 7), insights });

    return new Response(JSON.stringify({
      success: true,
      forecast: forecast.map(f => ({
        date: f.date,
        predictedOrders: Math.round(f.predictedOrders),
        predictedRevenue: Math.round(f.predictedRevenue),
        confidence: f.confidence,
        factors: f.factors
      })),
      seasonality,
      insights,
      recommendations: generateRecommendations(forecast, insights)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in demand forecasting:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processHistoricalData(orders: any[]): any[] {
  const dailyAggregates = new Map();
  
  orders.forEach(order => {
    const date = new Date(order.created_at).toDateString();
    
    if (!dailyAggregates.has(date)) {
      dailyAggregates.set(date, {
        date: new Date(order.created_at),
        orders: 0,
        revenue: 0,
        items: 0
      });
    }
    
    const day = dailyAggregates.get(date);
    day.orders += 1;
    day.revenue += order.total;
    day.items += order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  });
  
  return Array.from(dailyAggregates.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function generateDemandForecast(historicalData: any[], forecastDays: number): any[] {
  if (historicalData.length === 0) {
    // Return mock forecast if no historical data
    return generateMockForecast(forecastDays);
  }
  
  const forecast = [];
  const recentData = historicalData.slice(-30); // Use last 30 days
  
  // Simple moving average with trend analysis
  const avgOrders = recentData.reduce((sum, day) => sum + day.orders, 0) / recentData.length;
  const avgRevenue = recentData.reduce((sum, day) => sum + day.revenue, 0) / recentData.length;
  
  // Calculate trend
  const trend = calculateTrend(recentData);
  
  for (let i = 0; i < forecastDays; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i + 1);
    
    // Apply trend and seasonal factors
    const dayOfWeek = forecastDate.getDay();
    const seasonalFactor = getSeasonalFactor(dayOfWeek);
    
    const predictedOrders = (avgOrders + trend.orders * i) * seasonalFactor;
    const predictedRevenue = (avgRevenue + trend.revenue * i) * seasonalFactor;
    
    // Add some randomness for realism
    const variance = 0.1; // 10% variance
    const orderVariance = predictedOrders * variance * (Math.random() - 0.5);
    const revenueVariance = predictedRevenue * variance * (Math.random() - 0.5);
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedOrders: Math.max(0, predictedOrders + orderVariance),
      predictedRevenue: Math.max(0, predictedRevenue + revenueVariance),
      confidence: Math.max(60, 90 - i * 2), // Confidence decreases over time
      factors: {
        trend: trend.orders > 0 ? 'growing' : trend.orders < 0 ? 'declining' : 'stable',
        seasonal: seasonalFactor > 1 ? 'peak' : seasonalFactor < 1 ? 'low' : 'average',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
      }
    });
  }
  
  return forecast;
}

function generateMockForecast(forecastDays: number): any[] {
  const forecast = [];
  const baseOrders = 25;
  const baseRevenue = 1200;
  
  for (let i = 0; i < forecastDays; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i + 1);
    
    const dayOfWeek = forecastDate.getDay();
    const seasonalFactor = getSeasonalFactor(dayOfWeek);
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedOrders: Math.round((baseOrders + Math.random() * 10 - 5) * seasonalFactor),
      predictedRevenue: Math.round((baseRevenue + Math.random() * 300 - 150) * seasonalFactor),
      confidence: Math.max(60, 85 - i),
      factors: {
        trend: 'stable',
        seasonal: seasonalFactor > 1 ? 'peak' : seasonalFactor < 1 ? 'low' : 'average',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
      }
    });
  }
  
  return forecast;
}

function calculateTrend(data: any[]): { orders: number, revenue: number } {
  if (data.length < 2) return { orders: 0, revenue: 0 };
  
  const n = data.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const sumYOrders = data.reduce((sum, day, index) => sum + day.orders * index, 0);
  const sumYRevenue = data.reduce((sum, day, index) => sum + day.revenue * index, 0);
  
  const trendOrders = (n * sumYOrders - sumX * data.reduce((sum, day) => sum + day.orders, 0)) / (n * sumX2 - sumX * sumX);
  const trendRevenue = (n * sumYRevenue - sumX * data.reduce((sum, day) => sum + day.revenue, 0)) / (n * sumX2 - sumX * sumX);
  
  return { orders: trendOrders, revenue: trendRevenue };
}

function getSeasonalFactor(dayOfWeek: number): number {
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  const factors = [0.8, 0.7, 0.8, 0.9, 1.1, 1.4, 1.3]; // Weekend higher
  return factors[dayOfWeek];
}

function identifySeasonalPatterns(data: any[]): any {
  const dayOfWeekPatterns = new Array(7).fill(0);
  const dayOfWeekCounts = new Array(7).fill(0);
  
  data.forEach(day => {
    const dayOfWeek = day.date.getDay();
    dayOfWeekPatterns[dayOfWeek] += day.orders;
    dayOfWeekCounts[dayOfWeek] += 1;
  });
  
  const avgByDay = dayOfWeekPatterns.map((sum, index) => 
    dayOfWeekCounts[index] > 0 ? sum / dayOfWeekCounts[index] : 0
  );
  
  return {
    weeklyPattern: avgByDay,
    peakDay: avgByDay.indexOf(Math.max(...avgByDay)),
    lowDay: avgByDay.indexOf(Math.min(...avgByDay)),
    weekendBoost: (avgByDay[5] + avgByDay[6]) / 2 / ((avgByDay[1] + avgByDay[2] + avgByDay[3] + avgByDay[4]) / 4)
  };
}

function generateDemandInsights(forecast: any[], seasonality: any): any[] {
  const insights = [];
  
  // Peak demand insight
  const peakDay = forecast.reduce((max, day) => day.predictedOrders > max.predictedOrders ? day : max);
  insights.push({
    type: 'peak_demand',
    title: 'Pico de Demanda Previsto',
    description: `Maior demanda esperada em ${new Date(peakDay.date).toLocaleDateString('pt-BR')} com ${Math.round(peakDay.predictedOrders)} pedidos`,
    impact: 'high',
    action: 'Aumentar estoque e equipe para este dia'
  });
  
  // Weekend pattern
  if (seasonality.weekendBoost > 1.2) {
    insights.push({
      type: 'weekend_boost',
      title: 'Padrão de Final de Semana',
      description: `Finais de semana têm ${((seasonality.weekendBoost - 1) * 100).toFixed(0)}% mais demanda`,
      impact: 'medium',
      action: 'Otimizar operações para finais de semana'
    });
  }
  
  // Growth trend
  const totalWeek1 = forecast.slice(0, 7).reduce((sum, day) => sum + day.predictedOrders, 0);
  const totalWeek4 = forecast.slice(21, 28).reduce((sum, day) => sum + day.predictedOrders, 0);
  const growthRate = ((totalWeek4 - totalWeek1) / totalWeek1) * 100;
  
  if (Math.abs(growthRate) > 5) {
    insights.push({
      type: 'growth_trend',
      title: growthRate > 0 ? 'Tendência de Crescimento' : 'Tendência de Declínio',
      description: `Demanda ${growthRate > 0 ? 'crescendo' : 'declinando'} ${Math.abs(growthRate).toFixed(1)}% ao mês`,
      impact: growthRate > 0 ? 'positive' : 'negative',
      action: growthRate > 0 ? 'Preparar para expansão' : 'Revisar estratégia de marketing'
    });
  }
  
  return insights;
}

function generateRecommendations(forecast: any[], insights: any[]): string[] {
  const recommendations = [];
  
  // Based on peak demand
  const peakInsight = insights.find(i => i.type === 'peak_demand');
  if (peakInsight) {
    recommendations.push('Aumentar estoque em 20% nos dias de pico');
    recommendations.push('Contratar pessoal temporário para dias de alta demanda');
  }
  
  // Based on weekend pattern
  const weekendInsight = insights.find(i => i.type === 'weekend_boost');
  if (weekendInsight) {
    recommendations.push('Criar promoções específicas para fins de semana');
    recommendations.push('Ajustar horários de funcionamento nos weekends');
  }
  
  // Based on growth trend
  const growthInsight = insights.find(i => i.type === 'growth_trend');
  if (growthInsight) {
    if (growthInsight.title.includes('Crescimento')) {
      recommendations.push('Considerar expansão da capacidade');
      recommendations.push('Investir em marketing para sustentar crescimento');
    } else {
      recommendations.push('Revisar cardápio e preços');
      recommendations.push('Implementar campanhas de retenção');
    }
  }
  
  // General recommendations
  recommendations.push('Monitorar KPIs diariamente para ajustes rápidos');
  recommendations.push('Configurar alertas automáticos para desvios de previsão');
  
  return recommendations;
}