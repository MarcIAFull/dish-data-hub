// 💾 Simple database helpers

/**
 * Load recent messages for conversation context
 */
export async function loadConversationHistory(
  supabase: any,
  chatId: number,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading history:', error);
    return [];
  }

  return (data || []).reverse(); // Return chronological order
}

/**
 * Save AI processing log to database
 */
export async function saveProcessingLog(
  supabase: any,
  logData: {
    chat_id: number;
    session_id: string;
    request_id: string;
    user_message: string;
    current_state: string;
    new_state?: string;
    metadata_snapshot: any;
    orchestrator_decision: any;
    agents_called: string[];
    loop_iterations?: number;
    exit_reason?: string;
    state_transitions?: string[];
    tool_results: any[];
    loaded_history: any[];
    loaded_summaries: any[];
    final_response: string;
    processing_time_ms: number;
    enriched_context?: any; // ✅ FASE 1: Contexto enriquecido
    macro_guidance?: string; // ✅ FASE 2: Orientação macro
    agent_metrics?: {
      [agent: string]: {
        execution_time_ms: number;
        tools_called: number;
        success: boolean;
      };
    };
  }
): Promise<void> {
  // Calcular métricas de ferramentas
  const toolMetrics = logData.tool_results.reduce((acc, result) => {
    const toolName = result.tool || 'unknown';
    if (!acc[toolName]) {
      acc[toolName] = { success: 0, failed: 0, total: 0 };
    }
    acc[toolName].total++;
    if (result.success) {
      acc[toolName].success++;
    } else {
      acc[toolName].failed++;
    }
    return acc;
  }, {} as Record<string, { success: number; failed: number; total: number }>);

  const { error } = await supabase
    .from('ai_processing_logs')
    .insert({
      chat_id: logData.chat_id,
      session_id: logData.session_id,
      request_id: logData.request_id,
      user_messages: [{ content: logData.user_message }],
      current_state: logData.current_state,
      new_state: logData.new_state,
      metadata_snapshot: {
        ...logData.metadata_snapshot,
        current_state: logData.current_state,
        macro_guidance: logData.macro_guidance,  // ✅ NOVO: FASE 2
        enriched_context: logData.enriched_context,  // ✅ FASE 1
        loop_iterations: logData.loop_iterations,
        exit_reason: logData.exit_reason,
        state_transitions: logData.state_transitions,
        agent_metrics: logData.agent_metrics,
        tool_metrics: toolMetrics,
        avg_agent_time_ms: logData.agent_metrics
          ? Object.values(logData.agent_metrics).reduce((sum, m) => sum + m.execution_time_ms, 0) / Object.keys(logData.agent_metrics).length
          : 0,
        enriched_context: logData.enriched_context // ✅ NOVO: Persistir contexto enriquecido
      },
      detected_intents: [logData.orchestrator_decision],
      agents_called: logData.agents_called,
      tools_executed: logData.tool_results,
      loaded_history: logData.loaded_history,
      loaded_summaries: logData.loaded_summaries,
      final_response: logData.final_response,
      processing_time_ms: logData.processing_time_ms,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving processing log:', error);
  }
}

/**
 * Get cart from chat metadata
 */
export function getCartFromMetadata(metadata: any): {
  items: any[];
  total: number;
  count: number;
} {
  const items = metadata?.order_items || [];
  const total = items.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unit_price), 0
  );
  
  return {
    items,
    total,
    count: items.length
  };
}

/**
 * Update chat metadata
 */
export async function updateChatMetadata(
  supabase: any,
  chatId: number,
  metadata: any
): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .update({ 
      metadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', chatId);

  if (error) {
    console.error('Error updating metadata:', error);
  }
}
