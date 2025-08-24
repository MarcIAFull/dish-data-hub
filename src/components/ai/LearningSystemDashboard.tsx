import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Target,
  CheckCircle,
  XCircle,
  BarChart3,
  Lightbulb,
  Star,
  AlertCircle
} from 'lucide-react';

interface LearningInteraction {
  id: string;
  interaction_type: string;
  user_message: string;
  ai_response: string;
  user_feedback_score?: number;
  sentiment_score?: number;
  intent_detected?: string;
  successful_outcome?: boolean;
  learning_tags: any;
  created_at: string;
  context_data: any;
}

interface LearningPattern {
  id: string;
  pattern_type: string;
  pattern_data: any;
  frequency_count: number;
  success_rate?: number;
  confidence_level?: number;
  auto_response_enabled: boolean;
  suggested_improvement?: string;
  last_occurrence: string;
}

interface LearningSystemDashboardProps {
  restaurantId: string;
}

export const LearningSystemDashboard: React.FC<LearningSystemDashboardProps> = ({ 
  restaurantId 
}) => {
  const [interactions, setInteractions] = useState<LearningInteraction[]>([]);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningData();
  }, [restaurantId]);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      
      const [interactionsRes, patternsRes] = await Promise.all([
        supabase
          .from('ai_learning_interactions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(50),
          
        supabase
          .from('ai_learning_patterns')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('frequency_count', { ascending: false })
      ]);

      if (interactionsRes.error) throw interactionsRes.error;
      if (patternsRes.error) throw patternsRes.error;

      setInteractions(interactionsRes.data || []);
      setPatterns(patternsRes.data || []);
    } catch (error) {
      console.error('Error fetching learning data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de aprendizado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInteractionStats = () => {
    const total = interactions.length;
    if (total === 0) return { successRate: 0, avgSentiment: 0, byType: {} };

    const successful = interactions.filter(i => i.successful_outcome).length;
    const avgSentiment = interactions
      .filter(i => i.sentiment_score !== null)
      .reduce((sum, i) => sum + (i.sentiment_score || 0), 0) / 
      interactions.filter(i => i.sentiment_score !== null).length || 0;

    const byType = interactions.reduce((acc, i) => {
      acc[i.interaction_type] = (acc[i.interaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      successRate: (successful / total) * 100,
      avgSentiment,
      byType
    };
  };

  const toggleAutoResponse = async (patternId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_learning_patterns')
        .update({ 
          auto_response_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', patternId);

      if (error) throw error;

      await fetchLearningData();
      
      toast({
        title: enabled ? "Auto-resposta ativada" : "Auto-resposta desativada",
        description: enabled ? 
          "A IA usará este padrão para respostas automáticas" : 
          "A IA não usará mais este padrão automaticamente",
      });
    } catch (error) {
      console.error('Error toggling auto response:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração",
        variant: "destructive",
      });
    }
  };

  const stats = getInteractionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Analisando aprendizado da IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sistema de Aprendizado da IA
          </CardTitle>
          <CardDescription>
            Como sua IA está aprendendo e melhorando com cada interação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="patterns">Padrões</TabsTrigger>
              <TabsTrigger value="interactions">Interações</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {stats.successRate.toFixed(1)}%
                    </p>
                    <Progress value={stats.successRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Interações</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-500">
                      {interactions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total registradas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Padrões</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-500">
                      {patterns.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Identificados
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Tipos de Interação</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {type === 'order' ? 'Pedidos' :
                           type === 'question' ? 'Perguntas' :
                           type === 'complaint' ? 'Reclamações' :
                           type === 'compliment' ? 'Elogios' : type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <Progress 
                            value={(count / interactions.length) * 100} 
                            className="w-20 h-2" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              <div className="space-y-3">
                {patterns.map((pattern) => (
                  <Card key={pattern.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {pattern.pattern_type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary">
                              {pattern.frequency_count} ocorrências
                            </Badge>
                            {pattern.success_rate && (
                              <Badge variant="default">
                                {(pattern.success_rate * 100).toFixed(0)}% sucesso
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>Dados do Padrão:</strong> {JSON.stringify(pattern.pattern_data)}
                          </div>
                          
                          {pattern.suggested_improvement && (
                            <div className="flex items-start gap-2 text-sm">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <span>{pattern.suggested_improvement}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`auto-${pattern.id}`}
                              checked={pattern.auto_response_enabled}
                              onCheckedChange={(checked) => toggleAutoResponse(pattern.id, checked)}
                            />
                            <Label htmlFor={`auto-${pattern.id}`} className="text-sm">
                              Auto-resposta
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {patterns.length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ainda Aprendendo</h3>
                    <p className="text-muted-foreground">
                      A IA precisa de mais interações para identificar padrões
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <div className="space-y-3">
                {interactions.slice(0, 15).map((interaction) => (
                  <Card key={interaction.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {interaction.interaction_type === 'order' ? 'Pedido' :
                             interaction.interaction_type === 'question' ? 'Pergunta' :
                             interaction.interaction_type === 'complaint' ? 'Reclamação' :
                             interaction.interaction_type === 'compliment' ? 'Elogio' : interaction.interaction_type}
                          </Badge>
                          
                          {interaction.successful_outcome === true && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {interaction.successful_outcome === false && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          
                          {interaction.user_feedback_score && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs">{interaction.user_feedback_score}/5</span>
                            </div>
                          )}
                        </div>
                        
                        <span className="text-xs text-muted-foreground">
                          {new Date(interaction.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Cliente:</strong> {interaction.user_message}
                        </div>
                        <div>
                          <strong>IA:</strong> {interaction.ai_response}
                        </div>
                      </div>
                      
                      {interaction.learning_tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {interaction.learning_tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Melhoria Contínua
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>• A IA aprende com cada interação registrada</p>
                      <p>• Padrões são identificados automaticamente</p>
                      <p>• Auto-respostas melhoram com o tempo</p>
                      <p>• Feedback dos clientes refina o aprendizado</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Próximos Passos
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>• Coletar mais feedback dos clientes</p>
                      <p>• Ativar auto-respostas para padrões confiáveis</p>
                      <p>• Monitorar taxa de sucesso regularmente</p>
                      <p>• Implementar melhorias sugeridas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};