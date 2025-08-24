import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface AIConfiguration {
  id: string;
  name: string;
  description: string;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  context_memory_turns: number;
  language: string;
  response_style: string;
  knowledge_cutoff: string;
  enable_sentiment_analysis: boolean;
  enable_conversation_summary: boolean;
  enable_order_intent_detection: boolean;
  enable_proactive_suggestions: boolean;
  enable_multilingual_support: boolean;
  is_active: boolean;
  is_default: boolean;
}

export function AIConfigurationManager() {
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultConfig = {
    name: '',
    description: '',
    ai_model: 'gpt-5-2025-08-07',
    temperature: 0.7,
    max_tokens: 500,
    context_memory_turns: 10,
    language: 'pt-BR',
    response_style: 'friendly',
    knowledge_cutoff: '2024-12-01',
    enable_sentiment_analysis: true,
    enable_conversation_summary: true,
    enable_order_intent_detection: true,
    enable_proactive_suggestions: false,
    enable_multilingual_support: false,
    is_active: true,
    is_default: false,
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error('Error fetching AI configurations:', error);
      toast.error('Erro ao carregar configurações de IA');
    }
  };

  const handleSave = async (config: Partial<AIConfiguration>) => {
    try {
      setLoading(true);
      
      if (editingConfig) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(config)
          .eq('id', editingConfig.id);
        
        if (error) throw error;
        toast.success('Configuração atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert([config as any]);
        
        if (error) throw error;
        toast.success('Configuração criada com sucesso');
      }

      setEditingConfig(null);
      setIsCreating(false);
      fetchConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;

    try {
      const { error } = await supabase
        .from('ai_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Configuração excluída com sucesso');
      fetchConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Erro ao excluir configuração');
    }
  };

  const ConfigurationForm = ({ config, onSave, onCancel }: {
    config: Partial<AIConfiguration>;
    onSave: (config: Partial<AIConfiguration>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(config);

    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingConfig ? 'Editar' : 'Nova'} Configuração de IA</CardTitle>
          <CardDescription>
            Configure os parâmetros técnicos da IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: IA Avançada"
              />
            </div>
            <div>
              <Label htmlFor="ai_model">Modelo de IA</Label>
              <Select 
                value={formData.ai_model} 
                onValueChange={(value) => setFormData({ ...formData, ai_model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-5-2025-08-07">GPT-5 (Premium)</SelectItem>
                  <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini (Balanced)</SelectItem>
                  <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Reliable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva esta configuração..."
            />
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature || 0.7}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_tokens || 500}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="context_memory_turns">Memória de Contexto</Label>
              <Input
                id="context_memory_turns"
                type="number"
                value={formData.context_memory_turns || 10}
                onChange={(e) => setFormData({ ...formData, context_memory_turns: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Idioma</Label>
              <Select 
                value={formData.language} 
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="response_style">Estilo de Resposta</Label>
              <Select 
                value={formData.response_style} 
                onValueChange={(value) => setFormData({ ...formData, response_style: value })}
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

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Funcionalidades Avançadas</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sentiment">Análise de Sentimento</Label>
              <Switch
                id="sentiment"
                checked={formData.enable_sentiment_analysis || false}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_sentiment_analysis: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="summary">Resumo de Conversação</Label>
              <Switch
                id="summary"
                checked={formData.enable_conversation_summary || false}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_conversation_summary: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="intent">Detecção de Intenção de Pedido</Label>
              <Switch
                id="intent"
                checked={formData.enable_order_intent_detection || false}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_order_intent_detection: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="proactive">Sugestões Proativas</Label>
              <Switch
                id="proactive"
                checked={formData.enable_proactive_suggestions || false}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_proactive_suggestions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="multilingual">Suporte Multilíngue</Label>
              <Switch
                id="multilingual"
                checked={formData.enable_multilingual_support || false}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_multilingual_support: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => onSave(formData)} 
              disabled={loading || !formData.name}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isCreating || editingConfig) {
    return (
      <ConfigurationForm
        config={editingConfig || defaultConfig}
        onSave={handleSave}
        onCancel={() => {
          setIsCreating(false);
          setEditingConfig(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configurações de IA</h2>
          <p className="text-muted-foreground">
            Gerencie configurações centralizadas de IA para seus restaurantes
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Configuração
        </Button>
      </div>

      <div className="grid gap-4">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {config.name}
                    {config.is_default && <Badge variant="secondary">Padrão</Badge>}
                    {!config.is_active && <Badge variant="outline">Inativo</Badge>}
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingConfig(config)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Modelo:</span> {config.ai_model}
                </div>
                <div>
                  <span className="font-medium">Tokens:</span> {config.max_tokens}
                </div>
                <div>
                  <span className="font-medium">Memória:</span> {config.context_memory_turns} turnos
                </div>
                <div>
                  <span className="font-medium">Idioma:</span> {config.language}
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {config.enable_sentiment_analysis && <Badge variant="outline">Análise de Sentimento</Badge>}
                {config.enable_conversation_summary && <Badge variant="outline">Resumo</Badge>}
                {config.enable_order_intent_detection && <Badge variant="outline">Detecção de Pedidos</Badge>}
                {config.enable_proactive_suggestions && <Badge variant="outline">Sugestões Proativas</Badge>}
                {config.enable_multilingual_support && <Badge variant="outline">Multilíngue</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}