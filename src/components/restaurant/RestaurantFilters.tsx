import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical, 
  Power, 
  PowerOff, 
  Trash2,
  Download,
  Plus,
  X
} from 'lucide-react';

interface RestaurantFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (filter: 'all' | 'active' | 'inactive') => void;
  sortBy: 'name' | 'created_at' | 'updated_at' | 'orders';
  onSortByChange: (sort: 'name' | 'created_at' | 'updated_at' | 'orders') => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
  onCreateNew: () => void;
  onExport: () => void;
  canCreateNew: boolean;
}

export function RestaurantFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onSelectNone,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onCreateNew,
  onExport,
  canCreateNew,
}: RestaurantFiltersProps) {
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar restaurantes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select 
            value={`${sortBy}-${sortDirection}`} 
            onValueChange={(value) => {
              const [sort, direction] = value.split('-') as [typeof sortBy, typeof sortDirection];
              onSortByChange(sort);
              onSortDirectionChange(direction);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Mais recente</SelectItem>
              <SelectItem value="created_at-asc">Mais antigo</SelectItem>
              <SelectItem value="name-asc">Nome A-Z</SelectItem>
              <SelectItem value="name-desc">Nome Z-A</SelectItem>
              <SelectItem value="orders-desc">Mais pedidos</SelectItem>
              <SelectItem value="orders-asc">Menos pedidos</SelectItem>
              <SelectItem value="updated_at-desc">Atualizado recente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onExport}
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            onClick={onCreateNew}
            disabled={!canCreateNew}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Restaurante
          </Button>
        </div>
      </div>

      {/* Selection toolbar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedCount} de {totalCount} selecionado(s)
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                Selecionar todos
              </Button>
              <Button variant="outline" size="sm" onClick={onSelectNone}>
                Limpar seleção
              </Button>
            </div>
          </div>

          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkActivate}
            >
              <Power className="w-4 h-4 mr-2" />
              Ativar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkDeactivate}
            >
              <PowerOff className="w-4 h-4 mr-2" />
              Desativar
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedCount} restaurante(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir {selectedCount} restaurante(s) selecionado(s)? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onBulkDelete();
                setBulkDeleteDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir {selectedCount} restaurante(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}