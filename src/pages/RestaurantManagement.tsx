import { useNavigate } from 'react-router-dom';
import { useRestaurantsManagement } from '@/hooks/useRestaurantsManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Settings, Eye } from 'lucide-react';

export default function RestaurantManagement() {
  const navigate = useNavigate();
  const { restaurants, loading } = useRestaurantsManagement();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Restaurantes</h1>
          <p className="text-muted-foreground mt-2">Gerencie todos os seus restaurantes</p>
        </div>
        <Button onClick={() => navigate('/restaurant/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Restaurante
        </Button>
      </div>

      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum restaurante encontrado</p>
            <Button onClick={() => navigate('/restaurant/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Restaurante
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{restaurant.name}</CardTitle>
                    <CardDescription>{restaurant.description || 'Sem descrição'}</CardDescription>
                  </div>
                  <Badge variant={restaurant.is_active ? 'default' : 'secondary'}>
                    {restaurant.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/r/${restaurant.slug}`, '_blank')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
