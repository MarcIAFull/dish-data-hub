import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  metadata?: any;
  chat_id?: number;
  message_type?: string;
  session_id?: string;
  whatsapp_message_id?: string;
}

interface ConversationTimelineProps {
  chatId: number;
}

export function ConversationTimeline({ chatId }: ConversationTimelineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mensagens',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Mensagem copiada',
      description: 'Conteúdo copiado para a área de transferência'
    });
  };

  const toggleExpanded = (messageId: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const getSenderColor = (senderType: string) => {
    const colors = {
      customer: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
      agent: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
      system: 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
    };
    return colors[senderType as keyof typeof colors] || colors.system;
  };

  const getSentimentEmoji = (sentiment?: number) => {
    if (!sentiment) return null;
    if (sentiment > 0.5) return '😊';
    if (sentiment < -0.5) return '😞';
    return '😐';
  };

  const highlightKeywords = (text: string) => {
    const keywords = ['confirmo', 'não quero', 'cancelar', 'sim', 'não', 'quero', 'pedido'];
    let highlighted = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlighted = highlighted.replace(
        regex,
        `<mark class="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">$&</mark>`
      );
    });
    return highlighted;
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <ScrollArea className="h-full" ref={scrollRef}>
        <CardContent className="p-6 space-y-4">
          {messages.map((message, index) => {
            const isExpanded = expandedMessages.has(message.id);
            const isCustomer = message.sender_type === 'customer';
            const isSystem = message.sender_type === 'system';

            return (
              <div
                key={message.id}
                className={`flex ${isCustomer ? 'justify-start' : isSystem ? 'justify-center' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] ${isSystem ? 'max-w-[60%]' : ''}`}>
                  <Card className={`${getSenderColor(message.sender_type)} border-2`}>
                    <CardContent className="p-4">
                      {/* Header da mensagem */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {message.sender_type}
                          </Badge>
                          {message.metadata?.sentiment && (
                            <span className="text-lg">
                              {getSentimentEmoji(message.metadata.sentiment)}
                            </span>
                          )}
                          {message.metadata?.intent && (
                            <Badge variant="secondary" className="text-xs">
                              {message.metadata.intent}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'HH:mm:ss', { locale: ptBR })}
                        </span>
                      </div>

                      {/* Conteúdo da mensagem */}
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none mb-2"
                        dangerouslySetInnerHTML={{
                          __html: highlightKeywords(message.content)
                        }}
                      />

                      {/* Tool calls */}
                      {message.metadata?.tool_calls && message.metadata.tool_calls.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {message.metadata.tool_calls.map((tool: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="mr-1">
                              🛠️ {tool.function?.name || tool.name || 'Unknown'}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                        {message.metadata && Object.keys(message.metadata).length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(message.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 mr-1" />
                            )}
                            Metadata
                          </Button>
                        )}
                      </div>

                      {/* Metadata expandida */}
                      {isExpanded && message.metadata && (
                        <div className="mt-3 p-3 bg-background/50 rounded-md">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(message.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma mensagem nesta conversa
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
