// 💳 Checkout-Specific Tools - FASE 3
// Ferramentas inteligentes para o agente de checkout

/**
 * Define as ferramentas específicas do agente de checkout
 */
export function getCheckoutSpecificTools() {
  return [
    {
      type: "function",
      function: {
        name: "get_customer_previous_addresses",
        description: "Obter endereços anteriores do cliente para facilitar a escolha",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    },
    {
      type: "function",
      function: {
        name: "validate_restaurant_open",
        description: "Verificar se o restaurante está aberto agora e pode receber pedidos",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    },
    {
      type: "function",
      function: {
        name: "calculate_estimated_time",
        description: "Calcular tempo total estimado (preparo + entrega) baseado no endereço",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Endereço de entrega completo ou parcial"
            }
          },
          required: []
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_delivery_fee_estimate",
        description: "Estimar taxa de entrega baseado em distância aproximada ou bairro",
        parameters: {
          type: "object",
          properties: {
            address_info: {
              type: "string",
              description: "Endereço, bairro ou região"
            }
          },
          required: []
        }
      }
    }
  ];
}

/**
 * EXECUTORES DAS FERRAMENTAS
 */

/**
 * Retorna endereços anteriores do cliente
 */
export async function executeGetCustomerPreviousAddresses(
  args: {},
  context: {
    supabase: any;
    enrichedContext: any;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log('[TOOL] get_customer_previous_addresses - Buscando endereços');
    
    // Usar endereço preferido do enrichedContext
    const preferredAddress = context.enrichedContext?.customer?.preferredAddress;
    
    // Buscar últimos pedidos com endereços
    const lastOrders = context.enrichedContext?.customer?.lastOrders || [];
    const addresses = lastOrders
      .filter((order: any) => order.delivery_address)
      .map((order: any) => ({
        address: order.delivery_address,
        used_at: order.created_at,
        times_used: 1 // Simplificado
      }))
      .slice(0, 3);
    
    return {
      success: true,
      preferred_address: preferredAddress || null,
      recent_addresses: addresses,
      total_addresses: addresses.length,
      execution_time_ms: Date.now() - startTime,
      context_used: {
        has_preferred: !!preferredAddress,
        has_history: addresses.length > 0,
        order_count: lastOrders.length
      }
    };
    
  } catch (error) {
    console.error('[TOOL] get_customer_previous_addresses - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Valida se restaurante está aberto
 */
export async function executeValidateRestaurantOpen(
  args: {},
  context: {
    enrichedContext: any;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log('[TOOL] validate_restaurant_open - Verificando status');
    
    const restaurant = context.enrichedContext?.restaurant || {};
    const isOpen = restaurant.isOpen || false;
    const nextOpen = restaurant.nextOpenTime || null;
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return {
      success: true,
      is_open: isOpen,
      current_time: currentTime,
      next_opening: nextOpen,
      can_accept_orders: isOpen,
      message: isOpen 
        ? `Restaurante ABERTO - Aceitando pedidos agora!`
        : `Restaurante FECHADO - Próxima abertura: ${nextOpen || 'não informado'}`,
      execution_time_ms: Date.now() - startTime,
      context_used: {
        checked_working_hours: true,
        current_status: isOpen ? 'open' : 'closed'
      }
    };
    
  } catch (error) {
    console.error('[TOOL] validate_restaurant_open - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Calcula tempo estimado total
 */
export async function executeCalculateEstimatedTime(
  args: { address?: string },
  context: {
    enrichedContext: any;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log('[TOOL] calculate_estimated_time - Calculando tempo');
    
    const restaurant = context.enrichedContext?.restaurant || {};
    const prepTime = restaurant.estimatedPrepTime || 30;
    const deliveryTime = restaurant.estimatedDeliveryTime || 40;
    
    // Se tiver endereço, poderia ajustar delivery time baseado em distância
    // Por enquanto, usa os valores padrão
    const totalTime = prepTime + deliveryTime;
    
    const estimatedDelivery = new Date(Date.now() + totalTime * 60000);
    const deliveryTimeStr = estimatedDelivery.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return {
      success: true,
      prep_time_minutes: prepTime,
      delivery_time_minutes: deliveryTime,
      total_time_minutes: totalTime,
      estimated_delivery_at: deliveryTimeStr,
      message: `Tempo estimado: ${totalTime} minutos (${prepTime} min preparo + ${deliveryTime} min entrega)`,
      execution_time_ms: Date.now() - startTime,
      context_used: {
        used_restaurant_times: true,
        address_provided: !!args.address
      }
    };
    
  } catch (error) {
    console.error('[TOOL] calculate_estimated_time - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Estima taxa de entrega
 */
export async function executeGetDeliveryFeeEstimate(
  args: { address_info?: string },
  context: {
    supabase: any;
    restaurantId: string;
    enrichedContext: any;
  }
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log('[TOOL] get_delivery_fee_estimate - Estimando taxa');
    
    // Buscar zonas de entrega
    const zones = context.enrichedContext?.restaurant?.deliveryZones || [];
    
    if (zones.length === 0) {
      return {
        success: true,
        estimated_fee: 0,
        message: 'Taxa de entrega não disponível. Consulte ao finalizar o pedido.',
        zones: [],
        execution_time_ms: Date.now() - startTime,
        context_used: {
          has_zones: false
        }
      };
    }
    
    // Ordenar zonas por distância mínima
    const sortedZones = zones.sort((a: any, b: any) => a.min_distance - b.min_distance);
    
    // Retornar primeira zona como estimativa base
    const baseZone = sortedZones[0];
    
    return {
      success: true,
      estimated_fee: baseZone.fee,
      min_fee: Math.min(...zones.map((z: any) => z.fee)),
      max_fee: Math.max(...zones.map((z: any) => z.fee)),
      zones: sortedZones.map((z: any) => ({
        range: `${z.min_distance}km - ${z.max_distance}km`,
        fee: z.fee
      })),
      message: `Taxa estimada: R$ ${baseZone.fee.toFixed(2)} (varia de R$ ${Math.min(...zones.map((z: any) => z.fee)).toFixed(2)} a R$ ${Math.max(...zones.map((z: any) => z.fee)).toFixed(2)})`,
      execution_time_ms: Date.now() - startTime,
      context_used: {
        has_zones: true,
        zone_count: zones.length,
        address_info: args.address_info || 'not_provided'
      }
    };
    
  } catch (error) {
    console.error('[TOOL] get_delivery_fee_estimate - Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    };
  }
}
