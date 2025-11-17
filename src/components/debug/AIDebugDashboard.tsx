import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Clock, Trash2, MessageSquare, Activity } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { EnrichedContextViewer } from "./EnrichedContextViewer"; // ✅ NOVO: FASE 1
import { MacroGuidanceViewer } from "./MacroGuidanceViewer"; // ✅ NOVO: FASE 2
import { ToolCallsViewer } from "./ToolCallsViewer"; // ✅ NOVO: FASE 3

interface AILog {
  id: string;
  chat_id: number;
  session_id: string;
  request_id: string;
  user_messages: any;
  detected_intents: any;
  agents_called: any;
  tools_executed: any;
  final_response: string;
  processing_time_ms: number;
  created_at: string;
  metadata_snapshot?: any; // ✅ NOVO: FASE 1
}

function getAgentIcon(agent: string) {
  switch (agent) {
    case 'SALES': return '🛒';
    case 'CHECKOUT': return '💳';
    case 'MENU': return '📋';
    case 'SUPPORT': return '🆘';
    default: return '🤖';
  }
}

function buildSimplifiedTimeline(log: AILog) {
  console.log('[DEBUG] Building timeline for log:', log);
  
  // Extract user message safely
  const userMessageObj = log.user_messages?.[0];
  const userMessage = typeof userMessageObj === 'string' 
    ? userMessageObj 
    : userMessageObj?.content || 'N/A';
  
  // Extract agent name safely
  const agentObj = log.agents_called?.[0];
  const agentCalled = typeof agentObj === 'string'
    ? agentObj
    : 'N/A';
  
  // Extract orchestrator details safely
  const intent = log.detected_intents?.[0];
  let orchestratorDetails = '';
  if (intent) {
    if (typeof intent === 'string') {
      orchestratorDetails = intent;
    } else if (typeof intent === 'object') {
      orchestratorDetails = intent.reasoning || JSON.stringify(intent);
    }
  }
  
  const toolsCount = Array.isArray(log.tools_executed) ? log.tools_executed.length : 0;
  
  const finalResponse = typeof log.final_response === 'string' 
    ? log.final_response 
    : (log.final_response ? JSON.stringify(log.final_response) : '');
  
  const steps = [
    {
      step: 1,
      name: "Webhook",
      icon: "📥",
      description: `Mensagem recebida: "${String(userMessage).substring(0, 50)}..."`,
      status: "success"
    },
    {
      step: 2,
      name: "Orquestrador",
      icon: "🎯",
      description: `Agente escolhido: ${agentCalled}`,
      details: orchestratorDetails || undefined,
      status: agentCalled !== 'N/A' ? "success" : "warning"
    },
    {
      step: 3,
      name: "Agente Especializado",
      icon: getAgentIcon(agentCalled),
      description: `${agentCalled} processou a mensagem`,
      details: `${toolsCount} ferramenta(s) usada(s)`,
      status: "success"
    },
    {
      step: 4,
      name: "Humanização",
      icon: "🎨",
      description: "Resposta humanizada para WhatsApp",
      details: finalResponse ? String(finalResponse).substring(0, 100) : undefined,
      status: finalResponse ? "success" : "warning"
    },
    {
      step: 5,
      name: "WhatsApp",
      icon: "📱",
      description: "Mensagem enviada",
      status: "success"
    }
  ];
  
  console.log('[DEBUG] Built steps:', steps);
  return steps;
}

export function AIDebugDashboard() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_processing_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
      toast.success('Logs atualizados');
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso vai ARQUIVAR todos os chats ativos e cancelar pedidos pendentes. Confirma?')) {
      return;
    }

    try {
      toast.loading('Resetando sistema...');

      // Chamar edge function de reset que faz tudo atomicamente
      const { data, error } = await supabase.functions.invoke('reset-system');

      if (error) {
        console.error('Erro ao resetar sistema:', error);
        toast.error('Erro ao resetar sistema');
        return;
      }

      console.log('✅ Sistema resetado:', data);
      toast.success(data.message || 'Sistema resetado com sucesso!');
      
      // Recarregar logs
      setLogs([]);
      setSelectedLog(null);
      loadLogs();
      
    } catch (error) {
      console.error('Error resetting system:', error);
      toast.error('Erro ao resetar sistema. Veja o console.');
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Debug Dashboard</h1>
          <p className="text-muted-foreground">Arquitetura Simplificada v5.0 - 5 Etapas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={clearLogs} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Logs Recentes ({logs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLog?.id === log.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">
                        {typeof log.agents_called?.[0] === 'string' 
                          ? log.agents_called[0] 
                          : 'N/A'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.processing_time_ms}ms
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 mb-2">
                      {typeof log.user_messages?.[0] === 'string' 
                        ? log.user_messages[0] 
                        : log.user_messages?.[0]?.content || 'Sem mensagem'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedLog ? `Request: ${selectedLog.request_id}` : 'Selecione um log'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLog ? (
              <Tabs defaultValue="timeline">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="guidance">Orientação</TabsTrigger>
                  <TabsTrigger value="context">Contexto</TabsTrigger>
                  <TabsTrigger value="tools">Ferramentas</TabsTrigger>
                  <TabsTrigger value="raw">Raw Data</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                  {buildSimplifiedTimeline(selectedLog).map((step) => (
                    <div key={step.step} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{step.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">
                              [{step.step}/5] {step.name}
                            </h3>
                            <Badge variant={step.status === 'success' ? 'default' : 'secondary'}>
                              {step.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {step.description}
                          </p>
                          {step.details && typeof step.details === 'string' && (
                            <p className="text-xs text-muted-foreground italic">
                              {step.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="guidance" className="space-y-3">
                  <MacroGuidanceViewer
                    state={selectedLog.metadata_snapshot?.current_state || 'greeting'}
                    guidance={selectedLog.metadata_snapshot?.macro_guidance}
                  />
                </TabsContent>

                <TabsContent value="context" className="space-y-3">
                  <EnrichedContextViewer 
                    context={selectedLog.metadata_snapshot?.enriched_context} 
                  />
                </TabsContent>

                <TabsContent value="tools" className="space-y-3">
                  <ToolCallsViewer toolsExecuted={selectedLog.tools_executed || []} />
                </TabsContent>

                <TabsContent value="raw">
                  <ScrollArea className="h-[500px]">
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4" />
                <p>Selecione um log para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
