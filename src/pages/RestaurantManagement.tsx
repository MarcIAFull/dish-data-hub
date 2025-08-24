import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ProtectedRestaurantRoute } from '@/components/ProtectedRestaurantRoute';

// Import all the components
import { RestaurantInfo } from '@/components/restaurant/RestaurantInfo';
import { CategoriesManager } from '@/components/restaurant/CategoriesManager';
import { ProductsManager } from '@/components/restaurant/ProductsManager';
import { AgentConfiguration } from '@/components/agent/AgentConfiguration';
import { ConversationsDashboard } from '@/components/conversations/ConversationsDashboard';
import { OrdersDashboard } from '@/components/orders/OrdersDashboard';
import { ExecutiveDashboard } from '@/components/analytics/ExecutiveDashboard';
import { BotPerformanceDashboard } from '@/components/analytics/BotPerformanceDashboard';
import { ConversionMetrics } from '@/components/analytics/ConversionMetrics';
import { SalesReports } from '@/components/analytics/SalesReports';
import { EmbeddedChat } from '@/components/chat/EmbeddedChat';

export default function RestaurantManagement() {
  const navigate = useNavigate();

  const handleRestaurantUpdate = (updatedRestaurant: any) => {
    // Restaurant info will be updated automatically through the state management
    console.log('Restaurant updated:', updatedRestaurant);
  };

  return (
    <ProtectedRestaurantRoute>
      {(restaurant) => (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <p className="text-muted-foreground">/{restaurant.slug}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/r/${restaurant.slug}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Página
                </Button>
              </div>

              {/* Management Tabs */}
              <Tabs defaultValue="info" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="categories">Categorias</TabsTrigger>
                  <TabsTrigger value="products">Produtos</TabsTrigger>
                  <TabsTrigger value="agent">Configuração IA</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                  <RestaurantInfo 
                    restaurant={restaurant} 
                    onUpdate={handleRestaurantUpdate} 
                  />
                </TabsContent>

                <TabsContent value="categories">
                  <CategoriesManager restaurantId={restaurant.id} />
                </TabsContent>

                <TabsContent value="products">
                  <ProductsManager restaurantId={restaurant.id} />
                </TabsContent>

                <TabsContent value="agent">
                  <AgentConfiguration restaurantId={restaurant.id} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Embedded Chat for Testing */}
            <EmbeddedChat 
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
            />
          </div>
        </div>
      )}
    </ProtectedRestaurantRoute>
  );
}