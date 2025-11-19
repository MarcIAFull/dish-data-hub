import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Package, Clipboard, Download, FileText, CheckCircle } from "lucide-react";

interface ChatExportData {
  export_metadata: {
    exported_at: string;
    export_version: string;
    chat_id: number;
    phone: string;
  };
  chat_info?: any;
  agent_info?: any;
  restaurant_info?: any;
  messages?: any[];
  state_transitions?: any[];
  tool_calls?: any[];
  errors?: any[];
  analytics?: any;
}

interface ChatExporterProps {
  chatId: number;
}

// Calcular analíticas da conversa
function calculateAnalytics(chat: any, messages: any[], toolCalls: any[]) {
  const customerMessages = messages.filter(m => m.sender_type === 'customer');
  const agentMessages = messages.filter(m => m.sender_type === 'agent');
  const systemMessages = messages.filter(m => m.sender_type === 'system');
  
  const successfulToolCalls = toolCalls?.filter(tc => tc.success).length || 0;
  const failedToolCalls = toolCalls?.filter(tc => !tc.success).length || 0;
  
  const conversationDuration = chat.updated_at && chat.created_at
    ? Math.floor((new Date(chat.updated_at).getTime() - new Date(chat.created_at).getTime()) / 1000)
    : 0;
  
  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].sender_type === 'customer' && messages[i + 1].sender_type === 'agent') {
      const responseTime = new Date(messages[i + 1].created_at).getTime() - new Date(messages[i].created_at).getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }
  }
  
  const avgResponseTime = responseCount > 0 
    ? Math.floor(totalResponseTime / responseCount / 1000) 
    : 0;
  
  return {
    total_messages: messages.length,
    customer_messages: customerMessages.length,
    agent_messages: agentMessages.length,
    system_messages: systemMessages.length,
    total_tool_calls: toolCalls?.length || 0,
    successful_tool_calls: successfulToolCalls,
    failed_tool_calls: failedToolCalls,
    conversation_duration_seconds: conversationDuration,
    avg_response_time_seconds: avgResponseTime
  };
}

// Detectar transições de estado do metadata
function detectStateTransitions(messages: any[], chat: any) {
  const transitions = [];
  
  if (chat.metadata?.state_history) {
    return chat.metadata.state_history;
  }
  
  if (chat.conversation_state) {
    transitions.push({
      from_state: 'greeting',
      to_state: chat.conversation_state,
      transitioned_at: chat.updated_at,
      trigger_message_id: messages[messages.length - 1]?.id
    });
  }
  
  return transitions;
}

// Formatar como texto legível
function formatAsReadableText(data: ChatExportData): string {
  let text = '';
  
  text += '═══════════════════════════════════════════════\n';
  text += '        EXPORT DE CONVERSA - ZENDY AI         \n';
  text += '═══════════════════════════════════════════════\n\n';
  
  text += `📅 Exportado em: ${data.export_metadata.exported_at}\n`;
  text += `📞 Telefone: ${data.export_metadata.phone}\n`;
  text += `🆔 Chat ID: ${data.export_metadata.chat_id}\n\n`;
  
  if (data.chat_info) {
    text += '─────────────────────────────────────────────\n';
    text += '📊 INFORMAÇÕES DO CHAT\n';
    text += '─────────────────────────────────────────────\n';
    text += `Status: ${data.chat_info.status}\n`;
    text += `Estado: ${data.chat_info.conversation_state}\n`;
    text += `IA Habilitada: ${data.chat_info.ai_enabled ? 'Sim' : 'Não'}\n`;
    text += `Criado em: ${data.chat_info.created_at}\n\n`;
  }
  
  if (data.messages) {
    text += '─────────────────────────────────────────────\n';
    text += '💬 HISTÓRICO DE MENSAGENS\n';
    text += '─────────────────────────────────────────────\n\n';
    
    data.messages.forEach((msg) => {
      const emoji = msg.sender_type === 'customer' ? '👤' : 
                    msg.sender_type === 'agent' ? '🤖' : '⚙️';
      text += `${emoji} [${msg.sender_type.toUpperCase()}] ${msg.created_at}\n`;
      text += `${msg.content}\n\n`;
    });
  }
  
  if (data.tool_calls && data.tool_calls.length > 0) {
    text += '─────────────────────────────────────────────\n';
    text += '🛠️ TOOL CALLS\n';
    text += '─────────────────────────────────────────────\n\n';
    
    data.tool_calls.forEach(tc => {
      text += `⚡ ${tc.function_name}\n`;
      text += `   Status: ${tc.success ? '✅ Sucesso' : '❌ Falhou'}\n`;
      text += `   Tempo: ${tc.execution_time_ms}ms\n`;
      text += `   Timestamp: ${tc.created_at}\n\n`;
    });
  }
  
  if (data.analytics) {
    text += '─────────────────────────────────────────────\n';
    text += '📈 ANALÍTICAS\n';
    text += '─────────────────────────────────────────────\n';
    text += `Total de mensagens: ${data.analytics.total_messages}\n`;
    text += `Mensagens do cliente: ${data.analytics.customer_messages}\n`;
    text += `Mensagens do agente: ${data.analytics.agent_messages}\n`;
    text += `Tool calls: ${data.analytics.total_tool_calls}\n`;
    text += `Duração: ${data.analytics.conversation_duration_seconds}s\n`;
    text += `Tempo médio de resposta: ${data.analytics.avg_response_time_seconds}s\n\n`;
  }
  
  text += '═══════════════════════════════════════════════\n';
  text += '                FIM DO EXPORT                  \n';
  text += '═══════════════════════════════════════════════\n';
  
  return text;
}

export default function ChatExporter({ chatId }: ChatExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [includeOptions, setIncludeOptions] = useState({
    chat_info: true,
    agent_info: true,
    restaurant_info: true,
    messages: true,
    state_transitions: true,
    tool_calls: true,
    errors: true,
    analytics: true
  });

  const getExportData = async (): Promise<ChatExportData> => {
    // 1. Buscar dados do chat completo
    const { data: chat } = await supabase
      .from('chats')
      .select(`
        *,
        agents (
          id, name, personality,
          enable_order_creation, enable_product_search,
          order_confirmation_required,
          restaurants (
            id, name, slug, address, phone
          )
        )
      `)
      .eq('id', chatId)
      .single();

    if (!chat) throw new Error('Chat não encontrado');

    // 2. Buscar todas as mensagens
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    // 3. Buscar AI processing logs (contém tool calls)
    const { data: aiLogs } = await supabase
      .from('ai_processing_logs')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    // Extrair tool calls dos logs
    const toolCalls = aiLogs?.flatMap(log => {
      if (!log.tools_executed) return [];
      try {
        const parsed = typeof log.tools_executed === 'string' 
          ? JSON.parse(log.tools_executed) 
          : log.tools_executed;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }) || [];

    // 4. Buscar erros relacionados
    const { data: errors } = await supabase
      .from('error_logs')
      .select('*')
      .contains('context', { chat_id: chatId })
      .order('created_at', { ascending: true });

    // 5. Calcular analíticas
    const analytics = calculateAnalytics(chat, messages || [], toolCalls);

    // 6. Detectar transições de estado
    const stateTransitions = detectStateTransitions(messages || [], chat);

    // 7. Montar objeto final
    const exportData: ChatExportData = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_version: "1.0",
        chat_id: chat.id,
        phone: chat.phone || 'N/A'
      }
    };

    if (includeOptions.chat_info) {
      exportData.chat_info = {
        id: chat.id,
        phone: chat.phone,
        status: chat.status,
        conversation_state: chat.conversation_state,
        ai_enabled: chat.ai_enabled,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        last_message_at: chat.last_message_at,
        metadata: chat.metadata
      };
    }

    if (includeOptions.agent_info && chat.agents) {
      exportData.agent_info = {
        id: chat.agents.id,
        name: chat.agents.name,
        personality: chat.agents.personality,
        enable_order_creation: chat.agents.enable_order_creation,
        enable_product_search: chat.agents.enable_product_search,
        order_confirmation_required: chat.agents.order_confirmation_required
      };
    }

    if (includeOptions.restaurant_info && chat.agents?.restaurants) {
      exportData.restaurant_info = {
        id: chat.agents.restaurants.id,
        name: chat.agents.restaurants.name,
        slug: chat.agents.restaurants.slug,
        address: chat.agents.restaurants.address,
        phone: chat.agents.restaurants.phone
      };
    }

    if (includeOptions.messages) {
      exportData.messages = messages?.map(m => ({
        id: m.id,
        sender_type: m.sender_type,
        content: m.content,
        message_type: m.message_type,
        created_at: m.created_at,
        metadata: m.metadata
      })) || [];
    }

    if (includeOptions.state_transitions) {
      exportData.state_transitions = stateTransitions;
    }

    if (includeOptions.tool_calls) {
      exportData.tool_calls = toolCalls;
    }

    if (includeOptions.errors) {
      exportData.errors = errors || [];
    }

    if (includeOptions.analytics) {
      exportData.analytics = analytics;
    }

    return exportData;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = await getExportData();

      await navigator.clipboard.writeText(
        JSON.stringify(exportData, null, 2)
      );

      setExportSuccess(true);
      toast.success('JSON copiado para área de transferência!');

      setTimeout(() => setExportSuccess(false), 3000);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar conversa');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJSON = async () => {
    try {
      const exportData = await getExportData();
      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)], 
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${chatId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo JSON baixado!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar JSON');
    }
  };

  const handleDownloadTXT = async () => {
    try {
      const exportData = await getExportData();
      const readableText = formatAsReadableText(exportData);
      const blob = new Blob([readableText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${chatId}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo TXT baixado!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar TXT');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Exportar Conversa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checkboxes de opções */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(includeOptions).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                checked={value}
                onCheckedChange={(checked) =>
                  setIncludeOptions(prev => ({ ...prev, [key]: !!checked }))
                }
              />
              <label className="text-sm cursor-pointer">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
            </div>
          ))}
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            <Clipboard className="mr-2 h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Copiar JSON'}
          </Button>
          
          <Button 
            onClick={handleDownloadJSON}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            .JSON
          </Button>
          
          <Button 
            onClick={handleDownloadTXT}
            variant="outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            .TXT
          </Button>
        </div>

        {/* Success feedback */}
        {exportSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              JSON copiado para área de transferência!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
