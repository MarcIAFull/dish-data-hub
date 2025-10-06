import { useAuth } from '@/hooks/useAuth';
import { useRestaurantsManagement } from '@/hooks/useRestaurantsManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Store, Settings, MessageSquare, ShoppingBag, TrendingUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { restaurants, loading, totalRestaurants, activeRestaurants } = useRestaurantsManagement();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const inactiveRestaurants = totalRestaurants - activeRestaurants;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo, {user?.email}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Restaurantes</CardTitle>
            <Store className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRestaurants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Seus restaurantes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurantes Ativos</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeRestaurants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Disponíveis para pedidos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurantes Inativos</CardTitle>
            <Store className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{inactiveRestaurants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Temporariamente pausados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalRestaurants > 0 ? Math.round((activeRestaurants / totalRestaurants) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Restaurantes operacionais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/restaurant/new')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Novo Restaurante</CardTitle>
                <CardDescription className="text-xs">Cadastrar estabelecimento</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/restaurant/manage')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-base">Gerenciar</CardTitle>
                <CardDescription className="text-xs">Editar restaurantes</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/conversations')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">Conversas</CardTitle>
                <CardDescription className="text-xs">Central de atendimento</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">Pedidos</CardTitle>
                <CardDescription className="text-xs">Gestão de pedidos</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Restaurants */}
      {restaurants.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Restaurantes Recentes</CardTitle>
                <CardDescription>Últimos restaurantes cadastrados</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/restaurant/manage')}>
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.slice(0, 3).map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {restaurant.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        restaurant.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {restaurant.is_active ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(`/r/${restaurant.slug}`, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {restaurants.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum restaurante cadastrado</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Comece criando seu primeiro restaurante para começar a receber pedidos online
            </p>
            <Button onClick={() => navigate('/restaurant/new')} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeiro Restaurante
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
