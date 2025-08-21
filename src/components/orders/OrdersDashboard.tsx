import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ShoppingBag, 
  User, 
  Phone, 
  MapPin, 
  Clock,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Truck
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { OrderDetail } from './OrderDetail';

interface OrdersDashboardProps {
  restaurantId: string;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({ 
  restaurantId 
}) => {
  const { orders, loading, getStatusLabel, getStatusColor, formatCurrency, updateOrderStatus } = useOrders(restaurantId);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <PlayCircle className="h-4 w-4" />;
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'delivered':
        return <Truck className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getQuickActions = (order: any) => {
    const actions = [];

    if (order.status === 'pending') {
      actions.push(
        <Button
          key="confirm"
          size="sm"
          onClick={() => updateOrderStatus(order.id, 'confirmed')}
        >
          Confirmar
        </Button>
      );
    }

    if (order.status === 'confirmed') {
      actions.push(
        <Button
          key="preparing"
          size="sm"
          onClick={() => updateOrderStatus(order.id, 'preparing')}
        >
          Preparar
        </Button>
      );
    }

    if (order.status === 'preparing') {
      actions.push(
        <Button
          key="ready"
          size="sm"
          onClick={() => updateOrderStatus(order.id, 'ready')}
        >
          Pronto
        </Button>
      );
    }

    if (order.status === 'ready') {
      actions.push(
        <Button
          key="delivered"
          size="sm"
          onClick={() => updateOrderStatus(order.id, 'delivered')}
        >
          Entregar
        </Button>
      );
    }

    if (['pending', 'confirmed'].includes(order.status)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="destructive"
          onClick={() => updateOrderStatus(order.id, 'cancelled')}
        >
          Cancelar
        </Button>
      );
    }

    return actions;
  };

  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Orders List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Pedidos
            </CardTitle>
            <CardDescription>
              {orders.length} pedidos total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <ShoppingBag className="mx-auto h-8 w-8 mb-4" />
                  <p>Nenhum pedido encontrado</p>
                  <p className="text-sm mt-2">
                    Os pedidos aparecerão quando clientes fizerem pedidos
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {orders.map((order) => {
                    const isSelected = selectedOrderId === order.id;
                    
                    return (
                      <div
                        key={order.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm">
                              #{order.order_number}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(order.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {getStatusLabel(order.status)}
                            </div>
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{order.customers.name}</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {order.customers.phone}
                          </div>

                          {order.delivery_type === 'delivery' && order.delivery_address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{order.delivery_address}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(order.total)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'itens'}
                            </Badge>
                          </div>

                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <div className="flex gap-1 mt-2">
                              {getQuickActions(order).slice(0, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Order Detail */}
      <div className="lg:col-span-2">
        {selectedOrder ? (
          <OrderDetail 
            order={selectedOrder}
            onStatusUpdate={updateOrderStatus}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <ShoppingBag className="mx-auto h-12 w-12 mb-4" />
                <p>Selecione um pedido para ver os detalhes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};