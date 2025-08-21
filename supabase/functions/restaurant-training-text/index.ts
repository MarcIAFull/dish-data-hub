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
    const slug = pathParts[pathParts.length - 2]; // Get slug from /restaurant/{slug}/training.txt

    if (!slug) {
      return new Response('Restaurant slug is required', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
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
      return new Response('Restaurant not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
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
      return new Response('Error fetching menu data', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Generate training text
    let trainingText = `INFORMAÇÕES DO RESTAURANTE:\n`;
    trainingText += `Nome: ${restaurant.name}\n`;
    if (restaurant.description) trainingText += `Descrição: ${restaurant.description}\n`;
    if (restaurant.address) trainingText += `Endereço: ${restaurant.address}\n`;
    if (restaurant.phone) trainingText += `Telefone: ${restaurant.phone}\n`;
    if (restaurant.whatsapp) trainingText += `WhatsApp: ${restaurant.whatsapp}\n`;
    if (restaurant.instagram) trainingText += `Instagram: ${restaurant.instagram}\n`;
    
    trainingText += `\n========================================\n`;
    trainingText += `CARDÁPIO COMPLETO:\n`;
    trainingText += `========================================\n\n`;

    if (categories && categories.length > 0) {
      categories.forEach((category: any) => {
        trainingText += `CATEGORIA: ${category.name.toUpperCase()}\n`;
        if (category.description) {
          trainingText += `Descrição da categoria: ${category.description}\n`;
        }
        trainingText += `\n`;

        const availableProducts = category.products?.filter((p: any) => p.is_available) || [];
        
        if (availableProducts.length > 0) {
          availableProducts.forEach((product: any) => {
            trainingText += `• ${product.name}`;
            if (product.price) {
              trainingText += ` - R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
            }
            trainingText += `\n`;
            if (product.description) {
              trainingText += `  ${product.description}\n`;
            }
            trainingText += `\n`;
          });
        } else {
          trainingText += `  Nenhum produto disponível nesta categoria.\n\n`;
        }
        
        trainingText += `----------------------------------------\n\n`;
      });
    } else {
      trainingText += `Cardápio ainda não foi configurado.\n\n`;
    }

    trainingText += `========================================\n`;
    trainingText += `INSTRUÇÕES PARA IA:\n`;
    trainingText += `========================================\n\n`;
    trainingText += `Você é um assistente virtual especializado no restaurante ${restaurant.name}.\n`;
    trainingText += `Sempre seja educado, prestativo e use as informações acima para responder perguntas sobre:\n`;
    trainingText += `- Cardápio e produtos disponíveis\n`;
    trainingText += `- Preços e descrições dos produtos\n`;
    trainingText += `- Informações de contato e localização\n`;
    trainingText += `- Horários de funcionamento (se disponível)\n`;
    trainingText += `- Formas de pedido e entrega\n\n`;
    trainingText += `Se não souber alguma informação específica, seja honesto e oriente o cliente a entrar em contato diretamente.\n`;
    trainingText += `Sempre mantenha um tom amigável e profissional.\n\n`;
    trainingText += `Data da última atualização: ${new Date().toISOString()}\n`;

    return new Response(trainingText, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error in restaurant-training-text function:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});