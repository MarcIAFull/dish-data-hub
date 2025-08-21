import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Send, 
  User, 
  Bot, 
  UserCheck, 
  Phone, 
  Clock,
  Pause,
  Play,
  X,
  MessageSquare
} from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';

interface ConversationDetailProps {
  conversation: any;
  onStatusUpdate: (conversationId: string, status: string) => void;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ 
  conversation,
  onStatusUpdate
}) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const { sendMessage, markMessagesAsRead } = useConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Mark messages as read when viewing conversation
    markMessagesAsRead(conversation.id);
  }, [conversation.messages, conversation.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(conversation.id, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'agent':
        return <Bot className="h-4 w-4" />;
      case 'human':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'customer':
        return 'Cliente';
      case 'agent':
        return 'Bot';
      case 'human':
        return 'Atendente';
      default:
        return 'Sistema';
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'customer':
        return 'bg-blue-500';
      case 'agent':
        return 'bg-green-500';
      case 'human':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusActions = () => {
    const actions = [];
    
    if (conversation.status === 'active') {
      actions.push(
        <Button
          key="pause"
          variant="outline"
          size="sm"
          onClick={() => onStatusUpdate(conversation.id, 'paused')}
        >
          <Pause className="h-4 w-4 mr-2" />
          Pausar
        </Button>
      );
      
      actions.push(
        <Button
          key="handoff"
          variant="outline"
          size="sm"
          onClick={() => onStatusUpdate(conversation.id, 'human_handoff')}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Atendimento Humano
        </Button>
      );
    }
    
    if (conversation.status === 'paused') {
      actions.push(
        <Button
          key="resume"
          variant="outline"
          size="sm"
          onClick={() => onStatusUpdate(conversation.id, 'active')}
        >
          <Play className="h-4 w-4 mr-2" />
          Retomar
        </Button>
      );
    }
    
    if (conversation.status !== 'ended') {
      actions.push(
        <Button
          key="end"
          variant="destructive"
          size="sm"
          onClick={() => onStatusUpdate(conversation.id, 'ended')}
        >
          <X className="h-4 w-4 mr-2" />
          Finalizar
        </Button>
      );
    }
    
    return actions;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              {conversation.customer_name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {conversation.customer_phone}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(conversation.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </div>
              <Badge 
                variant={
                  conversation.status === 'active' ? 'default' :
                  conversation.status === 'human_handoff' ? 'destructive' :
                  conversation.status === 'paused' ? 'secondary' : 'outline'
                }
              >
                {conversation.status === 'active' ? 'Ativo' :
                 conversation.status === 'human_handoff' ? 'Atendimento Humano' :
                 conversation.status === 'paused' ? 'Pausado' : 'Finalizado'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {getStatusActions()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4">
            {conversation.messages && conversation.messages.length > 0 ? (
              conversation.messages.map((message: any, index: number) => (
                <div key={message.id} className="flex items-start gap-3">
                  <Avatar className={`h-8 w-8 ${getSenderColor(message.sender_type)}`}>
                    <AvatarFallback className="text-white">
                      {getSenderIcon(message.sender_type)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getSenderLabel(message.sender_type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="mx-auto h-8 w-8 mb-4" />
                <p>Nenhuma mensagem nesta conversa</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />
        
        {/* Message Input */}
        <div className="p-4">
          {conversation.status === 'ended' ? (
            <div className="text-center text-muted-foreground py-4">
              <p>Esta conversa foi finalizada</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] resize-none"
                disabled={sending}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};