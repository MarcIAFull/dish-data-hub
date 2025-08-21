import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Brain, 
  Heart, 
  TrendingUp, 
  AlertTriangle,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  Lightbulb
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface ConversationAnalyticsProps {
  restaurantId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export const ConversationAnalytics: React.FC<ConversationAnalyticsProps> = ({
  restaurantId
}) => {
  const { insights, loading, analyzeConversation } = useAnalytics(restaurantId);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleAnalyzeConversation = async (conversationId: string) => {
    setAnalyzingId(conversationId);
    await analyzeConversation(conversationId);
    setAnalyzingId(null);
  };

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

  // Calculate aggregated metrics
  const totalInsights = insights.length;
  const avgSentiment = insights.length > 0 
    ? insights.reduce((sum, insight) => sum + (insight.sentiment_score || 0), 0) / insights.length 
    : 0;
  const avgSatisfaction = insights.length > 0 
    ? insights.reduce((sum, insight) => sum + (insight.satisfaction_score || 0), 0) / insights.length 
    : 0;
  const conversionRate = insights.length > 0 
    ? (insights.filter(insight => insight.converted_to_order).length / insights.length) * 100 
    : 0;

  // Intent distribution
  const intentData = insights.reduce((acc: any, insight) => {
    const intent = insight.intent_detected || 'unknown';
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});

  const intentChartData = Object.entries(intentData).map(([intent, count]) => ({
    name: intent === 'ordering' ? 'Pedidos' :
          intent === 'inquiry' ? 'Consultas' :
          intent === 'complaint' ? 'Reclamações' :
          intent === 'support' ? 'Suporte' : 'Outros',
    value: count,
    intent
  }));

  // Top keywords from all insights
  const allTopics = insights.flatMap(insight => insight.key_topics || []);
  const topicFrequency = allTopics.reduce((acc: any, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  
  const topKeywords = Object.entries(topicFrequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  // Sentiment distribution
  const sentimentRanges = {
    positive: insights.filter(i => (i.sentiment_score || 0) > 0.3).length,
    neutral: insights.filter(i => (i.sentiment_score || 0) >= -0.3 && (i.sentiment_score || 0) <= 0.3).length,
    negative: insights.filter(i => (i.sentiment_score || 0) < -0.3).length
  };

  const sentimentData = [
    { name: 'Positivo', value: sentimentRanges.positive, color: 'hsl(var(--green))' },
    { name: 'Neutro', value: sentimentRanges.neutral, color: 'hsl(var(--muted))' },
    { name: 'Negativo', value: sentimentRanges.negative, color: 'hsl(var(--destructive))' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Análise de Conversas</h2>
        <p className="text-muted-foreground">
          Insights de IA sobre sentimentos, temas e otimizações
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conversas Analisadas
                </p>
                <p className="text-2xl font-bold">{totalInsights}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sentimento Médio
                </p>
                <p className="text-2xl font-bold">
                  {avgSentiment > 0.3 ? '😊' : avgSentiment < -0.3 ? '😞' : '😐'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {avgSentiment.toFixed(2)}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Satisfação Média
                </p>
                <p className="text-2xl font-bold">{(avgSatisfaction * 100).toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={avgSatisfaction * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Taxa de Conversão
                </p>
                <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={conversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Intenções dos Clientes
            </CardTitle>
            <CardDescription>
              Principais motivos de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {intentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {intentChartData.map((item, index) => (
                <div key={item.intent} className="flex items-center gap-2">
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

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Análise de Sentimento
            </CardTitle>
            <CardDescription>
              Distribuição emocional das conversas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keywords and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Palavras-chave Populares
            </CardTitle>
            <CardDescription>
              Temas mais mencionados pelos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {topKeywords.map((keyword, index) => (
                  <div key={keyword.topic} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="font-medium">{keyword.topic}</span>
                    <Badge variant="secondary">{keyword.count}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Optimization Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Sugestões de Otimização
            </CardTitle>
            <CardDescription>
              Melhorias baseadas na análise das conversas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentimentRanges.negative > 0 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-50 dark:bg-red-950/20">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Atenção aos Sentimentos Negativos
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {sentimentRanges.negative} conversas com sentimento negativo foram detectadas.
                    </p>
                  </div>
                </div>
              )}

              {avgSatisfaction < 0.7 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Melhorar Satisfação
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      A satisfação média está abaixo de 70%. Revisar respostas do bot.
                    </p>
                  </div>
                </div>
              )}

              {conversionRate < 30 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Otimizar Conversão
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Taxa de conversão abaixo de 30%. Melhorar abordagem de vendas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Recentes</CardTitle>
          <CardDescription>
            Últimas análises de conversas processadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {insights.slice(0, 10).map((insight) => (
                <div key={insight.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={insight.converted_to_order ? 'default' : 'outline'}>
                        {insight.converted_to_order ? 'Convertido' : 'Não convertido'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {insight.intent_detected}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span>Sentimento: {(insight.sentiment_score || 0).toFixed(2)}</span>
                      <span>Satisfação: {((insight.satisfaction_score || 0) * 100).toFixed(0)}%</span>
                      {insight.resolution_time_minutes && (
                        <span>Tempo: {insight.resolution_time_minutes}min</span>
                      )}
                    </div>
                    
                    {insight.key_topics && insight.key_topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {insight.key_topics.slice(0, 3).map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalyzeConversation(insight.conversation_id)}
                    disabled={analyzingId === insight.conversation_id}
                  >
                    {analyzingId === insight.conversation_id ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};