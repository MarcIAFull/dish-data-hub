import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddressValidationRequest {
  address: string;
  city?: string;
  zip_code?: string;
  restaurant_id: string;
  restaurant_address?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AddressValidationRequest = await req.json();
    
    console.log('[VALIDATE_ADDRESS] Received request:', body);

    // ============= VALIDATION LAYER 1: BASIC FORMAT =============
    
    if (!body.address || body.address.trim().length < 10) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'invalid_format',
        message: 'Endereço incompleto. Por favor, forneça endereço completo com rua, número e cidade.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Extract ZIP code from address if not provided separately
    let zipCode = body.zip_code;
    if (!zipCode) {
      const zipRegex = /\d{5}-?\d{3}/;
      const match = body.address.match(zipRegex);
      zipCode = match ? match[0].replace('-', '') : null;
    }

    // ============= VALIDATION LAYER 2: ZIP CODE VALIDATION =============
    
    let validatedCity = body.city;
    let validatedState = '';
    
    if (zipCode) {
      console.log('[VALIDATE_ADDRESS] Validating ZIP code:', zipCode);
      
      try {
        // Use ViaCEP API (free Brazilian ZIP code API)
        const cepResponse = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
        
        if (cepResponse.ok) {
          const cepData = await cepResponse.json();
          
          if (!cepData.erro) {
            validatedCity = cepData.localidade;
            validatedState = cepData.uf;
            console.log('[VALIDATE_ADDRESS] ZIP validated:', validatedCity, validatedState);
          } else {
            console.warn('[VALIDATE_ADDRESS] Invalid ZIP code:', zipCode);
          }
        }
      } catch (cepError) {
        console.error('[VALIDATE_ADDRESS] ViaCEP error:', cepError);
        // Continue without ZIP validation
      }
    }

    // ============= VALIDATION LAYER 3: CALCULATE DISTANCE =============
    
    // For now, use simplified distance calculation
    // In production, integrate with Google Maps Distance Matrix API or similar
    
    let distance = 0;
    let calculationMethod = 'estimated';

    // Check if we have restaurant address
    if (body.restaurant_address) {
      // Simplified estimation: use ZIP code proximity or city matching
      if (validatedCity) {
        // Same city - estimate 3-5km
        distance = 4.0;
        calculationMethod = 'zip_based';
      } else {
        // Unknown - assume 5km
        distance = 5.0;
        calculationMethod = 'default';
      }
    } else {
      // No restaurant address - use default
      distance = 5.0;
      calculationMethod = 'default';
    }

    console.log('[VALIDATE_ADDRESS] Calculated distance:', distance, 'km', `(${calculationMethod})`);

    // ============= VALIDATION LAYER 4: GET DELIVERY FEE =============
    
    const { data: deliveryZones, error: zonesError } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('restaurant_id', body.restaurant_id)
      .eq('is_active', true)
      .lte('min_distance', distance)
      .gte('max_distance', distance)
      .order('min_distance', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (zonesError) {
      console.error('[VALIDATE_ADDRESS] Error fetching delivery zones:', zonesError);
    }

    const deliveryFee = deliveryZones?.fee || 5.00; // Default R$ 5.00
    
    console.log('[VALIDATE_ADDRESS] Delivery fee:', deliveryFee);

    // ============= BUILD FORMATTED ADDRESS =============
    
    const formattedAddress = [
      body.address.trim(),
      validatedCity ? validatedCity : body.city,
      zipCode ? `CEP: ${zipCode}` : null
    ].filter(Boolean).join(', ');

    // ============= GENERATE VALIDATION TOKEN =============
    
    // Create a validation token that expires in 30 minutes
    const validationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Store validation in database (optional - for audit trail)
    // You could create a temporary table for this
    
    console.log('[VALIDATE_ADDRESS] ✅ Address validated successfully');

    return new Response(JSON.stringify({
      valid: true,
      formatted_address: formattedAddress,
      city: validatedCity || body.city,
      state: validatedState,
      zip_code: zipCode,
      distance_km: distance,
      delivery_fee: deliveryFee,
      calculation_method: calculationMethod,
      validation_token: validationToken,
      expires_at: expiresAt.toISOString(),
      message: `Endereço validado! Taxa de entrega: R$ ${deliveryFee.toFixed(2)} (${distance}km)`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[VALIDATE_ADDRESS] ❌ Error:', error);
    
    return new Response(JSON.stringify({
      valid: false,
      error: 'validation_error',
      message: 'Não foi possível validar o endereço. Por favor, verifique e tente novamente.',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
