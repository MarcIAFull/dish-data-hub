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
    console.log('Function called:', req.method);
    const body = await req.text();
    console.log('Request body:', body);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON in request body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { instance, token, baseUrl } = parsedBody;

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
    console.log(`URL base fornecida: ${baseUrl || 'Não fornecida'}`);
    
    // Clean instance name for URL usage - remove spaces and special chars
    const cleanInstance = instance.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    console.log(`Instância limpa para URL: ${cleanInstance}`);
    
    // Build possible URLs
    const possibleUrls = [];
    
    // If user provided a base URL, try it first
    if (baseUrl) {
      const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
      possibleUrls.push(
        `${cleanBaseUrl}/instance/connectionState/${encodeURIComponent(instance)}`,
        `${cleanBaseUrl}/instance/connectionState/${cleanInstance}`,
        `${cleanBaseUrl}/instance/connectionState`,
        `${cleanBaseUrl}/manager/instance/connectionState/${encodeURIComponent(instance)}`,
        `${cleanBaseUrl}/manager/instance/connectionState/${cleanInstance}`,
        `${cleanBaseUrl}/manager/instance/connectionState`,
        `${cleanBaseUrl}/api/instance/connectionState/${encodeURIComponent(instance)}`,
        `${cleanBaseUrl}/api/instance/connectionState/${cleanInstance}`,
        `${cleanBaseUrl}/api/instance/connectionState`,
      );
    }
    
    // Common Evolution API patterns
    possibleUrls.push(
      // Common Evolution API patterns with cleaned instance name
      `https://evolution.${cleanInstance}.com.br/instance/connectionState`,
      `https://${cleanInstance}.evolution-api.com/instance/connectionState`,  
      `https://api.${cleanInstance}.com/instance/connectionState`,
      `https://evolution-api.com/instance/connectionState/${encodeURIComponent(instance)}`,
      `https://evolution-api.com/instance/connectionState/${cleanInstance}`,
      // Try direct connection patterns with original instance name
      `https://evolution-api.com/instance/connectionState`,
      `https://api.evolutionapi.com/instance/connectionState/${encodeURIComponent(instance)}`,
      `https://api.evolutionapi.com/instance/connectionState/${cleanInstance}`,
    );

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