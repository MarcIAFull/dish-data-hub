import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface RestaurantStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCategories: number;
  activeConversations: number;
  lastOrderDate: string | null;
}

export interface RestaurantWithStats extends Restaurant {
  stats: RestaurantStats;
}

interface UseRestaurantsManagement {
  restaurants: RestaurantWithStats[];
  loading: boolean;
  error: string | null;
  totalRestaurants: number;
  activeRestaurants: number;
  // Actions
  fetchRestaurants: () => Promise<void>;
  toggleRestaurantStatus: (id: string, isActive: boolean) => Promise<void>;
  deleteRestaurant: (id: string) => Promise<boolean>;
  duplicateRestaurant: (id: string) => Promise<boolean>;
  bulkToggleStatus: (ids: string[], isActive: boolean) => Promise<void>;
  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  sortBy: 'name' | 'created_at' | 'updated_at' | 'orders';
  setSortBy: (sort: 'name' | 'created_at' | 'updated_at' | 'orders') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  // Computed
  filteredRestaurants: RestaurantWithStats[];
}

export function useRestaurantsManagement(): UseRestaurantsManagement {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at' | 'orders'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      fetchRestaurants();
    }
  }, [user]);

  const fetchRestaurants = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Iniciando carregamento de restaurantes para usuário:', user.id);

      // Step 1: Fetch basic restaurant data
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (restaurantsError) {
        console.error('❌ Erro ao buscar restaurantes:', restaurantsError);
        throw restaurantsError;
      }

      console.log('✅ Restaurantes carregados:', restaurantsData?.length || 0);

      if (!restaurantsData || restaurantsData.length === 0) {
        setRestaurants([]);
        return;
      }

      // Step 2: Fetch stats for each restaurant separately
      const restaurantsWithStats: RestaurantWithStats[] = await Promise.all(
        restaurantsData.map(async (restaurant) => {
          try {
            // Fetch orders
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('id, total, created_at, status')
              .eq('restaurant_id', restaurant.id);

            if (ordersError) {
              console.error(`❌ Erro ao buscar pedidos para restaurante ${restaurant.id}:`, ordersError);
            }

            // Fetch categories
            const { data: categoriesData, error: categoriesError } = await supabase
              .from('categories')
              .select('id')
              .eq('restaurant_id', restaurant.id);

            if (categoriesError) {
              console.error(`❌ Erro ao buscar categorias para restaurante ${restaurant.id}:`, categoriesError);
            }

            // Fetch products
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select('id')
              .in('category_id', (categoriesData || []).map(c => c.id));

            if (productsError) {
              console.error(`❌ Erro ao buscar produtos para restaurante ${restaurant.id}:`, productsError);
            }

            // Fetch active conversations through agents
            const { data: agentsData, error: agentsError } = await supabase
              .from('agents')
              .select('id')
              .eq('restaurant_id', restaurant.id);

            let activeConversations = 0;
            if (!agentsError && agentsData && agentsData.length > 0) {
              const { data: conversationsData, error: conversationsError } = await supabase
                .from('conversations')
                .select('id')
                .in('agent_id', agentsData.map(a => a.id))
                .eq('status', 'active');

              if (!conversationsError) {
                activeConversations = conversationsData?.length || 0;
              } else {
                console.error(`❌ Erro ao buscar conversações para restaurante ${restaurant.id}:`, conversationsError);
              }
            }

            // Calculate stats
            const orders = ordersData || [];
            const categories = categoriesData || [];
            const products = productsData || [];

            const completedOrders = orders.filter(order => order.status === 'completed');
            const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
            const lastOrder = orders.length > 0 ? orders.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0] : null;

            console.log(`📊 Stats para ${restaurant.name}:`, {
              totalOrders: orders.length,
              totalRevenue,
              totalProducts: products.length,
              totalCategories: categories.length,
              activeConversations,
            });

            return {
              ...restaurant,
              stats: {
                totalOrders: orders.length,
                totalRevenue,
                totalProducts: products.length,
                totalCategories: categories.length,
                activeConversations,
                lastOrderDate: lastOrder?.created_at || null,
              }
            };
          } catch (error) {
            console.error(`❌ Erro ao calcular stats para restaurante ${restaurant.id}:`, error);
            // Return restaurant with empty stats as fallback
            return {
              ...restaurant,
              stats: {
                totalOrders: 0,
                totalRevenue: 0,
                totalProducts: 0,
                totalCategories: 0,
                activeConversations: 0,
                lastOrderDate: null,
              }
            };
          }
        })
      );

      console.log('✅ Todos os restaurantes processados com sucesso');
      setRestaurants(restaurantsWithStats);

    } catch (error: any) {
      console.error('❌ Erro crítico ao carregar restaurantes:', error);
      setError(error.message);
      
      // Fallback: try to load just basic restaurant data
      try {
        console.log('🔄 Tentando carregamento básico como fallback...');
        const { data: basicRestaurants, error: basicError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!basicError && basicRestaurants) {
          const restaurantsWithEmptyStats = basicRestaurants.map(restaurant => ({
            ...restaurant,
            stats: {
              totalOrders: 0,
              totalRevenue: 0,
              totalProducts: 0,
              totalCategories: 0,
              activeConversations: 0,
              lastOrderDate: null,
            }
          }));
          setRestaurants(restaurantsWithEmptyStats);
          console.log('✅ Carregamento básico realizado com sucesso');
        } else {
          throw basicError;
        }
      } catch (fallbackError) {
        console.error('❌ Falha no carregamento básico:', fallbackError);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os restaurantes',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurantStatus = async (id: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setRestaurants(prev => 
        prev.map(restaurant => 
          restaurant.id === id ? { ...restaurant, is_active: isActive } : restaurant
        )
      );

      toast({
        title: 'Sucesso',
        description: `Restaurante ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do restaurante',
        variant: 'destructive',
      });
    }
  };

  const deleteRestaurant = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Restaurante excluído com sucesso',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o restaurante',
        variant: 'destructive',
      });
      return false;
    }
  };

  const duplicateRestaurant = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const original = restaurants.find(r => r.id === id);
      if (!original) throw new Error('Restaurante não encontrado');

      const { data, error } = await supabase
        .from('restaurants')
        .insert([{
          name: `${original.name} (Cópia)`,
          slug: `${original.slug}-copy-${Date.now()}`,
          description: original.description,
          address: original.address,
          phone: original.phone,
          whatsapp: original.whatsapp,
          instagram: original.instagram,
          is_active: false,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchRestaurants(); // Refresh the list
      
      toast({
        title: 'Sucesso',
        description: 'Restaurante duplicado com sucesso',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o restaurante',
        variant: 'destructive',
      });
      return false;
    }
  };

  const bulkToggleStatus = async (ids: string[], isActive: boolean) => {
    if (!user || ids.length === 0) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: isActive })
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;

      setRestaurants(prev => 
        prev.map(restaurant => 
          ids.includes(restaurant.id) ? { ...restaurant, is_active: isActive } : restaurant
        )
      );

      toast({
        title: 'Sucesso',
        description: `${ids.length} restaurante(s) ${isActive ? 'ativado(s)' : 'desativado(s)'} com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status dos restaurantes',
        variant: 'destructive',
      });
    }
  };

  // Computed values
  const filteredRestaurants = restaurants
    .filter(restaurant => {
      // Search filter
      if (searchTerm && !restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !restaurant.slug.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'active' && !restaurant.is_active) return false;
      if (statusFilter === 'inactive' && restaurant.is_active) return false;
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'orders':
          aValue = a.stats.totalOrders;
          bValue = b.stats.totalOrders;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter(r => r.is_active).length;

  return {
    restaurants,
    loading,
    error,
    totalRestaurants,
    activeRestaurants,
    fetchRestaurants,
    toggleRestaurantStatus,
    deleteRestaurant,
    duplicateRestaurant,
    bulkToggleStatus,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filteredRestaurants,
  };
}