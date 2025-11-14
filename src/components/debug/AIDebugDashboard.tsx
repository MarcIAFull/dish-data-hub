import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Clock, Trash2, MessageSquare, Workflow, Activity } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IntentsViewer } from "./IntentsViewer";
import { AgentFlowViewer } from "./AgentFlowViewer";
import { ToolCallsViewer } from "./ToolCallsViewer";
import { MetadataDiff } from "./MetadataDiff";
import { ContextViewer } from "./ContextViewer";
import { CommunicationViewer } from "./CommunicationViewer";
import { TimelineViewer } from "./TimelineViewer";
import { format } from "date-fns";
import { toast } from "sonner";

interface AILog {
  id: string;
  chat_id: number;
  session_id: string;
  request_id: string;
  user_messages: any;
  current_state: string;
  metadata_snapshot: any;
  detected_intents: any;
  execution_plan: any;
  agents_called: any;
  tools_executed: any;
  loaded_history: any;
  loaded_summaries: any;
  final_response: string;
  new_state: string;
  updated_metadata: any;
  processing_time_ms: number;
  created_at: string;
}

interface Chat {
  id: number;
  phone: string;
  session_id: string;
  created_at: string;
}

function buildTimelineEvents(log: AILog) {
  const events: any[] = [];
  let timestamp = 0;

  if (log.detected_intents && log.detected_intents.length > 0) {
    events.push({
      timestamp,
      type: "intent",
      title: `${log.detected_intents.length} Intent(s)`,
      description: log.detected_intents.map((i: any) => i.type).join(", "),
      status: "success"
    });
    timestamp += 50;
  }

  if (log.agents_called && log.agents_called.length > 0) {
    log.agents_called.forEach((agent: any) => {
      events.push({
        timestamp,
        type: "agent",
        title: `${agent.agent} - ${agent.action}`,
        description: agent.output ? `Output: ${agent.output.substring(0, 100)}...` : undefined,
        status: "success"
      });
      timestamp += 100;
    });
  }

  if (log.tools_executed && log.tools_executed.length > 0) {
    log.tools_executed.forEach((tool: any, idx: number) => {
      events.push({
        timestamp,
        type: "tool",
        title: tool.toolName || `Tool ${idx + 1}`,
        description: tool.success ? "Executado" : "Falhou",
        status: tool.success ? "success" : "error"
      });
      timestamp += 30;
    });
  }

  if (log.final_response) {
    events.push({
      timestamp,
      type: "response",
      title: "Resposta Final",
      description: `${log.final_response.length} chars`,
      status: "success"
    });
  }

  return events;
}

export function AIDebugDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetSystem = async () => {
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-system');
      if (error) throw error;
      toast.success(data.message);
      await loadChats();
      setSelectedChatId(null);
      setLogs([]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao resetar');
    } finally {
      setResetting(false);
    }
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("id, phone, session_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (chatId: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_processing_logs")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      loadLogs(selectedChatId);
    }
  }, [selectedChatId]);

  const handleRefresh = () => {
    if (selectedChatId) {
      loadLogs(selectedChatId);
    } else {
      loadChats();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Debug Dashboard</h1>
            <p className="text-muted-foreground">
              Sistema completo de debug
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={resetting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá apagar todos os dados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSystem}>
                    Resetar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Conversas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <Card
                      key={chat.id}
                      className={`cursor-pointer transition-colors ${
                        selectedChatId === chat.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{chat.phone}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(chat.created_at), "dd/MM HH:mm")}
                            </p>
                          </div>
                          <Badge variant="outline">#{chat.id}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            {!selectedChatId ? (
              <Card>
                <CardContent className="py-24 text-center">
                  <p className="text-muted-foreground">
                    Selecione uma conversa
                  </p>
                </CardContent>
              </Card>
            ) : logs.length === 0 ? (
              <Card>
                <CardContent className="py-24 text-center">
                  <p className="text-muted-foreground">Nenhum log encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {logs.map((log) => (
                  <Card key={log.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Request: {log.request_id.substring(0, 8)}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                            <Badge variant="outline" className="ml-2">
                              {log.processing_time_ms}ms
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {log.current_state && <Badge variant="outline">{log.current_state}</Badge>}
                          {log.new_state && log.new_state !== log.current_state && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">→</span>
                              <Badge>{log.new_state}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <Tabs defaultValue="communication" className="w-full">
                        <TabsList className="grid w-full grid-cols-6">
                          <TabsTrigger value="communication" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Comunicação
                          </TabsTrigger>
                          <TabsTrigger value="timeline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Timeline
                          </TabsTrigger>
                          <TabsTrigger value="intents" className="text-xs">
                            Intents
                          </TabsTrigger>
                          <TabsTrigger value="agents" className="text-xs">
                            <Workflow className="h-3 w-3 mr-1" />
                            Agentes
                          </TabsTrigger>
                          <TabsTrigger value="context" className="text-xs">
                            Contexto
                          </TabsTrigger>
                          <TabsTrigger value="metadata" className="text-xs">
                            Metadata
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="communication" className="mt-4">
                          <CommunicationViewer agents={log.agents_called || []} />
                        </TabsContent>

                        <TabsContent value="timeline" className="mt-4">
                          <TimelineViewer 
                            events={buildTimelineEvents(log)} 
                            totalTime={log.processing_time_ms}
                          />
                        </TabsContent>

                        <TabsContent value="intents" className="mt-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Intenções</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <IntentsViewer intents={log.detected_intents || []} />
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="agents" className="mt-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Fluxo de Agentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <AgentFlowViewer agents={log.agents_called || []} />
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="context" className="mt-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Contexto</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ContextViewer
                                history={log.loaded_history}
                                summaries={log.loaded_summaries}
                              />
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="metadata" className="mt-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Metadata</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <MetadataDiff
                                before={log.metadata_snapshot}
                                after={log.updated_metadata}
                              />
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>

                      {log.final_response && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
                          <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            Resposta Final:
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{log.final_response}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
