import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Bot, Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: string;
  delivered?: boolean;
  read?: boolean;
}

export function MessageBubble({ content, isUser, timestamp, delivered = true, read = false }: MessageBubbleProps) {
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`rounded-lg px-3 py-2 shadow-sm ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card text-card-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] opacity-70">
              {new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isUser && (
              read ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : delivered ? (
                <CheckCheck className="h-3 w-3 opacity-50" />
              ) : (
                <Check className="h-3 w-3 opacity-50" />
              )
            )}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
