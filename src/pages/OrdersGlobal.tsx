import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Truck,
  Store
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { OrderDetail } from '@/components/orders/OrderDetail';
import { GlobalFiltersComponent } from '@/components/filters/GlobalFilters';

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Pronto' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function OrdersGlobal() {
  const { filters, restaurants } = useGlobalFilters();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Get orders for all selected restaurants
  const allOrders = filters.selectedRestaurants.flatMap(restaurantId => {
    const { orders } = useOrders(restaurantId);
    return orders.map(order => ({
      ...order,
      restaurantId,
      restaurantName: restaurants.find(r => r.id === restaurantId)?.name || 'Restaurante',
    }));
  });

  // Apply filters
  const filteredOrders = allOrders.filter(order => {
    // Status filter
    if (filters.status && order.status !== filters.status) {
      return false;
    }
    
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        order.customers?.name?.toLowerCase().includes(searchLower) ||
        order.customers?.phone?.includes(searchLower) ||
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.restaurantName.toLowerCase().includes(searchLower)
      );
    }
    
    // Date filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const orderDate = new Date(order.created_at);
      if (filters.dateRange.from && orderDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && orderDate > filters.dateRange.to) {
        return false;
      }
    }
    
    return true;
  });

  // Sort by most recent
  const sortedOrders = filteredOrders.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || '';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const selectedOrder = sortedOrders.find(order => order.id === selectedOrderId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Central de Pedidos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os pedidos dos seus restaurantes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <GlobalFiltersComponent 
                showStatus={true}
                statusOptions={statusOptions}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders List */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Pedidos
                      </CardTitle>
                      <CardDescription>
                        {sortedOrders.length} pedidos encontrados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[700px]">
                        {sortedOrders.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground">
                            <ShoppingBag className="mx-auto h-8 w-8 mb-4" />
                            <p>Nenhum pedido encontrado</p>
                            <p className="text-sm mt-2">
                              Ajuste os filtros ou aguarde novos pedidos
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 p-2">
                            {sortedOrders.map((order) => {
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
                                        <Store className="h-3 w-3" />
                                        {order.restaurantName}
                                      </div>
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
                                      <span className="font-medium">{order.customers?.name}</span>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      {order.customers?.phone}
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
                                        {order.order_items?.length || 0} {(order.order_items?.length || 0) === 1 ? 'item' : 'itens'}
                                      </Badge>
                                    </div>
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
                <div>
                  {selectedOrder ? (
                    <OrderDetail 
                      order={selectedOrder}
                      onStatusUpdate={(id, status) => {
                        // Update status logic here
                        console.log('Update status', id, status);
                      }}
                    />
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-[700px]">
                        <div className="text-center text-muted-foreground">
                          <ShoppingBag className="mx-auto h-12 w-12 mb-4" />
                          <p>Selecione um pedido para ver os detalhes</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}