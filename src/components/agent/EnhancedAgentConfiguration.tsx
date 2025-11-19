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
  Settings, 
  MessageSquare, 
  Brain, 
  Info,
  Link2,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Copy,
  Loader2
} from 'lucide-react';

interface Agent {
  id: string;
  restaurant_id: string;
  name: string;
  personality: string;
  instructions: string;
  is_active: boolean;
  fallback_enabled: boolean;
  fallback_timeout_minutes: number;
  whatsapp_number?: string;
  evolution_api_token?: string;
  evolution_api_instance?: string;
  evolution_api_base_url?: string;
  webhook_url?: string;
  enable_order_creation?: boolean;
  enable_automatic_notifications?: boolean;
  enable_product_search?: boolean;
  order_confirmation_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface EnhancedAgentConfigurationProps {
  restaurantId: string;
}

export const EnhancedAgentConfiguration: React.FC<EnhancedAgentConfigurationProps> = ({ 
  restaurantId 
}) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultAgent: Omit<Agent, 'id' | 'created_at' | 'updated_at'> = {
    restaurant_id: restaurantId,
    name: 'Agente IA',
    personality: 'Você é um assistente virtual inteligente e especializado neste restaurante. Seja sempre educado, prestativo e natural. Use emojis de forma apropriada e mantenha um tom amigável e profissional.',
    instructions: 'Analise o contexto da conversa e forneça respostas personalizadas sobre o cardápio, pedidos e informações do restaurante.',
    is_active: true,
    fallback_enabled: true,
    fallback_timeout_minutes: 5,
    whatsapp_number: ''
  };

  const fetchAgentAndRestaurant = async () => {
    try {
      setLoading(true);
      
      // Buscar nome do restaurante
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurantName(restaurantData?.name || '');

      // Buscar agente
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (agentError) throw agentError;

      if (agentData) {
        setAgent(agentData);
      } else {
        // Auto-criar agente se não existir
        const { data: createdAgent, error: createError } = await supabase
          .from('agents')
          .insert([defaultAgent])
          .select()
          .single();

        if (createError) throw createError;
        
        setAgent(createdAgent);
        toast({
          title: "Agente criado",
          description: "Agente IA criado automaticamente para este restaurante",
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAgent = async () => {
    if (!agent) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('agents')
        .update({
          name: agent.name,
          personality: agent.personality,
          instructions: agent.instructions,
          is_active: agent.is_active,
          fallback_enabled: agent.fallback_enabled,
          fallback_timeout_minutes: agent.fallback_timeout_minutes,
          whatsapp_number: agent.whatsapp_number,
          evolution_api_token: agent.evolution_api_token,
          evolution_api_instance: agent.evolution_api_instance,
          evolution_api_base_url: agent.evolution_api_base_url,
          webhook_url: agent.webhook_url,
          enable_order_creation: agent.enable_order_creation,
          enable_automatic_notifications: agent.enable_automatic_notifications,
          enable_product_search: agent.enable_product_search,
          order_confirmation_required: agent.order_confirmation_required,
        })
        .eq('id', agent.id);

      if (error) throw error;
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do agente foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Error saving agent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchAgentAndRestaurant();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <Brain className="mx-auto h-12 w-12 mb-4" />
          <p>Erro ao carregar agente</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyWebhookUrl = () => {
    const webhookUrl = 'https://wsyddfdfzfkhkkxmrmxf.supabase.co/functions/v1/enhanced-ai-webhook';
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "URL copiada!",
      description: "A URL do webhook foi copiada para a área de transferência",
    });
  };


  return (
    <div className="space-y-6">
      {/* Status e Informações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${agent.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                {agent.is_active ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">{agent.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${agent.whatsapp_number ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                <MessageSquare className={`h-5 w-5 ${agent.whatsapp_number ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-semibold text-sm">{agent.whatsapp_number || 'Não configurado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-semibold text-xs">{formatDate(agent.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atualizado</p>
                <p className="font-semibold text-xs">{formatDate(agent.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuração do Agente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração do Agente IA
          </CardTitle>
          <CardDescription>
            Configure o comportamento e personalidade do seu assistente virtual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="tools">Ferramentas IA</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="fallback">Fallback</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Agente</Label>
                  <Input
                    id="name"
                    value={agent.name}
                    onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                    placeholder="Ex: Assistente IA do Restaurante"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={agent.is_active}
                    onCheckedChange={(checked) => setAgent({ ...agent, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Agente ativo</Label>
                </div>

                <div>
                  <Label htmlFor="personality">Personalidade da IA</Label>
                  <Textarea
                    id="personality"
                    value={agent.personality}
                    onChange={(e) => setAgent({ ...agent, personality: e.target.value })}
                    placeholder="Descreva como a IA deve se comportar e interagir..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instruções Avançadas</Label>
                  <Textarea
                    id="instructions"
                    value={agent.instructions}
                    onChange={(e) => setAgent({ ...agent, instructions: e.target.value })}
                    placeholder="Instruções detalhadas sobre comportamentos específicos..."
                    className="min-h-[100px]"
                  />
                </div>

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

            <TabsContent value="tools" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">Ferramentas da IA</h4>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Com as ferramentas ativadas, a IA poderá executar ações reais no sistema como criar pedidos e enviar notificações automaticamente.
                  </p>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Switch
                    id="enable_order_creation"
                    checked={agent.enable_order_creation ?? true}
                    onCheckedChange={(checked) => setAgent(prev => 
                      prev ? { ...prev, enable_order_creation: checked } : null
                    )}
                  />
                  <div className="flex-1">
                    <Label htmlFor="enable_order_creation" className="font-medium">
                      🛒 Criação Automática de Pedidos
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que a IA crie pedidos automaticamente quando o cliente confirmar
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Switch
                    id="order_confirmation_required"
                    checked={agent.order_confirmation_required ?? true}
                    onCheckedChange={(checked) => setAgent(prev => 
                      prev ? { ...prev, order_confirmation_required: checked } : null
                    )}
                    disabled={!agent.enable_order_creation}
                  />
                  <div className="flex-1">
                    <Label htmlFor="order_confirmation_required" className="font-medium">
                      ✅ Exigir Confirmação de Pedido
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      IA deve confirmar todos os detalhes antes de criar o pedido
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Switch
                    id="enable_automatic_notifications"
                    checked={agent.enable_automatic_notifications ?? true}
                    onCheckedChange={(checked) => setAgent(prev => 
                      prev ? { ...prev, enable_automatic_notifications: checked } : null
                    )}
                  />
                  <div className="flex-1">
                    <Label htmlFor="enable_automatic_notifications" className="font-medium">
                      📱 Notificações Automáticas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Envia notificações automáticas de status de pedido via WhatsApp
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Switch
                    id="enable_product_search"
                    checked={agent.enable_product_search ?? true}
                    onCheckedChange={(checked) => setAgent(prev => 
                      prev ? { ...prev, enable_product_search: checked } : null
                    )}
                  />
                  <div className="flex-1">
                    <Label htmlFor="enable_product_search" className="font-medium">
                      📋 Busca de Produtos
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      IA pode verificar disponibilidade de produtos no cardápio em tempo real
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-amber-600" />
                    <h4 className="font-medium text-amber-700 dark:text-amber-300">Importante</h4>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ Com as ferramentas ativadas, a IA poderá executar ações reais como criar pedidos e enviar mensagens. Certifique-se de testar o comportamento antes de ativar em produção.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Integração WhatsApp Desativada</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A integração com Evolution API foi removida desta plataforma.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <Button onClick={saveAgent} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};