import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string | number;
  conversation_id?: string;
  user_message?: string;
  bot_message?: string;
  user_name?: string;
  phone?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  phone?: string;
  status: string;
  app?: string;
  created_at: string;
  updated_at?: string;
  last_read_at?: string;
  agent_id?: string;
  customer_id?: string | number;
  restaurant_id?: string;
  messages?: Message[];
  restaurant_name?: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// Helper para calcular mensagens não lidas
export function getUnreadCount(conversation: Conversation): number {
  if (!conversation.messages || conversation.messages.length === 0) {
    return 0;
  }

  const lastReadTime = conversation.last_read_at 
    ? new Date(conversation.last_read_at) 
    : new Date(0);

  return conversation.messages.filter(msg => 
    new Date(msg.created_at) > lastReadTime && !!msg.user_message
  ).length;
}

// Função para marcar conversa como lida
export async function markAsRead(conversationId: string) {
  const { error } = await supabase
    .from('chats')
    .update({ last_read_at: new Date().toISOString() })
    .eq('id', Number(conversationId));

  if (error) {
    console.error('Error marking as read:', error);
  }
}

export function useConversationsCompat(restaurantId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Buscar conversas diretamente com filtro por restaurant_id
      let query = supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtro direto por restaurant_id (RLS já garante isolamento)
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar mensagens para cada conversa
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', conv.id)
            .order('created_at', { ascending: true });

          // Transformar mensagens para o formato esperado
          const transformedMessages = (messages || []).map(msg => ({
            id: msg.id,
            user_message: msg.sender_type === 'user' ? msg.content : undefined,
            bot_message: msg.sender_type === 'bot' ? msg.content : undefined,
            created_at: msg.created_at,
            phone: conv.phone
          }));

          return {
            ...conv,
            id: String(conv.id),
            messages: transformedMessages
          };
        })
      );

      setConversations(conversationsWithMessages);
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
  };

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

      await fetchConversations();
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
    fetchConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined
        },
        () => {
          console.log('Conversation changed, refetching...');
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
    updateStatus: updateConversationStatus
  };
}
