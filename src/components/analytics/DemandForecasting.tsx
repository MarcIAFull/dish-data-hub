import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { 
  TrendingUp,
  Calendar,
  AlertTriangle,
  Target,
  BarChart3,
  Clock,
  Package,
  Users
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';

interface DemandForecastingProps {
  restaurantId: string;
}

export function DemandForecasting({ restaurantId }: DemandForecastingProps) {
  const [loading, setLoading] = React.useState(false);
  const [forecastData, setForecastData] = React.useState<any>(null);
  const [forecastPeriod, setForecastPeriod] = React.useState(30);

  // Mock forecast data for demo
  const mockForecast = {
    forecast: [
      { date: '2024-08-22', predictedOrders: 28, predictedRevenue: 1350, confidence: 89, factors: { trend: 'growing', seasonal: 'peak', dayOfWeek: 'Thursday' } },
      { date: '2024-08-23', predictedOrders: 35, predictedRevenue: 1680, confidence: 91, factors: { trend: 'growing', seasonal: 'peak', dayOfWeek: 'Friday' } },
      { date: '2024-08-24', predictedOrders: 42, predictedRevenue: 2010, confidence: 88, factors: { trend: 'growing', seasonal: 'peak', dayOfWeek: 'Saturday' } },
      { date: '2024-08-25', predictedOrders: 32, predictedRevenue: 1540, confidence: 85, factors: { trend: 'stable', seasonal: 'low', dayOfWeek: 'Sunday' } },
      { date: '2024-08-26', predictedOrders: 22, predictedRevenue: 1060, confidence: 83, factors: { trend: 'stable', seasonal: 'low', dayOfWeek: 'Monday' } },
      { date: '2024-08-27', predictedOrders: 25, predictedRevenue: 1200, confidence: 84, factors: { trend: 'stable', seasonal: 'average', dayOfWeek: 'Tuesday' } },
      { date: '2024-08-28', predictedOrders: 27, predictedRevenue: 1300, confidence: 86, factors: { trend: 'growing', seasonal: 'average', dayOfWeek: 'Wednesday' } },
    ],
    seasonality: {
      weeklyPattern: [0.8, 0.7, 0.8, 0.9, 1.1, 1.4, 1.3],
      peakDay: 5,
      lowDay: 1,
      weekendBoost: 1.35
    },
    insights: [
      {
        type: 'peak_demand',
        title: 'Pico de Demanda Previsto',
        description: 'Maior demanda esperada em 24/08/2024 com 42 pedidos',
        impact: 'high',
        action: 'Aumentar estoque e equipe para este dia'
      },
      {
        type: 'weekend_boost',
        title: 'Padrão de Final de Semana',
        description: 'Finais de semana têm 35% mais demanda',
        impact: 'medium',
        action: 'Otimizar operações para finais de semana'
      }
    ],
    recommendations: [
      'Aumentar estoque em 20% nos dias de pico',
      'Contratar pessoal temporário para dias de alta demanda',
      'Criar promoções específicas para fins de semana',
      'Monitorar KPIs diariamente para ajustes rápidos'
    ]
  };

  React.useEffect(() => {
    // Simulate loading forecast data
    setForecastData(mockForecast);
  }, [restaurantId]);

  const generateForecast = async () => {
    setLoading(true);
    try {
      // Simulate API call to demand forecasting
      await new Promise(resolve => setTimeout(resolve, 2000));
      setForecastData(mockForecast);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">Alto Impacto</Badge>;
      case 'medium':
        return <Badge variant="outline">Médio Impacto</Badge>;
      case 'positive':
        return <Badge className="bg-green-500">Positivo</Badge>;
      case 'negative':
        return <Badge variant="destructive">Negativo</Badge>;
      default:
        return <Badge variant="secondary">Baixo Impacto</Badge>;
    }
  };

  if (!forecastData) {
    return <div>Carregando previsões...</div>;
  }

  const { forecast, seasonality, insights, recommendations } = forecastData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Previsão de Demanda</h2>
          <p className="text-muted-foreground">
            Previsões inteligentes baseadas em IA para otimizar operações
          </p>
        </div>
        
        <Button onClick={generateForecast} disabled={loading}>
          <BarChart3 className="h-4 w-4 mr-2" />
          {loading ? 'Gerando...' : 'Atualizar Previsão'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Próximos 7 Dias</p>
                <h3 className="text-2xl font-bold">
                  {forecast.slice(0, 7).reduce((sum: number, day: any) => sum + day.predictedOrders, 0)}
                </h3>
                <p className="text-xs text-muted-foreground">pedidos previstos</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Prevista</p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(forecast.slice(0, 7).reduce((sum: number, day: any) => sum + day.predictedRevenue, 0))}
                </h3>
                <p className="text-xs text-muted-foreground">próxima semana</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dia de Pico</p>
                <h3 className="text-2xl font-bold">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][seasonality.peakDay]}
                </h3>
                <p className="text-xs text-muted-foreground">maior movimento</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confiança Média</p>
                <h3 className="text-2xl font-bold">
                  {Math.round(forecast.reduce((sum: number, day: any) => sum + day.confidence, 0) / forecast.length)}%
                </h3>
                <p className="text-xs text-muted-foreground">das previsões</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Previsão</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Previsão de Pedidos</CardTitle>
                <CardDescription>
                  Número esperado de pedidos nos próximos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    predictedOrders: {
                      label: "Pedidos",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="predictedOrders"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previsão de Receita</CardTitle>
                <CardDescription>
                  Receita esperada nos próximos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    predictedRevenue: {
                      label: "Receita",
                      color: "hsl(var(--secondary))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="predictedRevenue"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Previsão</CardTitle>
              <CardDescription>
                Previsões detalhadas com fatores influenciadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecast.map((day: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {new Date(day.date).toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {day.factors.seasonal} • {day.factors.trend}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Pedidos</p>
                        <p className="font-bold">{day.predictedOrders}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Receita</p>
                        <p className="font-bold">{formatCurrency(day.predictedRevenue)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Confiança</p>
                        <p className={`font-bold ${getConfidenceColor(day.confidence)}`}>
                          {day.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Padrão Semanal</CardTitle>
                <CardDescription>
                  Variação da demanda por dia da semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Demanda Relativa",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={seasonality.weeklyPattern.map((value: number, index: number) => ({
                        day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index],
                        value: (value * 100).toFixed(0)
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Sazonalidade</CardTitle>
                <CardDescription>
                  Padrões identificados nos dados históricos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Dia de Maior Movimento</p>
                    <p className="text-lg font-bold">
                      {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][seasonality.peakDay]}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Dia de Menor Movimento</p>
                    <p className="text-lg font-bold">
                      {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][seasonality.lowDay]}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg col-span-2">
                    <p className="text-sm text-muted-foreground">Boost de Final de Semana</p>
                    <p className="text-lg font-bold text-green-600">
                      +{((seasonality.weekendBoost - 1) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {insights.map((insight: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          {getImpactBadge(insight.impact)}
                        </div>
                        <p className="text-muted-foreground mb-3">{insight.description}</p>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="font-medium mb-1">Ação Recomendada:</p>
                          <p className="text-sm">{insight.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Plano de Ação
              </CardTitle>
              <CardDescription>
                Recomendações personalizadas baseadas nas previsões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{recommendation}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Implementar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}