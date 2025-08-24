import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Save, 
  Plus, 
  Settings, 
  MessageSquare, 
  Brain, 
  Smartphone, 
  BarChart3,
  Zap,
  Globe
} from 'lucide-react';

interface Agent {
  id?: string;
  restaurant_id: string;
  name: string;
  personality: string;
  instructions: string;
  is_active: boolean;
  fallback_enabled: boolean;
  fallback_timeout_minutes: number;
  // AI Configuration
  ai_model: string;
  temperature: number;
  max_tokens: number;
  context_memory_turns: number;
  language: string;
  response_style: string;
  knowledge_cutoff: string;
  custom_tools: any;
  performance_metrics: any;
  // WhatsApp Integration
  whatsapp_number?: string;
  evolution_api_token?: string;
  evolution_api_instance?: string;
  webhook_url?: string;
  // Advanced AI Features
  enable_sentiment_analysis: boolean;
  enable_conversation_summary: boolean;
  enable_order_intent_detection: boolean;
  enable_proactive_suggestions: boolean;
  enable_multilingual_support: boolean;
}

interface EnhancedAgentConfigurationProps {
  restaurantId: string;
}

export const EnhancedAgentConfiguration: React.FC<EnhancedAgentConfigurationProps> = ({ 
  restaurantId 
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultAgent: Omit<Agent, 'id'> = {
    restaurant_id: restaurantId,
    name: 'Assistente IA Avançado',
    personality: 'Você é um assistente virtual inteligente e especializado neste restaurante. Seja sempre educado, prestativo e natural. Use emojis de forma apropriada e mantenha um tom amigável e profissional. Adapte seu estilo à personalidade do cliente.',
    instructions: 'Analise o contexto da conversa e forneça respostas personalizadas. Detecte intenções de pedido, analise sentimentos e ofereça sugestões proativas quando apropriado. Mantenha um histórico da conversa para personalizar a experiência.',
    is_active: true,
    fallback_enabled: true,
    fallback_timeout_minutes: 5,
    // AI Configuration
    ai_model: 'gpt-5-2025-08-07',
    temperature: 0.7,
    max_tokens: 500,
    context_memory_turns: 10,
    language: 'pt-BR',
    response_style: 'friendly',
    knowledge_cutoff: '2024-12-01',
    custom_tools: {},
    performance_metrics: {},
    // WhatsApp Integration
    whatsapp_number: '',
    evolution_api_token: '',
    evolution_api_instance: '',
    webhook_url: '',
    // Advanced AI Features
    enable_sentiment_analysis: true,
    enable_conversation_summary: true,
    enable_order_intent_detection: true,
    enable_proactive_suggestions: false,
    enable_multilingual_support: false
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAgents(data || []);
      
      if (data && data.length > 0) {
        setSelectedAgent(data[0]);
      } else {
        setSelectedAgent({ ...defaultAgent } as Agent);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAgent = async () => {
    if (!selectedAgent) return;

    try {
      setSaving(true);
      
      if (selectedAgent.id) {
        const { error } = await supabase
          .from('agents')
          .update({
            ...selectedAgent,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedAgent.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('agents')
          .insert([selectedAgent])
          .select()
          .single();

        if (error) throw error;
        setSelectedAgent(data);
      }

      await fetchAgents();
      
      toast({
        title: "Agente IA salvo",
        description: "Configurações avançadas foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Error saving agent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o agente",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const createNewAgent = () => {
    setSelectedAgent({ ...defaultAgent } as Agent);
  };

  useEffect(() => {
    fetchAgents();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando IA avançada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Agents List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Agentes IA
            </CardTitle>
            <CardDescription>
              {agents.length} agente(s) inteligente(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{agent.name}</span>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                      {agent.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {agent.ai_model} • {agent.language}
                  </p>
                </div>
              ))}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={createNewAgent}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agente IA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Agent Configuration */}
      <div className="lg:col-span-3">
        {selectedAgent ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configuração Avançada de IA
              </CardTitle>
              <CardDescription>
                Configure seu assistente virtual inteligente com recursos avançados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="ai">IA Avançada</TabsTrigger>
                  <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                  <TabsTrigger value="features">Recursos</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Agente</Label>
                      <Input
                        id="name"
                        value={selectedAgent.name}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, name: e.target.value } : null
                        )}
                        placeholder="Ex: Assistente IA do Restaurante"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={selectedAgent.is_active}
                        onCheckedChange={(checked) => setSelectedAgent(prev => 
                          prev ? { ...prev, is_active: checked } : null
                        )}
                      />
                      <Label htmlFor="is_active">Agente ativo</Label>
                    </div>

                    <div>
                      <Label htmlFor="personality">Personalidade da IA</Label>
                      <Textarea
                        id="personality"
                        value={selectedAgent.personality}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, personality: e.target.value } : null
                        )}
                        placeholder="Descreva como a IA deve se comportar e interagir..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions">Instruções Avançadas</Label>
                      <Textarea
                        id="instructions"
                        value={selectedAgent.instructions}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, instructions: e.target.value } : null
                        )}
                        placeholder="Instruções detalhadas sobre comportamentos específicos..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ai_model">Modelo de IA</Label>
                      <Select 
                        value={selectedAgent.ai_model} 
                        onValueChange={(value) => setSelectedAgent(prev => 
                          prev ? { ...prev, ai_model: value } : null
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-5-2025-08-07">GPT-5 (Mais inteligente)</SelectItem>
                          <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini (Mais rápido)</SelectItem>
                          <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Confiável)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="language">Idioma</Label>
                      <Select 
                        value={selectedAgent.language} 
                        onValueChange={(value) => setSelectedAgent(prev => 
                          prev ? { ...prev, language: value } : null
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português Brasileiro</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="temperature">Criatividade (Temperature)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedAgent.temperature}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, temperature: parseFloat(e.target.value) } : null
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_tokens">Tamanho máximo da resposta</Label>
                      <Input
                        id="max_tokens"
                        type="number"
                        min="100"
                        max="2000"
                        value={selectedAgent.max_tokens}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, max_tokens: parseInt(e.target.value) } : null
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor="context_memory">Memória de contexto (turnos)</Label>
                      <Input
                        id="context_memory"
                        type="number"
                        min="1"
                        max="50"
                        value={selectedAgent.context_memory_turns}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, context_memory_turns: parseInt(e.target.value) } : null
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor="response_style">Estilo de resposta</Label>
                      <Select 
                        value={selectedAgent.response_style} 
                        onValueChange={(value) => setSelectedAgent(prev => 
                          prev ? { ...prev, response_style: value } : null
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Amigável</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                      <Input
                        id="whatsapp_number"
                        value={selectedAgent.whatsapp_number || ''}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, whatsapp_number: e.target.value } : null
                        )}
                        placeholder="Ex: +5511999999999"
                      />
                    </div>

                    <div>
                      <Label htmlFor="evolution_api_token">Token da Evolution API</Label>
                      <Input
                        id="evolution_api_token"
                        type="password"
                        value={selectedAgent.evolution_api_token || ''}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, evolution_api_token: e.target.value } : null
                        )}
                        placeholder="Seu token da Evolution API"
                      />
                    </div>

                    <div>
                      <Label htmlFor="evolution_api_instance">Instância da Evolution API</Label>
                      <Input
                        id="evolution_api_instance"
                        value={selectedAgent.evolution_api_instance || ''}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, evolution_api_instance: e.target.value } : null
                        )}
                        placeholder="Nome da sua instância"
                      />
                    </div>

                    <div>
                      <Label htmlFor="webhook_url">URL do Webhook</Label>
                      <Input
                        id="webhook_url"
                        value={selectedAgent.webhook_url || ''}
                        onChange={(e) => setSelectedAgent(prev => 
                          prev ? { ...prev, webhook_url: e.target.value } : null
                        )}
                        placeholder="https://sua-api.com/webhook"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sentiment_analysis"
                        checked={selectedAgent.enable_sentiment_analysis}
                        onCheckedChange={(checked) => setSelectedAgent(prev => 
                          prev ? { ...prev, enable_sentiment_analysis: checked } : null
                        )}
                      />
                      <Label htmlFor="sentiment_analysis">Análise de sentimento em tempo real</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="conversation_summary"
                        checked={selectedAgent.enable_conversation_summary}
                        onCheckedChange={(checked) => setSelectedAgent(prev => 
                          prev ? { ...prev, enable_conversation_summary: checked } : null
                        )}
                      />
                      <Label htmlFor="conversation_summary">Resumo automático de conversas</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="order_intent"
                        checked={selectedAgent.enable_order_intent_detection}
                        onCheckedChange={(checked) => setSelectedAgent(prev => 
                          prev ? { ...prev, enable_order_intent_detection: checked } : null
                        )}
                      />
                      <Label htmlFor="order_intent">Detecção de intenção de pedido</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="proactive_suggestions"
                        checked={selectedAgent.enable_proactive_suggestions}
                        onCheckedChange={(checked) => setSelectedAgent(prev => 
                          prev ? { ...prev, enable_proactive_suggestions: checked } : null
                        )}
                      />
                      <Label htmlFor="proactive_suggestions">Sugestões proativas</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="multilingual"
                        checked={selectedAgent.enable_multilingual_support}
                        onCheckedChange={(checked) => setSelectedAgent(prev => 
                          prev ? { ...prev, enable_multilingual_support: checked } : null
                        )}
                      />
                      <Label htmlFor="multilingual">Suporte multilíngue</Label>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="fallback_enabled"
                          checked={selectedAgent.fallback_enabled}
                          onCheckedChange={(checked) => setSelectedAgent(prev => 
                            prev ? { ...prev, fallback_enabled: checked } : null
                          )}
                        />
                        <Label htmlFor="fallback_enabled">Fallback para atendimento humano</Label>
                      </div>

                      {selectedAgent.fallback_enabled && (
                        <div>
                          <Label htmlFor="fallback_timeout">Timeout para fallback (minutos)</Label>
                          <Input
                            id="fallback_timeout"
                            type="number"
                            min="1"
                            max="60"
                            value={selectedAgent.fallback_timeout_minutes}
                            onChange={(e) => setSelectedAgent(prev => 
                              prev ? { ...prev, fallback_timeout_minutes: parseInt(e.target.value) || 5 } : null
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analytics Avançado</h3>
                    <p className="text-muted-foreground mb-4">
                      Dashboard de performance da IA será implementado na próxima fase
                    </p>
                    <Badge variant="secondary">Em breve</Badge>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="flex justify-end">
                <Button onClick={saveAgent} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Configurações IA'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <Brain className="mx-auto h-12 w-12 mb-4" />
                <p>Selecione um agente para configurar</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};