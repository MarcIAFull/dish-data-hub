import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CustomerSegment } from '@/hooks/useBusinessIntelligence';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Users,
  Crown,
  UserCheck,
  Clock,
  AlertTriangle,
  UserPlus,
  TrendingUp,
  Heart,
  DollarSign
} from 'lucide-react';

interface CustomerBehaviorProps {
  restaurantId: string;
  customerSegments: CustomerSegment[];
}

export function CustomerBehavior({ restaurantId, customerSegments }: CustomerBehaviorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'vip':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'regular':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'occasional':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'new':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'vip':
        return 'VIP';
      case 'regular':
        return 'Regular';
      case 'occasional':
        return 'Ocasional';
      case 'at_risk':
        return 'Em Risco';
      case 'new':
        return 'Novo';
      default:
        return segment;
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return '#FFD700';
      case 'regular':
        return '#3B82F6';
      case 'occasional':
        return '#6B7280';
      case 'at_risk':
        return '#EF4444';
      case 'new':
        return '#10B981';
      default:
        return '#94A3B8';
    }
  };

  // Calculate segment distribution
  const segmentDistribution = customerSegments.reduce((acc, customer) => {
    acc[customer.segment_type] = (acc[customer.segment_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const segmentChartData = Object.entries(segmentDistribution).map(([segment, count]) => ({
    segment: getSegmentLabel(segment),
    value: count,
    color: getSegmentColor(segment)
  }));

  // Calculate LTV distribution
  const ltvRanges = {
    'R$ 0-100': customerSegments.filter(c => c.ltv_score <= 100).length,
    'R$ 101-300': customerSegments.filter(c => c.ltv_score > 100 && c.ltv_score <= 300).length,
    'R$ 301-500': customerSegments.filter(c => c.ltv_score > 300 && c.ltv_score <= 500).length,
    'R$ 500+': customerSegments.filter(c => c.ltv_score > 500).length,
  };

  const ltvChartData = Object.entries(ltvRanges).map(([range, count]) => ({
    range,
    count
  }));

  // Top customers by LTV
  const topCustomers = customerSegments
    .sort((a, b) => b.ltv_score - a.ltv_score)
    .slice(0, 10);

  // At-risk customers
  const atRiskCustomers = customerSegments
    .filter(c => c.segment_type === 'at_risk' || c.churn_probability > 70)
    .sort((a, b) => b.churn_probability - a.churn_probability)
    .slice(0, 5);

  // Mock retention data
  const retentionData = [
    { month: 'Jan', retention: 85, newCustomers: 45 },
    { month: 'Fev', retention: 82, newCustomers: 52 },
    { month: 'Mar', retention: 88, newCustomers: 38 },
    { month: 'Abr', retention: 90, newCustomers: 61 },
    { month: 'Mai', retention: 87, newCustomers: 48 },
    { month: 'Jun', retention: 92, newCustomers: 55 },
  ];

  const totalCustomers = customerSegments.length;
  const averageLTV = customerSegments.reduce((sum, c) => sum + c.ltv_score, 0) / totalCustomers;
  const averageChurnRisk = customerSegments.reduce((sum, c) => sum + c.churn_probability, 0) / totalCustomers;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <h3 className="text-2xl font-bold">{totalCustomers}</h3>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">LTV Médio</p>
                <h3 className="text-2xl font-bold">{formatCurrency(averageLTV)}</h3>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes VIP</p>
                <h3 className="text-2xl font-bold">
                  {segmentDistribution.vip || 0}
                </h3>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risco de Churn</p>
                <h3 className="text-2xl font-bold">{averageChurnRisk.toFixed(1)}%</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Segmentação de Clientes</CardTitle>
            <CardDescription>
              Distribuição dos clientes por perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                vip: { label: "VIP", color: "#FFD700" },
                regular: { label: "Regular", color: "#3B82F6" },
                occasional: { label: "Ocasional", color: "#6B7280" },
                at_risk: { label: "Em Risco", color: "#EF4444" },
                new: { label: "Novo", color: "#10B981" },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentChartData}
                    dataKey="value"
                    nameKey="segment"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ segment, value }) => `${segment}: ${value}`}
                  >
                    {segmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de LTV</CardTitle>
            <CardDescription>
              Lifetime Value por faixa de valor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Clientes",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ltvChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Top Clientes (LTV)
            </CardTitle>
            <CardDescription>
              Clientes com maior valor vitalício
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    {getSegmentIcon(customer.segment_type)}
                    <div>
                      <p className="font-medium">{customer.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.frequency_score} pedidos • {customer.recency_days} dias atrás
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(customer.ltv_score)}</p>
                    <Badge variant={customer.segment_type === 'vip' ? 'default' : 'secondary'}>
                      {getSegmentLabel(customer.segment_type)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clientes em Risco
            </CardTitle>
            <CardDescription>
              Clientes com alta probabilidade de churn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskCustomers.length > 0 ? (
                atRiskCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">{customer.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.recency_days} dias sem pedido • LTV: {formatCurrency(customer.ltv_score)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{customer.churn_probability.toFixed(1)}%</span>
                      </div>
                      <Progress value={customer.churn_probability} className="w-20 h-2" />
                      <Button size="sm" variant="outline" className="mt-2">
                        Reengajar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cliente em risco no momento!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Retenção e Aquisição
          </CardTitle>
          <CardDescription>
            Taxa de retenção e novos clientes por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              retention: {
                label: "Retenção %",
                color: "hsl(var(--primary))",
              },
              newCustomers: {
                label: "Novos Clientes",
                color: "hsl(var(--secondary))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="newCustomers"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}