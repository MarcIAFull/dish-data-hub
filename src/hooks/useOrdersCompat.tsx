import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  chat_id: string;
  status: string;
  restaurant_id?: string;
  customer_id?: string;
  total?: number;
  created_at: string;
  updated_at?: string;
  payload?: any;
}

export function useOrdersCompat(restaurantId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Buscar pedidos usando a view de compatibilidade
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar por restaurant_id se fornecido
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (chatId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: newStatus,
          status_to: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('chat_id', chatId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'Status do pedido atualizado com sucesso'
      });

      await fetchOrders();
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'indefinido').length;
    const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      total,
      pending,
      completed,
      totalValue
    };
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  return {
    orders,
    loading,
    stats: getOrderStats(),
    refetch: fetchOrders,
    updateStatus: updateOrderStatus
  };
}
