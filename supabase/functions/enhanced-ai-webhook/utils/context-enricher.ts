// 🧠 Context Enricher - Enriquece contexto com dados do DB
// FASE 1: Infraestrutura de Contexto Enriquecido

export interface EnrichedContext {
  customer: {
    phone: string;
    lastOrders: any[];
    favoriteItems: string[];
    preferredAddress: string | null;
    preferredPayment: string | null;
    totalOrders: number;
  };
  restaurant: {
    isOpen: boolean;
    nextOpenTime: string | null;
    estimatedPrepTime: number;
    estimatedDeliveryTime: number;
    deliveryZones: any[];
  };
  agent: {
    personality: string;
    instructions: string | null;
    features: {
      enableOrderCreation: boolean;
      enableProductSearch: boolean;
      enableAutomaticNotifications: boolean;
      orderConfirmationRequired: boolean;
    };
  };
  session: {
    reopenedCount: number;
    previousSessionSummary: string | null;
  };
}

/**
 * FUNÇÃO PRINCIPAL: Enriquece contexto da conversa
 */
export async function enrichConversationContext(
  supabase: any,
  chat: any,
  requestId: string
): Promise<EnrichedContext> {
  console.log(`[${requestId}] 🧠 Enriquecendo contexto...`);
  
  const startTime = Date.now();

  // Buscar em paralelo
  const [customerHistory, restaurantStatus, agentConfig, sessionSummary] = await Promise.all([
    loadCustomerHistory(supabase, chat.phone, chat.restaurant_id, requestId),
    loadRestaurantStatus(supabase, chat.restaurant_id, requestId),
    loadAgentConfiguration(supabase, chat.agent_id, requestId),
    loadLastSessionSummary(supabase, chat.id, requestId)
  ]);

  const enrichedContext: EnrichedContext = {
    customer: {
      phone: chat.phone,
      lastOrders: customerHistory.last3Orders,
      favoriteItems: customerHistory.favorites,
      preferredAddress: customerHistory.lastAddress,
      preferredPayment: customerHistory.lastPayment,
      totalOrders: customerHistory.orderCount
    },
    restaurant: {
      isOpen: restaurantStatus.isOpen,
      nextOpenTime: restaurantStatus.nextOpen,
      estimatedPrepTime: restaurantStatus.prepTime,
      estimatedDeliveryTime: restaurantStatus.deliveryTime,
      deliveryZones: restaurantStatus.zones
    },
    agent: {
      personality: agentConfig.personality,
      instructions: agentConfig.instructions,
      features: agentConfig.enabledFeatures
    },
    session: {
      reopenedCount: chat.reopened_count || 0,
      previousSessionSummary: sessionSummary
    }
  };

  console.log(`[${requestId}] ✅ Contexto enriquecido em ${Date.now() - startTime}ms`);
  
  return enrichedContext;
}

/**
 * Carrega histórico do cliente (últimos 3 pedidos, favoritos)
 */
async function loadCustomerHistory(
  supabase: any,
  phone: string,
  restaurantId: string,
  requestId: string
) {
  console.log(`[${requestId}] 📊 Buscando histórico do cliente ${phone}...`);

  // Buscar últimos pedidos completos do cliente
  const { data: orders, error: ordersError } = await supabase
    .from('pedidos')
    .select('*')
    .eq('customer_phone', phone)
    .eq('restaurant_id', restaurantId)
    .eq('order_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3);

  if (ordersError) {
    console.error(`[${requestId}] ❌ Erro ao buscar pedidos:`, ordersError);
  }

  const last3Orders = orders || [];

  // Extrair itens favoritos (mais pedidos)
  const itemFrequency: Record<string, number> = {};
  last3Orders.forEach(order => {
    const items = order.payload?.order_items || [];
    items.forEach((item: any) => {
      const name = item.product_name;
      itemFrequency[name] = (itemFrequency[name] || 0) + 1;
    });
  });

  const favorites = Object.entries(itemFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name]) => name);

  // Último endereço usado
  const lastAddress = last3Orders[0]?.payload?.delivery_address || null;
  const lastPayment = last3Orders[0]?.payload?.payment_method || null;

  return {
    last3Orders,
    favorites,
    lastAddress,
    lastPayment,
    orderCount: last3Orders.length
  };
}

/**
 * Carrega status do restaurante (horário, zonas de entrega)
 */
async function loadRestaurantStatus(
  supabase: any,
  restaurantId: string,
  requestId: string
) {
  console.log(`[${requestId}] 🏪 Verificando status do restaurante...`);

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('working_hours, estimated_prep_time, estimated_delivery_time')
    .eq('id', restaurantId)
    .single();

  if (restError) {
    console.error(`[${requestId}] ❌ Erro ao buscar restaurante:`, restError);
    return {
      isOpen: true,
      nextOpen: null,
      prepTime: 30,
      deliveryTime: 40,
      zones: []
    };
  }

  // Verificar se está aberto agora
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const todayHours = restaurant.working_hours?.[dayOfWeek];
  const isOpen = todayHours?.enabled && 
                 currentTime >= todayHours?.open && 
                 currentTime <= todayHours?.close;

  // Calcular próximo horário de abertura
  let nextOpen = null;
  if (!isOpen) {
    // Simplificado: assume que abre no próximo dia útil
    nextOpen = todayHours?.open || '10:00';
  }

  // Buscar zonas de entrega
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('max_distance', { ascending: true });

  return {
    isOpen,
    nextOpen,
    prepTime: restaurant.estimated_prep_time || 30,
    deliveryTime: restaurant.estimated_delivery_time || 40,
    zones: zones || []
  };
}

/**
 * Carrega configuração do agente
 */
async function loadAgentConfiguration(
  supabase: any,
  agentId: string,
  requestId: string
) {
  console.log(`[${requestId}] 🤖 Carregando configuração do agente...`);

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (agentError) {
    console.error(`[${requestId}] ❌ Erro ao buscar agente:`, agentError);
    return {
      personality: 'friendly',
      instructions: null,
      enabledFeatures: {
        enableOrderCreation: true,
        enableProductSearch: true,
        enableAutomaticNotifications: true,
        orderConfirmationRequired: true
      }
    };
  }

  return {
    personality: agent.personality || 'friendly',
    instructions: agent.instructions,
    enabledFeatures: {
      enableOrderCreation: agent.enable_order_creation ?? true,
      enableProductSearch: agent.enable_product_search ?? true,
      enableAutomaticNotifications: agent.enable_automatic_notifications ?? true,
      orderConfirmationRequired: agent.order_confirmation_required ?? true
    }
  };
}

/**
 * Carrega última session summary
 */
async function loadLastSessionSummary(
  supabase: any,
  chatId: number,
  requestId: string
): Promise<string | null> {
  console.log(`[${requestId}] 📝 Buscando último resumo de sessão...`);

  const { data: summary, error: summaryError } = await supabase
    .from('session_summaries')
    .select('summary, completed_at')
    .eq('chat_id', chatId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (summaryError || !summary) {
    return null;
  }

  return summary.summary;
}
