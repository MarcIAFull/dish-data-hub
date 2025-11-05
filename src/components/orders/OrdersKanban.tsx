import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, MapPin, Package, Clock, User, Volume2, VolumeX, Printer, Download, ShoppingBag } from 'lucide-react';
import { OrderFilters } from './OrderFilters';
import { OrderStats } from './OrderStats';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_delivery' | 'completed' | 'cancelled';
type OrderSource = 'ai_agent' | 'manual' | 'marketplace';

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
  restaurant_id: string;
}

interface OrdersKanbanProps {
  restaurantId: string;
}

export function OrdersKanban({ restaurantId }: OrdersKanbanProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusChangeNotes, setStatusChangeNotes] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => 
    localStorage.getItem('ordersSoundEnabled') !== 'false'
  );
  const [currency, setCurrency] = useState('R$');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSources, setSelectedSources] = useState<OrderSource[]>([]);
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState<('delivery' | 'pickup')[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const columns = [
    { status: 'pending', title: 'Pendentes', color: 'bg-yellow-500 dark:bg-yellow-600' },
    { status: 'confirmed', title: 'Confirmados', color: 'bg-blue-500 dark:bg-blue-600' },
    { status: 'preparing', title: 'Em Preparo', color: 'bg-purple-500 dark:bg-purple-600' },
    { status: 'ready', title: 'Prontos', color: 'bg-green-500 dark:bg-green-600' },
    { status: 'in_delivery', title: 'Em Entrega', color: 'bg-orange-500 dark:bg-orange-600' },
    { status: 'completed', title: 'Concluídos', color: 'bg-emerald-500 dark:bg-emerald-600' },
    { status: 'cancelled', title: 'Cancelados', color: 'bg-red-500 dark:bg-red-600' }
  ];

  const sourceLabels: Record<OrderSource, string> = {
    ai_agent: 'IA',
    manual: 'Manual',
    marketplace: 'Marketplace'
  };

  // Buscar moeda do restaurante
  useEffect(() => {
    const fetchRestaurantCurrency = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('country')
        .eq('id', restaurantId)
        .single();
      
      setCurrency(data?.country === 'PT' ? '€' : 'R$');
    };
    
    fetchRestaurantCurrency();
  }, [restaurantId]);

  useEffect(() => {
    loadOrders();

    // Realtime subscription for new orders
    const newOrdersChannel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('New order received:', payload);
          loadOrders();
          
          // Play notification sound
          if (soundEnabled) {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(err => console.log('Audio play failed:', err));
          }
          
          toast.success(`🔔 Novo Pedido #${payload.new.id}!`, {
            duration: 5000,
            action: {
              label: 'Ver',
              onClick: () => {
                const newOrder = payload.new as Order;
                setSelectedOrder(newOrder);
              }
            }
          });
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
      supabase.removeChannel(newOrdersChannel);
    };
  }, [restaurantId, soundEnabled]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('order_status', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Orders loaded:', data?.length);

      // Validar e filtrar pedidos com dados completos
      const validOrders = data?.filter(order => 
        order.customer_name && 
        order.total_amount !== null &&
        order.restaurant_id
      ) || [];

      if (data && data.length !== validOrders.length) {
        toast.warning(`${data.length - validOrders.length} pedido(s) com dados incompletos foram ocultados`);
      }

      const ordersWithItemCount = validOrders.map((order: any) => ({
        ...order,
        items_count: order.payload?.items?.length || 0
      }));

      setOrders(ordersWithItemCount);
    } catch (error) {
      console.error('Error loading orders:', error);
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
      loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    let filtered = orders.filter(order => order.order_status === status);

    // Aplicar filtros
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm)
      );
    }

    if (selectedSources.length > 0) {
      filtered = filtered.filter(order => 
        selectedSources.includes(order.order_source as OrderSource)
      );
    }

    if (selectedDeliveryTypes.length > 0) {
      filtered = filtered.filter(order => 
        selectedDeliveryTypes.includes(order.delivery_type || 'delivery')
      );
    }

    if (dateRange?.from) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        const from = dateRange.from!;
        const to = dateRange.to || dateRange.from;
        return orderDate >= from && orderDate <= to;
      });
    }

    return filtered;
  };

  const getTimeSinceCreation = (created_at: string) => {
    const diff = Date.now() - new Date(created_at).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 15) return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: `${minutes}min` };
    if (minutes < 30) return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: `${minutes}min` };
    return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: `${minutes}min` };
  };

  const calculateStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.order_status === 'pending').length;
    const preparing = orders.filter(o => o.order_status === 'preparing').length;
    const completed = orders.filter(o => o.order_status === 'completed').length;
    const revenue = orders
      .filter(o => o.order_status === 'completed')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const avgTicket = completed > 0 ? revenue / completed : 0;
    const avgTime = 25; // placeholder

    return { total, pending, preparing, completed, revenue, avgTicket, avgTime };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSources([]);
    setSelectedDeliveryTypes([]);
    setDateRange(undefined);
  };

  const toggleOrderSelection = (orderId: number) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
            .info { margin: 20px 0; }
            .items { margin: 20px 0; }
            .item { padding: 5px 0; border-bottom: 1px solid #ccc; }
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Pedido #${order.id}</h1>
          <div class="info">
            <p><strong>Cliente:</strong> ${order.customer_name}</p>
            <p><strong>Telefone:</strong> ${order.customer_phone || 'N/A'}</p>
            <p><strong>Data:</strong> ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
          <div class="items">
            <h2>Itens:</h2>
            ${order.payload?.items?.map((item: any) => `
              <div class="item">
                ${item.quantity}x ${item.product_name} - ${currency} ${(item.quantity * item.unit_price).toFixed(2)}
              </div>
            `).join('') || '<p>Nenhum item</p>'}
          </div>
          <div class="total">
            Total: ${currency} ${order.total_amount?.toFixed(2) || '0.00'}
          </div>
        </body>
      </html>
    `);
    printWindow.print();
  };

  const exportOrders = () => {
    const csv = [
      ['ID', 'Cliente', 'Telefone', 'Status', 'Valor', 'Data'].join(','),
      ...orders.map(o => [
        o.id,
        o.customer_name,
        o.customer_phone || '',
        o.order_status,
        o.total_amount?.toFixed(2) || '0',
        new Date(o.created_at).toLocaleString('pt-BR')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando pedidos...</div>;
  }

  const stats = calculateStats();

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Central de Pedidos</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newValue = !soundEnabled;
                setSoundEnabled(newValue);
                localStorage.setItem('ordersSoundEnabled', newValue.toString());
                toast.success(newValue ? 'Som ativado' : 'Som desativado');
              }}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Os pedidos criados pela IA ou manualmente aparecerão aqui automaticamente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Central de Pedidos</h1>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <Badge variant="secondary" className="mr-2">
              {selectedOrders.length} selecionado(s)
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportOrders}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newValue = !soundEnabled;
              setSoundEnabled(newValue);
              localStorage.setItem('ordersSoundEnabled', newValue.toString());
              toast.success(newValue ? 'Som ativado' : 'Som desativado');
            }}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <OrderStats stats={stats} currency={currency} />

      {/* Filtros */}
      <OrderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSources={selectedSources}
        onSourceChange={setSelectedSources}
        selectedDeliveryTypes={selectedDeliveryTypes}
        onDeliveryTypeChange={setSelectedDeliveryTypes}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearFilters={clearFilters}
      />

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {columns.map(column => (
            <div key={column.status} className="w-80 flex-shrink-0">
              <div className={`${column.color} text-white p-3 rounded-t-lg`}>
                <h3 className="font-semibold">{column.title}</h3>
                <span className="text-sm opacity-90">
                  {getOrdersByStatus(column.status as OrderStatus).length} pedidos
                </span>
              </div>
              
              <ScrollArea className="h-[600px] bg-muted/30 rounded-b-lg p-2">
                <div className="space-y-2">
                  {getOrdersByStatus(column.status as OrderStatus).map(order => (
                    <Card
                      key={order.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1" onClick={() => setSelectedOrder(order)}>
                            <CardTitle className="text-base">Pedido #{order.id}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(order.created_at).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge variant={order.order_source === 'ai_agent' ? 'default' : 'secondary'}>
                              {sourceLabels[order.order_source as OrderSource] || order.order_source}
                            </Badge>
                            <Badge className={getTimeSinceCreation(order.created_at).color}>
                              {getTimeSinceCreation(order.created_at).label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2" onClick={() => setSelectedOrder(order)}>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{order.customer_name}</span>
                        </div>
                        
                        {order.customer_phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{order.customer_phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{order.items_count} {order.items_count === 1 ? 'item' : 'itens'}</span>
                        </div>

                        <div className="pt-2 border-t flex items-center justify-between">
                          <p className="text-lg font-bold">{currency} {order.total_amount?.toFixed(2) || '0.00'}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              printOrder(order);
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido #{selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  Criado em {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printOrder(selectedOrder)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedOrder.customer_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <Badge variant={selectedOrder.order_source === 'ai_agent' ? 'default' : 'secondary'}>
                      {sourceLabels[selectedOrder.order_source as OrderSource] || selectedOrder.order_source}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">
                      {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {selectedOrder.payload?.delivery_address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                    <p className="font-medium">{selectedOrder.payload.delivery_address}</p>
                  </div>
                )}

                <div>
                  <Label>Itens do Pedido</Label>
                  <div className="mt-2 space-y-1">
                    {selectedOrder.payload?.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-2 border-b">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span className="font-medium">{currency} {(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                    )) || <p className="text-muted-foreground">Nenhum item</p>}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold">{currency} {selectedOrder.total_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <Label>Observações</Label>
                    <p className="mt-1 p-2 bg-muted rounded">{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="status">Atualizar Status</Label>
                  <Select
                    value={selectedOrder.order_status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value as OrderStatus)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col.status} value={col.status}>
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notas da Mudança de Status</Label>
                  <Textarea
                    id="notes"
                    placeholder="Adicione observações sobre a mudança de status..."
                    value={statusChangeNotes}
                    onChange={(e) => setStatusChangeNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
