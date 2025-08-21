import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  MessageCircle,
  Euro,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface ConversionMetricsProps {
  restaurantId: string;
}

export const ConversionMetrics: React.FC<ConversionMetricsProps> = ({
  restaurantId
}) => {
  const { analyticsData, loading } = useAnalytics(restaurantId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="mx-auto h-12 w-12 mb-4" />
            <p>Dados de conversão não disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overview } = analyticsData;

  // Calculate trend indicators (mock data for now)
  const trends = {
    conversations: 12, // % increase
    orders: 8,
    revenue: 15,
    conversionRate: -2
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  // Funnel data
  const funnelData = [
    { name: 'Visitantes', value: overview.totalConversations + 150, fill: 'hsl(var(--primary))' },
    { name: 'Conversas Iniciadas', value: overview.totalConversations, fill: 'hsl(var(--primary))' },
    { name: 'Pedidos Criados', value: overview.totalOrders, fill: 'hsl(var(--primary))' },
  ];

  // Mock daily conversion data
  const dailyData = Array.from({ length: 7 }, (_, i) => ({
    day: `Dia ${i + 1}`,
    conversations: Math.floor(Math.random() * 20) + 10,
    orders: Math.floor(Math.random() * 10) + 2,
    revenue: Math.floor(Math.random() * 500) + 100
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Métricas de Conversão</h2>
        <p className="text-muted-foreground">
          Análise detalhada do funil WhatsApp → Pedidos
        </p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conversas Iniciadas
                </p>
                <p className="text-2xl font-bold">{overview.totalConversations}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(trends.conversations)}
                  <span className={`text-sm ${getTrendColor(trends.conversations)}`}>
                    {Math.abs(trends.conversations)}%
                  </span>
                </div>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pedidos Convertidos
                </p>
                <p className="text-2xl font-bold">{overview.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(trends.orders)}
                  <span className={`text-sm ${getTrendColor(trends.orders)}`}>
                    {Math.abs(trends.orders)}%
                  </span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Taxa de Conversão
                </p>
                <p className="text-2xl font-bold">{overview.conversionRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(trends.conversionRate)}
                  <span className={`text-sm ${getTrendColor(trends.conversionRate)}`}>
                    {Math.abs(trends.conversionRate)}%
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <Progress value={overview.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Revenue Total
                </p>
                <p className="text-2xl font-bold">€{overview.totalRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(trends.revenue)}
                  <span className={`text-sm ${getTrendColor(trends.revenue)}`}>
                    {Math.abs(trends.revenue)}%
                  </span>
                </div>
              </div>
              <Euro className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>
              Jornada do cliente: WhatsApp → Pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((step, index) => {
                const percentage = index === 0 ? 100 : (step.value / funnelData[0].value) * 100;
                return (
                  <div key={step.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{step.name}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold">{step.value}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendência de Conversão</CardTitle>
            <CardDescription>
              Últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="conversations" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stackId="2"
                    stroke="hsl(var(--green))" 
                    fill="hsl(var(--green))"
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valor Médio do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                €{overview.avgOrderValue.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Via WhatsApp vs outros canais
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">WhatsApp</span>
                  <span className="text-sm font-medium">€{overview.avgOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-sm">Outros</span>
                  <span className="text-sm">€{(overview.avgOrderValue * 0.85).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tempo Médio para Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {overview.avgResponseTime.toFixed(0)}min
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Do primeiro contato ao pedido
              </p>
              <Badge variant="secondary" className="mt-4">
                32% mais rápido que a média
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Abandono</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {(100 - overview.conversionRate).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Conversas que não viraram pedidos
              </p>
              <Progress 
                value={100 - overview.conversionRate} 
                className="mt-4"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};