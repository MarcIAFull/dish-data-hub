import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Target,
  Clock,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ResponseEffectiveness {
  id: string;
  response_type: string;
  response_text: string;
  usage_count: number;
  success_rate: number;
  avg_user_satisfaction: number;
  effectiveness_score: number;
  last_used: string;
}

interface OverallMetrics {
  totalResponses: number;
  avgEffectiveness: number;
  topResponseType: string;
  improvementAreas: string[];
}

interface EffectivenessReportsProps {
  restaurantId: string;
  agentId?: string;
}

export const EffectivenessReports: React.FC<EffectivenessReportsProps> = ({ 
  restaurantId, 
  agentId 
}) => {
  const [responseData, setResponseData] = useState<ResponseEffectiveness[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchEffectivenessData();
  }, [restaurantId, agentId, timeRange]);

  const fetchEffectivenessData = async () => {
    try {
      setLoading(true);
      
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      let query = supabase
        .from('response_effectiveness')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('last_used', startDate.toISOString())
        .order('effectiveness_score', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setResponseData(data || []);
    } catch (error) {
      console.error('Error fetching effectiveness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallMetrics = (): OverallMetrics => {
    if (responseData.length === 0) {
      return {
        totalResponses: 0,
        avgEffectiveness: 0,
        topResponseType: '',
        improvementAreas: []
      };
    }

    const totalResponses = responseData.reduce((sum, r) => sum + r.usage_count, 0);
    const avgEffectiveness = responseData.reduce((sum, r) => sum + r.effectiveness_score, 0) / responseData.length;
    
    // Get top response type by usage
    const responseTypes = responseData.reduce((acc, r) => {
      acc[r.response_type] = (acc[r.response_type] || 0) + r.usage_count;
      return acc;
    }, {} as Record<string, number>);
    
    const topResponseType = Object.entries(responseTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Find improvement areas (low effectiveness)
    const improvementAreas = responseData
      .filter(r => r.effectiveness_score < 70)
      .map(r => r.response_type)
      .filter((type, index, arr) => arr.indexOf(type) === index);

    return {
      totalResponses,
      avgEffectiveness,
      topResponseType,
      improvementAreas
    };
  };

  const getResponseTypeMetrics = () => {
    const typeMetrics = responseData.reduce((acc, response) => {
      const type = response.response_type;
      if (!acc[type]) {
        acc[type] = {
          type,
          totalUsage: 0,
          avgEffectiveness: 0,
          avgSatisfaction: 0,
          responses: []
        };
      }
      
      acc[type].totalUsage += response.usage_count;
      acc[type].responses.push(response);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(typeMetrics).forEach((metric: any) => {
      metric.avgEffectiveness = metric.responses.reduce((sum: number, r: any) => sum + r.effectiveness_score, 0) / metric.responses.length;
      metric.avgSatisfaction = metric.responses.reduce((sum: number, r: any) => sum + r.avg_user_satisfaction, 0) / metric.responses.length;
    });

    return Object.values(typeMetrics);
  };

  const getPerformanceCategory = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'text-green-500', icon: CheckCircle };
    if (score >= 60) return { label: 'Bom', color: 'text-blue-500', icon: Target };
    if (score >= 40) return { label: 'Regular', color: 'text-yellow-500', icon: AlertCircle };
    return { label: 'Precisa Melhorar', color: 'text-red-500', icon: XCircle };
  };

  const metrics = getOverallMetrics();
  const typeMetrics = getResponseTypeMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando relatórios de efetividade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios de Efetividade
          </CardTitle>
          <CardDescription>
            Análise detalhada da efetividade das respostas do agente de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="responses">Respostas</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Total de Respostas</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics.totalResponses}</p>
                    <p className="text-xs text-muted-foreground">
                      {responseData.length} tipos diferentes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Efetividade Média</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics.avgEffectiveness.toFixed(1)}%</p>
                    <Progress value={metrics.avgEffectiveness} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Tipo Mais Usado</span>
                    </div>
                    <p className="text-lg font-bold capitalize">{metrics.topResponseType || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Tipo de resposta</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Áreas p/ Melhoria</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics.improvementAreas.length}</p>
                    <p className="text-xs text-muted-foreground">Tipos com baixa efetividade</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Top 5 Respostas Mais Efetivas</h3>
                  <div className="space-y-3">
                    {responseData.slice(0, 5).map((response, index) => {
                      const category = getPerformanceCategory(response.effectiveness_score);
                      const IconComponent = category.icon;
                      
                      return (
                        <div key={response.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-xs font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium capitalize">{response.response_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {response.usage_count} usos · {response.avg_user_satisfaction.toFixed(1)}/5 satisfação
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconComponent className={`h-4 w-4 ${category.color}`} />
                            <span className="font-medium">{response.effectiveness_score.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="responses" className="space-y-4">
              <div className="space-y-4">
                {responseData.map((response) => {
                  const category = getPerformanceCategory(response.effectiveness_score);
                  const IconComponent = category.icon;
                  
                  return (
                    <Card key={response.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium capitalize">{response.response_type}</h3>
                            <p className="text-sm text-muted-foreground">
                              Última utilização: {new Date(response.last_used).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconComponent className={`h-4 w-4 ${category.color}`} />
                            <Badge variant={response.effectiveness_score >= 70 ? 'default' : 'destructive'}>
                              {response.effectiveness_score.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Usos</p>
                            <p className="font-semibold">{response.usage_count}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                            <p className="font-semibold">{response.success_rate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Satisfação</p>
                            <p className="font-semibold">{response.avg_user_satisfaction.toFixed(1)}/5</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Categoria</p>
                            <p className={`font-semibold ${category.color}`}>{category.label}</p>
                          </div>
                        </div>

                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm">
                            <strong>Resposta:</strong> {response.response_text}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="grid gap-4">
                {typeMetrics.map((metric: any) => (
                  <Card key={metric.type}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium capitalize">{metric.type}</h3>
                        <Badge variant="outline">{metric.responses.length} respostas</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Uso Total</p>
                          <p className="text-2xl font-bold">{metric.totalUsage}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Efetividade Média</p>
                          <p className="text-2xl font-bold">{metric.avgEffectiveness.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Satisfação Média</p>
                          <p className="text-2xl font-bold">{metric.avgSatisfaction.toFixed(1)}/5</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Efetividade</span>
                          <span>{metric.avgEffectiveness.toFixed(1)}%</span>
                        </div>
                        <Progress value={metric.avgEffectiveness} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Pontos Fortes
                    </h3>
                    <div className="space-y-3">
                      {responseData
                        .filter(r => r.effectiveness_score >= 80)
                        .slice(0, 3)
                        .map((response) => (
                          <div key={response.id} className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="font-medium capitalize">{response.response_type}</p>
                            <p className="text-sm text-green-700">
                              {response.effectiveness_score.toFixed(1)}% de efetividade com {response.usage_count} usos
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Áreas para Melhoria
                    </h3>
                    <div className="space-y-3">
                      {responseData
                        .filter(r => r.effectiveness_score < 60)
                        .slice(0, 3)
                        .map((response) => (
                          <div key={response.id} className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="font-medium capitalize">{response.response_type}</p>
                            <p className="text-sm text-red-700">
                              {response.effectiveness_score.toFixed(1)}% de efetividade - considere reformular
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Recomendações Específicas
                    </h3>
                    <div className="space-y-3">
                      {metrics.avgEffectiveness < 70 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-700">
                            <strong>Melhoria Geral:</strong> Efetividade média está baixa ({metrics.avgEffectiveness.toFixed(1)}%). 
                            Considere revisar as respostas mais utilizadas e implementar testes A/B.
                          </p>
                        </div>
                      )}
                      
                      {metrics.improvementAreas.length > 0 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-sm text-orange-700">
                            <strong>Tipos a Melhorar:</strong> {metrics.improvementAreas.join(', ')} 
                            apresentam baixa efetividade. Foque nestas áreas primeiro.
                          </p>
                        </div>
                      )}
                      
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                        <p className="text-sm text-purple-700">
                          <strong>Otimização:</strong> Use os templates de maior sucesso como base para 
                          melhorar respostas com baixa performance.
                        </p>
                      </div>
                      
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700">
                          <strong>Monitoramento:</strong> Configure alertas para respostas com efetividade 
                          abaixo de 50% para intervenção rápida.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};