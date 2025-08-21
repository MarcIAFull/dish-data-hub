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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 2]; // Get slug from /restaurant/{slug}/ai-data.json

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Restaurant slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch restaurant data
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

    // Fetch categories and products
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        *,
        products (*)
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

    // Structure data for AI consumption
    const aiData = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        whatsapp: restaurant.whatsapp,
        instagram: restaurant.instagram,
        logo_url: restaurant.logo_url,
        cover_url: restaurant.cover_url,
        is_active: restaurant.is_active,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at
      },
      menu: {
        categories: categories?.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          products: category.products?.filter((p: any) => p.is_available).map((product: any) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image_url: product.image_url,
            display_order: product.display_order,
            is_available: product.is_available
          })) || []
        })) || []
      },
      metadata: {
        total_categories: categories?.length || 0,
        total_products: categories?.reduce((acc: number, cat: any) => acc + (cat.products?.length || 0), 0) || 0,
        last_updated: new Date().toISOString(),
        api_version: "1.0",
        format: "ai-structured-data"
      }
    };

    return new Response(JSON.stringify(aiData, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error in restaurant-ai-data function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});