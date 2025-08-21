import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { restaurantId, products } = await req.json();

    if (!products || !Array.isArray(products)) {
      throw new Error('Produtos não fornecidos ou formato inválido');
    }

    console.log(`Processando ${products.length} produtos para classificação automática`);

    // Prepare OpenAI prompt
    const prompt = `
Você é um especialista em classificação de produtos de restaurante. Analise os seguintes produtos e para cada um forneça:

1. CATEGORIA sugerida (ex: "Entradas", "Pratos Principais", "Sobremesas", "Bebidas", etc.)
2. TAGS automáticas baseadas nos ingredientes e características (ex: "vegetariano", "vegano", "sem glúten", "picante", "doce", "frito", etc.)
3. PREÇO sugerido (baseado nos ingredientes e tipo de prato, considere valores em EUR)
4. DESCRIÇÃO melhorada (mais atrativa para clientes)
5. TEMPO DE PREPARO estimado em minutos
6. TIPO DE CULINÁRIA (italiana, portuguesa, chinesa, etc.)

Produtos para analisar:
${products.map((p, i) => `${i + 1}. Nome: ${p.name}\n   Descrição: ${p.description || 'Sem descrição'}\n   Preço atual: ${p.price || 'Não definido'}\n`).join('\n')}

Responda APENAS com um JSON válido seguindo este formato:
{
  "products": [
    {
      "index": 0,
      "category": "Categoria sugerida",
      "tags": ["tag1", "tag2", "tag3"],
      "suggested_price": 12.50,
      "improved_description": "Descrição melhorada",
      "prep_time_minutes": 15,
      "cuisine_type": "italiana"
    }
  ]
}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em classificação de produtos de restaurante. Sempre responda apenas com JSON válido.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('Resposta da IA:', aiResponse);

    // Parse AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse);
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      throw new Error('Resposta da IA não está em formato JSON válido');
    }

    // Process results and prepare response
    const classifiedProducts = products.map((product, index) => {
      const analysis = aiAnalysis.products.find((p: any) => p.index === index);
      
      if (!analysis) {
        console.warn(`Análise não encontrada para produto ${index}`);
        return {
          ...product,
          ai_suggestions: {
            category: 'Outros',
            tags: [],
            suggested_price: product.price || 10,
            improved_description: product.description,
            prep_time_minutes: 20,
            cuisine_type: 'geral'
          }
        };
      }

      return {
        ...product,
        ai_suggestions: {
          category: analysis.category,
          tags: analysis.tags || [],
          suggested_price: analysis.suggested_price,
          improved_description: analysis.improved_description,
          prep_time_minutes: analysis.prep_time_minutes,
          cuisine_type: analysis.cuisine_type
        }
      };
    });

    // Store AI analysis in database for future reference
    const analysisRecord = {
      restaurant_id: restaurantId,
      user_id: user.id,
      analysis_type: 'menu_classification',
      input_data: { products },
      ai_response: aiAnalysis,
      processed_at: new Date().toISOString()
    };

    // Optional: Store in an ai_analysis table (would need to be created)
    // await supabase.from('ai_analysis').insert(analysisRecord);

    console.log(`Classificação concluída para ${classifiedProducts.length} produtos`);

    return new Response(JSON.stringify({ 
      success: true,
      classified_products: classifiedProducts,
      total_processed: classifiedProducts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na classificação automática:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});