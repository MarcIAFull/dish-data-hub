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
        .from('conversations')
        .select('*', { count: 'exact' })
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
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          if (msgError) {
            console.error('Error fetching messages:', msgError);
            return { ...conv, messages: [] };
          }

          return {
            ...conv,
            messages: messages || []
          };
        })
      );

      setConversations(prev => 
        pageNum === 0 
          ? conversationsWithMessages 
          : [...prev, ...conversationsWithMessages]
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
        .eq('conversation_id', conversationId);

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
          table: 'chat_messages',
          filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined
        },
        (payload) => {
          console.log('New message:', payload);
          const newMessage = payload.new as Message;
          
          setConversations(prev => 
            prev.map(conv => {
              if (conv.id === newMessage.conversation_id) {
                const existingConv = conv;
                
                // Notificar apenas se for mensagem do usuário
                if (newMessage.user_message && onConversationClick) {
                  notifyNewMessage(
                    newMessage.phone || 'Cliente',
                    newMessage.user_message,
                    () => onConversationClick(existingConv)
                  );
                }
                
                return {
                  ...conv,
                  messages: [...(conv.messages || []), newMessage],
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
