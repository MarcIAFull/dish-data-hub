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
    agents_called: string[]; // 🆕 Array de agentes
    loop_iterations?: number; // 🆕 Número de iterações
    exit_reason?: string; // 🆕 Razão de saída do loop
    state_transitions?: string[]; // 🆕 Histórico de transições
    tool_results: any[];
    loaded_history: any[];
    loaded_summaries: any[];
    final_response: string;
    processing_time_ms: number;
  }
): Promise<void> {
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
        loop_iterations: logData.loop_iterations,
        exit_reason: logData.exit_reason,
        state_transitions: logData.state_transitions
      },
      detected_intents: [logData.orchestrator_decision],
      agents_called: logData.agents_called, // Agora é array
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
