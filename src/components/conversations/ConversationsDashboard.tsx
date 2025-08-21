import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, User, Bot, Clock, Phone } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { ConversationDetail } from './ConversationDetail';

interface ConversationsDashboardProps {
  restaurantId: string;
}

export const ConversationsDashboard: React.FC<ConversationsDashboardProps> = ({ 
  restaurantId 
}) => {
  const { conversations, loading, updateConversationStatus } = useConversations(restaurantId);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

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

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversas WhatsApp
            </CardTitle>
            <CardDescription>
              {conversations.length} conversas total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="mx-auto h-8 w-8 mb-4" />
                  <p>Nenhuma conversa encontrada</p>
                  <p className="text-sm mt-2">
                    As conversas aparecerão quando clientes enviarem mensagens
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {conversations.map((conversation) => {
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
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <ConversationDetail 
            conversation={selectedConversation}
            onStatusUpdate={updateConversationStatus}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="mx-auto h-12 w-12 mb-4" />
                <p>Selecione uma conversa para ver os detalhes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};