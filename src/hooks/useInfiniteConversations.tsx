import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from './useConversationsCompat';
import { useToast } from '@/hooks/use-toast';
import { notifyNewConversation, notifyNewMessage } from '@/lib/notifications';

const PAGE_SIZE = 20;

export function useInfiniteConversations(
  restaurantId?: string,
  onConversationClick?: (conversation: Conversation) => void
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  const fetchPage = useCallback(async (pageNum: number) => {
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('chats')
        .select(`
          *,
          restaurant:restaurants!restaurant_id(
            id,
            name,
            slug
          )
        `, { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Buscar mensagens para cada conversa
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', conv.id)
            .order('created_at', { ascending: true });

          if (msgError) {
            console.error('Error fetching messages:', msgError);
            return { ...conv, id: String(conv.conversation_id || conv.id), messages: [] };
          }

          // Transformar mensagens para o formato esperado
          const transformedMessages = (messages || []).map((msg: any) => ({
            id: msg.id,
            user_message: msg.sender_type === 'customer' ? msg.content : undefined,
            bot_message: msg.sender_type === 'agent' ? msg.content : undefined,
            created_at: msg.created_at,
            phone: conv.phone
          }));

          return {
            ...conv,
            id: String(conv.id),
            messages: transformedMessages,
            restaurant: conv.restaurant
          };
        })
      );

      // Agrupar conversas por telefone - pegar apenas a mais recente de cada número
      const groupedByPhone = conversationsWithMessages.reduce((acc, conv) => {
        const phone = conv.phone || 'unknown';
        
        if (!acc[phone] || new Date(conv.updated_at) > new Date(acc[phone].updated_at)) {
          // Mesclar mensagens de conversas antigas do mesmo telefone se existir
          if (acc[phone]) {
            const allMessages = [...(acc[phone].messages || []), ...(conv.messages || [])];
            conv.messages = allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
          acc[phone] = conv;
        } else {
          // Adicionar mensagens à conversa existente
          const allMessages = [...(acc[phone].messages || []), ...(conv.messages || [])];
          acc[phone].messages = allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
        
        return acc;
      }, {} as Record<string, any>);

      const uniqueConversations = Object.values(groupedByPhone);

      setConversations(prev => 
        pageNum === 0 
          ? uniqueConversations 
          : [...prev, ...uniqueConversations]
      );

      setHasMore((count || 0) > (pageNum + 1) * PAGE_SIZE);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Erro ao carregar conversas',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, toast]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const refresh = useCallback(() => {
    setPage(0);
    setConversations([]);
    setLoading(true);
    fetchPage(0);
  }, [fetchPage]);

  const updateConversationStatus = async (conversationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', Number(conversationId));

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'Status da conversa atualizado com sucesso'
      });

      refresh();
    } catch (error: any) {
      console.error('Error updating conversation:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPage(page);
  }, [page, fetchPage]);

  // Real-time updates
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined
        },
        (payload) => {
          console.log('Conversation changed:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newConv = payload.new as Conversation;
            notifyNewConversation(
              newConv.phone || 'Sem telefone',
              onConversationClick ? () => onConversationClick(newConv) : undefined
            );
          }
          
          refresh();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined
        },
        (payload) => {
          console.log('New message:', payload);
          const newMessage = payload.new as any;
          
          setConversations(prev => 
            prev.map(conv => {
              if (conv.id === newMessage.chat_id) {
                const existingConv = conv;
                
                // Transformar mensagem
                const transformedMessage = {
                  id: newMessage.id,
                  user_message: newMessage.sender_type === 'user' ? newMessage.content : undefined,
                  bot_message: newMessage.sender_type === 'bot' ? newMessage.content : undefined,
                  created_at: newMessage.created_at,
                  phone: conv.phone
                };
                
                // Notificar apenas se for mensagem do usuário
                if (newMessage.sender_type === 'user' && onConversationClick) {
                  notifyNewMessage(
                    conv.phone || 'Cliente',
                    newMessage.content,
                    () => onConversationClick(existingConv)
                  );
                }
                
                return {
                  ...conv,
                  messages: [...(conv.messages || []), transformedMessage],
                  updated_at: new Date().toISOString()
                };
              }
              return conv;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [restaurantId, refresh, onConversationClick]);

  return {
    conversations,
    loading,
    hasMore,
    loadMore,
    refresh,
    updateStatus: updateConversationStatus
  };
}
