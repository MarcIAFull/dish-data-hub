import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Agent {
  id: string;
  restaurant_id: string;
  name: string;
  personality: string;
  instructions: string;
  is_active: boolean;
  fallback_enabled: boolean;
  fallback_timeout_minutes: number;
  whatsapp_number: string;
  evolution_api_instance: string;
  evolution_api_token: string;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  agent_id: string;
  customer_phone: string;
  customer_name: string;
  status: 'active' | 'paused' | 'ended' | 'human_handoff';
  assigned_human_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'agent' | 'human';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document';
  media_url: string;
  is_read: boolean;
  whatsapp_message_id: string;
  created_at: string;
}

interface ConversationWithMessages extends Conversation {
  messages: Message[];
  agents: Agent;
}

export const useConversations = (restaurantId?: string) => {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConversations = async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          agents!inner (
            *,
            restaurants!inner (id)
          ),
          messages (*)
        `)
        .eq('agents.restaurants.id', restaurantId)
        .order('last_message_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Type the data properly
      const typedData = (data || []).map(conv => ({
        ...conv,
        messages: conv.messages || []
      })) as ConversationWithMessages[];

      setConversations(typedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, message: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          conversationId,
          message,
          messageType: 'text'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });

      // Refresh conversations to get updated data
      await fetchConversations();
      
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateConversationStatus = async (conversationId: string, status: Conversation['status']) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        throw error;
      }

      await fetchConversations();
      
      toast({
        title: "Status atualizado",
        description: `Conversa ${status === 'human_handoff' ? 'transferida para atendimento humano' : status}`,
      });
    } catch (err) {
      console.error('Error updating conversation status:', err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da conversa",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                messages: conv.messages.map(msg => ({ ...msg, is_read: true }))
              }
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!restaurantId) return;

    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
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
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [restaurantId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [restaurantId]);

  return {
    conversations,
    loading,
    error,
    sendMessage,
    updateConversationStatus,
    markMessagesAsRead,
    refreshConversations: fetchConversations
  };
};