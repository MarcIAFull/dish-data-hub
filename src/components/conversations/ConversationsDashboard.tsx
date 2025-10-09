import { useState } from 'react';
import { useConversationsCompat, Conversation } from '@/hooks/useConversationsCompat';
import { useConversationFilters } from '@/hooks/useConversationFilters';
import { useConversationStats } from '@/hooks/useConversationStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConversationDetail } from './ConversationDetail';
import { ConversationFilters } from './ConversationFilters';
import { ConversationStats } from './ConversationStats';

interface ConversationsDashboardProps {
  restaurantId?: string;
}

export function ConversationsDashboard({ restaurantId }: ConversationsDashboardProps) {
  const { conversations, loading, updateStatus } = useConversationsCompat(restaurantId);
  
  // Hook de estatísticas
  const stats = useConversationStats(conversations);
  
  // Hook de filtros
  const {
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    setSelectedStatuses,
    dateRange,
    setDateRange,
    filteredConversations,
    clearFilters,
    hasActiveFilters
  } = useConversationFilters(conversations);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'ativo':
        return 'bg-green-500';
      case 'ended':
      case 'encerrado':
        return 'bg-gray-500';
      case 'human_handoff':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conversas</h2>
          <p className="text-muted-foreground">
            Gerencie todas as conversas do seu restaurante
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <ConversationStats stats={stats} loading={loading} />

      {/* Filtros */}
      <ConversationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatuses={selectedStatuses}
        onStatusChange={setSelectedStatuses}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        totalCount={conversations.length}
        filteredCount={filteredConversations.length}
      />

      {/* Lista de conversas */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters 
                ? 'Nenhuma conversa encontrada com os filtros aplicados'
                : 'Nenhuma conversa encontrada'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation) => (
            <Card key={conversation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {conversation.phone || 'Sem telefone'}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(conversation.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(conversation.status)}>
                    {conversation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {conversation.messages && conversation.messages.length > 0 ? (
                      <p>{conversation.messages.length} mensagens</p>
                    ) : (
                      <p>Sem mensagens</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewConversation(conversation)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver conversa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet de Detalhes */}
      <ConversationDetail
        conversation={selectedConversation}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={updateStatus}
      />
    </div>
  );
}
