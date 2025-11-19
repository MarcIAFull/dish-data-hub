import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Package, Clipboard, Download, FileText, CheckCircle } from "lucide-react";

interface ConversationFlowEvent {
  timestamp: string;
  event_type: 'customer_message' | 'agent_message' | 'system_message' | 'tool_call' | 'ai_processing';
  data: any;
}

interface ChatExportData {
  export_metadata: {
    exported_at: string;
    export_version: string;
    chat_id: number;
    phone: string;
  };
  chat_info?: any;
  agent_info?: any;
  agent_config?: any;
  restaurant_info?: any;
  messages?: any[];
  conversation_flow?: ConversationFlowEvent[];
  state_transitions?: any[];
  tool_calls?: any[];
  errors?: any[];
  analytics?: any;
  debug_info?: {
    export_complete: boolean;
    warnings: string[];
    total_events: number;
  };
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

// Criar fluxo cronológico de eventos
function createConversationFlow(messages: any[], toolCalls: any[], aiLogs: any[]): ConversationFlowEvent[] {
  const events: ConversationFlowEvent[] = [];
  
  // Adicionar mensagens
  messages.forEach(msg => {
    events.push({
      timestamp: msg.created_at,
      event_type: msg.sender_type === 'customer' ? 'customer_message' 
                : msg.sender_type === 'agent' ? 'agent_message' 
                : 'system_message',
      data: {
        id: msg.id,
        content: msg.content,
        message_type: msg.message_type,
        metadata: msg.metadata
      }
    });
  });
  
  // Adicionar tool calls
  toolCalls.forEach(tc => {
    events.push({
      timestamp: tc.log_created_at || tc.created_at,
      event_type: 'tool_call',
      data: tc
    });
  });
  
  // Adicionar processamentos AI
  aiLogs.forEach(log => {
    events.push({
      timestamp: log.created_at,
      event_type: 'ai_processing',
      data: {
        request_id: log.request_id,
        current_state: log.current_state,
        new_state: log.new_state,
        detected_intents: log.detected_intents,
        processing_time_ms: log.processing_time_ms
      }
    });
  });
  
  // Ordenar por timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  return events;
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
  
  // Warnings
  if (data.debug_info && data.debug_info.warnings.length > 0) {
    text += '⚠️ AVISOS:\n';
    data.debug_info.warnings.forEach(w => text += `   - ${w}\n`);
    text += '\n';
  }
  
  if (data.chat_info) {
    text += '─────────────────────────────────────────────\n';
    text += '📊 INFORMAÇÕES DO CHAT\n';
    text += '─────────────────────────────────────────────\n';
    text += `Status: ${data.chat_info.status}\n`;
    text += `Estado: ${data.chat_info.conversation_state}\n`;
    text += `IA Habilitada: ${data.chat_info.ai_enabled ? 'Sim' : 'Não'}\n`;
    text += `Criado em: ${data.chat_info.created_at}\n`;
    text += `Última mensagem: ${data.chat_info.last_message_at}\n\n`;
  }
  
  if (data.agent_info) {
    text += '─────────────────────────────────────────────\n';
    text += '🤖 INFORMAÇÕES DO AGENTE\n';
    text += '─────────────────────────────────────────────\n';
    text += `Nome: ${data.agent_info.name}\n`;
    text += `Personalidade: ${data.agent_info.personality}\n`;
    if (data.agent_config) {
      text += `\nConfigurações:\n`;
      text += `  - Criação de pedidos: ${data.agent_config.tools_enabled.order_creation ? 'Sim' : 'Não'}\n`;
      text += `  - Busca de produtos: ${data.agent_config.tools_enabled.product_search ? 'Sim' : 'Não'}\n`;
      text += `  - Confirmação obrigatória: ${data.agent_config.tools_enabled.order_confirmation ? 'Sim' : 'Não'}\n`;
    }
    text += '\n';
  }
  
  // Fluxo cronológico
  if (data.conversation_flow && data.conversation_flow.length > 0) {
    text += '─────────────────────────────────────────────\n';
    text += '📅 FLUXO CRONOLÓGICO DA CONVERSA\n';
    text += '─────────────────────────────────────────────\n\n';
    
    data.conversation_flow.forEach((event, idx) => {
      const time = new Date(event.timestamp).toLocaleString('pt-BR');
      
      switch (event.event_type) {
        case 'customer_message':
          text += `${idx + 1}. 👤 [CLIENTE] ${time}\n`;
          text += `   ${event.data.content}\n\n`;
          break;
        case 'agent_message':
          text += `${idx + 1}. 🤖 [AGENTE] ${time}\n`;
          text += `   ${event.data.content}\n\n`;
          break;
        case 'system_message':
          text += `${idx + 1}. ⚙️ [SISTEMA] ${time}\n`;
          text += `   ${event.data.content}\n\n`;
          break;
        case 'tool_call':
          text += `${idx + 1}. 🛠️ [TOOL CALL] ${time}\n`;
          text += `   Função: ${event.data.function_name || event.data.name}\n`;
          text += `   Status: ${event.data.success ? '✅ Sucesso' : '❌ Falhou'}\n`;
          if (event.data.execution_time_ms) {
            text += `   Tempo: ${event.data.execution_time_ms}ms\n`;
          }
          text += '\n';
          break;
        case 'ai_processing':
          text += `${idx + 1}. 🧠 [AI PROCESSING] ${time}\n`;
          if (event.data.current_state !== event.data.new_state) {
            text += `   Estado: ${event.data.current_state} → ${event.data.new_state}\n`;
          }
          if (event.data.processing_time_ms) {
            text += `   Tempo: ${event.data.processing_time_ms}ms\n`;
          }
          text += '\n';
          break;
      }
    });
  }
  
  if (data.analytics) {
    text += '─────────────────────────────────────────────\n';
    text += '📈 ESTATÍSTICAS\n';
    text += '─────────────────────────────────────────────\n';
    text += `Total de mensagens: ${data.analytics.total_messages}\n`;
    text += `  └─ Cliente: ${data.analytics.customer_messages}\n`;
    text += `  └─ Agente: ${data.analytics.agent_messages}\n`;
    text += `  └─ Sistema: ${data.analytics.system_messages}\n\n`;
    text += `Tool calls executadas: ${data.analytics.total_tool_calls}\n`;
    text += `  └─ Sucesso: ${data.analytics.successful_tool_calls}\n`;
    text += `  └─ Falhas: ${data.analytics.failed_tool_calls}\n\n`;
    text += `Duração total: ${data.analytics.conversation_duration_seconds}s\n`;
    text += `Tempo médio de resposta: ${data.analytics.avg_response_time_seconds}s\n\n`;
  }
  
  if (data.debug_info) {
    text += '─────────────────────────────────────────────\n';
    text += '🔍 DEBUG INFO\n';
    text += '─────────────────────────────────────────────\n';
    text += `Export completo: ${data.debug_info.export_complete ? 'Sim' : 'Não'}\n`;
    text += `Total de eventos: ${data.debug_info.total_events}\n`;
    if (data.debug_info.warnings.length > 0) {
      text += `Avisos: ${data.debug_info.warnings.length}\n`;
    }
    text += '\n';
  }
  
  text += '═══════════════════════════════════════════════\n';
  text += '                FIM DO EXPORT                  \n';
  text += '═══════════════════════════════════════════════\n';
  
  return text;
}

export default function ChatExporter({ chatId }: ChatExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
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

  const handleTest = async () => {
    setIsTesting(true);
    console.log('🧪 [ChatExporter] TESTE DE EXPORT INICIADO');
    
    try {
      await getExportData();
      toast.success('✅ Teste de export bem-sucedido! Verifique o console.');
    } catch (error) {
      console.error('❌ [ChatExporter] TESTE FALHOU:', error);
      toast.error('Teste falhou! Verifique o console para detalhes.');
    } finally {
      setIsTesting(false);
    }
  };

  const getExportData = async (): Promise<ChatExportData> => {
    console.log('🔍 [ChatExporter] Iniciando export para chatId:', chatId);
    
    // 1. Buscar dados do chat completo
    console.log('📊 [ChatExporter] Buscando dados do chat...');
    const { data: chat, error: chatError } = await supabase
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

    if (chatError) {
      console.error('❌ [ChatExporter] Erro ao buscar chat:', chatError);
      throw new Error(`Erro ao buscar chat: ${chatError.message}`);
    }
    
    if (!chat) {
      console.error('❌ [ChatExporter] Chat não encontrado');
      throw new Error('Chat não encontrado');
    }
    
    console.log('✅ [ChatExporter] Chat encontrado:', {
      id: chat.id,
      phone: chat.phone,
      status: chat.status,
      conversation_state: chat.conversation_state
    });

    // 2. Buscar todas as mensagens
    console.log('💬 [ChatExporter] Buscando mensagens...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ [ChatExporter] Erro ao buscar mensagens:', messagesError);
    } else {
      console.log('✅ [ChatExporter] Mensagens encontradas:', messages?.length || 0);
      if (messages && messages.length > 0) {
        console.log('📝 [ChatExporter] Primeira mensagem:', messages[0]);
        console.log('📝 [ChatExporter] Última mensagem:', messages[messages.length - 1]);
      }
    }

    // 3. Buscar AI processing logs (contém tool calls)
    console.log('🤖 [ChatExporter] Buscando AI processing logs...');
    const { data: aiLogs, error: aiLogsError } = await supabase
      .from('ai_processing_logs')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (aiLogsError) {
      console.error('❌ [ChatExporter] Erro ao buscar AI logs:', aiLogsError);
    } else {
      console.log('✅ [ChatExporter] AI logs encontrados:', aiLogs?.length || 0);
    }

    // Extrair tool calls dos logs
    const toolCalls = aiLogs?.flatMap((log, index) => {
      if (!log.tools_executed) return [];
      try {
        const parsed = typeof log.tools_executed === 'string' 
          ? JSON.parse(log.tools_executed) 
          : log.tools_executed;
        const calls = Array.isArray(parsed) ? parsed : [];
        console.log(`🛠️ [ChatExporter] Log ${index + 1}: ${calls.length} tool calls`);
        return calls.map((call: any) => ({
          ...call,
          log_created_at: log.created_at,
          request_id: log.request_id
        }));
      } catch (e) {
        console.error(`❌ [ChatExporter] Erro ao parsear tools_executed do log ${index + 1}:`, e);
        return [];
      }
    }) || [];
    
    console.log('✅ [ChatExporter] Total de tool calls extraídos:', toolCalls.length);

    // 4. Buscar erros relacionados
    console.log('⚠️ [ChatExporter] Buscando erros...');
    const { data: errors, error: errorsError } = await supabase
      .from('error_logs')
      .select('*')
      .contains('context', { chat_id: chatId })
      .order('created_at', { ascending: true });

    if (errorsError) {
      console.error('❌ [ChatExporter] Erro ao buscar error logs:', errorsError);
    } else {
      console.log('✅ [ChatExporter] Erros encontrados:', errors?.length || 0);
    }

    // 5. Calcular analíticas
    console.log('📈 [ChatExporter] Calculando analíticas...');
    const analytics = calculateAnalytics(chat, messages || [], toolCalls);
    console.log('✅ [ChatExporter] Analíticas:', analytics);

    // 6. Detectar transições de estado
    console.log('🔄 [ChatExporter] Detectando transições de estado...');
    const stateTransitions = detectStateTransitions(messages || [], chat);
    console.log('✅ [ChatExporter] Transições encontradas:', stateTransitions.length);

    // 7. Criar fluxo cronológico
    console.log('📅 [ChatExporter] Criando fluxo cronológico...');
    const conversationFlow = createConversationFlow(messages || [], toolCalls, aiLogs || []);
    console.log('✅ [ChatExporter] Eventos no fluxo:', conversationFlow.length);

    // 8. Validar export
    const warnings: string[] = [];
    if (!messages || messages.length === 0) {
      warnings.push('Nenhuma mensagem encontrada para este chat');
    }
    if (!aiLogs || aiLogs.length === 0) {
      warnings.push('Nenhum log de processamento AI encontrado');
    }
    if (toolCalls.length === 0) {
      warnings.push('Nenhuma tool call encontrada');
    }
    
    console.log('⚠️ [ChatExporter] Warnings:', warnings);

    // 9. Montar objeto final
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
      
      exportData.agent_config = {
        tools_enabled: {
          order_creation: chat.agents.enable_order_creation,
          product_search: chat.agents.enable_product_search,
          order_confirmation: chat.agents.order_confirmation_required
        }
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

    // Adicionar fluxo cronológico
    exportData.conversation_flow = conversationFlow;

    // Adicionar debug info
    exportData.debug_info = {
      export_complete: warnings.length === 0,
      warnings,
      total_events: conversationFlow.length
    };

    console.log('✅ [ChatExporter] Export completo:', {
      has_messages: !!exportData.messages && exportData.messages.length > 0,
      has_flow: conversationFlow.length > 0,
      warnings: warnings.length
    });

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

        {/* Botão de teste */}
        <Button 
          onClick={handleTest}
          disabled={isTesting}
          variant="secondary"
          className="w-full"
        >
          🧪 {isTesting ? 'Testando...' : 'Testar Export (veja console)'}
        </Button>

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
