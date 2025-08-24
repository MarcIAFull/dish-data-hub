import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  Frown, 
  Meh, 
  Smile, 
  TrendingUp, 
  AlertTriangle,
  Users,
  MessageSquare,
  Clock,
  Target
} from 'lucide-react';

interface SentimentData {
  id: string;
  sentiment_score: number;
  sentiment_label: string;
  confidence_score: number;
  emotional_indicators: any;
  response_strategy: string;
  escalation_triggered: boolean;
  created_at: string;
  conversation_id: string;
  customer_phone: string;
}

interface SentimentAnalyticsDashboardProps {
  restaurantId: string;
}

export const SentimentAnalyticsDashboard: React.FC<SentimentAnalyticsDashboardProps> = ({ 
  restaurantId 
}) => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchSentimentData();
  }, [restaurantId, timeRange]);

  const fetchSentimentData = async () => {
    try {
      setLoading(true);
      
      const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 30d
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('sentiment_analytics')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSentimentData(data || []);
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentStats = () => {
    const total = sentimentData.length;
    if (total === 0) return { positive: 0, neutral: 0, negative: 0, avgScore: 0 };

    const positive = sentimentData.filter(d => d.sentiment_label === 'positive').length;
    const neutral = sentimentData.filter(d => d.sentiment_label === 'neutral').length;
    const negative = sentimentData.filter(d => d.sentiment_label === 'negative').length;
    
    const avgScore = sentimentData.reduce((sum, d) => sum + d.sentiment_score, 0) / total;

    return {
      positive: (positive / total) * 100,
      neutral: (neutral / total) * 100,
      negative: (negative / total) * 100,
      avgScore
    };
  };

  const getEmotionalInsights = () => {
    if (sentimentData.length === 0) return {};

    const emotions = sentimentData.reduce((acc, d) => {
      if (d.emotional_indicators) {
        Object.keys(d.emotional_indicators).forEach(emotion => {
          if (!acc[emotion]) acc[emotion] = [];
          acc[emotion].push(d.emotional_indicators[emotion]);
        });
      }
      return acc;
    }, {} as Record<string, number[]>);

    return Object.fromEntries(
      Object.entries(emotions).map(([emotion, values]) => [
        emotion,
        values.reduce((sum, val) => sum + val, 0) / values.length
      ])
    );
  };

  const getResponseStrategies = () => {
    const strategies = sentimentData.reduce((acc, d) => {
      acc[d.response_strategy] = (acc[d.response_strategy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return strategies;
  };

  const stats = getSentimentStats();
  const emotions = getEmotionalInsights();
  const strategies = getResponseStrategies();
  const escalations = sentimentData.filter(d => d.escalation_triggered).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Heart className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Analisando sentimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Análise de Sentimento em Tempo Real
          </CardTitle>
          <CardDescription>
            Como seus clientes estão se sentindo durante as conversas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="emotions">Emoções</TabsTrigger>
              <TabsTrigger value="strategies">Estratégias</TabsTrigger>
              <TabsTrigger value="recent">Recentes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Smile className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Positivo</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {stats.positive.toFixed(1)}%
                    </p>
                    <Progress value={stats.positive} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Meh className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Neutro</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">
                      {stats.neutral.toFixed(1)}%
                    </p>
                    <Progress value={stats.neutral} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Frown className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Negativo</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">
                      {stats.negative.toFixed(1)}%
                    </p>
                    <Progress value={stats.negative} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Escalações</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-500">
                      {escalations}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sentimentData.length > 0 ? (escalations / sentimentData.length * 100).toFixed(1) : 0}% do total
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Score Médio de Sentimento</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Negativo</span>
                        <span>Neutro</span>
                        <span>Positivo</span>
                      </div>
                      <Progress 
                        value={(stats.avgScore + 1) * 50} 
                        className="h-2"
                      />
                    </div>
                    <Badge variant={stats.avgScore > 0.2 ? 'default' : stats.avgScore > -0.2 ? 'secondary' : 'destructive'}>
                      {stats.avgScore.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emotions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(emotions).map(([emotion, value]) => (
                  <Card key={emotion}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {emotion === 'anger' ? 'Raiva' :
                           emotion === 'satisfaction' ? 'Satisfação' :
                           emotion === 'urgency' ? 'Urgência' :
                           emotion === 'confusion' ? 'Confusão' : emotion}
                        </span>
                        <Badge variant="outline">
                          {(value * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={value * 100} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="strategies" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(strategies).map(([strategy, count]) => (
                  <Card key={strategy}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium capitalize">
                          {strategy === 'empathetic' ? 'Empática' :
                           strategy === 'promotional' ? 'Promocional' :
                           strategy === 'informational' ? 'Informativa' : strategy}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {sentimentData.length > 0 ? (count / sentimentData.length * 100).toFixed(1) : 0}% das respostas
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <div className="space-y-3">
                {sentimentData.slice(0, 10).map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {item.sentiment_label === 'positive' ? (
                            <Smile className="h-4 w-4 text-green-500" />
                          ) : item.sentiment_label === 'negative' ? (
                            <Frown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Meh className="h-4 w-4 text-yellow-500" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                Score: {item.sentiment_score.toFixed(2)}
                              </Badge>
                              <Badge variant="secondary">
                                {item.response_strategy === 'empathetic' ? 'Empática' :
                                 item.response_strategy === 'promotional' ? 'Promocional' :
                                 item.response_strategy === 'informational' ? 'Informativa' : item.response_strategy}
                              </Badge>
                              {item.escalation_triggered && (
                                <Badge variant="destructive">Escalação</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Confiança: {(item.confidence_score * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};