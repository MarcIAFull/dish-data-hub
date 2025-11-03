import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Agent {
  id: string;
  name: string;
  restaurant_id: string;
  whatsapp_number: string;
  evolution_api_instance: string;
  evolution_api_token: string;
  webhook_url: string;
  is_active: boolean;
}

interface Conversation {
  id: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent_id: string;
  restaurant_id: string;
}

interface Message {
  id: number;
  conversation_id?: string;
  user_message?: string;
  bot_message?: string;
  message_type?: string;
  created_at: string;
}

export default function WebhookDebug() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load agents
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      setAgents(agentsData || []);

      // Load recent conversations
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);
      
      setConversations(conversationsData || []);

      // Load recent messages from chat_messages
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setMessages(messagesData as any || []);

      // Check webhook status
      checkWebhookStatus();

      toast.success('Dados atualizados');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const checkWebhookStatus = async () => {
    setWebhookStatus('checking');
    
    try {
      const response = await fetch(
        'https://wsyddfdfzfkhkkxmrmxf.supabase.co/functions/v1/enhanced-ai-webhook',
        { method: 'GET' }
      );
      
      if (response.ok) {
        setWebhookStatus('online');
      } else {
        setWebhookStatus('offline');
      }
    } catch (error) {
      setWebhookStatus('offline');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug do Webhook</h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento em tempo real do sistema de mensagens
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(webhookStatus)}
            Status do Webhook
          </CardTitle>
          <CardDescription>
            https://wsyddfdfzfkhkkxmrmxf.supabase.co/functions/v1/enhanced-ai-webhook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={webhookStatus === 'online' ? 'default' : 'destructive'}>
              {webhookStatus === 'online' ? 'Online' : webhookStatus === 'offline' ? 'Offline' : 'Verificando...'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Última verificação: {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Agents Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Agentes Configurados ({agents.length})</CardTitle>
          <CardDescription>
            Configuração dos agentes IA e integração com Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              Nenhum agente configurado
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{agent.name}</div>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                      {agent.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">WhatsApp:</span>{' '}
                      {agent.whatsapp_number || '❌ Não configurado'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Instância:</span>{' '}
                      {agent.evolution_api_instance || '❌ Não configurado'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Token:</span>{' '}
                      {agent.evolution_api_token ? '✅ Configurado' : '❌ Não configurado'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Webhook URL:</span>{' '}
                      {agent.webhook_url ? '✅ Configurado' : '❌ Não configurado'}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Restaurant ID:</span>{' '}
                      <code className="text-xs bg-muted px-1 rounded">{agent.restaurant_id}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Conversas Recentes ({conversations.length})</CardTitle>
            <CardDescription>
              Últimas 10 conversas recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                Nenhuma conversa encontrada
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div key={conv.id} className="border rounded p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{conv.phone}</span>
                      <Badge variant="outline">{conv.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Criada: {new Date(conv.created_at).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Agent ID:</span>{' '}
                      {conv.agent_id ? (
                        <code className="bg-muted px-1 rounded">{conv.agent_id.substring(0, 8)}</code>
                      ) : (
                        <span className="text-destructive">❌ NULL</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Restaurant ID:</span>{' '}
                      {conv.restaurant_id ? (
                        <code className="bg-muted px-1 rounded">{conv.restaurant_id.substring(0, 8)}</code>
                      ) : (
                        <span className="text-destructive">❌ NULL</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Recentes ({messages.length})</CardTitle>
            <CardDescription>
              Últimas 20 mensagens processadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                Nenhuma mensagem encontrada
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className="border rounded p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={msg.user_message ? 'secondary' : 'default'}>
                        {msg.user_message ? 'Cliente' : 'Assistente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-xs line-clamp-2">{msg.user_message || msg.bot_message}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
