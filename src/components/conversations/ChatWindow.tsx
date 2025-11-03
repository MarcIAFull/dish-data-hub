import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Send, Loader2, PhoneCall, X, MessageSquare, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MessageBubble } from './MessageBubble';
import type { Conversation, Message } from '@/hooks/useConversationsCompat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Store } from 'lucide-react';
import { getRestaurantColor } from '@/lib/restaurantColors';

interface ChatWindowProps {
  conversation: Conversation | null;
  onStatusChange: (conversationId: string, status: string) => void;
}

export function ChatWindow({ conversation, onStatusChange }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (conversation?.id) {
      fetchMessages();
      setAiEnabled((conversation as any).ai_enabled ?? true);
    } else {
      setMessages([]);
    }
  }, [conversation?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat-${conversation.id}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('New message:', payload);
          const newMessage = payload.new as any;
          
          setMessages(prev => [...prev, {
            id: newMessage.id,
            user_message: newMessage.sender_type === 'customer' ? newMessage.content : undefined,
            bot_message: newMessage.sender_type === 'agent' ? newMessage.content : undefined,
            created_at: newMessage.created_at,
            phone: conversation.phone
          }]);
          
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  const fetchMessages = async () => {
    if (!conversation?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', Number(conversation.id))
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transformar para o formato esperado
      const transformedMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        user_message: msg.sender_type === 'customer' ? msg.content : undefined,
        bot_message: msg.sender_type === 'agent' ? msg.content : undefined,
        created_at: msg.created_at,
        phone: conversation.phone
      }));
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erro ao carregar mensagens',
        description: 'Não foi possível carregar as mensagens',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation?.id || sending) return;
    
    // Validação e logging detalhado
    console.log('=== ENVIANDO MENSAGEM ===');
    console.log('Conversation:', conversation);
    console.log('Conversation ID:', conversation.id);
    console.log('Tipo do ID:', typeof conversation.id);
    console.log('Mensagem:', messageText.trim());
    
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          conversationId: conversation.id.toString(),
          message: messageText.trim(),
          messageType: 'text'
        }
      });

      console.log('Resposta da edge function:', { data, error });

      if (error) {
        console.error('Erro da edge function:', error);
        throw error;
      }

      setMessageText('');
      toast({
        title: 'Mensagem enviada',
        description: 'Mensagem enviada com sucesso'
      });
    } catch (error: any) {
      console.error('Exceção ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Não foi possível enviar a mensagem',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleEndConversation = () => {
    if (conversation?.id) {
      onStatusChange(conversation.id, 'ended');
    }
  };

  const handleToggleAI = async () => {
    if (!conversation) return;
    
    const newAiEnabled = !aiEnabled;
    setAiEnabled(newAiEnabled);
    
    const { error } = await supabase
      .from('chats')
      .update({ ai_enabled: newAiEnabled })
      .eq('id', Number(conversation.id));
    
    if (error) {
      console.error('Error toggling AI:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alternar modo de IA',
        variant: 'destructive'
      });
      setAiEnabled(!newAiEnabled);
    } else {
      toast({
        title: newAiEnabled ? '🤖 IA ativada' : '👤 Modo humano',
        description: newAiEnabled ? 'IA voltou a responder automaticamente' : 'Você está no controle agora'
      });
    }
  };

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

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#e5ddd5]">
        <div className="text-center text-gray-500">
          <MessageSquare className="h-20 w-20 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between border-b">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-semibold text-lg">📱 {conversation.phone || 'Sem telefone'}</h3>
            
            {/* Badge do Restaurante */}
            {conversation.restaurant && (
              <Badge 
                variant="secondary" 
                className={`${getRestaurantColor(conversation.restaurant.id)}`}
              >
                <Store className="h-3 w-3 mr-1" />
                {conversation.restaurant.name}
              </Badge>
            )}
          </div>
          
          <p className="text-xs opacity-80 mb-2">
            Iniciada {formatDistanceToNow(new Date(conversation.created_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </p>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(conversation.status)}>
              {conversation.status}
            </Badge>
            <div className="flex items-center gap-2 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
              <Switch
                checked={aiEnabled}
                onCheckedChange={handleToggleAI}
                id="ai-toggle"
                className="data-[state=checked]:bg-white data-[state=unchecked]:bg-primary-foreground/30"
              />
              <label 
                htmlFor="ai-toggle" 
                className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
              >
                {aiEnabled ? (
                  <>
                    <Bot className="h-3.5 w-3.5" />
                    <span>IA Ativa</span>
                  </>
                ) : (
                  <>
                    <User className="h-3.5 w-3.5" />
                    <span>Modo Humano</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndConversation}
            disabled={conversation.status === 'ended'}
            className="hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma mensagem ainda</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => {
              const isUser = !!message.user_message;
              const content = message.user_message || message.bot_message || '';
              
              return (
                <MessageBubble
                  key={message.id}
                  content={content}
                  isUser={isUser}
                  timestamp={message.created_at}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-background p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Digite uma mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending || conversation.status === 'ended'}
            className="min-h-[44px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending || conversation.status === 'ended'}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
