import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: number;
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
  agent_id?: string;
  customer_id?: string | number;
  restaurant_id?: string;
  messages?: Message[];
  restaurant_name?: string;
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
        .from('conversations')
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
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          return {
            ...conv,
            messages: messages || []
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
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId);

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
  }, [restaurantId]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
    updateStatus: updateConversationStatus
  };
}
