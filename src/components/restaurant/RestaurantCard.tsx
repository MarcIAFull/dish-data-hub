import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Settings, 
  ExternalLink, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Power, 
  PowerOff,
  ShoppingCart,
  MessageCircle,
  Package,
  Euro
} from 'lucide-react';
import { RestaurantWithStats } from '@/hooks/useRestaurantsManagement';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RestaurantCardProps {
  restaurant: RestaurantWithStats;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function RestaurantCard({ 
  restaurant, 
  isSelected, 
  onSelect, 
  onToggleStatus, 
  onDelete, 
  onDuplicate 
}: RestaurantCardProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {restaurant.name}
                <Badge variant={restaurant.is_active ? 'default' : 'secondary'} className="text-xs">
                  {restaurant.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <span>/{restaurant.slug}</span>
                {restaurant.stats.lastOrderDate && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Último pedido {formatDate(restaurant.stats.lastOrderDate)}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/restaurant/${restaurant.id}`)}>
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/r/${restaurant.slug}`, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Página
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDuplicate(restaurant.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onToggleStatus(restaurant.id, !restaurant.is_active)}
              >
                {restaurant.is_active ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {restaurant.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {restaurant.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <span>{restaurant.stats.totalOrders} pedidos</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span>{formatCurrency(restaurant.stats.totalRevenue)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span>{restaurant.stats.totalProducts} produtos</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <span>{restaurant.stats.activeConversations} conversas</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => window.open(`/r/${restaurant.slug}`, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Página
          </Button>
        </div>
      </CardContent>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Restaurante</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir "{restaurant.name}"? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete(restaurant.id);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}