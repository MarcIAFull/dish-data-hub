import { useNavigate } from 'react-router-dom';
import { useRestaurantsManagement } from '@/hooks/useRestaurantsManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Settings, Eye, Search, Filter, Trash2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function RestaurantManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    restaurants,
    loading,
    filteredRestaurants,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    toggleRestaurantStatus,
    deleteRestaurant,
    duplicateRestaurant,
  } = useRestaurantsManagement();

  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleRestaurantStatus(id, currentStatus);
    toast({
      title: currentStatus ? 'Restaurante desativado' : 'Restaurante ativado',
      description: 'Status atualizado com sucesso',
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja deletar "${name}"?`)) {
      await deleteRestaurant(id);
      toast({
        title: 'Restaurante deletado',
        description: 'Restaurante removido com sucesso',
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    await duplicateRestaurant(id);
    toast({
      title: 'Restaurante duplicado',
      description: 'Uma cópia foi criada com sucesso',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Restaurantes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie, filtre e organize seus restaurantes
          </p>
        </div>
        <Button onClick={() => navigate('/restaurant/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Restaurante
        </Button>
      </div>

      {/* Filters and Search */}
      {restaurants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="created_at">Data de Criação</SelectItem>
                  <SelectItem value="updated_at">Última Atualização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredRestaurants.length} de {restaurants.length} restaurantes
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              >
                {sortDirection === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restaurant List */}
      {filteredRestaurants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {restaurants.length === 0 
                ? 'Nenhum restaurante encontrado' 
                : 'Nenhum restaurante corresponde aos filtros'}
            </p>
            {restaurants.length === 0 && (
              <Button onClick={() => navigate('/restaurant/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Restaurante
              </Button>
            )}
            {restaurants.length > 0 && (
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}>
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {restaurant.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <Badge variant={restaurant.is_active ? 'default' : 'secondary'}>
                    {restaurant.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                {/* Restaurant Info */}
                <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t">
                  {restaurant.address && (
                    <p className="line-clamp-1">📍 {restaurant.address}</p>
                  )}
                  {restaurant.phone && (
                    <p>📞 {restaurant.phone}</p>
                  )}
                  {restaurant.whatsapp && (
                    <p>💬 {restaurant.whatsapp}</p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-2">
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
                    Ver
                  </Button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(restaurant.id, restaurant.is_active)}
                    title={restaurant.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {restaurant.is_active ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(restaurant.id)}
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(restaurant.id, restaurant.name)}
                    title="Deletar"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
