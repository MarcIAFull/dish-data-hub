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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { restaurantId, contentType } = await req.json();

    if (!restaurantId || !contentType) {
      throw new Error('Restaurant ID e tipo de conteúdo são obrigatórios');
    }

    // Fetch restaurant and menu data
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select(`
        *,
        categories (
          *,
          products (*)
        )
      `)
      .eq('id', restaurantId)
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      throw new Error('Restaurante não encontrado');
    }

    console.log(`Gerando ${contentType} para restaurante: ${restaurant.name}`);

    let prompt = '';
    let aiModel = 'gpt-5-2025-08-07';

    switch (contentType) {
      case 'faq':
        prompt = `
Crie um FAQ completo para o restaurante "${restaurant.name}".

Informações do restaurante:
- Nome: ${restaurant.name}
- Descrição: ${restaurant.description || 'Não fornecida'}
- Endereço: ${restaurant.address || 'Não fornecido'}
- Telefone: ${restaurant.phone || 'Não fornecido'}
- WhatsApp: ${restaurant.whatsapp || 'Não fornecido'}

Menu:
${restaurant.categories?.map((cat: any) => `
Categoria: ${cat.name}
Produtos: ${cat.products?.map((p: any) => `${p.name} - €${p.price}`).join(', ') || 'Nenhum produto'}
`).join('\n') || 'Sem categorias'}

Crie perguntas e respostas que clientes reais fariam, incluindo:
- Horários de funcionamento
- Formas de pagamento aceitas
- Delivery/Take-away
- Ingredientes e alergênicos
- Especiais do dia
- Reservas
- Localização e estacionamento

Responda APENAS com JSON:
{
  "faq": [
    {
      "question": "Pergunta",
      "answer": "Resposta detalhada"
    }
  ]
}`;
        break;

      case 'agent_training':
        prompt = `
Crie um guia de treinamento para um agente de IA que vai atender clientes do restaurante "${restaurant.name}" via WhatsApp.

Informações do restaurante:
- Nome: ${restaurant.name}
- Descrição: ${restaurant.description || 'Não fornecida'}
- Tipo de culinária: ${restaurant.cuisine_type || 'Geral'}
- Endereço: ${restaurant.address || 'Não fornecido'}
- Contatos: ${restaurant.phone || ''} / ${restaurant.whatsapp || ''}

Menu completo:
${restaurant.categories?.map((cat: any) => `
**${cat.name}**
${cat.products?.map((p: any) => `- ${p.name}: ${p.description || 'Sem descrição'} - €${p.price}`).join('\n') || 'Nenhum produto'}
`).join('\n') || 'Sem menu disponível'}

O agente deve ter personalidade amigável, profissional e conhecer profundamente o menu.

Responda APENAS com JSON:
{
  "personality": "Descrição da personalidade do agente",
  "key_knowledge": ["ponto1", "ponto2", "ponto3"],
  "conversation_starters": ["frase1", "frase2"],
  "common_responses": {
    "greeting": "Mensagem de cumprimento",
    "menu_question": "Como responder sobre o menu",
    "price_question": "Como responder sobre preços",
    "delivery_question": "Como responder sobre delivery",
    "closing": "Como encerrar conversas"
  },
  "training_examples": [
    {
      "customer_message": "Mensagem do cliente",
      "agent_response": "Resposta ideal do agente"
    }
  ]
}`;
        break;

      case 'menu_descriptions':
        prompt = `
Melhore as descrições dos produtos do restaurante "${restaurant.name}".

Produtos atuais:
${restaurant.categories?.map((cat: any) => 
  cat.products?.map((p: any) => `
Produto: ${p.name}
Descrição atual: ${p.description || 'Sem descrição'}
Preço: €${p.price}
Categoria: ${cat.name}
`).join('\n')
).join('\n') || 'Nenhum produto'}

Crie descrições atrativas, apetitosas e profissionais. Inclua ingredientes principais, método de preparo quando relevante, e características especiais.

Responda APENAS com JSON:
{
  "improved_products": [
    {
      "name": "Nome do produto",
      "improved_description": "Nova descrição atrativa",
      "suggested_tags": ["tag1", "tag2"]
    }
  ]
}`;
        break;

      case 'ai_data_structured':
        prompt = `
Crie dados estruturados completos para treinamento de IA sobre o restaurante "${restaurant.name}".

Informações disponíveis:
- Nome: ${restaurant.name}
- Descrição: ${restaurant.description || 'Não fornecida'}
- Endereço: ${restaurant.address || 'Não fornecido'}
- Contatos: ${restaurant.phone || ''} / ${restaurant.whatsapp || ''}

Menu:
${restaurant.categories?.map((cat: any) => `
${cat.name}: ${cat.products?.map((p: any) => `${p.name} (€${p.price})`).join(', ') || 'Vazio'}
`).join('\n') || 'Sem menu'}

Crie dados estruturados otimizados para IA, incluindo contexto, entidades, relacionamentos e metadados.

Responda APENAS com JSON:
{
  "restaurant_context": {
    "name": "Nome",
    "business_type": "Tipo de negócio",
    "cuisine_type": "Tipo de culinária",
    "price_range": "budget/mid/premium",
    "specialties": ["especialidade1", "especialidade2"],
    "location": "Informações de localização"
  },
  "menu_structure": {
    "categories": [
      {
        "name": "Nome da categoria",
        "description": "Descrição",
        "products": [
          {
            "name": "Nome do produto",
            "description": "Descrição",
            "price": 0.00,
            "ingredients": ["ingrediente1"],
            "dietary_info": ["vegano", "sem glúten"],
            "prep_time_minutes": 0
          }
        ]
      }
    ]
  },
  "business_info": {
    "hours": "Horários de funcionamento",
    "contact": "Informações de contato",
    "policies": "Políticas e informações importantes"
  },
  "ai_instructions": {
    "tone": "Tom de voz",
    "key_points": ["ponto importante 1"],
    "conversation_flow": "Como conduzir conversas"
  }
}`;
        break;

      default:
        throw new Error('Tipo de conteúdo não suportado');
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { 
            role: 'system', 
            content: `Você é um especialista em conteúdo para restaurantes e agentes de IA. Sempre responda apenas com JSON válido, sem texto adicional.` 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log(`Conteúdo ${contentType} gerado com sucesso`);

    // Parse and validate JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      throw new Error('Resposta da IA não está em formato JSON válido');
    }

    return new Response(JSON.stringify({ 
      success: true,
      content_type: contentType,
      generated_content: parsedContent,
      restaurant_name: restaurant.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Erro na geração de conteúdo:`, error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});