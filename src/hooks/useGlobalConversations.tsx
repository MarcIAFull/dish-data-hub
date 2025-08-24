import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, Agent } from '@/hooks/useConversations';

export interface ConversationWithMessages extends Conversation {
  messages?: Message[];
  agents?: Partial<Agent>;
  restaurantId: string;
  restaurantName: string;
}

export const useGlobalConversations = (restaurantIds: string[]) => {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (restaurantIds.length === 0) {
      setConversations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar conversas com agentes e mensagens
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          agents!inner(
            id,
            name,
            restaurant_id,
            restaurants!inner(
              id,
              name
            )
          ),
          messages(
            id,
            conversation_id,
            content,
            sender_type,
            created_at,
            is_read,
            message_type,
            media_url,
            whatsapp_message_id
          )
        `)
        .in('agents.restaurant_id', restaurantIds)
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Transformar dados para o formato esperado
      const formattedConversations: ConversationWithMessages[] = conversationsData?.map(conv => ({
        ...conv,
        status: conv.status as Conversation['status'],
        restaurantId: conv.agents?.restaurant_id || '',
        restaurantName: conv.agents?.restaurants?.name || 'Restaurante',
        messages: conv.messages?.map(msg => ({
          ...msg,
          sender_type: msg.sender_type as 'customer' | 'agent' | 'human',
          message_type: msg.message_type as 'text' | 'image' | 'audio' | 'document'
        })).sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []
      })) || [];

      setConversations(formattedConversations);

    } catch (err) {
      console.error('Erro ao buscar conversas globais:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, message: string) => {
    try {
      // Invocar a função edge para enviar mensagem WhatsApp
      const { error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          conversationId,
          message
        }
      });

      if (error) throw error;

      // Atualizar conversas após enviar mensagem
      await fetchConversations();
      return true;
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      return false;
    }
  };

  const updateConversationStatus = async (conversationId: string, status: Conversation['status']) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', conversationId);

      if (error) throw error;

      // Atualizar o estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status }
            : conv
        )
      );

      return true;
    } catch (err) {
      console.error('Erro ao atualizar status da conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
      return false;
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'customer')
        .eq('is_read', false);

      if (error) throw error;

      // Atualizar o estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                messages: conv.messages?.map(msg => 
                  msg.sender_type === 'customer' ? { ...msg, is_read: true } : msg
                ) || []
              }
            : conv
        )
      );

      return true;
    } catch (err) {
      console.error('Erro ao marcar mensagens como lidas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao marcar como lidas');
      return false;
    }
  };

  useEffect(() => {
    fetchConversations();

    // Configurar real-time subscriptions
    const conversationsSubscription = supabase
      .channel('global_conversations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `agent_id=in.(${restaurantIds.join(',')})`
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel('global_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [restaurantIds.join(',')]);

  return {
    conversations,
    loading,
    error,
    sendMessage,
    updateConversationStatus,
    markMessagesAsRead,
    refetch: fetchConversations
  };
};