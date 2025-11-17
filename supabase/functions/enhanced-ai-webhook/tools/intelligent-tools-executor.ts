// 🔧 Tool Executor - FASE 3
// Dispatcher central para executar todas as ferramentas

import {
  executeSuggestUpsell,
  executeGetProductModifiers,
  executeGetBestSellers,
  executeGetCustomerFavorites
} from './sales-tools.ts';

import {
  executeGetCustomerPreviousAddresses,
  executeValidateRestaurantOpen,
  executeCalculateEstimatedTime,
  executeGetDeliveryFeeEstimate
} from './checkout-tools.ts';

import {
  executeAddItemToOrder,
  executeRemoveItemFromOrder,
  executeUpdateItemQuantity,
  executeGetCartSummary,
  executeClearCart
} from './cart-tools.ts';

/**
 * Executa uma ferramenta inteligente baseada no nome
 */
export async function executeIntelligentTool(
  toolName: string,
  args: any,
  context: {
    supabase: any;
    restaurantId: string;
    chatId: number;
    enrichedContext: any;
  }
): Promise<any> {
  console.log(`[TOOL EXECUTOR] Executando: ${toolName}`);
  
  try {
    switch (toolName) {
      // Cart tools (ORDER agent)
      case 'add_item_to_order':
        return await executeAddItemToOrder(context.supabase, context.chatId, args);
      
      case 'remove_item_from_order':
        return await executeRemoveItemFromOrder(context.supabase, context.chatId, args);
      
      case 'update_item_quantity':
        return await executeUpdateItemQuantity(context.supabase, context.chatId, args);
      
      case 'get_cart_summary':
        return await executeGetCartSummary(context.supabase, context.chatId);
      
      case 'clear_cart':
        return await executeClearCart(context.supabase, context.chatId);
      
      // Sales tools (upsell suggestions)
      case 'suggest_upsell':
        return await executeSuggestUpsell(args, context);
      
      case 'get_product_modifiers':
        return await executeGetProductModifiers(args, context);
      
      case 'get_best_sellers':
        return await executeGetBestSellers(args, context);
      
      case 'get_customer_favorites':
        return await executeGetCustomerFavorites(args, context);
      
      // Checkout tools
      case 'get_customer_previous_addresses':
        return await executeGetCustomerPreviousAddresses(args, context);
      
      case 'validate_restaurant_open':
        return await executeValidateRestaurantOpen(args, context);
      
      case 'calculate_estimated_time':
        return await executeCalculateEstimatedTime(args, context);
      
      case 'get_delivery_fee_estimate':
        return await executeGetDeliveryFeeEstimate(args, context);
      
      default:
        console.warn(`[TOOL EXECUTOR] Ferramenta desconhecida: ${toolName}`);
        return {
          success: false,
          error: `Ferramenta não implementada: ${toolName}`,
          execution_time_ms: 0
        };
    }
  } catch (error) {
    console.error(`[TOOL EXECUTOR] Erro ao executar ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      execution_time_ms: 0
    };
  }
}

/**
 * Verifica se uma ferramenta é "inteligente" (usa enrichedContext)
 */
export function isIntelligentTool(toolName: string): boolean {
  const intelligentTools = [
    // Cart tools (ORDER agent)
    'add_item_to_order',
    'remove_item_from_order',
    'update_item_quantity',
    'get_cart_summary',
    'clear_cart',
    // Sales tools
    'suggest_upsell',
    'get_product_modifiers',
    'get_best_sellers',
    'get_customer_favorites',
    // Checkout tools
    'get_customer_previous_addresses',
    'validate_restaurant_open',
    'calculate_estimated_time',
    'get_delivery_fee_estimate'
  ];
  
  return intelligentTools.includes(toolName);
}
