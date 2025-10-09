import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { 
  Search, 
  X, 
  Filter
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DateRange } from 'react-day-picker';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativas', color: 'bg-green-500' },
  { value: 'ended', label: 'Encerradas', color: 'bg-gray-500' },
  { value: 'human_handoff', label: 'Transferidas', color: 'bg-yellow-500' },
  { value: 'indefinido', label: 'Indefinido', color: 'bg-blue-500' }
];

interface ConversationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
}

export function ConversationFilters({
  searchTerm,
  onSearchChange,
  selectedStatuses,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
  totalCount,
  filteredCount
}: ConversationFiltersProps) {
  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por telefone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtro de Status */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Status
              {selectedStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedStatuses.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="font-medium text-sm">Filtrar por status</div>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={selectedStatuses.includes(option.value)}
                      onCheckedChange={() => toggleStatus(option.value)}
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtro de Período */}
        <DatePickerWithRange
          date={dateRange}
          setDate={onDateRangeChange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Status dos Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Contador */}
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{filteredCount}</span> de{' '}
            <span className="font-medium text-foreground">{totalCount}</span> conversas
          </p>

          {/* Badges de Filtros Ativos */}
          {selectedStatuses.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Status: {selectedStatuses.length}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onStatusChange([])}
              />
            </Badge>
          )}

          {dateRange?.from && (
            <Badge variant="secondary" className="gap-1">
              Período aplicado
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onDateRangeChange(undefined)}
              />
            </Badge>
          )}
        </div>

        {/* Botão Limpar */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
