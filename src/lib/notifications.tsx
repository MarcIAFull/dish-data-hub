import { toast } from '@/hooks/use-toast';
import { MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function notifyNewConversation(
  phone: string,
  onViewClick?: () => void
) {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5" />
        <span>Nova conversa iniciada</span>
      </div>
    ) as any,
    description: `Cliente: ${phone}`,
    action: onViewClick ? (
      <Button variant="outline" size="sm" onClick={onViewClick}>
        Ver conversa
      </Button>
    ) : undefined,
    duration: 7000
  });
}

export function notifyNewMessage(
  phone: string,
  message: string,
  onViewClick?: () => void
) {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <span>Nova mensagem</span>
      </div>
    ) as any,
    description: (
      <div className="space-y-1">
        <p className="font-medium">{phone}</p>
        <p className="text-sm text-muted-foreground">
          {message.substring(0, 60)}{message.length > 60 ? '...' : ''}
        </p>
      </div>
    ) as any,
    action: onViewClick ? (
      <Button variant="outline" size="sm" onClick={onViewClick}>
        Abrir
      </Button>
    ) : undefined,
    duration: 7000
  });
}
