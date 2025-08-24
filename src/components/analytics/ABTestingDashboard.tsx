import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  Play, 
  Pause,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Clock,
  Star,
  Plus,
  BarChart3,
  Award
} from 'lucide-react';

interface ABTestResult {
  variant_id: string;
  variant_name: string;
  response_template: string;
  traffic_percentage: number;
  total_interactions: number;
  conversions: number;
  conversion_rate: number;
  avg_satisfaction: number;
  avg_duration: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
}

interface ABTestData {
  testName: string;
  results: ABTestResult[];
  significance: {
    significant: boolean;
    confidence: number;
    winner?: string;
    message: string;
  } | null;
}

interface ABTestingDashboardProps {
  restaurantId: string;
  agentId: string;
}

export const ABTestingDashboard: React.FC<ABTestingDashboardProps> = ({ 
  restaurantId, 
  agentId 
}) => {
  const [tests, setTests] = useState<ABTestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    variants: [
      { name: 'Controle', template: '', trafficPercentage: 50 },
      { name: 'Variante A', template: '', trafficPercentage: 50 }
    ]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveTests();
  }, [restaurantId, agentId]);

  const fetchActiveTests = async () => {
    try {
      setLoading(true);
      
      // Get unique test names
      const { data: testNames, error: namesError } = await supabase
        .from('ab_test_variants')
        .select('test_name')
        .eq('restaurant_id', restaurantId)
        .eq('agent_id', agentId);

      if (namesError) throw namesError;

      const uniqueTests = [...new Set(testNames?.map(t => t.test_name) || [])];
      
      // Fetch results for each test
      const testResults = await Promise.all(
        uniqueTests.map(async (testName) => {
          const response = await supabase.functions.invoke('ab-testing-manager', {
            body: {
              action: 'getTestResults',
              restaurantId,
              agentId,
              testName
            }
          });

          if (response.error) throw response.error;
          return response.data;
        })
      );

      setTests(testResults);
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar testes A/B",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createABTest = async () => {
    try {
      // Validate traffic percentages sum to 100
      const totalPercentage = newTest.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
      if (totalPercentage !== 100) {
        toast({
          title: "Erro",
          description: "As porcentagens de tráfego devem somar 100%",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('ab-testing-manager', {
        body: {
          action: 'createTest',
          restaurantId,
          agentId,
          testName: newTest.name,
          variants: newTest.variants
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: "Teste A/B criado com sucesso"
      });

      setIsCreateDialogOpen(false);
      setNewTest({
        name: '',
        variants: [
          { name: 'Controle', template: '', trafficPercentage: 50 },
          { name: 'Variante A', template: '', trafficPercentage: 50 }
        ]
      });
      fetchActiveTests();
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar teste A/B",
        variant: "destructive"
      });
    }
  };

  const endABTest = async (testName: string) => {
    try {
      const response = await supabase.functions.invoke('ab-testing-manager', {
        body: {
          action: 'endTest',
          restaurantId,
          agentId,
          testName
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: "Teste A/B finalizado"
      });

      fetchActiveTests();
    } catch (error) {
      console.error('Error ending A/B test:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar teste A/B",
        variant: "destructive"
      });
    }
  };

  const addVariant = () => {
    const newVariants = [...newTest.variants, {
      name: `Variante ${String.fromCharCode(65 + newTest.variants.length - 1)}`,
      template: '',
      trafficPercentage: 0
    }];
    
    // Redistribute traffic equally
    const equalPercentage = Math.floor(100 / newVariants.length);
    const remainder = 100 - (equalPercentage * newVariants.length);
    
    newVariants.forEach((variant, index) => {
      variant.trafficPercentage = equalPercentage + (index < remainder ? 1 : 0);
    });

    setNewTest({ ...newTest, variants: newVariants });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <TestTube className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando testes A/B...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Testes A/B de Respostas
              </CardTitle>
              <CardDescription>
                Otimize as respostas do agente através de testes A/B
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Teste
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Teste A/B</DialogTitle>
                  <DialogDescription>
                    Configure diferentes variantes de resposta para testar efetividade
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="testName">Nome do Teste</Label>
                    <Input
                      id="testName"
                      placeholder="Ex: Saudação Inicial, Resposta Produto"
                      value={newTest.name}
                      onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Variantes do Teste</Label>
                      <Button variant="outline" size="sm" onClick={addVariant}>
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Variante
                      </Button>
                    </div>
                    
                    {newTest.variants.map((variant, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <Label>Nome da Variante</Label>
                                <Input
                                  value={variant.name}
                                  onChange={(e) => {
                                    const variants = [...newTest.variants];
                                    variants[index].name = e.target.value;
                                    setNewTest({ ...newTest, variants });
                                  }}
                                />
                              </div>
                              <div className="w-32">
                                <Label>Tráfego (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={variant.trafficPercentage}
                                  onChange={(e) => {
                                    const variants = [...newTest.variants];
                                    variants[index].trafficPercentage = parseInt(e.target.value) || 0;
                                    setNewTest({ ...newTest, variants });
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Template de Resposta</Label>
                              <Textarea
                                placeholder="Digite o template de resposta para esta variante..."
                                value={variant.template}
                                onChange={(e) => {
                                  const variants = [...newTest.variants];
                                  variants[index].template = e.target.value;
                                  setNewTest({ ...newTest, variants });
                                }}
                                rows={3}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createABTest}>Criar Teste</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum teste A/B ativo</p>
              <p className="text-sm text-muted-foreground">Crie seu primeiro teste para otimizar as respostas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {tests.map((test) => (
                <Card key={test.testName}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{test.testName}</CardTitle>
                        <CardDescription>
                          {test.results.filter(r => r.is_active).length} variantes ativas
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.significance?.significant && (
                          <Badge variant="default">
                            <Award className="h-3 w-3 mr-1" />
                            Significativo ({test.significance.confidence}%)
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => endABTest(test.testName)}
                          disabled={!test.results.some(r => r.is_active)}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Finalizar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="results" className="w-full">
                      <TabsList>
                        <TabsTrigger value="results">Resultados</TabsTrigger>
                        <TabsTrigger value="details">Detalhes</TabsTrigger>
                      </TabsList>

                      <TabsContent value="results" className="space-y-4">
                        <div className="grid gap-4">
                          {test.results.map((result) => (
                            <Card key={result.variant_id} className={
                              test.significance?.winner === result.variant_name 
                                ? "border-green-500 bg-green-50" 
                                : ""
                            }>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">{result.variant_name}</h3>
                                    {test.significance?.winner === result.variant_name && (
                                      <Badge variant="default">
                                        <Award className="h-3 w-3 mr-1" />
                                        Vencedor
                                      </Badge>
                                    )}
                                    {!result.is_active && (
                                      <Badge variant="secondary">Finalizado</Badge>
                                    )}
                                  </div>
                                  <Badge variant="outline">
                                    {result.traffic_percentage}% do tráfego
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Interações</p>
                                    <p className="text-lg font-semibold">{result.total_interactions}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Conversões</p>
                                    <p className="text-lg font-semibold">{result.conversions}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                                    <p className="text-lg font-semibold">{result.conversion_rate.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Satisfação</p>
                                    <p className="text-lg font-semibold">{result.avg_satisfaction.toFixed(1)}/5</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Taxa de Conversão</span>
                                    <span>{result.conversion_rate.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={result.conversion_rate} className="h-2" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {test.significance && (
                          <Card>
                            <CardContent className="p-4">
                              <h3 className="font-medium mb-2">Análise Estatística</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Significância</p>
                                  <p className="font-medium">
                                    {test.significance.significant ? 'Significativo' : 'Não significativo'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Confiança</p>
                                  <p className="font-medium">{test.significance.confidence.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  <p className="font-medium">{test.significance.message}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        {test.results.map((result) => (
                          <Card key={result.variant_id}>
                            <CardContent className="p-4">
                              <h3 className="font-medium mb-2">{result.variant_name}</h3>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Template de Resposta:</p>
                                  <p className="text-sm bg-muted p-2 rounded">
                                    {result.response_template}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Duração Média</p>
                                    <p className="font-medium">{result.avg_duration.toFixed(1)}s</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Data de Início</p>
                                    <p className="font-medium">
                                      {new Date(result.start_date).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};