import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProtectedRestaurantRoute } from '@/components/ProtectedRestaurantRoute';

interface RestaurantFormData {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
}

function RestaurantFormContent({ restaurant }: { restaurant?: any }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!restaurant;
  
  const [formData, setFormData] = useState<RestaurantFormData>(
    restaurant || {
      name: '',
      slug: '',
      description: '',
      address: '',
      phone: '',
      whatsapp: '',
      instagram: '',
    }
  );
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        if (!user) throw new Error('Usuário não autenticado');
        
        const { error } = await supabase
          .from('restaurants')
          .update(formData)
          .eq('id', restaurant.id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        toast({
          title: 'Sucesso!',
          description: 'Restaurante atualizado com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('restaurants')
          .insert([{
            ...formData,
            user_id: user?.id,
          }]);

        if (error) throw error;
        
        toast({
          title: 'Sucesso!',
          description: 'Restaurante criado com sucesso',
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message.includes('unique') 
          ? 'Este slug já está em uso. Escolha outro.' 
          : 'Erro ao salvar restaurante',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <CardTitle>
                    {isEditing ? 'Editar Restaurante' : 'Novo Restaurante'}
                  </CardTitle>
                  <CardDescription>
                    {isEditing 
                      ? 'Atualize as informações do seu restaurante'
                      : 'Adicione um novo restaurante à sua conta'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Restaurante</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Pizzaria do João"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL do Restaurante</Label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-muted bg-muted text-muted-foreground text-sm">
                      lovable.app/r/
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
                      placeholder="+351 000 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="+351 000 000 000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@seu_restaurante"
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Restaurante')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantForm() {
  const { id } = useParams();
  const isEditing = !!id;

  if (isEditing) {
    return (
      <ProtectedRestaurantRoute>
        {(restaurant) => <RestaurantFormContent restaurant={restaurant} />}
      </ProtectedRestaurantRoute>
    );
  }

  return <RestaurantFormContent />;
}