import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  Target
} from 'lucide-react';

interface BusinessMetricsProps {
  restaurantId: string;
}

export function BusinessMetrics({ restaurantId }: BusinessMetricsProps) {
  const { analyticsData, loading } = useAnalytics(restaurantId);

  if (loading || !analyticsData) {
    return <div>Carregando métricas...</div>;
  }

  const { overview } = analyticsData;

  // Mock data for advanced charts - in real implementation, this would come from the BI system
  const revenueData = [
    { date: '2024-01-01', revenue: 15000, orders: 45 },
    { date: '2024-01-02', revenue: 18000, orders: 52 },
    { date: '2024-01-03', revenue: 16500, orders: 48 },
    { date: '2024-01-04', revenue: 22000, orders: 65 },
    { date: '2024-01-05', revenue: 19500, orders: 58 },
    { date: '2024-01-06', revenue: 25000, orders: 75 },
    { date: '2024-01-07', revenue: 23000, orders: 68 },
  ];

  const performanceMetrics = [
    { metric: 'Conversão', value: overview.conversionRate, target: 15, status: 'good' },
    { metric: 'Tempo Resposta', value: overview.avgResponseTime / 60, target: 2, status: 'warning' },
    { metric: 'Ticket Médio', value: overview.avgOrderValue, target: 350, status: 'good' },
    { metric: 'Pedidos/Dia', value: overview.totalOrders / 7, target: 50, status: 'excellent' },
  ];

  const channelData = [
    { channel: 'WhatsApp', value: 65, color: '#25D366' },
    { channel: 'Instagram', value: 20, color: '#E4405F' },
    { channel: 'Direto', value: 10, color: '#1DA1F2' },
    { channel: 'Outros', value: 5, color: '#6B7280' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'excellent': return 'default';
      case 'good': return 'default';
      case 'warning': return 'outline';
      case 'danger': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução da Receita
            </CardTitle>
            <CardDescription>
              Receita e pedidos nos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Receita",
                  color: "hsl(var(--primary))",
                },
                orders: {
                  label: "Pedidos",
                  color: "hsl(var(--secondary))",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
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
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance vs Meta
            </CardTitle>
            <CardDescription>
              Indicadores principais e suas metas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                    <span className="font-medium">{item.metric}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {item.metric === 'Ticket Médio' ? formatCurrency(item.value) : item.value.toFixed(1)}
                    </span>
                    <Badge variant={getStatusVariant(item.status)}>
                      Meta: {item.metric === 'Ticket Médio' ? formatCurrency(item.target) : item.target}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade por Hora
            </CardTitle>
            <CardDescription>
              Distribuição de pedidos ao longo do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                messages: {
                  label: "Mensagens",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.activity.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="messages"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Canais de Origem
            </CardTitle>
            <CardDescription>
              Distribuição de pedidos por canal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                whatsapp: { label: "WhatsApp", color: "#25D366" },
                instagram: { label: "Instagram", color: "#E4405F" },
                direct: { label: "Direto", color: "#1DA1F2" },
                others: { label: "Outros", color: "#6B7280" },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    dataKey="value"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ channel, value }) => `${channel}: ${value}%`}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}