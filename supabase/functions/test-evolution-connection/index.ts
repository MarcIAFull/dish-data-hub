import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instance, token } = await req.json();

    if (!instance || !token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Instância e token são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test Evolution API connection
    const testUrl = `https://api.evolutionapi.com/instance/connectionState/${instance}`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Conexão estabelecida com sucesso',
          data 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorData = await response.text();
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Erro na API: ${response.status} - ${errorData}` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Test connection error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});