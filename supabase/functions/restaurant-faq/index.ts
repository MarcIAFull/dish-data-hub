import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 2]; // Get slug from /restaurant/{slug}/faq.json

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

    // Try to get cached FAQ first
    const cacheKey = `faq_${restaurant.id}`;
    
    // For now, generate FAQ dynamically. In production, you might want to cache this.
    let faqData;

    if (openAIApiKey) {
      // Generate FAQ using OpenAI
      try {
        const { data: categories } = await supabase
          .from('categories')
          .select(`
            *,
            products (*)
          `)
          .eq('restaurant_id', restaurant.id)
          .order('display_order');

        const menuInfo = categories?.map(cat => ({
          category: cat.name,
          products: cat.products?.filter((p: any) => p.is_available).map((p: any) => ({
            name: p.name,
            price: p.price,
            description: p.description
          }))
        })) || [];

        const prompt = `Gere um FAQ em JSON para o restaurante "${restaurant.name}".
        
Informações do restaurante:
- Nome: ${restaurant.name}
- Descrição: ${restaurant.description || 'Não informado'}
- Endereço: ${restaurant.address || 'Não informado'}
- Telefone: ${restaurant.phone || 'Não informado'}
- WhatsApp: ${restaurant.whatsapp || 'Não informado'}

Cardápio: ${JSON.stringify(menuInfo, null, 2)}

Gere um FAQ com 8-12 perguntas e respostas comuns que clientes fariam. Inclua perguntas sobre:
- Horário de funcionamento
- Formas de pedido/entrega
- Produtos mais populares
- Informações de contato
- Localização
- Formas de pagamento
- Política de entrega

Retorne APENAS um JSON válido no formato:
{
  "faq": [
    {
      "question": "Pergunta aqui?",
      "answer": "Resposta detalhada aqui."
    }
  ],
  "last_updated": "ISO_DATE",
  "restaurant_name": "Nome do Restaurante"
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-2025-08-07',
            messages: [
              { role: 'system', content: 'Você é um especialista em criar FAQs para restaurantes. Sempre responda em português brasileiro e seja específico sobre o restaurante em questão.' },
              { role: 'user', content: prompt }
            ],
            max_completion_tokens: 2000
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const generatedContent = aiResponse.choices[0].message.content;
          
          // Try to parse the JSON response
          try {
            faqData = JSON.parse(generatedContent);
            faqData.generated_by = 'ai';
            faqData.last_updated = new Date().toISOString();
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback to default FAQ
            faqData = getDefaultFAQ(restaurant);
          }
        } else {
          console.error('OpenAI API error:', await response.text());
          faqData = getDefaultFAQ(restaurant);
        }
      } catch (aiError) {
        console.error('Error generating AI FAQ:', aiError);
        faqData = getDefaultFAQ(restaurant);
      }
    } else {
      // No OpenAI key, use default FAQ
      faqData = getDefaultFAQ(restaurant);
    }

    return new Response(JSON.stringify(faqData, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
      },
    });

  } catch (error) {
    console.error('Error in restaurant-faq function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultFAQ(restaurant: any) {
  return {
    faq: [
      {
        question: "Qual é o horário de funcionamento?",
        answer: "Para informações sobre horário de funcionamento, entre em contato conosco através do WhatsApp ou telefone."
      },
      {
        question: "Como fazer um pedido?",
        answer: `Você pode fazer seu pedido através do nosso WhatsApp${restaurant.whatsapp ? ` (${restaurant.whatsapp})` : ''} ou telefone${restaurant.phone ? ` (${restaurant.phone})` : ''}.`
      },
      {
        question: "Vocês fazem entrega?",
        answer: "Para informações sobre entrega e taxa de entrega, entre em contato conosco."
      },
      {
        question: "Onde vocês estão localizados?",
        answer: restaurant.address ? `Estamos localizados em: ${restaurant.address}` : "Entre em contato conosco para obter informações sobre nossa localização."
      },
      {
        question: "Quais formas de pagamento vocês aceitam?",
        answer: "Aceitamos diversas formas de pagamento. Entre em contato para mais informações."
      },
      {
        question: "Vocês têm opções vegetarianas/veganas?",
        answer: "Consulte nosso cardápio para ver todas as opções disponíveis ou entre em contato para informações específicas sobre pratos vegetarianos e veganos."
      },
      {
        question: "Como entrar em contato?",
        answer: `Você pode entrar em contato conosco através do${restaurant.whatsapp ? ` WhatsApp (${restaurant.whatsapp})` : ''}${restaurant.phone ? ` telefone (${restaurant.phone})` : ''}${restaurant.instagram ? ` ou Instagram (${restaurant.instagram})` : ''}.`
      },
      {
        question: "Vocês têm promoções?",
        answer: "Para saber sobre promoções atuais e ofertas especiais, acompanhe nosso WhatsApp ou redes sociais."
      }
    ],
    generated_by: 'default',
    last_updated: new Date().toISOString(),
    restaurant_name: restaurant.name
  };
}