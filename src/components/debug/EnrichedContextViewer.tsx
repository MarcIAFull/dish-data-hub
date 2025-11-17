// 🎨 Enriched Context Viewer - Visualização do Contexto Enriquecido
// FASE 1: Debug Visual

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Store, 
  Bot, 
  Clock, 
  MapPin, 
  CreditCard,
  ShoppingBag,
  Star,
  AlertCircle
} from "lucide-react";

interface EnrichedContextViewerProps {
  context: any;
}

export function EnrichedContextViewer({ context }: EnrichedContextViewerProps) {
  if (!context) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p>Nenhum contexto enriquecido disponível para este log</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { customer, restaurant, agent, session } = context;

  return (
    <div className="space-y-4">
      {/* Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-blue-500" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{customer?.phone || 'N/A'}</Badge>
              <Badge variant="secondary">
                {customer?.totalOrders || 0} pedidos anteriores
              </Badge>
            </div>
          </div>

          {customer?.favoriteItems && customer.favoriteItems.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Itens Favoritos
              </p>
              <div className="flex flex-wrap gap-2">
                {customer.favoriteItems.map((item: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {customer?.preferredAddress && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                Endereço Preferido
              </p>
              <p className="text-sm text-muted-foreground">
                {customer.preferredAddress}
              </p>
            </div>
          )}

          {customer?.preferredPayment && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-500" />
                Pagamento Preferido
              </p>
              <Badge variant="outline">{customer.preferredPayment}</Badge>
            </div>
          )}

          {customer?.lastOrders && customer.lastOrders.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                Últimos Pedidos
              </p>
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {customer.lastOrders.map((order: any, idx: number) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">
                          Pedido #{order.id}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          R$ {order.total_amount?.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restaurante */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5 text-green-500" />
            Restaurante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              <Badge variant={restaurant?.isOpen ? "default" : "destructive"}>
                {restaurant?.isOpen ? '🟢 Aberto' : '🔴 Fechado'}
              </Badge>
            </div>
            {!restaurant?.isOpen && restaurant?.nextOpenTime && (
              <div>
                <p className="text-sm font-medium mb-1">Próxima Abertura</p>
                <Badge variant="outline">{restaurant.nextOpenTime}</Badge>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo de Preparo
              </p>
              <p className="text-sm text-muted-foreground">
                {restaurant?.estimatedPrepTime || 30} min
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo de Entrega
              </p>
              <p className="text-sm text-muted-foreground">
                {restaurant?.estimatedDeliveryTime || 40} min
              </p>
            </div>
          </div>

          {restaurant?.deliveryZones && restaurant.deliveryZones.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Zonas de Entrega
              </p>
              <div className="space-y-1">
                {restaurant.deliveryZones.map((zone: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                    <span>
                      {zone.min_distance}km - {zone.max_distance}km
                    </span>
                    <span className="font-medium">
                      R$ {zone.fee.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-purple-500" />
            Configuração do Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Personalidade</p>
            <Badge variant="outline">{agent?.personality || 'friendly'}</Badge>
          </div>

          {agent?.instructions && (
            <div>
              <p className="text-sm font-medium mb-1">Instruções Customizadas</p>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {agent.instructions}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Funcionalidades</p>
            <div className="flex flex-wrap gap-2">
              {agent?.features?.enableOrderCreation && (
                <Badge variant="outline" className="text-xs">
                  ✅ Criação de Pedidos
                </Badge>
              )}
              {agent?.features?.enableProductSearch && (
                <Badge variant="outline" className="text-xs">
                  ✅ Busca de Produtos
                </Badge>
              )}
              {agent?.features?.enableAutomaticNotifications && (
                <Badge variant="outline" className="text-xs">
                  ✅ Notificações Automáticas
                </Badge>
              )}
              {agent?.features?.orderConfirmationRequired && (
                <Badge variant="outline" className="text-xs">
                  ⚠️ Requer Confirmação
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-orange-500" />
            Informações da Sessão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Reabertura de Conversa</p>
            <Badge variant={session?.reopenedCount > 0 ? "secondary" : "outline"}>
              {session?.reopenedCount || 0}x reaberta
            </Badge>
          </div>

          {session?.previousSessionSummary && (
            <div>
              <p className="text-sm font-medium mb-2">Resumo da Sessão Anterior</p>
              <ScrollArea className="h-[100px]">
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                  {session.previousSessionSummary}
                </p>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
