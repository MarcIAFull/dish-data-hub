import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BusinessMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  conversionRate: number;
}

export interface ProductPerformance {
  id: string;
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  profit_margin: number;
  trend_direction: string;
  customer_rating: number;
}

export interface CustomerSegment {
  id: string;
  customer_id: string;
  customer_name: string;
  segment_type: 'vip' | 'regular' | 'occasional' | 'at_risk' | 'new';
  ltv_score: number;
  frequency_score: number;
  recency_days: number;
  churn_probability: number;
  next_order_prediction: string;
}

export interface AIInsight {
  id: string;
  insight_type: 'pricing' | 'menu' | 'demand' | 'customer';
  insight_data: any;
  confidence_score: number;
  impact_score: number;
  status: 'pending' | 'applied' | 'rejected';
  created_at: string;
}

export interface PriceRecommendation {
  id: string;
  product_id: string;
  product_name: string;
  current_price: number;
  recommended_price: number;
  reason: string;
  expected_impact: any;
  confidence_level: number;
  status: 'pending' | 'testing' | 'applied' | 'rejected';
}

export function useBusinessIntelligence(restaurantId: string) {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [priceRecommendations, setPriceRecommendations] = useState<PriceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  const fetchBusinessMetrics = async (selectedTimeframe = timeframe) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('business-intelligence', {
        body: { 
          restaurantId,
          timeframe: selectedTimeframe,
          type: 'metrics'
        }
      });

      if (error) throw error;
      
      setBusinessMetrics(data.metrics);
      setTimeframe(selectedTimeframe);
    } catch (error: any) {
      console.error('Error fetching business metrics:', error);
      toast({
        title: 'Erro ao carregar métricas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductPerformance = async () => {
    try {
      // For now, return empty array since we don't have product_performance data yet
      // In a real implementation, this would fetch from the database
      setProductPerformance([]);
    } catch (error: any) {
      console.error('Error fetching product performance:', error);
    }
  };

  const fetchCustomerSegments = async () => {
    try {
      // For now, return empty array since we don't have customer_segments data yet
      // In a real implementation, this would fetch from the database
      setCustomerSegments([]);
    } catch (error: any) {
      console.error('Error fetching customer segments:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      // For now, return empty array since we don't have ai_insights_cache data yet
      // In a real implementation, this would fetch from the database
      setAIInsights([]);
    } catch (error: any) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const fetchPriceRecommendations = async () => {
    try {
      // For now, return empty array since we don't have price_recommendations data yet
      // In a real implementation, this would fetch from the database
      setPriceRecommendations([]);
    } catch (error: any) {
      console.error('Error fetching price recommendations:', error);
    }
  };

  const generateInsights = async (type: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights-generator', {
        body: { 
          restaurantId,
          insightType: type
        }
      });

      if (error) throw error;
      
      toast({
        title: 'Insights gerados',
        description: 'Novos insights foram gerados com sucesso',
      });
      
      await fetchAIInsights();
      return data;
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Erro ao gerar insights',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const applyPriceRecommendation = async (recommendationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('apply-price-recommendation', {
        body: { 
          recommendationId,
          restaurantId
        }
      });

      if (error) throw error;
      
      toast({
        title: 'Preço atualizado',
        description: 'Recomendação de preço aplicada com sucesso',
      });
      
      await fetchPriceRecommendations();
    } catch (error: any) {
      console.error('Error applying price recommendation:', error);
      toast({
        title: 'Erro ao aplicar recomendação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchBusinessMetrics(),
      fetchProductPerformance(),
      fetchCustomerSegments(),
      fetchAIInsights(),
      fetchPriceRecommendations()
    ]);
  };

  useEffect(() => {
    if (restaurantId) {
      refreshData();
    }
  }, [restaurantId]);

  return {
    businessMetrics,
    productPerformance,
    customerSegments,
    aiInsights,
    priceRecommendations,
    loading,
    timeframe,
    fetchBusinessMetrics,
    generateInsights,
    applyPriceRecommendation,
    refreshData,
    setTimeframe: (newTimeframe: string) => {
      fetchBusinessMetrics(newTimeframe);
    }
  };
}