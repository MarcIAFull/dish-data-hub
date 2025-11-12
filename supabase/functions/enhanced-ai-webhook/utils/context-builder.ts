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
  productCount: number;
}

export interface SupportContext {
  restaurantName: string;
  phone: string;
  address: string;
  workingHours: any;
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
  metadata: any
): SalesContext {
  const orderItems = metadata?.order_items || [];
  const cartTotal = orderItems.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unit_price), 0
  );

  // Get top 5 popular products (by category order and name)
  const popularProducts = products
    .sort((a, b) => {
      const catA = categories.find(c => c.id === a.category_id);
      const catB = categories.find(c => c.id === b.category_id);
      return (catA?.display_order || 999) - (catB?.display_order || 999);
    })
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      description: p.description,
      price: p.price,
      category: categories.find(c => c.id === p.category_id)?.name
    }));

  return {
    restaurantName: restaurant.name,
    categories: categories.map(c => ({ name: c.name, emoji: c.emoji })),
    popularProducts,
    currentCart: orderItems,
    cartTotal
  };
}

/**
 * Builds context for Checkout Agent
 */
export function buildCheckoutContext(
  restaurant: any,
  deliveryZones: any[],
  paymentMethods: any[],
  metadata: any
): CheckoutContext {
  const orderItems = metadata?.order_items || [];
  const cartTotal = orderItems.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unit_price), 0
  );

  return {
    restaurantName: restaurant.name,
    cartItems: orderItems,
    cartTotal,
    deliveryZones: deliveryZones.map(z => ({
      name: z.name,
      fee: z.delivery_fee,
      minOrder: z.min_order_value
    })),
    paymentMethods: paymentMethods
      .filter(pm => pm.is_active)
      .map(pm => pm.method_type),
    minOrderValue: restaurant.min_order_value || 0
  };
}

/**
 * Builds context for Menu Agent
 */
export function buildMenuContext(
  restaurant: any,
  categories: any[],
  products: any[]
): MenuContext {
  return {
    restaurantName: restaurant.name,
    categories: categories.map(c => ({ name: c.name, emoji: c.emoji })),
    productCount: products.length
  };
}

/**
 * Builds context for Support Agent
 */
export function buildSupportContext(restaurant: any): SupportContext {
  return {
    restaurantName: restaurant.name,
    phone: restaurant.phone || 'Não disponível',
    address: restaurant.address || 'Não disponível',
    workingHours: restaurant.working_hours || {}
  };
}
