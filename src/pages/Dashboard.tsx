import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRestaurantsManagement } from '@/hooks/useRestaurantsManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RestaurantFilters } from '@/components/restaurant/RestaurantFilters';
import { Plus, ChefHat, LogOut, Crown, Zap, Bot, AlertCircle, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

console.log('Dashboard component loaded - icons:', { Plus, ChefHat, LogOut });

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { subscription, hasFeature, isWithinLimits } = useSubscription();
  const { progress, isCompleted, currentStep } = useOnboarding();
  const navigate = useNavigate();
  
  // Use advanced restaurant management hook
  const {
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
  } = useRestaurantsManagement();

  // Selection state for bulk operations
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Selection handlers
  const handleSelectRestaurant = (id: string, selected: boolean) => {
    setSelectedRestaurants(prev => 
      selected 
        ? [...prev, id]
        : prev.filter(resId => resId !== id)
    );
  };

  const handleSelectAll = () => {
    setSelectedRestaurants(filteredRestaurants.map(r => r.id));
  };

  const handleSelectNone = () => {
    setSelectedRestaurants([]);
  };

  // Bulk operations
  const handleBulkActivate = () => {
    bulkToggleStatus(selectedRestaurants, true);
    setSelectedRestaurants([]);
  };

  const handleBulkDeactivate = () => {
    bulkToggleStatus(selectedRestaurants, false);
    setSelectedRestaurants([]);
  };

  const handleBulkDelete = () => {
    // Delete multiple restaurants
    Promise.all(selectedRestaurants.map(id => deleteRestaurant(id)))
      .then(() => {
        setSelectedRestaurants([]);
      });
  };

  const handleExport = () => {
    // Export restaurants data as CSV
    const csvData = filteredRestaurants.map(restaurant => ({
      Nome: restaurant.name,
      Slug: restaurant.slug,
      Status: restaurant.is_active ? 'Ativo' : 'Inativo',
      Pedidos: restaurant.stats.totalOrders,
      Receita: restaurant.stats.totalRevenue,
      Produtos: restaurant.stats.totalProducts,
      Criado: new Date(restaurant.created_at).toLocaleDateString('pt-BR'),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurantes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Computed stats
  const totalRevenue = restaurants.reduce((sum, r) => sum + r.stats.totalRevenue, 0);
  const totalOrders = restaurants.reduce((sum, r) => sum + r.stats.totalOrders, 0);
  const totalProducts = restaurants.reduce((sum, r) => sum + r.stats.totalProducts, 0);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!loading && progress && !isCompleted && currentStep < 5) {
      navigate('/onboarding');
    }
  }, [progress, isCompleted, currentStep, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Olá, {user?.user_metadata?.display_name || user?.email}! Gerencie seus restaurantes.
            </p>
          </div>
          <div className="flex gap-2">
            {subscription && (
              <div className="flex items-center gap-2">
                <Badge variant={subscription.plan.type === 'free' ? 'secondary' : 'default'}>
                  {subscription.plan.type === 'free' && <Zap className="w-3 h-3 mr-1" />}
                  {subscription.plan.type === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                  {subscription.plan.name}
                </Badge>
              </div>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRestaurants}</div>
              <p className="text-xs text-muted-foreground">
                {activeRestaurants} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Todos os restaurantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Total de pedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Total no catálogo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status Card */}
        {subscription && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Status da Assinatura
                  </CardTitle>
                  <CardDescription>
                    Plano {subscription.plan.name} - {subscription.plan.type}
                  </CardDescription>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status === 'active' ? 'Ativo' : subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Restaurantes</p>
                  <p className="text-2xl font-bold">
                    {restaurants.length}/{subscription.plan.max_restaurants}
                  </p>
                  <Progress 
                    value={(restaurants.length / subscription.plan.max_restaurants) * 100} 
                    className="mt-2"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Recursos Inclusos</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {subscription.plan.ai_classification && (
                      <Badge variant="outline" className="text-xs">IA</Badge>
                    )}
                    {subscription.plan.whatsapp_integration && (
                      <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                    )}
                    {subscription.plan.analytics && (
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                    )}
                    {subscription.plan.api_access && (
                      <Badge variant="outline" className="text-xs">API</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Preço</p>
                  <p className="text-2xl font-bold">
                    €{subscription.plan.price_monthly}{subscription.plan.price_monthly > 0 && '/mês'}
                  </p>
                  {subscription.plan.type === 'free' && (
                    <Button variant="outline" size="sm" className="mt-2">
                      Fazer Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Limits Warning */}
        {subscription && !isWithinLimits('restaurants', restaurants.length) && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">
                  Limite de restaurantes atingido! Faça upgrade para adicionar mais restaurantes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {totalRestaurants === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle>Nenhum restaurante cadastrado</CardTitle>
                <CardDescription>
                  Crie seu primeiro restaurante para começar a gerenciar seu menu
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate('/restaurant/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Restaurante
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters and Controls */}
              <RestaurantFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                selectedCount={selectedRestaurants.length}
                totalCount={totalRestaurants}
                onSelectAll={handleSelectAll}
                onSelectNone={handleSelectNone}
                onBulkActivate={handleBulkActivate}
                onBulkDeactivate={handleBulkDeactivate}
                onBulkDelete={handleBulkDelete}
                onCreateNew={() => navigate('/restaurant/new')}
                onExport={handleExport}
                canCreateNew={!subscription || isWithinLimits('restaurants', restaurants.length)}
              />

              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredRestaurants.length === totalRestaurants 
                    ? `${totalRestaurants} restaurante(s)`
                    : `${filteredRestaurants.length} de ${totalRestaurants} restaurante(s)`
                  }
                </p>
              </div>

              {/* Restaurant Grid */}
              {filteredRestaurants.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum restaurante encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Tente ajustar os filtros ou criar um novo restaurante.
                    </p>
                    <Button 
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      variant="outline"
                    >
                      Limpar filtros
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      isSelected={selectedRestaurants.includes(restaurant.id)}
                      onSelect={(selected) => handleSelectRestaurant(restaurant.id, selected)}
                      onToggleStatus={toggleRestaurantStatus}
                      onDelete={deleteRestaurant}
                      onDuplicate={duplicateRestaurant}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}