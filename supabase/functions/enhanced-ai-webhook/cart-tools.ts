// Cart/order items management tools for AI agent

export async function executeAddItemToOrder(
  supabase: any,
  chatId: number,
  args: any
) {
  try {
    console.log('[ADD_ITEM_TO_ORDER] Adding item:', args);
    
    // Fetch current metadata
    const { data: chat } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .single();
    
    const metadata = chat?.metadata || {};
    const orderItems = metadata.order_items || [];
    
    // Add new item
    const newItem = {
      product_name: args.product_name,
      quantity: args.quantity || 1,
      unit_price: args.unit_price,
      notes: args.notes || null,
      added_at: new Date().toISOString()
    };
    
    orderItems.push(newItem);
    
    // Update metadata
    await supabase
      .from('chats')
      .update({ 
        metadata: { ...metadata, order_items: orderItems },
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
    
    // Calculate total
    const total = orderItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    console.log('[ADD_ITEM_TO_ORDER] ✅ Item added. Total items:', orderItems.length, 'Total value:', total);
    
    return {
      success: true,
      item_added: args.product_name,
      quantity: args.quantity || 1,
      current_items: orderItems,
      items_count: orderItems.length,
      current_total: total
    };
    
  } catch (error) {
    console.error('[ADD_ITEM_TO_ORDER] ❌ Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
