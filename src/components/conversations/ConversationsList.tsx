import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Bot, User, CheckCircle2, Store } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation } from '@/hooks/useConversationsCompat';
import { getUnreadCount } from '@/hooks/useConversationsCompat';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRestaurantColor } from '@/lib/restaurantColors';

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
  restaurants = [],
  selectedRestaurantFilter,
  onRestaurantFilterChange
}: ConversationsListProps) {
  
  // Filtrar conversas baseado no modo
  const filteredConversations = conversations.filter(conv => {
    if (filterMode === 'all') return true;
    if (filterMode === 'ai') return (conv as any).ai_enabled !== false && conv.status !== 'ended';
    if (filterMode === 'human') return (conv as any).ai_enabled === false && conv.status !== 'ended';
    if (filterMode === 'ended') return conv.status === 'ended';
    return true;
  });
  
  const getLastMessage = (conv: Conversation) => {
    if (!conv.messages || conv.messages.length === 0) return 'Sem mensagens';
    const lastMsg = conv.messages[conv.messages.length - 1];
    const content = lastMsg.user_message || lastMsg.bot_message || '';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const getLastMessageTime = (conv: Conversation) => {
    if (!conv.messages || conv.messages.length === 0) return '';
    const lastMsg = conv.messages[conv.messages.length - 1];
    return formatDistanceToNow(new Date(lastMsg.created_at), {
      addSuffix: false,
      locale: ptBR
    });
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="bg-primary p-4 text-primary-foreground">
        <h2 className="text-xl font-semibold mb-3">Conversas</h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-primary-foreground/90 border-0"
          />
        </div>

        {/* Filtro de Restaurante */}
        {restaurants.length > 1 && onRestaurantFilterChange && (
          <Select
            value={selectedRestaurantFilter || 'all'}
            onValueChange={(value) => onRestaurantFilterChange(value === 'all' ? null : value)}
          >
            <SelectTrigger className="mb-3 bg-primary-foreground/90 border-0">
              <SelectValue placeholder="Todos os restaurantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Todos os restaurantes
                </div>
              </SelectItem>
              {restaurants.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {r.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Filtros */}
        <Tabs value={filterMode} onValueChange={(v) => onFilterChange(v as FilterMode)} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-primary-foreground/10">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">
              Todas
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">
              <Bot className="h-3 w-3 mr-1" />
              IA
            </TabsTrigger>
            <TabsTrigger value="human" className="text-xs data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">
              <User className="h-3 w-3 mr-1" />
              Humano
            </TabsTrigger>
            <TabsTrigger value="ended" className="text-xs data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Fim
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conv) => {
              const unreadCount = getUnreadCount(conv);
              const isSelected = conv.id === selectedId;
              const aiEnabled = (conv as any).ai_enabled !== false;
              const isEnded = conv.status === 'ended';
              
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={`p-4 cursor-pointer transition-all hover:bg-accent/50 border-l-4 ${
                    isSelected 
                      ? 'bg-accent border-l-primary' 
                      : isEnded 
                        ? 'border-l-muted-foreground/30 opacity-70'
                        : aiEnabled
                          ? 'border-l-green-500'
                          : 'border-l-orange-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <h3 className="font-semibold">
                        📱 {conv.phone || 'Sem telefone'}
                      </h3>
                      
                      {/* Badge do Restaurante */}
                      {conv.restaurant ? (
                        <Badge 
                          variant="secondary" 
                          className={`h-5 px-2 text-xs font-medium ${getRestaurantColor(conv.restaurant.id)}`}
                        >
                          <Store className="h-3 w-3 mr-1" />
                          {conv.restaurant.name}
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="h-5 px-2 text-xs bg-gray-50 text-gray-500 border-gray-200"
                        >
                          ⚠️ Sem restaurante
                        </Badge>
                      )}
                      
                      {isEnded ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-xs bg-muted">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                      ) : aiEnabled ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-xs bg-green-50 text-green-700 border-green-200">
                          <Bot className="h-3 w-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-5 px-1.5 text-xs bg-orange-50 text-orange-700 border-orange-200">
                          <User className="h-3 w-3" />
                        </Badge>
                      )}
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {getLastMessageTime(conv)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {getLastMessage(conv)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
