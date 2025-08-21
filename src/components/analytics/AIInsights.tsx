import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusinessIntelligence, AIInsight } from '@/hooks/useBusinessIntelligence';
import { 
  Brain,
  TrendingUp,
  DollarSign,
  Users,
  ChefHat,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface AIInsightsProps {
  restaurantId: string;
  insights: AIInsight[];
}

export function AIInsights({ restaurantId, insights }: AIInsightsProps) {
  const { generateInsights, priceRecommendations, applyPriceRecommendation } = useBusinessIntelligence(restaurantId);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pricing':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'menu':
        return <ChefHat className="h-5 w-5 text-orange-500" />;
      case 'demand':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'customer':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getInsightTypeLabel = (type: string) => {
    switch (type) {
      case 'pricing':
        return 'Preços';
      case 'menu':
        return 'Cardápio';
      case 'demand':
        return 'Demanda';
      case 'customer':
        return 'Clientes';
      default:
        return type;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Alto Impacto</Badge>;
    if (score >= 60) return <Badge variant="outline">Médio Impacto</Badge>;
    return <Badge variant="secondary">Baixo Impacto</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Mock insights for demo - in real implementation, these would come from AI analysis
  const mockInsights = [
    {
      id: '1',
      insight_type: 'pricing',
      insight_data: {
        title: 'Oportunidade de Aumento de Preço',
        description: 'Pizza Margherita pode ter preço aumentado em 15% baseado na demanda',
        action: 'Aumentar de R$ 35,00 para R$ 40,25',
        impact: 'Aumento estimado de 12% na receita'
      },
      confidence_score: 85,
      impact_score: 78,
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      insight_type: 'menu',
      insight_data: {
        title: 'Novo Item Sugerido',
        description: 'Clientes frequentemente perguntam sobre opções veganas',
        action: 'Adicionar Pizza Vegana ao cardápio',
        impact: 'Potencial de atrair 15% mais clientes'
      },
      confidence_score: 72,
      impact_score: 65,
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      insight_type: 'demand',
      insight_data: {
        title: 'Pico de Demanda Detectado',
        description: 'Sextas-feiras às 19h têm 40% mais pedidos',
        action: 'Aumentar equipe e estoque nas sextas',
        impact: 'Redução de 25% no tempo de entrega'
      },
      confidence_score: 92,
      impact_score: 88,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  const allInsights = [...insights, ...mockInsights];
  const pricingInsights = allInsights.filter(i => i.insight_type === 'pricing');
  const menuInsights = allInsights.filter(i => i.insight_type === 'menu');
  const demandInsights = allInsights.filter(i => i.insight_type === 'demand');
  const customerInsights = allInsights.filter(i => i.insight_type === 'customer');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Insights de IA</h3>
          <p className="text-muted-foreground">
            Recomendações inteligentes para otimizar seu negócio
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => generateInsights('pricing')} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar Insights
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Insights Pendentes</p>
                <h3 className="text-2xl font-bold">{allInsights.filter(i => i.status === 'pending').length}</h3>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alto Impacto</p>
                <h3 className="text-2xl font-bold">{allInsights.filter(i => i.impact_score >= 80).length}</h3>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confiança Média</p>
                <h3 className="text-2xl font-bold">
                  {(allInsights.reduce((acc, i) => acc + i.confidence_score, 0) / allInsights.length).toFixed(1)}%
                </h3>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Implementados</p>
                <h3 className="text-2xl font-bold">{allInsights.filter(i => i.status === 'applied').length}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pricing">Preços</TabsTrigger>
          <TabsTrigger value="menu">Cardápio</TabsTrigger>
          <TabsTrigger value="demand">Demanda</TabsTrigger>
          <TabsTrigger value="customer">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {allInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getInsightIcon(insight.insight_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{insight.insight_data.title}</h4>
                          <Badge variant="outline">{getInsightTypeLabel(insight.insight_type)}</Badge>
                          {getImpactBadge(insight.impact_score)}
                        </div>
                        <p className="text-muted-foreground mb-3">{insight.insight_data.description}</p>
                        <div className="bg-muted p-3 rounded-lg mb-3">
                          <p className="font-medium mb-1">Ação Recomendada:</p>
                          <p className="text-sm">{insight.insight_data.action}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="font-medium mb-1 text-green-800">Impacto Esperado:</p>
                          <p className="text-sm text-green-700">{insight.insight_data.impact}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Confiança</p>
                        <div className="flex items-center gap-2">
                          <Progress value={insight.confidence_score} className="w-20 h-2" />
                          <span className={`text-sm font-bold ${getConfidenceColor(insight.confidence_score)}`}>
                            {insight.confidence_score}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button size="sm" className="w-full">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aplicar
                        </Button>
                        <Button size="sm" variant="outline" className="w-full">
                          Mais Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-4">
              {priceRecommendations.map((recommendation) => (
                <Card key={recommendation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{recommendation.product_name}</h4>
                          <Badge variant="outline">Recomendação de Preço</Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{recommendation.reason}</p>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Preço Atual</p>
                            <p className="text-lg font-bold">{formatCurrency(recommendation.current_price)}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1 text-green-800">Preço Sugerido</p>
                            <p className="text-lg font-bold text-green-700">
                              {formatCurrency(recommendation.recommended_price)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-1">Confiança</p>
                          <div className="flex items-center gap-2">
                            <Progress value={recommendation.confidence_level} className="w-20 h-2" />
                            <span className={`text-sm font-bold ${getConfidenceColor(recommendation.confidence_level)}`}>
                              {recommendation.confidence_level}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => applyPriceRecommendation(recommendation.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aplicar Preço
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            Testar A/B
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {pricingInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{insight.insight_data.title}</h4>
                        <p className="text-muted-foreground mb-3">{insight.insight_data.description}</p>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="font-medium mb-1">Ação:</p>
                          <p className="text-sm">{insight.insight_data.action}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aplicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <div className="grid gap-4">
            {menuInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <ChefHat className="h-5 w-5 text-orange-500" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{insight.insight_data.title}</h4>
                        <p className="text-muted-foreground mb-3">{insight.insight_data.description}</p>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="font-medium mb-1">Ação:</p>
                          <p className="text-sm">{insight.insight_data.action}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Implementar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <div className="grid gap-4">
            {demandInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{insight.insight_data.title}</h4>
                        <p className="text-muted-foreground mb-3">{insight.insight_data.description}</p>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="font-medium mb-1">Ação:</p>
                          <p className="text-sm">{insight.insight_data.action}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aplicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <div className="grid gap-4">
            {customerInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{insight.insight_data.title}</h4>
                        <p className="text-muted-foreground mb-3">{insight.insight_data.description}</p>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="font-medium mb-1">Ação:</p>
                          <p className="text-sm">{insight.insight_data.action}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Implementar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}