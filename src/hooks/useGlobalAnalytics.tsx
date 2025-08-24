import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalAnalyticsMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalConversations: number;
  avgConversionRate: number;
  avgSatisfactionScore: number;
  activeAgents: number;
  restaurantPerformance: {
    restaurantId: string;
    restaurantName: string;
    revenue: number;
    orders: number;
    conversations: number;
    conversionRate: number;
    satisfactionScore: number;
    aiEnabled: boolean;
  }[];
}

export const useGlobalAnalytics = (restaurantIds: string[], dateRange?: { from: Date | null; to: Date | null }) => {
  const [metrics, setMetrics] = useState<GlobalAnalyticsMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalConversations: 0,
    avgConversionRate: 0,
    avgSatisfactionScore: 0,
    activeAgents: 0,
    restaurantPerformance: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalAnalytics = async () => {
    if (restaurantIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar dados básicos dos restaurantes
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, ai_enabled')
        .in('id', restaurantIds);

      if (restaurantsError) throw restaurantsError;

      // Buscar pedidos
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          restaurant_id,
          total,
          created_at,
          status
        `)
        .in('restaurant_id', restaurantIds);

      if (dateRange?.from) {
        ordersQuery = ordersQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        ordersQuery = ordersQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { data: orders, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;

      // Buscar conversas
      let conversationsQuery = supabase
        .from('conversations')
        .select(`
          id,
          agent_id,
          created_at,
          status,
          agents!inner(restaurant_id)
        `)
        .in('agents.restaurant_id', restaurantIds);

      if (dateRange?.from) {
        conversationsQuery = conversationsQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        conversationsQuery = conversationsQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { data: conversations, error: conversationsError } = await conversationsQuery;
      if (conversationsError) throw conversationsError;

      // Buscar insights de conversação para métricas de conversão e satisfação
      let insightsQuery = supabase
        .from('conversation_insights')
        .select(`
          restaurant_id,
          converted_to_order,
          satisfaction_score,
          created_at
        `)
        .in('restaurant_id', restaurantIds);

      if (dateRange?.from) {
        insightsQuery = insightsQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        insightsQuery = insightsQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { data: insights, error: insightsError } = await insightsQuery;
      if (insightsError) throw insightsError;

      // Buscar agentes ativos
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, restaurant_id, is_active')
        .in('restaurant_id', restaurantIds)
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      // Calcular métricas por restaurante
      const restaurantPerformance = restaurants?.map(restaurant => {
        const restaurantOrders = orders?.filter(o => o.restaurant_id === restaurant.id) || [];
        const restaurantConversations = conversations?.filter(c => c.agents?.restaurant_id === restaurant.id) || [];
        const restaurantInsights = insights?.filter(i => i.restaurant_id === restaurant.id) || [];

        const revenue = restaurantOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const orderCount = restaurantOrders.length;
        const conversationCount = restaurantConversations.length;

        // Calcular taxa de conversão
        const conversions = restaurantInsights.filter(i => i.converted_to_order).length;
        const conversionRate = conversationCount > 0 ? (conversions / conversationCount) * 100 : 0;

        // Calcular score de satisfação médio
        const satisfactionScores = restaurantInsights
          .filter(i => i.satisfaction_score !== null)
          .map(i => i.satisfaction_score);
        const avgSatisfaction = satisfactionScores.length > 0 
          ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
          : 0;

        return {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          revenue,
          orders: orderCount,
          conversations: conversationCount,
          conversionRate,
          satisfactionScore: avgSatisfaction,
          aiEnabled: restaurant.ai_enabled || false
        };
      }) || [];

      // Calcular totais globais
      const totalRevenue = restaurantPerformance.reduce((sum, r) => sum + r.revenue, 0);
      const totalOrders = restaurantPerformance.reduce((sum, r) => sum + r.orders, 0);
      const totalConversations = restaurantPerformance.reduce((sum, r) => sum + r.conversations, 0);
      
      const avgConversionRate = restaurantPerformance.length > 0 
        ? restaurantPerformance.reduce((sum, r) => sum + r.conversionRate, 0) / restaurantPerformance.length 
        : 0;
      
      const avgSatisfactionScore = restaurantPerformance.length > 0 
        ? restaurantPerformance.reduce((sum, r) => sum + r.satisfactionScore, 0) / restaurantPerformance.length 
        : 0;

      const activeAgents = agents?.length || 0;

      setMetrics({
        totalRevenue,
        totalOrders,
        totalConversations,
        avgConversionRate,
        avgSatisfactionScore,
        activeAgents,
        restaurantPerformance
      });

    } catch (err) {
      console.error('Erro ao buscar analytics globais:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalAnalytics();
  }, [restaurantIds.join(','), dateRange?.from, dateRange?.to]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchGlobalAnalytics
  };
};