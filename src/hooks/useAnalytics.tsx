import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AnalyticsOverview {
  totalConversations: number;
  totalOrders: number;
  conversionRate: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgResponseTime: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  distributions: {
    conversationsByStatus: Record<string, number>;
    ordersByStatus: Record<string, number>;
  };
  activity: {
    hourlyActivity: Array<{ hour: number; messages: number }>;
  };
  timeframe: string;
}

export interface ConversationInsight {
  id: string;
  conversation_id: string;
  restaurant_id: string;
  sentiment_score: number;
  key_topics: string[];
  intent_detected: string;
  satisfaction_score: number;
  fallback_count: number;
  resolution_time_minutes: number;
  converted_to_order: boolean;
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

export function useAnalytics(restaurantId: string) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<ConversationInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  const fetchAnalyticsData = async (selectedTimeframe = timeframe) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('analytics-data', {
        body: { 
          restaurantId,
          timeframe: selectedTimeframe
        }
      });

      if (error) throw error;
      
      setAnalyticsData(data);
      setTimeframe(selectedTimeframe);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Erro ao carregar analytics',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_insights')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInsights(data || []);
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      toast({
        title: 'Erro ao carregar insights',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const analyzeConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('conversation-insights', {
        body: { 
          conversationId,
          restaurantId
        }
      });

      if (error) throw error;
      
      // Refresh insights after analysis
      await fetchInsights();
      
      return data;
    } catch (error: any) {
      console.error('Error analyzing conversation:', error);
      toast({
        title: 'Erro ao analisar conversa',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const refreshViews = async () => {
    try {
      const { error } = await supabase.rpc('refresh_analytics_views');
      if (error) throw error;
      
      toast({
        title: 'Dados atualizados',
        description: 'Métricas foram atualizadas com sucesso',
      });
    } catch (error: any) {
      console.error('Error refreshing views:', error);
      toast({
        title: 'Erro ao atualizar dados',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchAnalyticsData();
      fetchInsights();
    }
  }, [restaurantId]);

  return {
    analyticsData,
    insights,
    loading,
    timeframe,
    fetchAnalyticsData,
    analyzeConversation,
    refreshViews,
    setTimeframe: (newTimeframe: string) => {
      fetchAnalyticsData(newTimeframe);
    }
  };
}