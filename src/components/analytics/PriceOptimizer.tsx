import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { 
  Target,
  TrendingUp,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Users,
  ShoppingCart
} from 'lucide-react';

interface PriceOptimizerProps {
  restaurantId: string;
}

export function PriceOptimizer({ restaurantId }: PriceOptimizerProps) {
  const { priceRecommendations, generateInsights, applyPriceRecommendation } = useBusinessIntelligence(restaurantId);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [targetMargin, setTargetMargin] = useState('');
  const [competitorPrice, setCompetitorPrice] = useState('');
  const [optimizationGoal, setOptimizationGoal] = useState('revenue');
  const [testingPeriod, setTestingPeriod] = useState('7');
  const [analyzing, setAnalyzing] = useState(false);

  // Mock products for demo
  const products = [
    { id: '1', name: 'Pizza Margherita', currentPrice: 35.00, cost: 12.00 },
    { id: '2', name: 'Pizza Pepperoni', currentPrice: 42.00, cost: 15.00 },
    { id: '3', name: 'Lasagna Bolonhesa', currentPrice: 28.00, cost: 10.00 },
    { id: '4', name: 'Refrigerante 350ml', currentPrice: 8.00, cost: 2.50 },
  ];

  // Mock optimization results
  const optimizationResults = [
    {
      id: '1',
      productName: 'Pizza Margherita',
      currentPrice: 35.00,
      optimizedPrice: 38.50,
      expectedImpact: {
        revenueChange: '+12.5%',
        demandChange: '-3.2%',
        profitChange: '+18.7%',
        competitivePosition: 'Mantém vantagem'
      },
      confidence: 87,
      strategy: 'Aumento gradual com monitoramento'
    },
    {
      id: '2',
      productName: 'Pizza Pepperoni',
      currentPrice: 42.00,
      optimizedPrice: 39.90,
      expectedImpact: {
        revenueChange: '+8.3%',
        demandChange: '+15.1%',
        profitChange: '+11.2%',
        competitivePosition: 'Melhora posição'
      },
      confidence: 92,
      strategy: 'Redução estratégica para ganhar volume'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const runOptimization = async () => {
    setAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In real implementation, would call edge function for price optimization
      await generateInsights('pricing');
    } finally {
      setAnalyzing(false);
    }
  };

  const startABTest = async (recommendation: any) => {
    // In real implementation, would start A/B test
    console.log('Starting A/B test for:', recommendation.productName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Otimização de Preços</h2>
          <p className="text-muted-foreground">
            Use IA para otimizar preços e maximizar lucros
          </p>
        </div>
        
        <Button onClick={runOptimization} disabled={analyzing}>
          <Brain className="h-4 w-4 mr-2" />
          {analyzing ? 'Analisando...' : 'Analisar Preços'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configuração da Otimização
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para otimização de preços
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Produto</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.currentPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="goal">Objetivo da Otimização</Label>
                  <Select value={optimizationGoal} onValueChange={setOptimizationGoal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Maximizar Receita</SelectItem>
                      <SelectItem value="profit">Maximizar Lucro</SelectItem>
                      <SelectItem value="volume">Aumentar Volume</SelectItem>
                      <SelectItem value="market">Ganhar Market Share</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="margin">Margem Alvo (%)</Label>
                  <Input
                    id="margin"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                    placeholder="ex: 65"
                    type="number"
                  />
                </div>

                <div>
                  <Label htmlFor="competitor">Preço Concorrente</Label>
                  <Input
                    id="competitor"
                    value={competitorPrice}
                    onChange={(e) => setCompetitorPrice(e.target.value)}
                    placeholder="ex: 40.00"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="period">Período de Teste (dias)</Label>
                <Select value={testingPeriod} onValueChange={setTestingPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">1 semana</SelectItem>
                    <SelectItem value="14">2 semanas</SelectItem>
                    <SelectItem value="30">1 mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={runOptimization} disabled={analyzing}>
                <Zap className="h-4 w-4 mr-2" />
                {analyzing ? 'Processando IA...' : 'Otimizar Preços'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resultados da Otimização
              </CardTitle>
              <CardDescription>
                Recomendações baseadas em análise de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{result.productName}</h4>
                        <p className="text-sm text-muted-foreground">{result.strategy}</p>
                      </div>
                      <Badge variant={result.confidence > 85 ? 'default' : 'outline'}>
                        {result.confidence}% confiança
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm font-medium">Preço Atual</p>
                        <p className="text-lg font-bold">{formatCurrency(result.currentPrice)}</p>
                      </div>
                      <div className="bg-primary/10 p-3 rounded">
                        <p className="text-sm font-medium">Preço Otimizado</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(result.optimizedPrice)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Receita</p>
                        <p className="font-semibold text-green-600">{result.expectedImpact.revenueChange}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Demanda</p>
                        <p className="font-semibold">{result.expectedImpact.demandChange}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Lucro</p>
                        <p className="font-semibold text-green-600">{result.expectedImpact.profitChange}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Posição</p>
                        <p className="font-semibold text-xs">{result.expectedImpact.competitivePosition}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => applyPriceRecommendation(result.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aplicar Agora
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => startABTest(result)}
                        className="flex-1"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Testar A/B
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Métricas de Preço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 border rounded">
                <p className="text-sm text-muted-foreground">Elasticidade Média</p>
                <p className="text-2xl font-bold">-1.2</p>
                <p className="text-xs text-muted-foreground">Moderadamente elástico</p>
              </div>
              
              <div className="text-center p-3 border rounded">
                <p className="text-sm text-muted-foreground">Margem Média</p>
                <p className="text-2xl font-bold">68%</p>
                <p className="text-xs text-green-600">Acima da meta</p>
              </div>

              <div className="text-center p-3 border rounded">
                <p className="text-sm text-muted-foreground">Posição vs Concorrentes</p>
                <p className="text-2xl font-bold">+15%</p>
                <p className="text-xs text-muted-foreground">Premium positioning</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Preço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-2 border rounded">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Concorrente baixou preço</p>
                  <p className="text-xs text-muted-foreground">Pizza Margherita: R$ 32,00</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 border rounded">
                <TrendingUp className="h-4 w-4 text-green-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Oportunidade de aumento</p>
                  <p className="text-xs text-muted-foreground">Refrigerantes com alta demanda</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 border rounded">
                <Clock className="h-4 w-4 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Teste A/B em andamento</p>
                  <p className="text-xs text-muted-foreground">Lasagna: 3 dias restantes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                IA em Ação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Análise de Mercado</span>
                  <span className="text-green-600">Ativa</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Monitoramento de Concorrentes</span>
                  <span className="text-green-600">Ativa</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Previsão de Demanda</span>
                  <span className="text-green-600">Ativa</span>
                </div>
                <div className="flex justify-between">
                  <span>Otimização Automática</span>
                  <span className="text-yellow-600">Aguardando</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                Configurar Automação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}