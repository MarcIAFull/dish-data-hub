import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 1]; // Get slug from /enhanced-restaurant-data/{slug}

    if (!slug) {
      return new Response('Restaurant slug is required', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch comprehensive restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (restaurantError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch categories and products with advanced details
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        *,
        products (
          *,
          ingredients,
          allergens,
          tags,
          calories,
          preparation_time
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .order('display_order');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return new Response(JSON.stringify({ error: 'Error fetching menu data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent orders for context
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, price)
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch popular products
    const { data: popularProducts } = await supabase
      .from('order_items')
      .select(`
        product_id,
        products (name, price, category_id),
        quantity
      `)
      .eq('products.categories.restaurant_id', restaurant.id)
      .order('quantity', { ascending: false })
      .limit(5);

    // Build enhanced restaurant data structure
    const enhancedData = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        whatsapp: restaurant.whatsapp,
        instagram: restaurant.instagram,
        slug: restaurant.slug
      },
      menu: {
        categories: categories?.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          products: category.products?.filter(p => p.is_available).map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            ingredients: product.ingredients || [],
            allergens: product.allergens || [],
            tags: product.tags || [],
            calories: product.calories,
            preparation_time: product.preparation_time,
            is_available: product.is_available
          })) || []
        })) || []
      },
      analytics: {
        total_orders: recentOrders?.length || 0,
        popular_products: popularProducts?.map(item => ({
          name: item.products?.name,
          price: item.products?.price,
          total_ordered: item.quantity
        })) || [],
        recent_order_trends: recentOrders?.map(order => ({
          total: parseFloat(order.total),
          items_count: order.order_items?.length || 0,
          date: order.created_at
        })) || []
      },
      ai_context: {
        generated_at: new Date().toISOString(),
        total_products_available: categories?.reduce((acc, cat) => 
          acc + (cat.products?.filter(p => p.is_available)?.length || 0), 0) || 0,
        total_categories: categories?.length || 0,
        restaurant_activity_level: recentOrders?.length > 5 ? 'high' : 
                                   recentOrders?.length > 2 ? 'medium' : 'low'
      }
    };

    return new Response(JSON.stringify(enhancedData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error in enhanced-restaurant-data function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});