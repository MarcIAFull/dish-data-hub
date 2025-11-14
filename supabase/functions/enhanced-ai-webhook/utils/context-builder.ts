// Context builder utilities for specialized agents

export interface ConversationState {
  hasGreeted: boolean;
  hasItemsInCart: boolean;
  hasValidatedAddress: boolean;
  hasOrder: boolean;
  itemCount: number;
  cartTotal: number;
}

export interface SalesContext {
  restaurantName: string;
  categories: any[];
  popularProducts: any[];
  currentCart: any[];
  cartTotal: number;
}

export interface CheckoutContext {
  restaurantName: string;
  cartItems: any[];
  cartTotal: number;
  deliveryZones: any[];
  paymentMethods: any[];
  minOrderValue: number;
}

export interface MenuContext {
  restaurantName: string;
  categories: any[];
  totalProducts: number;
  personality?: string;
  tone?: string;
}

export interface SupportContext {
  restaurantName: string;
  phone: string;
  address: string;
  workingHours: any;
  estimatedPrepTime?: number;
  estimatedDeliveryTime?: number;
  personality?: string;
  tone?: string;
}

/**
 * Analyzes conversation state from metadata and messages
 */
export function analyzeConversationState(
  metadata: any,
  messages: any[]
): ConversationState {
  const orderItems = metadata?.order_items || [];
  const cartTotal = orderItems.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unit_price), 0
  );

  // Check if already greeted by looking at bot messages
  const botMessages = messages.filter(m => m.sender_type === 'bot');
  const hasGreeted = botMessages.length > 0;

  return {
    hasGreeted,
    hasItemsInCart: orderItems.length > 0,
    hasValidatedAddress: !!metadata?.validated_address,
    hasOrder: !!metadata?.order_id,
    itemCount: orderItems.length,
    cartTotal
  };
}

/**
 * Builds context for Sales Agent
 */
export function buildSalesContext(
  restaurant: any,
  categories: any[],
  products: any[],
  metadata: any,
  agent?: any
): SalesContext {
  // Get popular products (top 5 by display_order)
  const popularProducts = products
    .filter(p => p.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      price: p.price,
      category: categories.find(c => c.id === p.category_id)?.name || 'Outros'
    }));

  // Current cart items
  const currentCart = metadata.cart?.items || [];
  const cartTotal = metadata.cart?.total || 0;

  return {
    restaurantName: restaurant.name,
    categories: categories.filter(c => c.is_active),
    popularProducts,
    currentCart,
    cartTotal,
    itemCount: metadata.cart?.items?.length || 0,
    personality: agent?.personality,
    tone: agent?.tone
  };
}

/**
 * Builds context for Checkout Agent
 */
export function buildCheckoutContext(
  restaurant: any,
  deliveryZones: any[],
  paymentMethods: any[],
  metadata: any,
  agent?: any
): CheckoutContext {
  const cartItems = metadata.cart?.items || [];
  const cartTotal = metadata.cart?.total || 0;
  
  // Map delivery zones to readable format
  const zones = deliveryZones
    .filter(z => z.is_active)
    .map(z => ({
      name: `${z.min_distance}km - ${z.max_distance}km`,
      fee: z.fee,
      minOrder: z.min_order || 0
    }));

  return {
    restaurantName: restaurant.name,
    cartItems,
    cartTotal,
    minOrderValue: restaurant.min_order_value || 20.0,
    deliveryZones: zones,
    paymentMethods: paymentMethods.filter(p => p.is_active).map(p => p.display_name),
    personality: agent?.personality,
    tone: agent?.tone
  };
}

/**
 * Builds context for Menu Agent
 */
export function buildMenuContext(
  restaurant: any,
  categories: any[],
  products: any[],
  agent?: any
): MenuContext {
  // Group products by category
  const categoriesWithProducts = categories.map(category => {
    const categoryProducts = products.filter(p => p.category_id === category.id);
    return {
      name: category.name,
      emoji: category.emoji,
      products: categoryProducts.map(p => ({
        name: p.name,
        price: p.price,
        description: p.description,
        available: p.available
      }))
    };
  });

  return {
    restaurantName: restaurant.name,
    categories: categoriesWithProducts,
    totalProducts: products.length,
    personality: agent?.personality,
    tone: agent?.tone
  };
}

/**
 * Builds context for Support Agent
 */
export function buildSupportContext(restaurant: any, agent?: any): SupportContext {
  return {
    restaurantName: restaurant.name,
    phone: restaurant.phone || 'Não disponível',
    address: restaurant.address || 'Não disponível',
    workingHours: restaurant.working_hours || {},
    estimatedPrepTime: restaurant.estimated_prep_time,
    estimatedDeliveryTime: restaurant.estimated_delivery_time,
    personality: agent?.personality,
    tone: agent?.tone
  };
}
