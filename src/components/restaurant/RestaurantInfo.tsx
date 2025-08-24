import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  is_active: boolean;
  ai_enabled: boolean;
  ai_configuration_id: string | null;
}

interface AIConfiguration {
  id: string;
  name: string;
  description: string;
}

interface RestaurantInfoProps {
  restaurant: Restaurant;
  onUpdate: (restaurant: Restaurant) => void;
}

export function RestaurantInfo({ restaurant, onUpdate }: RestaurantInfoProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(restaurant);
  const [loading, setLoading] = useState(false);
  const [aiConfigurations, setAiConfigurations] = useState<AIConfiguration[]>([]);

  useEffect(() => {
    fetchAIConfigurations();
  }, []);

  const fetchAIConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('id, name, description')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAiConfigurations(data || []);
    } catch (error) {
      console.error('Error fetching AI configurations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('restaurants')
        .update(formData)
        .eq('id', restaurant.id)
        .eq('user_id', user.id);

      if (error) throw error;

      onUpdate(formData);
      toast({
        title: 'Sucesso!',
        description: 'Informações do restaurante atualizadas',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar informações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Restaurante</CardTitle>
        <CardDescription>
          Gerencie as informações básicas do seu restaurante
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Restaurante</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL (slug)</Label>
              <div className="flex">
                <span className="flex items-center px-3 text-sm bg-muted border border-r-0 rounded-l-md">
                  /r/
                </span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="rounded-l-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={formData.instagram || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Restaurante ativo (visível publicamente)</Label>
          </div>

          <Separator />

          {/* AI Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="text-lg font-medium">Configuração de IA</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ai_enabled"
                checked={formData.ai_enabled || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ai_enabled: checked }))}
              />
              <Label htmlFor="ai_enabled">Habilitar Assistente Virtual com IA</Label>
            </div>

            {formData.ai_enabled && (
              <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                <div>
                  <Label htmlFor="ai_configuration">Configuração de IA</Label>
                  <Select 
                    value={formData.ai_configuration_id || ''} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, ai_configuration_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma configuração de IA" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiConfigurations.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-xs text-muted-foreground">{config.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.ai_configuration_id && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ✅ IA configurada! Agora você pode personalizar seus agentes com essa configuração.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}