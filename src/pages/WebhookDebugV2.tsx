import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Filter, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationTimeline } from '@/components/debug/ConversationTimeline';
import { StateVisualization } from '@/components/debug/StateVisualization';
import { ToolCallsInspector } from '@/components/debug/ToolCallsInspector';
import { MetadataViewer } from '@/components/debug/MetadataViewer';
import { MessageTester } from '@/components/debug/MessageTester';
import { ErrorLogsPanel } from '@/components/debug/ErrorLogsPanel';
import ChatExporter from '@/components/debug/ChatExporter';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DebugChat {
  id: number;
  phone: string;
  conversation_state: string;
  ai_enabled: boolean;
  metadata: any;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  agent?: {
    id: string;
    name: string;
  };
  message_count?: number;
}

interface Metrics {
  active_chats: number;
  tool_calls: number;
  errors_today: number;
  avg_response_time: number;
}

export default function WebhookDebugV2() {
  const [chats, setChats] = useState<DebugChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<DebugChat | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    active_chats: 0,
    tool_calls: 0,
    errors_today: 0,
    avg_response_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchPhone, setSearchPhone] = useState('');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Carregar dados iniciais
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar chats ativos
      let query = supabase
        .from('chats')
        .select(`
          id,
          phone,
          conversation_state,
          ai_enabled,
          metadata,
          status,
          created_at,
          updated_at,
          last_message_at,
          agent_id,
          agents (
            id,
            name
          )
        `)
        .eq('ai_enabled', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(20);

      if (searchPhone) {
        query = query.ilike('phone', `%${searchPhone}%`);
      }
      if (filterAgent !== 'all') {
        query = query.eq('agent_id', filterAgent);
      }
      if (filterState !== 'all') {
        query = query.eq('conversation_state', filterState);
      }

      const { data: chatsData, error: chatsError } = await query;
      
      if (chatsError) throw chatsError;

      const formattedChats = (chatsData || []).map((chat: any) => ({
        ...chat,
        agent: chat.agents
      }));

      setChats(formattedChats);

      // Buscar métricas
      const { data: statsData } = await supabase
        .from('chats')
        .select('id, status, conversation_state, created_at, updated_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: errorsData } = await supabase
        .from('error_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: toolCallsData } = await supabase
        .from('ai_processing_logs')
        .select('tools_executed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      let totalToolCalls = 0;
      toolCallsData?.forEach((log: any) => {
        if (log.tools_executed && Array.isArray(log.tools_executed)) {
          totalToolCalls += log.tools_executed.length;
        }
      });

      const avgTime = statsData?.reduce((acc, chat) => {
        if (chat.updated_at && chat.created_at) {
          return acc + (new Date(chat.updated_at).getTime() - new Date(chat.created_at).getTime());
        }
        return acc;
      }, 0) || 0;

      setMetrics({
        active_chats: formattedChats.filter((c: any) => c.status === 'active').length,
        tool_calls: totalToolCalls,
        errors_today: errorsData?.length || 0,
        avg_response_time: statsData?.length ? avgTime / statsData.length / 1000 : 0
      });

      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchPhone, filterAgent, filterState]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, searchPhone, filterAgent, filterState]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('debug-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats'
        },
        (payload) => {
          setChats(prev => prev.map(chat => 
            chat.id === payload.new.id 
              ? { ...chat, ...payload.new }
              : chat
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const clearFilters = () => {
    setSearchPhone('');
    setFilterAgent('all');
    setFilterState('all');
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      greeting: 'bg-blue-100 text-blue-800 border-blue-300',
      discovery: 'bg-purple-100 text-purple-800 border-purple-300',
      browsing_menu: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      presentation: 'bg-orange-100 text-orange-800 border-orange-300',
      upsell: 'bg-pink-100 text-pink-800 border-pink-300',
      logistics: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      address: 'bg-teal-100 text-teal-800 border-teal-300',
      payment: 'bg-green-100 text-green-800 border-green-300',
      summary: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      completed: 'bg-green-200 text-green-900 border-green-600',
      transferred: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[state] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🐛 WEBHOOK DEBUG DASHBOARD v2.0
          </h1>
          <div className="flex items-center gap-4">
            <Badge variant={autoRefresh ? "default" : "secondary"} className="gap-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {autoRefresh ? 'ONLINE' : 'PAUSED'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Último update: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Pausar' : 'Ativar'} Auto-refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_chats}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tool Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.tool_calls}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Errors Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{metrics.errors_today}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avg_response_time.toFixed(1)}s</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar esquerda - Lista de chats */}
        <div className="col-span-3">
          <Card className="h-[calc(100vh-280px)]">
            <CardHeader>
              <CardTitle className="text-lg">📊 Conversas Ativas</CardTitle>
              <div className="space-y-2 mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por telefone..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="greeting">Greeting</SelectItem>
                    <SelectItem value="browsing_menu">Browsing Menu</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {(searchPhone || filterState !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(100%-200px)]">
              <div className="space-y-2">
                {chats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedChat?.id === chat.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{chat.phone || 'Sem telefone'}</span>
                        <Badge className={getStateColor(chat.conversation_state || 'unknown')}>
                          {chat.conversation_state || 'unknown'}
                        </Badge>
                      </div>
                      {chat.agent && (
                        <p className="text-xs text-muted-foreground">
                          Agente: {chat.agent.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {chat.last_message_at
                          ? formatDistanceToNow(new Date(chat.last_message_at), {
                              addSuffix: true,
                              locale: ptBR
                            })
                          : 'Sem mensagens'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {chats.length === 0 && !loading && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma conversa encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content - Detalhes do chat */}
        <div className="col-span-9">
          {selectedChat ? (
            <>
              <Tabs defaultValue="timeline" className="h-[calc(100vh-280px)]">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="states">Estados</TabsTrigger>
                  <TabsTrigger value="tools">Tool Calls</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="tester">Tester</TabsTrigger>
                  <TabsTrigger value="errors">Erros</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="h-[calc(100%-48px)]">
                  <ConversationTimeline chatId={selectedChat.id} />
                </TabsContent>

                <TabsContent value="states" className="h-[calc(100%-48px)]">
                  <StateVisualization 
                    chatId={selectedChat.id}
                    currentState={selectedChat.conversation_state}
                    metadata={selectedChat.metadata}
                  />
                </TabsContent>

                <TabsContent value="tools" className="h-[calc(100%-48px)]">
                  <ToolCallsInspector chatId={selectedChat.id} />
                </TabsContent>

                <TabsContent value="metadata" className="h-[calc(100%-48px)]">
                  <MetadataViewer 
                    chatId={selectedChat.id}
                    metadata={selectedChat.metadata}
                    onUpdate={loadData}
                  />
                </TabsContent>

                <TabsContent value="tester" className="h-[calc(100%-48px)]">
                  <MessageTester 
                    chatId={selectedChat.id}
                    phone={selectedChat.phone}
                    agentId={selectedChat.agent?.id}
                  />
                </TabsContent>

                <TabsContent value="errors" className="h-[calc(100%-48px)]">
                  <ErrorLogsPanel chatId={selectedChat.id} />
                </TabsContent>
              </Tabs>

              {/* Chat Exporter */}
              <div className="mt-4">
                <ChatExporter chatId={selectedChat.id} />
              </div>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Selecione uma conversa para ver os detalhes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
