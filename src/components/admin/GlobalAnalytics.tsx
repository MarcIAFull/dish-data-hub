import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Building2, ShoppingCart, TrendingUp } from 'lucide-react';

interface Analytics {
  totalUsers: number;
  totalRestaurants: number;
  activeRestaurants: number;
  totalOrders: number;
}

export function GlobalAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get total users (from profiles)
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get total restaurants
      const { count: restaurantsCount, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      if (restaurantsError) throw restaurantsError;

      // Get active restaurants
      const { count: activeRestaurantsCount, error: activeError } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) throw activeError;

      // Get total orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersError) throw ordersError;

      setAnalytics({
        totalUsers: usersCount || 0,
        totalRestaurants: restaurantsCount || 0,
        activeRestaurants: activeRestaurantsCount || 0,
        totalOrders: ordersCount || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Erro ao carregar analytics',
        description: 'Não foi possível carregar as estatísticas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Restaurantes</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalRestaurants}</div>
          <p className="text-xs text-muted-foreground">Restaurantes cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Restaurantes Ativos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.activeRestaurants}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.totalRestaurants > 0
              ? `${Math.round((analytics.activeRestaurants / analytics.totalRestaurants) * 100)}% do total`
              : '0% do total'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalOrders}</div>
          <p className="text-xs text-muted-foreground">Pedidos registrados</p>
        </CardContent>
      </Card>
    </div>
  );
}
