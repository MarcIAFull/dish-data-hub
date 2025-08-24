import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  TrendingUp, 
  Clock,
  Users,
  MessageSquare,
  Star,
  Target
} from 'lucide-react';

interface BotPerformanceDashboardProps {
  restaurantId: string;
  agentId?: string;
}

export const BotPerformanceDashboard: React.FC<BotPerformanceDashboardProps> = ({ 
  restaurantId, 
  agentId 
}) => {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [restaurantId, agentId]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agent_performance_metrics')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('date', { ascending: false })
        .limit(30);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPerformanceData(data || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Carregando métricas...</p>
      </div>
    );
  }

  const metrics = performanceData.length > 0 ? {
    totalConversations: performanceData.reduce((sum, d) => sum + d.total_conversations, 0),
    avgConversionRate: performanceData.reduce((sum, d) => sum + d.conversion_rate, 0) / performanceData.length,
    avgSatisfaction: performanceData.reduce((sum, d) => sum + d.avg_satisfaction_score, 0) / performanceData.length,
    totalRevenue: performanceData.reduce((sum, d) => sum + d.total_revenue_generated, 0)
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Performance do Bot de IA
        </CardTitle>
        <CardDescription>
          Métricas detalhadas de performance do agente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Conversas</span>
                </div>
                <p className="text-2xl font-bold">{metrics.totalConversations}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Conversão</span>
                </div>
                <p className="text-2xl font-bold">{metrics.avgConversionRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Satisfação</span>
                </div>
                <p className="text-2xl font-bold">{metrics.avgSatisfaction.toFixed(1)}/5</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Receita</span>
                </div>
                <p className="text-2xl font-bold">R$ {metrics.totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};