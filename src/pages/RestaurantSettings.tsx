import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, Pizza, CreditCard, MapPin, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryZonesManager } from "@/components/restaurant/DeliveryZonesManager";
import { PaymentMethodsManager } from "@/components/restaurant/PaymentMethodsManager";
import { ModifiersManager } from "@/components/restaurant/ModifiersManager";
import { OperationSettings } from "@/components/restaurant/OperationSettings";
import { MessagesManager } from "@/components/restaurant/MessagesManager";
import { CategoriesManager } from "@/components/restaurant/CategoriesManager";
import { ProductsManager } from "@/components/restaurant/ProductsManager";
import { EnhancedAgentConfiguration } from "@/components/agent/EnhancedAgentConfiguration";

export default function RestaurantSettings() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <p>Carregando...</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!restaurant) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <p>Restaurante não encontrado</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/restaurant-management")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">{restaurant.name}</p>
              </div>
            </div>

            <Tabs defaultValue="menu" className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="menu" className="flex items-center gap-2">
                  <Pizza className="h-4 w-4" />
                  Cardápio
                </TabsTrigger>
                <TabsTrigger value="zones" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Entregas
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamentos
                </TabsTrigger>
                <TabsTrigger value="modifiers" className="flex items-center gap-2">
                  <Pizza className="h-4 w-4" />
                  Complementos
                </TabsTrigger>
                <TabsTrigger value="operation" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Operação
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensagens
                </TabsTrigger>
                <TabsTrigger value="agent" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Agente IA
                </TabsTrigger>
              </TabsList>

              <TabsContent value="menu" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gerenciar Cardápio</CardTitle>
                    <CardDescription>
                      Configure categorias e produtos do seu restaurante
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CategoriesManager restaurantId={id!} />
                    <ProductsManager restaurantId={id!} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="zones">
                <DeliveryZonesManager restaurantId={id!} />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentMethodsManager restaurantId={id!} />
              </TabsContent>

              <TabsContent value="modifiers">
                <ModifiersManager restaurantId={id!} />
              </TabsContent>

              <TabsContent value="operation">
                <OperationSettings
                  restaurantId={id!}
                  initialData={restaurant}
                />
              </TabsContent>

              <TabsContent value="messages">
                <MessagesManager restaurantId={id!} />
              </TabsContent>

              <TabsContent value="agent">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração do Agente IA</CardTitle>
                    <CardDescription>
                      Personalize o comportamento do seu assistente virtual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EnhancedAgentConfiguration restaurantId={id!} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
