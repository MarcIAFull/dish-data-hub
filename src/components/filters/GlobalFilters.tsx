import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Filter, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGlobalFilters, GlobalFilters } from '@/hooks/useGlobalFilters';

interface GlobalFiltersProps {
  showStatus?: boolean;
  statusOptions?: { value: string; label: string }[];
  className?: string;
}

export const GlobalFiltersComponent: React.FC<GlobalFiltersProps> = ({
  showStatus = false,
  statusOptions = [],
  className = "",
}) => {
  const { filters, updateFilters, resetFilters, restaurants } = useGlobalFilters();

  const handleRestaurantToggle = (restaurantId: string, checked: boolean) => {
    const newSelected = checked
      ? [...filters.selectedRestaurants, restaurantId]
      : filters.selectedRestaurants.filter(id => id !== restaurantId);
    
    updateFilters({ selectedRestaurants: newSelected });
  };

  const toggleAllRestaurants = () => {
    const allSelected = filters.selectedRestaurants.length === restaurants.length;
    updateFilters({
      selectedRestaurants: allSelected ? [] : restaurants.map(r => r.id),
    });
  };

  const clearDateRange = () => {
    updateFilters({
      dateRange: { from: null, to: null },
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Globais
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Restaurant Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Restaurantes</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllRestaurants}
            >
              {filters.selectedRestaurants.length === restaurants.length ? 'Desmarcar Todos' : 'Marcar Todos'}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {filters.selectedRestaurants.map(id => {
              const restaurant = restaurants.find(r => r.id === id);
              return restaurant ? (
                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                  {restaurant.name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleRestaurantToggle(id, false)}
                  />
                </Badge>
              ) : null;
            })}
          </div>

          <ScrollArea className="h-32 border rounded-md p-3">
            <div className="space-y-2">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={restaurant.id}
                    checked={filters.selectedRestaurants.includes(restaurant.id)}
                    onCheckedChange={(checked) => 
                      handleRestaurantToggle(restaurant.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={restaurant.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {restaurant.name}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Período</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Data inicial"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from || undefined}
                  onSelect={(date) => 
                    updateFilters({
                      dateRange: { ...filters.dateRange, from: date || null }
                    })
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.to ? (
                    format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Data final"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to || undefined}
                  onSelect={(date) => 
                    updateFilters({
                      dateRange: { ...filters.dateRange, to: date || null }
                    })
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {(filters.dateRange.from || filters.dateRange.to) && (
              <Button variant="outline" size="icon" onClick={clearDateRange}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Buscar</Label>
          <Input
            placeholder="Digite para buscar..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          />
        </div>

        {/* Status Filter (Optional) */}
        {showStatus && statusOptions.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => updateFilters({ status: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};