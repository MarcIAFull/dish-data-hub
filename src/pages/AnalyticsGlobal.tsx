import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ShoppingBag, DollarSign, MessageCircle, Bot, AlertTriangle, Loader2 } from 'lucide-react';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useGlobalAnalytics } from '@/hooks/useGlobalAnalytics';
import { GlobalFiltersComponent } from '@/components/filters/GlobalFilters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AnalyticsGlobal() {
  const { filters, restaurants } = useGlobalFilters();
  
  // Use the new global analytics hook
  const { metrics, loading, error, refetch } = useGlobalAnalytics(
    filters.selectedRestaurants,
    filters.dateRange
  );

  // Check for AI disabled restaurants
  const aiDisabledRestaurants = metrics.restaurantPerformance.filter(r => !r.aiEnabled);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Real chart data from metrics
  const revenueData = metrics.restaurantPerformance.map(restaurant => ({
    name: restaurant.restaurantName,
    revenue: restaurant.revenue,
    orders: restaurant.orders,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
            <p className="text-muted-foreground">
              Visão consolidada de todos os seus restaurantes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <GlobalFiltersComponent />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Loading State */}
              {loading && (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Carregando analytics...</span>
                  </CardContent>
                </Card>
              )}

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar dados: {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* AI Disabled Warning */}
              {aiDisabledRestaurants.length > 0 && (
                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> {aiDisabledRestaurants.length} restaurante(s) com IA desabilitada: {' '}
                    {aiDisabledRestaurants.map(r => r.restaurantName).join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {filters.selectedRestaurants.length} restaurante{filters.selectedRestaurants.length !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      Média de {Math.round(metrics.totalOrders / Math.max(filters.selectedRestaurants.length, 1))} por restaurante
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalConversations}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.activeAgents} agentes ativos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(metrics.avgConversionRate)}</div>
                    <p className="text-xs text-muted-foreground">
                      Média entre restaurantes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.avgSatisfactionScore.toFixed(1)}/5</div>
                    <p className="text-xs text-muted-foreground">
                      Score médio de satisfação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor médio por pedido
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Restaurant */}
                <Card>
                  <CardHeader>
                    <CardTitle>Receita por Restaurante</CardTitle>
                    <CardDescription>
                      Comparativo de faturamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Orders Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Pedidos</CardTitle>
                    <CardDescription>
                      Participação por restaurante
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={revenueData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="orders"
                        >
                          {revenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Restaurant Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Restaurante</CardTitle>
                  <CardDescription>
                    Métricas detalhadas de cada estabelecimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Restaurante</th>
                          <th className="text-right py-2">Receita</th>
                          <th className="text-right py-2">Pedidos</th>
                          <th className="text-right py-2">Ticket Médio</th>
                          <th className="text-right py-2">Conversão</th>
                          <th className="text-right py-2">Satisfação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.restaurantPerformance.map((restaurant) => (
                          <tr key={restaurant.restaurantId} className="border-b">
                            <td className="py-2 font-medium">
                              <div className="flex items-center gap-2">
                                {restaurant.restaurantName}
                                {!restaurant.aiEnabled && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </td>
                            <td className="text-right py-2">
                              {formatCurrency(restaurant.revenue)}
                            </td>
                            <td className="text-right py-2">
                              {restaurant.orders}
                            </td>
                            <td className="text-right py-2">
                              {formatCurrency(restaurant.orders > 0 ? restaurant.revenue / restaurant.orders : 0)}
                            </td>
                            <td className="text-right py-2">
                              {formatPercentage(restaurant.conversionRate)}
                            </td>
                            <td className="text-right py-2">
                              {restaurant.satisfactionScore.toFixed(1)}/5
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}