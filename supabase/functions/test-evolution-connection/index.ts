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

    console.log(`Testando conexão para instância: ${instance}`);
    
    // Try different Evolution API URL patterns
    const possibleUrls = [
      // Common Evolution API patterns
      `https://evolution.${instance.toLowerCase().replace(/\s+/g, '-')}.com.br/instance/connectionState`,
      `https://${instance.toLowerCase().replace(/\s+/g, '-')}.evolution-api.com/instance/connectionState`,  
      `https://api.${instance.toLowerCase().replace(/\s+/g, '-')}.com/instance/connectionState`,
      `https://evolution-api.com/instance/connectionState/${instance}`,
      // Try direct connection patterns
      `https://evolution-api.com/instance/connectionState`,
      `https://api.evolutionapi.com/instance/connectionState/${instance}`,
    ];

    let lastError = null;
    let allAttempts = [];
    
    for (const testUrl of possibleUrls) {
      try {
        console.log(`Tentativa ${possibleUrls.indexOf(testUrl) + 1}: ${testUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': token, // Some Evolution APIs use 'apikey' instead
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log(`Resposta de ${testUrl}: ${response.status}`);
        
        const responseText = await response.text();
        allAttempts.push({
          url: testUrl,
          status: response.status,
          response: responseText.substring(0, 200) // Limit response size
        });

        if (response.ok) {
          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
          
          console.log(`Conexão bem-sucedida com: ${testUrl}`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Conexão estabelecida com sucesso',
              url: testUrl,
              data,
              allAttempts 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else if (response.status === 401) {
          // Unauthorized - might be correct URL but wrong token
          lastError = `Token inválido para ${testUrl}`;
          console.log(`Token inválido para: ${testUrl}`);
        } else if (response.status === 404) {
          // Not found - try next URL
          console.log(`URL não encontrada: ${testUrl}`);
        } else {
          lastError = `Erro HTTP ${response.status}: ${responseText}`;
          console.log(`Erro HTTP ${response.status} em ${testUrl}: ${responseText}`);
        }
      } catch (error) {
        const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
        console.log(`Erro ao tentar ${testUrl}: ${errorMsg}`);
        lastError = errorMsg;
        allAttempts.push({
          url: testUrl,
          error: errorMsg
        });
      }
    }

    // If we get here, none of the URLs worked
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Não foi possível conectar com a Evolution API. Último erro: ${lastError}. Verifique se a instância "${instance}" está ativa e o token está correto.`,
        debug: {
          instance,
          allAttempts,
          suggestion: "Verifique no Evolution Manager se a instância está conectada e ativa. O token pode estar incorreto ou expirado."
        }
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