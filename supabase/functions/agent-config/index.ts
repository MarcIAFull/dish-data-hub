import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentConfig {
  id: string;
  name: string;
  personality: string;
  instructions: string | null;
  is_active: boolean;
  fallback_enabled: boolean;
  fallback_timeout_minutes: number;
  restaurant_id: string;
  webhook_url: string | null;
  evolution_api_instance: string | null;
  evolution_api_token: string | null;
  whatsapp_number: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    console.log('Agent Config API called:', { path: url.pathname, method: req.method });

    // GET /agent-config/:agent_id
    // GET /agent-config/restaurant/:restaurant_id
    if (req.method === 'GET') {
      let query;
      
      if (pathParts.length === 2 && pathParts[0] === 'agent-config') {
        // Buscar por agent_id
        const agentId = pathParts[1];
        console.log('Fetching agent by ID:', agentId);
        
        query = supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .single();
      } else if (pathParts.length === 3 && pathParts[0] === 'agent-config' && pathParts[1] === 'restaurant') {
        // Buscar por restaurant_id
        const restaurantId = pathParts[2];
        console.log('Fetching agents by restaurant ID:', restaurantId);
        
        query = supabase
          .from('agents')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .limit(1)
          .single();
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint. Use /agent-config/:agent_id or /agent-config/restaurant/:restaurant_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching agent config:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Agent not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const agentConfig: AgentConfig = data;
      console.log('Agent config retrieved successfully:', agentConfig.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: agentConfig
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in agent-config function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
