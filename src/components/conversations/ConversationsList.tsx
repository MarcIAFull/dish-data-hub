import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Archive } from 'lucide-react';
import type { Conversation } from '@/hooks/useConversationsCompat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConversationCard } from './ConversationCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FilterMode = 'all' | 'ai' | 'human' | 'ended';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
  restaurants?: Array<{ id: string; name: string }>;
  selectedRestaurantFilter?: string | null;
  onRestaurantFilterChange?: (restaurantId: string | null) => void;
}

export function ConversationsList({
  conversations,
  selectedId,
  onSelect,
  searchTerm,
  onSearchChange,
  filterMode,
  onFilterChange,
  restaurants,
  selectedRestaurantFilter,
  onRestaurantFilterChange
}: ConversationsListProps) {
  const [showArchived, setShowArchived] = useState(false);

  // Aplicar filtros
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Filtro de arquivo
      const isArchived = !!(conv as any).archived_at;
      if (showArchived !== isArchived) return false;

      // Filtro por modo (all/ai/human/ended)
      if (filterMode === 'ai' && !(conv as any).ai_enabled) return false;
      if (filterMode === 'human' && (conv as any).ai_enabled) return false;
      if (filterMode === 'ended' && conv.status !== 'ended' && conv.status !== 'encerrado') return false;
      
      return true;
    });
  }, [conversations, filterMode, showArchived]);

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Tabs para Ativas/Arquivadas */}
      <div className="border-b border-border">
        <Tabs value={showArchived ? 'archived' : 'active'} onValueChange={(v) => setShowArchived(v === 'archived')}>
          <TabsList className="w-full grid grid-cols-2 h-10">
            <TabsTrigger value="active" className="text-xs">
              Ativas ({conversations.filter(c => !(c as any).archived_at).length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              <Archive className="h-3 w-3 mr-1" />
              Arquivadas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Header com busca e filtros */}
      <div className="p-3 space-y-2 border-b border-border bg-muted/30">
        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por telefone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        {/* Filtro de Restaurante */}
        {restaurants && restaurants.length > 1 && (
          <Select
            value={selectedRestaurantFilter || 'all'}
            onValueChange={(value) => onRestaurantFilterChange?.(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Todos os restaurantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                🏪 Todos os restaurantes
              </SelectItem>
              {restaurants.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filtros de tipo (All/IA/Humano/Fim) */}
        <div className="flex gap-1.5">
          <Button
            variant={filterMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
            className="flex-1 h-8 text-xs"
          >
            Todas
          </Button>
          <Button
            variant={filterMode === 'ai' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('ai')}
            className="flex-1 h-8 text-xs"
          >
            IA
          </Button>
          <Button
            variant={filterMode === 'human' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('human')}
            className="flex-1 h-8 text-xs"
          >
            Humano
          </Button>
          <Button
            variant={filterMode === 'ended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('ended')}
            className="flex-1 h-8 text-xs"
          >
            Fim
          </Button>
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onSelect={() => onSelect(conv)}
                showRestaurant={!selectedRestaurantFilter}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
