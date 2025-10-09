import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  User, 
  Bot, 
  PhoneCall, 
  X, 
  UserX,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation, Message } from '@/hooks/useConversationsCompat';

interface ConversationDetailProps {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (conversationId: string, status: string) => void;
}

export function ConversationDetail({ 
  conversation, 
  open, 
  onOpenChange,
  onStatusChange 
}: ConversationDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation?.id && open) {
      fetchMessages();
    }
  }, [conversation?.id, open]);

  // Real-time subscription para novas mensagens
  useEffect(() => {
    if (!conversation?.id || !open) return;

    const channel = supabase
      .channel(`conversation-${conversation.id}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('New message in open conversation:', payload);
          const newMessage = payload.new as Message;
          
          setMessages(prev => [...prev, newMessage]);
          
          // Auto-scroll imediato
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, open]);

  useEffect(() => {
    // Auto-scroll para última mensagem
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversation?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndConversation = () => {
    if (conversation?.id) {
      onStatusChange(conversation.id, 'ended');
      onOpenChange(false);
    }
  };

  const handleTransferToHuman = () => {
    if (conversation?.id) {
      onStatusChange(conversation.id, 'human_handoff');
    }
  };

  if (!conversation) return null;

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {conversation.phone || 'Sem telefone'}
              </SheetTitle>
              <SheetDescription>
                Iniciada {formatDistanceToNow(new Date(conversation.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </SheetDescription>
            </div>
            <Badge className={getStatusColor(conversation.status)}>
              {conversation.status}
            </Badge>
          </div>
        </SheetHeader>

        <Separator />

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem encontrada</p>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = !!message.user_message;
                const content = message.user_message || message.bot_message;
                
                return (
                  <div 
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`rounded-lg px-4 py-2 ${
                          isUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>

                    {isUser && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Actions Footer */}
        <div className="p-6 pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleTransferToHuman}
              disabled={conversation.status !== 'active'}
              className="w-full"
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              Transferir para Humano
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndConversation}
              disabled={conversation.status === 'ended'}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Encerrar Conversa
            </Button>
          </div>
          
          {conversation.status === 'human_handoff' && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
              <UserX className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Aguardando atendimento humano</p>
                <p className="text-xs mt-1">Esta conversa foi transferida para um atendente</p>
              </div>
            </div>
          )}
          
          {conversation.status === 'ended' && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-800 dark:text-gray-200">
                <p className="font-medium">Conversa encerrada</p>
                <p className="text-xs mt-1">Esta conversa foi finalizada</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
