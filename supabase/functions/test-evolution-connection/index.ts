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

    // Test Evolution API connection - try different possible URLs
    const possibleUrls = [
      `https://${instance}.evolution-api.com/instance/connectionState`,
      `https://api.evolution-api.com/instance/connectionState/${instance}`,
      `https://api.evolutionapi.com/instance/connectionState/${instance}`,
      `https://${instance}.evolutionapi.com/instance/connectionState`
    ];

    let lastError = null;
    
    for (const testUrl of possibleUrls) {
      try {
        console.log(`Tentando conectar com: ${testUrl}`);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Conexão bem-sucedida com: ${testUrl}`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Conexão estabelecida com sucesso',
              url: testUrl,
              data 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else if (response.status !== 404) {
          // If it's not a 404, this might be the right URL but wrong credentials
          const errorData = await response.text();
          lastError = `${response.status}: ${errorData}`;
          console.log(`Erro HTTP ${response.status} em ${testUrl}: ${errorData}`);
        }
      } catch (error) {
        console.log(`Erro ao tentar ${testUrl}:`, error);
        lastError = error.message;
      }
    }

    // If we get here, none of the URLs worked
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Não foi possível conectar com nenhuma URL da Evolution API. Último erro: ${lastError || 'Desconhecido'}. Verifique se a instância e token estão corretos.`
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

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