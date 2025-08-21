import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ProductPerformance } from '@/hooks/useBusinessIntelligence';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Star,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle
} from 'lucide-react';

interface ProductAnalyticsProps {
  restaurantId: string;
  productPerformance: ProductPerformance[];
}

export function ProductAnalytics({ restaurantId, productPerformance }: ProductAnalyticsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const topProducts = productPerformance.slice(0, 10);
  const lowPerformingProducts = productPerformance
    .filter(p => p.trend_direction === 'decreasing')
    .slice(0, 5);

  // Mock data for charts
  const categoryPerformance = [
    { category: 'Pizzas', revenue: 25000, orders: 180, margin: 65 },
    { category: 'Bebidas', revenue: 8000, orders: 220, margin: 80 },
    { category: 'Sobremesas', revenue: 5500, orders: 95, margin: 70 },
    { category: 'Entradas', revenue: 4200, orders: 68, margin: 55 },
    { category: 'Pratos', revenue: 15000, orders: 125, margin: 60 },
  ];

  const priceVsPerformance = productPerformance.map(product => ({
    name: product.product_name.substring(0, 15) + '...',
    price: (product.revenue / product.units_sold) || 0,
    performance: product.units_sold,
    margin: product.profit_margin
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos Ativos</p>
                <h3 className="text-2xl font-bold">{productPerformance.length}</h3>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produto Mais Vendido</p>
                <h3 className="text-lg font-bold truncate">
                  {topProducts[0]?.product_name || 'N/A'}
                </h3>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maior Margem</p>
                <h3 className="text-2xl font-bold">
                  {Math.max(...productPerformance.map(p => p.profit_margin)).toFixed(1)}%
                </h3>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos em Queda</p>
                <h3 className="text-2xl font-bold">{lowPerformingProducts.length}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance por Categoria</CardTitle>
            <CardDescription>
              Receita e margem por categoria de produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Receita",
                  color: "hsl(var(--primary))",
                },
                margin: {
                  label: "Margem %",
                  color: "hsl(var(--secondary))",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preço vs Performance</CardTitle>
            <CardDescription>
              Relação entre preço e volume de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                performance: {
                  label: "Performance",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={priceVsPerformance.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="price" 
                    name="Preço"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis dataKey="performance" name="Vendas" />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [
                      name === 'price' ? formatCurrency(Number(value)) : value,
                      name === 'price' ? 'Preço' : 'Vendas'
                    ]}
                  />
                  <Scatter dataKey="performance" fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 10 Produtos
            </CardTitle>
            <CardDescription>
              Produtos com melhor performance de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{product.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.units_sold} vendas • {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(product.trend_direction)}
                    <span className={`text-sm ${getTrendColor(product.trend_direction)}`}>
                      {product.profit_margin.toFixed(1)}% margem
                    </span>
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
              Produtos Precisam Atenção
            </CardTitle>
            <CardDescription>
              Produtos com performance em declínio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowPerformingProducts.length > 0 ? (
                lowPerformingProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.units_sold} vendas • {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Em queda</Badge>
                      <Button size="sm" variant="outline">
                        Analisar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Todos os produtos estão com performance estável!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}