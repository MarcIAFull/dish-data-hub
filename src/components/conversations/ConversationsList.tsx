import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation } from '@/hooks/useConversationsCompat';
import { getUnreadCount } from '@/hooks/useConversationsCompat';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function ConversationsList({ 
  conversations, 
  selectedId, 
  onSelect,
  searchTerm,
  onSearchChange 
}: ConversationsListProps) {
  
  const getLastMessage = (conv: Conversation) => {
    if (!conv.messages || conv.messages.length === 0) return 'Sem mensagens';
    const lastMsg = conv.messages[conv.messages.length - 1];
    const content = lastMsg.user_message || lastMsg.bot_message || '';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const getLastMessageTime = (conv: Conversation) => {
    if (!conv.messages || conv.messages.length === 0) return '';
    const lastMsg = conv.messages[conv.messages.length - 1];
    return formatDistanceToNow(new Date(lastMsg.created_at), {
      addSuffix: false,
      locale: ptBR
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] border-r border-gray-300">
      {/* Header */}
      <div className="bg-[#008069] p-4 text-white">
        <h2 className="text-xl font-semibold mb-3">Conversas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conv) => {
              const unreadCount = getUnreadCount(conv);
              const isSelected = conv.id === selectedId;
              
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-200 ${
                    isSelected ? 'bg-white' : 'bg-[#f0f2f5]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      📱 {conv.phone || 'Sem telefone'}
                      {unreadCount > 0 && (
                        <Badge className="bg-[#25d366] text-white ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {getLastMessageTime(conv)}
                    </span>
                  </div>
                  <p className={`text-sm ${unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {getLastMessage(conv)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
