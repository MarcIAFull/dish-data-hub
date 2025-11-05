import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProtectedRestaurantRoute } from '@/components/ProtectedRestaurantRoute';
import { CategoriesManager } from '@/components/restaurant/CategoriesManager';
import { ProductsManager } from '@/components/restaurant/ProductsManager';
import { EnhancedAgentConfiguration } from '@/components/agent/EnhancedAgentConfiguration';
import { OnboardingGuide } from '@/components/restaurant/OnboardingGuide';
import { Bot } from 'lucide-react';
import { OperationSettings } from '@/components/restaurant/OperationSettings';
import { DeliveryZonesManager } from '@/components/restaurant/DeliveryZonesManager';
import { PaymentMethodsManager } from '@/components/restaurant/PaymentMethodsManager';
import { MessagesManager } from '@/components/restaurant/MessagesManager';

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
  const [activeTab, setActiveTab] = useState('basic');
  
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Editar Restaurante' : 'Novo Restaurante'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing 
                  ? 'Gerencie seu restaurante, categorias e produtos'
                  : 'Crie seu restaurante e configure o menu'
                }
              </p>
            </div>
          </div>

          {isEditing && (
            <OnboardingGuide 
              restaurantId={restaurant.id} 
              onNavigate={setActiveTab}
            />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="categories" disabled={!isEditing}>
              Categorias
            </TabsTrigger>
            <TabsTrigger value="products" disabled={!isEditing}>
              Produtos
            </TabsTrigger>
            <TabsTrigger value="operation" disabled={!isEditing}>
              Dados da Operação
            </TabsTrigger>
            <TabsTrigger value="agent" disabled={!isEditing}>
              Agente IA
            </TabsTrigger>
          </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Restaurante</CardTitle>
                  <CardDescription>
                    Configure as informações básicas do seu restaurante
                  </CardDescription>
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
            </TabsContent>

            <TabsContent value="categories">
              {isEditing && restaurant?.id && (
                <CategoriesManager restaurantId={restaurant.id} />
              )}
            </TabsContent>

            <TabsContent value="products">
              {isEditing && restaurant?.id && (
                <ProductsManager restaurantId={restaurant.id} />
              )}
            </TabsContent>

            <TabsContent value="operation">
              {isEditing && restaurant?.id && (
                <div className="space-y-6">
                  <OperationSettings 
                    restaurantId={restaurant.id} 
                    initialData={restaurant}
                  />
                  
                  <DeliveryZonesManager restaurantId={restaurant.id} />
                  
                  <PaymentMethodsManager restaurantId={restaurant.id} />
                  
                  <MessagesManager restaurantId={restaurant.id} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="agent">
              {isEditing && restaurant?.id ? (
                <EnhancedAgentConfiguration restaurantId={restaurant.id} />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      O agente IA será criado automaticamente após salvar o restaurante
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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