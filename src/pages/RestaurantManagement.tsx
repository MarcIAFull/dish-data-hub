import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Settings, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RestaurantInfo } from '@/components/restaurant/RestaurantInfo';
import { CategoriesManager } from '@/components/restaurant/CategoriesManager';
import { ProductsManager } from '@/components/restaurant/ProductsManager';
import { ConversationsDashboard } from '@/components/conversations/ConversationsDashboard';
import { OrdersDashboard } from '@/components/orders/OrdersDashboard';
import { BotPerformanceDashboard } from '@/components/analytics/BotPerformanceDashboard';
import { ConversionMetrics } from '@/components/analytics/ConversionMetrics';
import { ConversationAnalytics } from '@/components/analytics/ConversationAnalytics';
import { SalesReports } from '@/components/analytics/SalesReports';
import { ExecutiveDashboard } from '@/components/analytics/ExecutiveDashboard';

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
}

export default function RestaurantManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRestaurant();
    }
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Restaurante não encontrado',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurante não encontrado</h1>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                <p className="text-muted-foreground">/{restaurant.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/r/${restaurant.slug}`, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Página
              </Button>
            </div>
          </div>

          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-9 text-xs">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="conversations">Conversas</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="executive">Executivo</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="conversion">Conversão</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <RestaurantInfo restaurant={restaurant} onUpdate={setRestaurant} />
            </TabsContent>

            <TabsContent value="categories">
              <CategoriesManager restaurantId={restaurant.id} />
            </TabsContent>

            <TabsContent value="products">
              <ProductsManager restaurantId={restaurant.id} />
            </TabsContent>

            <TabsContent value="conversations">
              <ConversationsDashboard restaurantId={restaurant.id} />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersDashboard restaurantId={restaurant.id} />
            </TabsContent>

            <TabsContent value="executive">
              <ExecutiveDashboard restaurantId={restaurant.id} />
            </TabsContent>

            <TabsContent value="performance">
              <BotPerformanceDashboard restaurantId={restaurant.id} />
            </TabsContent>

            <TabsContent value="conversion">
              <ConversionMetrics restaurantId={restaurant.id} />
            </TabsContent>

            <TabsContent value="reports">
              <SalesReports restaurantId={restaurant.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}