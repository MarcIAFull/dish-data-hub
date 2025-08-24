import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ShoppingBag, DollarSign, MessageCircle, Bot } from 'lucide-react';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GlobalFiltersComponent } from '@/components/filters/GlobalFilters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsGlobal() {
  const { filters, restaurants } = useGlobalFilters();
  
  // Get analytics for all selected restaurants
  const allAnalytics = filters.selectedRestaurants.map(restaurantId => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    const { analyticsData } = useAnalytics(restaurantId);
    return {
      restaurantId,
      restaurantName: restaurant?.name || 'Restaurante',
      data: analyticsData,
    };
  });

  // Aggregate data - using mock data for demonstration
  const totalMetrics = allAnalytics.reduce((acc, restaurant) => {
    if (!restaurant.data) return acc;
    
    // Using available properties from AnalyticsData
    const mockRevenue = Math.random() * 50000 + 10000;
    const mockOrders = Math.floor(Math.random() * 100 + 20);
    const mockConversions = Math.random() * 30 + 5;
    
    return {
      totalRevenue: acc.totalRevenue + mockRevenue,
      totalOrders: acc.totalOrders + mockOrders,
      totalConversations: acc.totalConversations + mockConversions,
      avgConversionRate: acc.avgConversionRate + (Math.random() * 20 + 10),
      avgSatisfactionScore: acc.avgSatisfactionScore + (Math.random() * 2 + 3),
      activeAgents: acc.activeAgents + 1,
    };
  }, {
    totalRevenue: 0,
    totalOrders: 0,
    totalConversations: 0,
    avgConversionRate: 0,
    avgSatisfactionScore: 0,
    activeAgents: 0,
  });

  const restaurantCount = filters.selectedRestaurants.length;
  if (restaurantCount > 0) {
    totalMetrics.avgConversionRate = totalMetrics.avgConversionRate / restaurantCount;
    totalMetrics.avgSatisfactionScore = totalMetrics.avgSatisfactionScore / restaurantCount;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Mock chart data for demonstration
  const revenueData = allAnalytics.map(restaurant => ({
    name: restaurant.restaurantName,
    revenue: Math.random() * 50000 + 10000,
    orders: Math.floor(Math.random() * 100 + 20),
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
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalMetrics.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {restaurantCount} restaurante{restaurantCount !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalMetrics.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      Média de {Math.round(totalMetrics.totalOrders / Math.max(restaurantCount, 1))} por restaurante
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalMetrics.totalConversations}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalMetrics.activeAgents} agentes ativos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(totalMetrics.avgConversionRate)}</div>
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
                    <div className="text-2xl font-bold">{totalMetrics.avgSatisfactionScore.toFixed(1)}/5</div>
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
                      {formatCurrency(totalMetrics.totalOrders > 0 ? totalMetrics.totalRevenue / totalMetrics.totalOrders : 0)}
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
                        {allAnalytics.map((restaurant) => {
                          const mockRevenue = Math.random() * 50000 + 10000;
                          const mockOrders = Math.floor(Math.random() * 100 + 20);
                          const mockConversion = Math.random() * 20 + 10;
                          const mockSatisfaction = Math.random() * 2 + 3;
                          
                          return (
                            <tr key={restaurant.restaurantId} className="border-b">
                              <td className="py-2 font-medium">{restaurant.restaurantName}</td>
                              <td className="text-right py-2">
                                {formatCurrency(mockRevenue)}
                              </td>
                              <td className="text-right py-2">
                                {mockOrders}
                              </td>
                              <td className="text-right py-2">
                                {formatCurrency(mockRevenue / mockOrders)}
                              </td>
                              <td className="text-right py-2">
                                {formatPercentage(mockConversion)}
                              </td>
                              <td className="text-right py-2">
                                {mockSatisfaction.toFixed(1)}/5
                              </td>
                            </tr>
                          );
                        })}
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