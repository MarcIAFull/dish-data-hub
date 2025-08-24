import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Info
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
  // WhatsApp Integration
  whatsapp_number?: string;
  evolution_api_token?: string;
  evolution_api_instance?: string;
  webhook_url?: string;
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
    // WhatsApp Integration
    whatsapp_number: '',
    evolution_api_token: '',
    evolution_api_instance: '',
    webhook_url: ''
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
            name: selectedAgent.name,
            personality: selectedAgent.personality,
            instructions: selectedAgent.instructions,
            is_active: selectedAgent.is_active,
            fallback_enabled: selectedAgent.fallback_enabled,
            fallback_timeout_minutes: selectedAgent.fallback_timeout_minutes,
            whatsapp_number: selectedAgent.whatsapp_number,
            evolution_api_token: selectedAgent.evolution_api_token,
            evolution_api_instance: selectedAgent.evolution_api_instance,
            webhook_url: selectedAgent.webhook_url,
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
                    Configuração de IA do restaurante
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                  <TabsTrigger value="fallback">Fallback</TabsTrigger>
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

                    {/* AI Configuration Info */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-blue-700 dark:text-blue-300">Configuração de IA</h4>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        As configurações técnicas da IA (modelo, temperatura, tokens, etc.) são gerenciadas nas configurações do restaurante. Este agente herda essas configurações e adiciona personalidade única.
                      </p>
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
                        placeholder="https://seu-webhook.com/whatsapp"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fallback" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="fallback_enabled"
                        checked={selectedAgent.fallback_enabled}
                        onCheckedChange={(checked) => setSelectedAgent(prev => 
                          prev ? { ...prev, fallback_enabled: checked } : null
                        )}
                      />
                      <Label htmlFor="fallback_enabled">Ativar fallback para atendimento humano</Label>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Tempo em minutos após o qual o atendimento será transferido para um humano se não houver resposta
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={saveAgent} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Selecione um agente para configurar</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};