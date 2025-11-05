import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, Package, MapPin, Phone, User, DollarSign, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_delivery' | 'completed' | 'cancelled';
type OrderSource = 'ai_agent' | 'digital_menu' | 'marketplace' | 'manual';

interface Order {
  id: number;
  order_status: OrderStatus;
  order_source: OrderSource;
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  total_amount: number;
  estimated_time?: number;
  notes?: string;
  created_at: string;
  items_count: number;
  payload: any;
}

interface OrdersKanbanProps {
  restaurantId: string;
}

export function OrdersKanban({ restaurantId }: OrdersKanbanProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusChangeNotes, setStatusChangeNotes] = useState('');

  const columns: { status: OrderStatus; title: string; color: string }[] = [
    { status: 'pending', title: 'Pendentes', color: 'bg-yellow-500' },
    { status: 'confirmed', title: 'Confirmados', color: 'bg-blue-500' },
    { status: 'preparing', title: 'Em Preparo', color: 'bg-purple-500' },
    { status: 'ready', title: 'Prontos', color: 'bg-green-500' },
    { status: 'in_delivery', title: 'Em Entrega', color: 'bg-orange-500' },
    { status: 'completed', title: 'Concluídos', color: 'bg-gray-500' },
    { status: 'cancelled', title: 'Cancelados', color: 'bg-red-500' }
  ];

  const sourceLabels: Record<OrderSource, string> = {
    ai_agent: 'IA',
    digital_menu: 'Cardápio Digital',
    marketplace: 'Marketplace',
    manual: 'Manual'
  };

  const sourceBadgeColors: Record<OrderSource, string> = {
    ai_agent: 'bg-purple-100 text-purple-800',
    digital_menu: 'bg-blue-100 text-blue-800',
    marketplace: 'bg-green-100 text-green-800',
    manual: 'bg-gray-100 text-gray-800'
  };

  useEffect(() => {
    loadOrders();

    // Real-time subscription for order updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          // Visual notification for new orders
          toast.success(`🔔 Novo pedido #${payload.new.id}!`, {
            duration: 5000,
            action: {
              label: 'Ver',
              onClick: () => setSelectedOrder(payload.new as Order)
            }
          });
          
          // Play notification sound (optional - will fail silently if blocked)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKfj8LZjHAU3k9jzzHksBSR3yPDdkEALFV604+qnVRQLRp/g8r5sIQYugc/y2Ik2Chtpv/DlnE4MDlCn4/C2YxwFN5PZ886FLAUkeMjw3ZBAC') as any;
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {
            // Ignore audio errors
          }
          
          loadOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('[OrdersKanban] Loading orders for restaurant:', restaurantId);
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('order_status', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrdersKanban] Error fetching orders:', error);
        throw error;
      }

      console.log('[OrdersKanban] Raw data from DB:', data?.length || 0, 'orders');
      console.log('[OrdersKanban] Sample order:', data?.[0]);
      console.log('[OrdersKanban] All orders:', data?.map(o => ({ 
        id: o.id, 
        status: o.order_status, 
        restaurant_id: o.restaurant_id,
        source: o.order_source 
      })));

      // Parse payload and count items
      const ordersWithItemCount = data.map((order: any) => ({
        ...order,
        items_count: order.payload?.items?.length || 0
      }));

      console.log('[OrdersKanban] Parsed orders:', ordersWithItemCount.length);
      setOrders(ordersWithItemCount);
    } catch (error) {
      console.error('[OrdersKanban] Error loading orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Log status change with notes
      if (statusChangeNotes) {
        await supabase
          .from('order_status_history')
          .insert({
            order_id: orderId,
            new_status: newStatus,
            changed_by: 'user',
            notes: statusChangeNotes
          });
      }

      toast.success('Status atualizado com sucesso!');
      setStatusChangeNotes('');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.order_status === status);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Central de Pedidos</h2>
        <div className="flex gap-2">
          <Badge variant="outline">Total: {orders.length}</Badge>
          <Badge variant="outline" className="bg-yellow-50">
            Pendentes: {getOrdersByStatus('pending').length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {columns.map(column => (
            <div key={column.status} className="w-80 flex-shrink-0">
              <div className={`${column.color} text-white p-3 rounded-t-lg`}>
                <h3 className="font-semibold">{column.title}</h3>
                <span className="text-sm opacity-90">
                  {getOrdersByStatus(column.status).length} pedidos
                </span>
              </div>
              
              <ScrollArea className="h-[600px] bg-muted/30 rounded-b-lg p-2">
                <div className="space-y-2">
                  {getOrdersByStatus(column.status).map(order => (
                    <Dialog key={order.id}>
                      <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-sm font-medium">
                                #{order.id}
                              </CardTitle>
                              <Badge className={sourceBadgeColors[order.order_source]}>
                                {sourceLabels[order.order_source]}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4" />
                              <span className="truncate">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Package className="h-4 w-4" />
                              <span>{order.items_count} itens</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <DollarSign className="h-4 w-4" />
                              <span>R$ {order.total_amount?.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(order.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>

                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Pedido #{order.id}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* Customer Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Cliente</label>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="h-4 w-4" />
                                <span>{order.customer_name}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Telefone</label>
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="h-4 w-4" />
                                <span>{order.customer_phone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Order Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Tipo</label>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-4 w-4" />
                                <span>{order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Origem</label>
                              <Badge className={sourceBadgeColors[order.order_source]}>
                                {sourceLabels[order.order_source]}
                              </Badge>
                            </div>
                          </div>

                          {/* Items */}
                          <div>
                            <label className="text-sm font-medium">Itens do Pedido</label>
                            <div className="mt-2 space-y-2">
                              {order.payload?.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between p-2 bg-muted rounded">
                                  <div>
                                    <div className="font-medium">{item.product_name}</div>
                                    {item.notes && (
                                      <div className="text-xs text-muted-foreground">{item.notes}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div>{item.quantity}x R$ {item.unit_price.toFixed(2)}</div>
                                    <div className="font-medium">
                                      R$ {(item.quantity * item.unit_price).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Total */}
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>Total</span>
                              <span>R$ {order.total_amount?.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Notes */}
                          {order.notes && (
                            <div>
                              <label className="text-sm font-medium">Observações</label>
                              <div className="flex items-start gap-2 mt-1 p-2 bg-muted rounded">
                                <MessageSquare className="h-4 w-4 mt-0.5" />
                                <span className="text-sm">{order.notes}</span>
                              </div>
                            </div>
                          )}

                          {/* Status Update */}
                          <div className="border-t pt-4 space-y-3">
                            <label className="text-sm font-medium">Atualizar Status</label>
                            <Select
                              onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o novo status" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map(col => (
                                  <SelectItem 
                                    key={col.status} 
                                    value={col.status}
                                    disabled={col.status === order.order_status}
                                  >
                                    {col.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Textarea
                              placeholder="Observações sobre a mudança de status (opcional)"
                              value={statusChangeNotes}
                              onChange={(e) => setStatusChangeNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
