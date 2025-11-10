import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sanitizes and validates a restaurant slug
 * Ensures it's URL-friendly and unique
 */
function sanitizeSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input for slug generation');
  }

  const sanitized = input
    .toLowerCase()
    .normalize('NFD')                      // Decompõe acentos
    .replace(/[\u0300-\u036f]/g, '')       // Remove marcas diacríticas
    .replace(/[^a-z0-9-]/g, '')            // Apenas letras, números, hífens
    .replace(/-+/g, '-')                   // Remove hífens duplicados
    .replace(/^-+|-+$/g, '');              // Remove hífens nas pontas

  if (!sanitized) {
    throw new Error('Slug would be empty after sanitization');
  }

  // Valida formato final
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sanitized)) {
    throw new Error('Invalid slug format after sanitization');
  }

  return sanitized;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { slug, restaurantId } = await req.json();

    console.log('🔍 Validating slug:', { slug, restaurantId });

    // Sanitiza o slug
    const sanitizedSlug = sanitizeSlug(slug);
    console.log('✨ Sanitized slug:', sanitizedSlug);

    // Verifica se já existe outro restaurante com esse slug
    let query = supabaseClient
      .from('restaurants')
      .select('id, slug')
      .eq('slug', sanitizedSlug);

    // Se estiver atualizando, ignora o próprio restaurante
    if (restaurantId) {
      query = query.neq('id', restaurantId);
    }

    const { data: existing, error: checkError } = await query.single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found (ok)
      console.error('❌ Error checking slug uniqueness:', checkError);
      throw checkError;
    }

    if (existing) {
      console.log('⚠️ Slug already exists, suggesting alternative');
      return new Response(
        JSON.stringify({
          valid: false,
          slug: sanitizedSlug,
          suggestion: `${sanitizedSlug}-2`,
          message: 'Este slug já está em uso',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409 
        }
      );
    }

    console.log('✅ Slug is valid and unique');
    return new Response(
      JSON.stringify({
        valid: true,
        slug: sanitizedSlug,
        message: 'Slug válido',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in validate-restaurant-slug:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: error.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
