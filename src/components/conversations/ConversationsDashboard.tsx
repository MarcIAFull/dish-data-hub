import { useConversationsCompat } from '@/hooks/useConversationsCompat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationsDashboardProps {
  restaurantId?: string;
}

export function ConversationsDashboard({ restaurantId }: ConversationsDashboardProps) {
  const { conversations, loading } = useConversationsCompat(restaurantId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conversas</h2>
          <p className="text-muted-foreground">{conversations.length} conversas encontradas</p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conversation) => (
            <Card key={conversation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {conversation.phone || 'Sem telefone'}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(conversation.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(conversation.status)}>
                    {conversation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {conversation.messages && conversation.messages.length > 0 ? (
                    <p>{conversation.messages.length} mensagens</p>
                  ) : (
                    <p>Sem mensagens</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
