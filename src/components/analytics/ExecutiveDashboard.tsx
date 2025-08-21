import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign,
  BarChart3,
  Brain,
  Target,
  RefreshCw
} from 'lucide-react';
import { BusinessMetrics as BusinessMetricsComponent } from './BusinessMetrics';
import { ProductAnalytics } from './ProductAnalytics';
import { CustomerBehavior } from './CustomerBehavior';
import { AIInsights } from './AIInsights';
import { FinancialReports } from './FinancialReports';
import { PriceOptimizer } from './PriceOptimizer';
import { DemandForecasting } from './DemandForecasting';

interface ExecutiveDashboardProps {
  restaurantId: string;
}

export function ExecutiveDashboard({ restaurantId }: ExecutiveDashboardProps) {
  const {
    businessMetrics,
    productPerformance,
    customerSegments,
    aiInsights,
    loading,
    timeframe,
    setTimeframe,
    refreshData
  } = useBusinessIntelligence(restaurantId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h2>
          <p className="text-muted-foreground">
            Visão estratégica completa do seu negócio
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {businessMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(businessMetrics.totalRevenue)}</h3>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(businessMetrics.revenueGrowth)}
                <span className={`text-sm ml-1 ${businessMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(businessMetrics.revenueGrowth)} vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                  <h3 className="text-2xl font-bold">{businessMetrics.totalOrders.toLocaleString()}</h3>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(businessMetrics.orderGrowth)}
                <span className={`text-sm ml-1 ${businessMetrics.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(businessMetrics.orderGrowth)} vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(businessMetrics.avgOrderValue)}</h3>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center mt-2">
                <Badge variant="outline" className="text-xs">
                  Otimização disponível
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clientes Únicos</p>
                  <h3 className="text-2xl font-bold">{businessMetrics.uniqueCustomers.toLocaleString()}</h3>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(businessMetrics.customerGrowth)}
                <span className={`text-sm ml-1 ${businessMetrics.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(businessMetrics.customerGrowth)} vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Insights IA
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Preços
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Previsão
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <BusinessMetricsComponent restaurantId={restaurantId} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductAnalytics 
            restaurantId={restaurantId} 
            productPerformance={productPerformance}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomerBehavior 
            restaurantId={restaurantId} 
            customerSegments={customerSegments}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AIInsights 
            restaurantId={restaurantId} 
            insights={aiInsights}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <PriceOptimizer restaurantId={restaurantId} />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <DemandForecasting restaurantId={restaurantId} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialReports restaurantId={restaurantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}