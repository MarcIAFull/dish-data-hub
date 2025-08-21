import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Save, Plus, Settings, MessageSquare } from 'lucide-react';

interface Agent {
  id?: string;
  restaurant_id: string;
  name: string;
  personality: string;
  instructions: string;
  is_active: boolean;
  fallback_enabled: boolean;
  fallback_timeout_minutes: number;
  whatsapp_number: string;
  evolution_api_instance: string;
  evolution_api_token: string;
}

interface AgentConfigurationProps {
  restaurantId: string;
}

export const AgentConfiguration: React.FC<AgentConfigurationProps> = ({ 
  restaurantId 
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const defaultAgent: Omit<Agent, 'id'> = {
    restaurant_id: restaurantId,
    name: 'Assistente Virtual',
    personality: 'Você é um assistente virtual prestativo e amigável do restaurante. Sempre seja educado, use emojis apropriados e ofereça ajuda de forma natural. Responda de forma clara e objetiva.',
    instructions: 'Sempre cumprimente o cliente, apresente o cardápio quando apropriado, esclareça dúvidas sobre produtos e preços, e ajude com pedidos. Se não souber algo específico, oriente o cliente a entrar em contato diretamente.',
    is_active: true,
    fallback_enabled: true,
    fallback_timeout_minutes: 5,
    whatsapp_number: '',
    evolution_api_instance: '',
    evolution_api_token: ''
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAgents(data || []);
      
      // Select first agent or create new one
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
        // Update existing agent
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
            evolution_api_instance: selectedAgent.evolution_api_instance,
            evolution_api_token: selectedAgent.evolution_api_token,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedAgent.id);

        if (error) throw error;
      } else {
        // Create new agent
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
        title: "Agente salvo",
        description: "Configurações do agente foram salvas com sucesso",
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
          <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando configurações...</p>
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
              <Bot className="h-5 w-5" />
              Agentes
            </CardTitle>
            <CardDescription>
              {agents.length} agente(s) configurado(s)
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
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {agent.whatsapp_number || 'Sem WhatsApp configurado'}
                  </p>
                </div>
              ))}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={createNewAgent}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Configuration */}
      <div className="lg:col-span-3">
        {selectedAgent ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Agente
              </CardTitle>
              <CardDescription>
                Configure a personalidade e comportamento do seu agente virtual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Agente</Label>
                  <Input
                    id="name"
                    value={selectedAgent.name}
                    onChange={(e) => setSelectedAgent(prev => 
                      prev ? { ...prev, name: e.target.value } : null
                    )}
                    placeholder="Ex: Assistente Virtual do Restaurante"
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
              </div>

              <Separator />

              {/* Personality Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="personality">Personalidade do Agente</Label>
                  <Textarea
                    id="personality"
                    value={selectedAgent.personality}
                    onChange={(e) => setSelectedAgent(prev => 
                      prev ? { ...prev, personality: e.target.value } : null
                    )}
                    placeholder="Descreva como o agente deve se comportar..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instruções Específicas</Label>
                  <Textarea
                    id="instructions"
                    value={selectedAgent.instructions}
                    onChange={(e) => setSelectedAgent(prev => 
                      prev ? { ...prev, instructions: e.target.value } : null
                    )}
                    placeholder="Instruções detalhadas sobre como o agente deve responder..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <Separator />

              {/* WhatsApp Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuração WhatsApp</h3>
                
                <div>
                  <Label htmlFor="whatsapp_number">Número WhatsApp</Label>
                  <Input
                    id="whatsapp_number"
                    value={selectedAgent.whatsapp_number}
                    onChange={(e) => setSelectedAgent(prev => 
                      prev ? { ...prev, whatsapp_number: e.target.value } : null
                    )}
                    placeholder="Ex: 5511999999999"
                  />
                </div>

                <div>
                  <Label htmlFor="evolution_api_instance">Instância Evolution API</Label>
                  <Input
                    id="evolution_api_instance"
                    value={selectedAgent.evolution_api_instance}
                    onChange={(e) => setSelectedAgent(prev => 
                      prev ? { ...prev, evolution_api_instance: e.target.value } : null
                    )}
                    placeholder="Nome da instância"
                  />
                </div>

                <div>
                  <Label htmlFor="evolution_api_token">Token Evolution API</Label>
                  <Input
                    id="evolution_api_token"
                    type="password"
                    value={selectedAgent.evolution_api_token}
                    onChange={(e) => setSelectedAgent(prev => 
                      prev ? { ...prev, evolution_api_token: e.target.value } : null
                    )}
                    placeholder="Token de acesso"
                  />
                </div>
              </div>

              <Separator />

              {/* Fallback Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuração de Fallback</h3>
                
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
                  </div>
                )}
              </div>

              <Separator />

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