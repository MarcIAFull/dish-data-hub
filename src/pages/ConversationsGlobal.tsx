import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, User, Clock, Phone, Store, Loader2, AlertTriangle } from 'lucide-react';
import { useGlobalConversations } from '@/hooks/useGlobalConversations';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { ConversationDetail } from '@/components/conversations/ConversationDetail';
import { GlobalFiltersComponent } from '@/components/filters/GlobalFilters';
import { Alert, AlertDescription } from '@/components/ui/alert';

const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'ended', label: 'Finalizado' },
  { value: 'human_handoff', label: 'Atendimento Humano' },
];

export default function ConversationsGlobal() {
  const { filters, restaurants } = useGlobalFilters();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Use the new global conversations hook
  const { 
    conversations: allConversations, 
    loading, 
    error, 
    sendMessage,
    updateConversationStatus,
    markMessagesAsRead 
  } = useGlobalConversations(filters.selectedRestaurants);

  // Apply filters
  const filteredConversations = allConversations.filter(conversation => {
    // Status filter
    if (filters.status && conversation.status !== filters.status) {
      return false;
    }
    
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        conversation.customer_name?.toLowerCase().includes(searchLower) ||
        conversation.customer_phone?.includes(searchLower) ||
        conversation.restaurantName.toLowerCase().includes(searchLower)
      );
    }
    
    // Date filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const conversationDate = new Date(conversation.created_at);
      if (filters.dateRange.from && conversationDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && conversationDate > filters.dateRange.to) {
        return false;
      }
    }
    
    return true;
  });

  // Sort by most recent
  const sortedConversations = filteredConversations.sort((a, b) => 
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      ended: 'outline',
      human_handoff: 'destructive'
    };

    const labels = {
      active: 'Ativo',
      paused: 'Pausado',
      ended: 'Finalizado',
      human_handoff: 'Atendimento Humano'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getUnreadCount = (conversation: any) => {
    return conversation.messages?.filter((msg: any) => 
      !msg.is_read && msg.sender_type === 'customer'
    ).length || 0;
  };

  const selectedConversation = sortedConversations.find(conv => conv.id === selectedConversationId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Central de Conversas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as conversas WhatsApp dos seus restaurantes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <GlobalFiltersComponent 
                showStatus={true}
                statusOptions={statusOptions}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Loading State */}
              {loading && (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Carregando conversas...</span>
                  </CardContent>
                </Card>
              )}

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar conversas: {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversations List */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Conversas
                      </CardTitle>
                      <CardDescription>
                        {sortedConversations.length} conversas encontradas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[700px]">
                        {sortedConversations.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground">
                            <MessageCircle className="mx-auto h-8 w-8 mb-4" />
                            <p>Nenhuma conversa encontrada</p>
                            <p className="text-sm mt-2">
                              Ajuste os filtros ou aguarde novas conversas
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 p-2">
                            {sortedConversations.map((conversation) => {
                              const unreadCount = getUnreadCount(conversation);
                              const isSelected = selectedConversationId === conversation.id;
                              
                              return (
                                <div
                                  key={conversation.id}
                                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    isSelected 
                                      ? 'bg-primary/10 border-primary' 
                                      : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => setSelectedConversationId(conversation.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <Avatar className="h-10 w-10">
                                        <AvatarFallback>
                                          <User className="h-4 w-4" />
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <p className="font-medium text-sm truncate">
                                            {conversation.customer_name}
                                          </p>
                                          {unreadCount > 0 && (
                                            <Badge variant="destructive" className="text-xs">
                                              {unreadCount}
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Store className="h-3 w-3" />
                                          {conversation.restaurantName}
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Phone className="h-3 w-3" />
                                          {conversation.customer_phone}
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                          <Clock className="h-3 w-3" />
                                          {formatDistanceToNow(new Date(conversation.last_message_at), {
                                            addSuffix: true,
                                            locale: ptBR
                                          })}
                                        </div>
                                        
                                        <div className="mt-2">
                                          {getStatusBadge(conversation.status)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {conversation.messages && conversation.messages.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <p className="text-xs text-muted-foreground truncate">
                                        <span className="capitalize">
                                          {conversation.messages[conversation.messages.length - 1].sender_type === 'customer' 
                                            ? 'Cliente' 
                                            : conversation.messages[conversation.messages.length - 1].sender_type === 'agent'
                                            ? 'Bot'
                                            : 'Atendente'
                                          }:
                                        </span>{' '}
                                        {conversation.messages[conversation.messages.length - 1].content}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Conversation Detail */}
                <div>
                  {selectedConversation ? (
                    <ConversationDetail 
                      conversation={selectedConversation}
                      onStatusUpdate={updateConversationStatus}
                    />
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-[700px]">
                        <div className="text-center text-muted-foreground">
                          <MessageCircle className="mx-auto h-12 w-12 mb-4" />
                          <p>Selecione uma conversa para ver os detalhes</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}