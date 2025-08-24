import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  restaurant_id: string;
  customer_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: 'cash' | 'pix' | 'card' | 'credit';
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_type: 'delivery' | 'pickup';
  delivery_address: string;
  notes: string;
  conversation_id: string;
  created_at: string;
  updated_at: string;
  customers: Customer;
  order_items: OrderItem[];
}

export const useOrders = (restaurantId?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          customers (*),
          order_items (
            *,
            products (id, name, price)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Type the data properly
      const typedData = (data || []).map(order => ({
        ...order,
        status: order.status as Order['status'],
        payment_method: order.payment_method as Order['payment_method'],
        payment_status: order.payment_status as Order['payment_status'],
        delivery_type: order.delivery_type as Order['delivery_type']
      })) as Order[];

      setOrders(typedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    items: Array<{
      productId: string;
      quantity: number;
      notes?: string;
    }>;
    deliveryType?: 'delivery' | 'pickup';
    paymentMethod?: 'cash' | 'pix' | 'card' | 'credit';
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          restaurantId,
          ...orderData
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Pedido criado",
        description: `Pedido ${data.order.order_number} criado com sucesso`,
      });

      // Refresh orders list
      await fetchOrders();
      
      return data.order;
    } catch (err) {
      console.error('Error creating order:', err);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-order-status', {
        body: {
          orderId,
          status
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Status atualizado",
        description: `Pedido atualizado para ${getStatusLabel(status)}`,
      });

      // Refresh orders list
      await fetchOrders();
      
      return data.order;
    } catch (err) {
      console.error('Error updating order status:', err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido",
        variant: "destructive",
      });
      throw err;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status];
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!restaurantId) return;

    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const orderItemsChannel = supabase
      .channel('order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderItemsChannel);
    };
  }, [restaurantId]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    getStatusLabel,
    getStatusColor,
    formatCurrency,
    refreshOrders: fetchOrders
  };
};