// Tools for AI to interact with orders (read-only + notifications)

export async function executeCheckOrderStatus(
  supabase: any,
  agent: any,
  args: { order_id: number }
) {
  try {
    console.log('[CHECK_ORDER_STATUS] Checking order:', args.order_id);
    
    const { data: order, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        order_status,
        order_source,
        customer_name,
        customer_phone,
        delivery_type,
        total_amount,
        estimated_time,
        created_at,
        updated_at,
        payload
      `)
      .eq('id', args.order_id)
      .eq('restaurant_id', agent.restaurants.id)
      .single();
    
    if (error) {
      console.error('[CHECK_ORDER_STATUS] Error:', error);
      return {
        success: false,
        error: 'Pedido não encontrado',
        message: 'Não foi possível localizar esse pedido.'
      };
    }
    
    // Get status history
    const { data: history } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', args.order_id)
      .order('changed_at', { ascending: false })
      .limit(5);
    
    const statusLabels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Em preparo',
      ready: 'Pronto',
      in_delivery: 'Em entrega',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    
    const currentStatus = statusLabels[order.order_status as keyof typeof statusLabels] || order.order_status;
    
    return {
      success: true,
      order_id: order.id,
      current_status: currentStatus,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      items_count: order.payload?.items?.length || 0,
      delivery_type: order.delivery_type,
      estimated_time: order.estimated_time,
      created_at: order.created_at,
      last_update: order.updated_at,
      recent_updates: history?.map(h => ({
        from: statusLabels[h.previous_status as keyof typeof statusLabels],
        to: statusLabels[h.new_status as keyof typeof statusLabels],
        when: h.changed_at,
        notes: h.notes
      })),
      message: `Pedido #${order.id} está ${currentStatus}.`
    };
    
  } catch (error) {
    console.error('[CHECK_ORDER_STATUS] Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao consultar status do pedido.'
    };
  }
}

export async function executeNotifyStatusChange(
  supabase: any,
  agent: any,
  args: {
    order_id: number;
    message?: string;
  },
  customerPhone: string
) {
  try {
    console.log('[NOTIFY_STATUS] Sending notification for order:', args.order_id);
    
    // Get order details
    const { data: order, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', args.order_id)
      .eq('restaurant_id', agent.restaurants.id)
      .single();
    
    if (error || !order) {
      return {
        success: false,
        error: 'Pedido não encontrado'
      };
    }
    
    // Build notification message
    const statusLabels = {
      pending: 'está pendente de confirmação',
      confirmed: 'foi confirmado',
      preparing: 'está sendo preparado',
      ready: 'está pronto',
      in_delivery: 'saiu para entrega',
      completed: 'foi concluído',
      cancelled: 'foi cancelado'
    };
    
    const statusMessage = statusLabels[order.order_status as keyof typeof statusLabels] || 'teve uma atualização';
    
    let notificationText = `📦 *Atualização do Pedido #${order.id}*\n\n`;
    notificationText += `Seu pedido ${statusMessage}!\n\n`;
    
    if (args.message) {
      notificationText += `💬 ${args.message}\n\n`;
    }
    
    if (order.estimated_time && ['confirmed', 'preparing'].includes(order.order_status)) {
      notificationText += `⏰ Tempo estimado: ${order.estimated_time} minutos\n\n`;
    }
    
    notificationText += `Total: R$ ${order.total_amount?.toFixed(2)}\n`;
    notificationText += `Tipo: ${order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}`;
    
    // Send via Evolution API
    if (agent.evolution_api_token && agent.evolution_api_instance) {
      const response = await fetch(
        `${agent.evolution_api_base_url || 'https://evolution.fullbpo.com'}/message/sendText/${agent.evolution_api_instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': agent.evolution_api_token
          },
          body: JSON.stringify({
            number: customerPhone,
            text: notificationText
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      console.log('[NOTIFY_STATUS] Notification sent successfully');
      
      return {
        success: true,
        message: 'Notificação enviada com sucesso!'
      };
    } else {
      return {
        success: false,
        error: 'Evolution API não configurada'
      };
    }
    
  } catch (error) {
    console.error('[NOTIFY_STATUS] Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao enviar notificação.'
    };
  }
}

// FASE 9: Transfer conversation to human agent
export async function executeTransferToHuman(
  supabase: any,
  agent: any,
  args: {
    reason: string;
    summary: string;
  },
  chatId: number,
  customerPhone: string
) {
  try {
    console.log('[TRANSFER_TO_HUMAN] Initiating transfer - Chat:', chatId, 'Reason:', args.reason);
    
    // 1. Disable AI for this chat
    const { error: updateError } = await supabase
      .from('chats')
      .update({ 
        ai_enabled: false,
        status: 'human_handoff',
        conversation_state: 'awaiting_human',
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
    
    if (updateError) throw updateError;
    
    console.log('[TRANSFER_TO_HUMAN] ✓ AI disabled for chat');
    
    // 2. Create internal note with context
    const noteText = `🤖→👤 TRANSFERÊNCIA AI → HUMANO

📋 Motivo: ${args.reason}

📝 Resumo da conversa:
${args.summary}

⏰ Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
📱 Cliente: ${customerPhone}
`;
    
    const { error: noteError } = await supabase
      .from('conversation_notes')
      .insert({
        chat_id: chatId,
        note: noteText,
        user_id: null,
        created_at: new Date().toISOString()
      });
    
    if (noteError) {
      console.error('[TRANSFER_TO_HUMAN] Failed to create note:', noteError);
    } else {
      console.log('[TRANSFER_TO_HUMAN] ✓ Internal note created');
    }
    
    // 3. Create security alert for serious cases
    if (['complaint', 'abuse', 'threat'].includes(args.reason)) {
      await supabase
        .from('security_alerts')
        .insert({
          agent_id: agent.id,
          phone: customerPhone,
          alert_type: 'escalation_required',
          message_content: args.summary.substring(0, 500),
          patterns_detected: [args.reason],
          created_at: new Date().toISOString()
        });
      
      console.log('[TRANSFER_TO_HUMAN] ⚠️ Security alert created');
    }
    
    console.log('[TRANSFER_TO_HUMAN] ✅ Transfer completed successfully');
    
    return {
      success: true,
      message: 'Conversa transferida para atendente humano com sucesso.',
      chat_disabled: true
    };
    
  } catch (error) {
    console.error('[TRANSFER_TO_HUMAN] ❌ Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao transferir para atendente humano.'
    };
  }
}
