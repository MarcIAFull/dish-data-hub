import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, Customer, OrderItem } from '@/hooks/useOrders';

export interface OrderWithDetails extends Omit<Order, 'customers' | 'order_items'> {
  customers?: Customer;
  order_items?: OrderItem[];
  restaurantId: string;
  restaurantName: string;
}

export const useGlobalOrders = (restaurantIds: string[]) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (restaurantIds.length === 0) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar pedidos com clientes, itens e dados do restaurante
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(
            id,
            name,
            phone,
            email,
            address,
            notes,
            created_at,
            updated_at
          ),
          order_items(
            id,
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            notes,
            created_at,
            products(
              id,
              name,
              image_url,
              price
            )
          ),
          restaurants!inner(
            id,
            name
          )
        `)
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Transformar dados para o formato esperado
      const formattedOrders: OrderWithDetails[] = ordersData?.map(order => ({
        ...order,
        status: order.status as Order['status'],
        delivery_type: order.delivery_type as 'delivery' | 'pickup',
        payment_method: order.payment_method as 'cash' | 'pix' | 'card' | 'credit',
        payment_status: order.payment_status as 'pending' | 'paid' | 'failed',
        restaurantId: order.restaurant_id,
        restaurantName: order.restaurants?.name || 'Restaurante',
        customers: order.customers || undefined,
        order_items: order.order_items?.map(item => ({
          ...item,
          products: {
            ...item.products,
            price: item.products.price || 0
          }
        })) || undefined
      })) || [];

      setOrders(formattedOrders);

    } catch (err) {
      console.error('Erro ao buscar pedidos globais:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      // Invocar função edge para atualizar status
      const { error } = await supabase.functions.invoke('update-order-status', {
        body: {
          orderId,
          status
        }
      });

      if (error) throw error;

      // Atualizar o estado local
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status }
            : order
        )
      );

      return true;
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
      return false;
    }
  };

  const createOrder = async (orderData: {
    restaurantId: string;
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    deliveryAddress?: string;
    deliveryType: 'delivery' | 'pickup';
    paymentMethod: string;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData
      });

      if (error) throw error;

      // Atualizar lista de pedidos
      await fetchOrders();
      return data;
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
      return null;
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
    return labels[status] || status;
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      delivered: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || '';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    fetchOrders();

    // Configurar real-time subscriptions
    const ordersSubscription = supabase
      .channel('global_orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `restaurant_id=in.(${restaurantIds.join(',')})`
        }, 
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const orderItemsSubscription = supabase
      .channel('global_order_items')
      .on('postgres_changes', 
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
      ordersSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
    };
  }, [restaurantIds.join(',')]);

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    getStatusLabel,
    getStatusColor,
    formatCurrency,
    refetch: fetchOrders
  };
};