import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Euro, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Clock,
  Download,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useOrders } from '@/hooks/useOrders';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalesReportsProps {
  restaurantId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--green))', 'hsl(var(--orange))'];

export const SalesReports: React.FC<SalesReportsProps> = ({
  restaurantId
}) => {
  const { analyticsData, loading: analyticsLoading } = useAnalytics(restaurantId);
  const { orders, loading: ordersLoading } = useOrders(restaurantId);
  const [reportPeriod, setReportPeriod] = useState('7d');

  const loading = analyticsLoading || ordersLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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

  // Calculate report data
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Calculate period comparison
  const periodDays = reportPeriod === '7d' ? 7 : reportPeriod === '30d' ? 30 : 90;
  const currentPeriodStart = subDays(new Date(), periodDays);
  const previousPeriodStart = subDays(currentPeriodStart, periodDays);
  
  const currentPeriodOrders = orders?.filter(order => 
    new Date(order.created_at) >= currentPeriodStart
  ) || [];
  
  const previousPeriodOrders = orders?.filter(order => 
    new Date(order.created_at) >= previousPeriodStart && 
    new Date(order.created_at) < currentPeriodStart
  ) || [];

  const currentRevenue = currentPeriodOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + Number(order.total), 0);
  
  const revenueGrowth = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  const ordersGrowth = previousPeriodOrders.length > 0 
    ? ((currentPeriodOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length) * 100 
    : 0;

  // Prepare daily sales data
  const dailySalesData = Array.from({ length: periodDays }, (_, i) => {
    const date = subDays(new Date(), periodDays - 1 - i);
    const dayOrders = orders?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
    }) || [];
    
    return {
      date: format(date, 'dd/MM', { locale: ptBR }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
      avgOrder: dayOrders.length > 0 
        ? dayOrders.reduce((sum, order) => sum + Number(order.total), 0) / dayOrders.length 
        : 0
    };
  });

  // Order status distribution
  const statusData = orders?.reduce((acc: any, order) => {
    const status = order.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status === 'pending' ? 'Pendente' :
          status === 'confirmed' ? 'Confirmado' :
          status === 'preparing' ? 'Preparando' :
          status === 'ready' ? 'Pronto' :
          status === 'delivered' ? 'Entregue' :
          status === 'cancelled' ? 'Cancelado' : status,
    value: count,
    status
  }));

  // Payment method distribution
  const paymentData = orders?.reduce((acc: any, order) => {
    const method = order.payment_method || 'cash';
    acc[method] = (acc[method] || 0) + Number(order.total);
    return acc;
  }, {}) || {};

  const paymentChartData = Object.entries(paymentData).map(([method, total]) => ({
    name: method === 'cash' ? 'Dinheiro' :
          method === 'pix' ? 'PIX' :
          method === 'card' ? 'Cartão' :
          method === 'credit' ? 'Crédito' : method,
    value: total,
    method
  }));

  // Top selling times
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourOrders = orders?.filter(order => 
      new Date(order.created_at).getHours() === hour
    ) || [];
    
    return {
      hour: `${hour}h`,
      orders: hourOrders.length,
      revenue: hourOrders.reduce((sum, order) => sum + Number(order.total), 0)
    };
  });

  const exportReport = () => {
    // Mock export functionality
    console.log('Exporting report...', { reportPeriod, totalOrders, totalRevenue });
    // In a real implementation, this would generate and download a PDF/Excel file
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Vendas</h2>
          <p className="text-muted-foreground">
            Análise completa de performance financeira e operacional
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Revenue Total
                </p>
                <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className={`h-4 w-4 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Euro className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Pedidos
                </p>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className={`h-4 w-4 ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(ordersGrowth).toFixed(1)}%
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
                  Ticket Médio
                </p>
                <p className="text-2xl font-bold">€{avgOrderValue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Por pedido
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pedidos/Dia
                </p>
                <p className="text-2xl font-bold">{(totalOrders / periodDays).toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">
                  Média do período
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendência de Vendas
          </CardTitle>
          <CardDescription>
            Revenue e pedidos dos últimos {periodDays} dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `€${Number(value).toFixed(2)}` : value,
                    name === 'revenue' ? 'Revenue' : 'Pedidos'
                  ]}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Status dos Pedidos
            </CardTitle>
            <CardDescription>
              Distribuição por fase do pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {statusChartData.map((item, index) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Métodos de Pagamento
            </CardTitle>
            <CardDescription>
              Revenue por forma de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Performance por Horário
          </CardTitle>
          <CardDescription>
            Picos de vendas ao longo do dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `€${Number(value).toFixed(2)}` : value,
                    name === 'revenue' ? 'Revenue' : 'Pedidos'
                  ]}
                />
                <Bar yAxisId="left" dataKey="orders" fill="hsl(var(--green))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Insights de Negócio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold">
                {hourlyData.reduce((max, curr) => curr.orders > max.orders ? curr : max, hourlyData[0])?.hour}
              </p>
              <p className="text-sm text-muted-foreground">Horário de Pico</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Euro className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-lg font-bold">
                {paymentChartData.reduce((max, curr) => Number(curr.value) > Number(max.value) ? curr : max, paymentChartData[0])?.name}
              </p>
              <p className="text-sm text-muted-foreground">Método Mais Usado</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-lg font-bold">
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Crescimento vs Período Anterior</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};