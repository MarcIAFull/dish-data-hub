import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Clock } from "lucide-react";
import { IntentsViewer } from "./IntentsViewer";
import { AgentFlowViewer } from "./AgentFlowViewer";
import { ToolCallsViewer } from "./ToolCallsViewer";
import { MetadataDiff } from "./MetadataDiff";
import { ContextViewer } from "./ContextViewer";
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

export function AIDebugDashboard() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(false);

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
      console.error("Error loading chats:", error);
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
      console.error("Error loading logs:", error);
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
    <div className="h-screen flex">
      {/* Left Column - Chats List */}
      <div className="w-80 border-r bg-background">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conversas Recentes</h2>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="mt-2 w-full"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-2 space-y-2">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedChatId === chat.id ? 'border-primary bg-accent' : ''
                }`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Chat #{chat.id}</CardTitle>
                  <p className="text-xs text-muted-foreground">{chat.phone}</p>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(chat.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                  {chat.session_id && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {chat.session_id.substring(0, 20)}...
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column - Logs Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {!selectedChatId ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">
                Selecione uma conversa para ver os logs
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">
                Nenhum log encontrado para esta conversa
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Logs de Processamento AI - Chat #{selectedChatId}
              </h2>
              {logs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-mono">
                          {log.request_id}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.processing_time_ms}ms
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="input">
                        <AccordionTrigger className="text-sm">
                          📥 Input
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold mb-1">Mensagens do Usuário:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(log.user_messages, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1">Estado Atual:</p>
                              <Badge>{log.current_state}</Badge>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="orchestrator">
                        <AccordionTrigger className="text-sm">
                          🎯 Orchestrator
                        </AccordionTrigger>
                        <AccordionContent>
                          <IntentsViewer intents={log.detected_intents} />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="agents">
                        <AccordionTrigger className="text-sm">
                          🤖 Agents
                        </AccordionTrigger>
                        <AccordionContent>
                          <AgentFlowViewer agents={log.agents_called} />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="tools">
                        <AccordionTrigger className="text-sm">
                          🔧 Tools
                        </AccordionTrigger>
                        <AccordionContent>
                          <ToolCallsViewer tools={log.tools_executed} />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="context">
                        <AccordionTrigger className="text-sm">
                          💭 Context
                        </AccordionTrigger>
                        <AccordionContent>
                          <ContextViewer
                            history={log.loaded_history}
                            summaries={log.loaded_summaries}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="output">
                        <AccordionTrigger className="text-sm">
                          📤 Output
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold mb-1">Resposta Final:</p>
                              <p className="text-sm bg-muted p-3 rounded">
                                {log.final_response}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1">Novo Estado:</p>
                              <Badge variant="secondary">{log.new_state}</Badge>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="metadata">
                        <AccordionTrigger className="text-sm">
                          🔄 Metadata Changes
                        </AccordionTrigger>
                        <AccordionContent>
                          <MetadataDiff
                            before={log.metadata_snapshot}
                            after={log.updated_metadata}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
