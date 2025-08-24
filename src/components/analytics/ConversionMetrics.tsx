import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Target, TrendingUp, Users, DollarSign } from 'lucide-react';

interface ConversionMetricsProps {
  restaurantId: string;
}

export const ConversionMetrics: React.FC<ConversionMetricsProps> = ({ restaurantId }) => {
  const [conversionData, setConversionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversionData();
  }, [restaurantId]);

  const fetchConversionData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('agent_performance_metrics')
        .select(`
          *,
          agents!inner(name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('conversion_rate', { ascending: false });

      if (error) throw error;
      setConversionData(data || []);
    } catch (error) {
      console.error('Error fetching conversion data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Target className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Carregando métricas de conversão...</p>
      </div>
    );
  }

  const overallMetrics = conversionData.length > 0 ? {
    totalConversations: conversionData.reduce((sum, d) => sum + d.total_conversations, 0),
    totalOrders: conversionData.reduce((sum, d) => sum + d.total_orders_generated, 0),
    totalRevenue: conversionData.reduce((sum, d) => sum + d.total_revenue_generated, 0),
    avgConversionRate: conversionData.reduce((sum, d) => sum + d.conversion_rate, 0) / conversionData.length
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Métricas de Conversão
        </CardTitle>
        <CardDescription>
          Análise da efetividade de conversão por agente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {overallMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Conversas</span>
                </div>
                <p className="text-2xl font-bold">{overallMetrics.totalConversations}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Taxa Conversão</span>
                </div>
                <p className="text-2xl font-bold">{overallMetrics.avgConversionRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Pedidos</span>
                </div>
                <p className="text-2xl font-bold">{overallMetrics.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Receita</span>
                </div>
                <p className="text-2xl font-bold">R$ {overallMetrics.totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="space-y-4">
          {conversionData.map((agent) => (
            <Card key={agent.agent_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{agent.agents?.name || 'Agente'}</h3>
                  <Badge variant={agent.conversion_rate > 15 ? 'default' : 'secondary'}>
                    {agent.conversion_rate.toFixed(1)}% conversão
                  </Badge>
                </div>
                <Progress value={agent.conversion_rate} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};