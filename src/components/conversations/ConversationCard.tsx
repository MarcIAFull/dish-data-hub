import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bot, User, CheckCircle2, Clock, ShoppingCart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getRestaurantColor } from '@/lib/restaurantColors';
import type { Conversation } from '@/hooks/useConversationsCompat';
import { getUnreadCount } from '@/hooks/useConversationsCompat';
import { cn } from '@/lib/utils';

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  showRestaurant?: boolean;
}

export function ConversationCard({ 
  conversation, 
  isSelected, 
  onSelect,
  showRestaurant = true 
}: ConversationCardProps) {
  const unreadCount = getUnreadCount(conversation);
  const isEnded = conversation.status === 'ended' || conversation.status === 'encerrado';
  const aiEnabled = (conversation as any).ai_enabled ?? true;
  
  const getLastMessage = () => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'Nenhuma mensagem';
    }
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    const content = lastMsg.user_message || lastMsg.bot_message || '';
    return content.length > 60 ? content.substring(0, 60) + '...' : content;
  };

  const getLastMessageTime = () => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return formatDistanceToNow(new Date(conversation.created_at), { 
        addSuffix: true, 
        locale: ptBR 
      });
    }
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    return formatDistanceToNow(new Date(lastMsg.created_at), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  return (
    <Card 
      className={cn(
        "p-3 cursor-pointer transition-all hover:shadow-md border",
        isSelected 
          ? "bg-primary/5 border-primary shadow-sm" 
          : "bg-card hover:bg-accent/50",
        unreadCount > 0 && "border-l-4 border-l-primary"
      )}
      onClick={onSelect}
    >
      <div className="space-y-2">
        {/* Header com telefone e badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="font-semibold text-sm truncate">
              {conversation.phone || 'Sem telefone'}
            </span>
            
            {/* Badge do Restaurante */}
            {showRestaurant && conversation.restaurant && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 px-2 text-xs font-medium shrink-0",
                  getRestaurantColor(conversation.restaurant.id)
                )}
              >
                {conversation.restaurant.name}
              </Badge>
            )}
          </div>

          {/* Contador de não lidas */}
          {unreadCount > 0 && (
            <Badge 
              variant="default" 
              className="h-5 min-w-[20px] px-1.5 text-xs bg-primary text-primary-foreground shrink-0"
            >
              {unreadCount}
            </Badge>
          )}
        </div>

        {/* Última mensagem */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {getLastMessage()}
        </p>

        {/* Footer com status e tempo */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status badges */}
            {isEnded ? (
              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-muted gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span className="hidden sm:inline">Encerrada</span>
              </Badge>
            ) : aiEnabled ? (
              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-blue-50 text-blue-700 border-blue-200 gap-1">
                <Bot className="h-3 w-3" />
                <span className="hidden sm:inline">IA</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-amber-50 text-amber-700 border-amber-200 gap-1">
                <User className="h-3 w-3" />
                <span className="hidden sm:inline">Humano</span>
              </Badge>
            )}
            
            {/* Indicador de pedido ativo (exemplo) */}
            {conversation.messages && conversation.messages.some(m => 
              (m.bot_message || m.user_message || '').toLowerCase().includes('pedido')
            ) && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-green-50 text-green-700 border-green-200 gap-1">
                <ShoppingCart className="h-3 w-3" />
              </Badge>
            )}
          </div>

          {/* Tempo */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span className="text-[10px]">{getLastMessageTime()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
