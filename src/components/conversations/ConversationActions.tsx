import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Archive,
  Tag,
  StickyNote,
  MoreVertical,
  Download,
  X,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation } from '@/hooks/useConversationsCompat';

interface ConversationActionsProps {
  conversation: Conversation;
  onStatusChange: (conversationId: string, status: string) => void;
  onRefresh?: () => void;
}

export function ConversationActions({ 
  conversation, 
  onStatusChange,
  onRefresh 
}: ConversationActionsProps) {
  const { toast } = useToast();
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          archived_at: new Date().toISOString(),
          status: 'ended'
        })
        .eq('id', Number(conversation.id));

      if (error) throw error;

      toast({
        title: 'Conversa arquivada',
        description: 'A conversa foi arquivada com sucesso'
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error archiving:', error);
      toast({
        title: 'Erro ao arquivar',
        description: 'Não foi possível arquivar a conversa',
        variant: 'destructive'
      });
    } finally {
      setArchiving(false);
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Exportando histórico',
      description: 'Preparando download do histórico...'
    });
    
    // Implementação simplificada de exportação
    const messages = conversation.messages || [];
    const text = messages.map(m => {
      const sender = m.user_message ? 'Cliente' : 'Agente';
      const content = m.user_message || m.bot_message || '';
      const time = new Date(m.created_at).toLocaleString('pt-BR');
      return `[${time}] ${sender}: ${content}`;
    }).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${conversation.phone}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onStatusChange(conversation.id, 'human_handoff')}>
            <UserCheck className="h-4 w-4 mr-2" />
            Transferir para humano
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar histórico
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchive} disabled={archiving}>
            <Archive className="h-4 w-4 mr-2" />
            Arquivar conversa
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onStatusChange(conversation.id, 'ended')}
            className="text-destructive focus:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Encerrar conversa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
