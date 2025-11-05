import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';

type OrderSource = 'ai_agent' | 'manual' | 'marketplace';
type DeliveryType = 'delivery' | 'pickup';

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSources: OrderSource[];
  onSourceChange: (sources: OrderSource[]) => void;
  selectedDeliveryTypes: DeliveryType[];
  onDeliveryTypeChange: (types: DeliveryType[]) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClearFilters: () => void;
}

const sourceLabels: Record<OrderSource, string> = {
  ai_agent: 'IA',
  manual: 'Manual',
  marketplace: 'Marketplace'
};

const deliveryLabels: Record<DeliveryType, string> = {
  delivery: 'Entrega',
  pickup: 'Retirada'
};

export function OrderFilters({
  searchTerm,
  onSearchChange,
  selectedSources,
  onSourceChange,
  selectedDeliveryTypes,
  onDeliveryTypeChange,
  dateRange,
  onDateRangeChange,
  onClearFilters
}: OrderFiltersProps) {
  const hasActiveFilters = 
    searchTerm || 
    selectedSources.length > 0 || 
    selectedDeliveryTypes.length > 0 || 
    dateRange?.from;

  const toggleSource = (source: OrderSource) => {
    if (selectedSources.includes(source)) {
      onSourceChange(selectedSources.filter(s => s !== source));
    } else {
      onSourceChange([...selectedSources, source]);
    }
  };

  const toggleDeliveryType = (type: DeliveryType) => {
    if (selectedDeliveryTypes.includes(type)) {
      onDeliveryTypeChange(selectedDeliveryTypes.filter(t => t !== type));
    } else {
      onDeliveryTypeChange([...selectedDeliveryTypes, type]);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome ou telefone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Origem */}
        <div className="space-y-2">
          <Label>Origem</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(sourceLabels) as OrderSource[]).map(source => (
              <Badge
                key={source}
                variant={selectedSources.includes(source) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSource(source)}
              >
                {sourceLabels[source]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tipo de Entrega */}
        <div className="space-y-2">
          <Label>Tipo de Entrega</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(deliveryLabels) as DeliveryType[]).map(type => (
              <Badge
                key={type}
                variant={selectedDeliveryTypes.includes(type) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleDeliveryType(type)}
              >
                {deliveryLabels[type]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label>Período</Label>
          <DatePickerWithRange
            date={dateRange}
            setDate={onDateRangeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
