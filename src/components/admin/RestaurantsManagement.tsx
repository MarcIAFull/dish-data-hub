import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, User, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
}

export function RestaurantsManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);

      // Admin can see all restaurants (no RLS filter needed due to admin policy)
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRestaurants(data || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast({
        title: 'Erro ao carregar restaurantes',
        description: 'Não foi possível carregar a lista de restaurantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'Status do restaurante atualizado com sucesso.',
      });

      loadRestaurants();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gestão Global de Restaurantes
        </CardTitle>
        <CardDescription>
          Visualize e gerencie todos os restaurantes cadastrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 border rounded-lg"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                  <Badge variant={restaurant.is_active ? 'default' : 'secondary'}>
                    {restaurant.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                {restaurant.description && (
                  <p className="text-sm text-muted-foreground">{restaurant.description}</p>
                )}

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {restaurant.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {restaurant.address}
                    </span>
                  )}
                  {restaurant.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {restaurant.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    ID do proprietário: {restaurant.user_id.slice(0, 8)}...
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  Visualizar
                </Button>
                <Button
                  variant={restaurant.is_active ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => toggleStatus(restaurant.id, restaurant.is_active)}
                >
                  {restaurant.is_active ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          ))}

          {restaurants.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum restaurante cadastrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
