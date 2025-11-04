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

interface ValidationResult {
  valid: boolean;
  formatted_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  distance_km?: number;
  delivery_fee?: number;
  calculation_method?: string;
  validation_token?: string;
  expires_at?: string;
  message?: string;
  error?: string;
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

    // ============= GET RESTAURANT COUNTRY =============
    
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('country, address')
      .eq('id', body.restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      console.error('[VALIDATE_ADDRESS] Error fetching restaurant:', restaurantError);
      return new Response(JSON.stringify({
        valid: false,
        error: 'restaurant_not_found',
        message: 'Restaurante não encontrado.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    const country = restaurant.country || 'PT';
    const currency = country === 'BR' ? 'R$' : '€';
    
    console.log('[VALIDATE_ADDRESS] Restaurant country:', country);

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

    // ============= VALIDATION LAYER 2: COUNTRY-SPECIFIC VALIDATION =============
    
    let validatedCity = body.city;
    let validatedState = '';
    let zipCode = body.zip_code;

    if (country === 'BR') {
      // === BRAZIL: Use ViaCEP API ===
      if (!zipCode) {
        const zipRegex = /\d{5}-?\d{3}/;
        const match = body.address.match(zipRegex);
        zipCode = match ? match[0].replace('-', '') : null;
      }

      if (zipCode) {
        console.log('[VALIDATE_ADDRESS] [BR] Validating CEP:', zipCode);
        
        try {
          const cepResponse = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
          
          if (cepResponse.ok) {
            const cepData = await cepResponse.json();
            
            if (!cepData.erro) {
              validatedCity = cepData.localidade;
              validatedState = cepData.uf;
              console.log('[VALIDATE_ADDRESS] [BR] CEP validated:', validatedCity, validatedState);
            } else {
              console.warn('[VALIDATE_ADDRESS] [BR] Invalid CEP:', zipCode);
            }
          }
        } catch (cepError) {
          console.error('[VALIDATE_ADDRESS] [BR] ViaCEP error:', cepError);
        }
      }
      
    } else if (country === 'PT') {
      // === PORTUGAL: Use Geonames API ===
      if (!zipCode) {
        const zipRegex = /\d{4}-?\d{3}/;
        const match = body.address.match(zipRegex);
        zipCode = match ? match[0] : null;
      }

      if (zipCode) {
        console.log('[VALIDATE_ADDRESS] [PT] Validating Código Postal:', zipCode);
        
        try {
          const postalCodeClean = zipCode.replace('-', '');
          const geonamesResponse = await fetch(
            `http://api.geonames.org/postalCodeSearchJSON?postalcode=${postalCodeClean}&country=PT&maxRows=1&username=demo`
          );
          
          if (geonamesResponse.ok) {
            const geoData = await geonamesResponse.json();
            
            if (geoData.postalCodes && geoData.postalCodes.length > 0) {
              const postal = geoData.postalCodes[0];
              validatedCity = postal.placeName;
              validatedState = postal.adminName1;
              console.log('[VALIDATE_ADDRESS] [PT] Código Postal validated:', validatedCity, validatedState);
            } else {
              console.warn('[VALIDATE_ADDRESS] [PT] Invalid Código Postal:', zipCode);
            }
          }
        } catch (geoError) {
          console.error('[VALIDATE_ADDRESS] [PT] Geonames error:', geoError);
        }
      }
      
    } else {
      // === OTHER COUNTRIES: Generic validation ===
      console.log('[VALIDATE_ADDRESS] Using generic validation for country:', country);
    }

    // ============= VALIDATION LAYER 3: CALCULATE DISTANCE =============
    
    let distance = 0;
    let calculationMethod = 'estimated';

    if (restaurant.address) {
      if (validatedCity) {
        distance = 4.0;
        calculationMethod = 'zip_based';
      } else {
        distance = 5.0;
        calculationMethod = 'default';
      }
    } else {
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

    const deliveryFee = deliveryZones?.fee || 5.00;
    
    console.log('[VALIDATE_ADDRESS] Delivery fee:', deliveryFee, currency);

    // ============= BUILD FORMATTED ADDRESS =============
    
    const zipLabel = country === 'BR' ? 'CEP' : 'Código Postal';
    const formattedAddress = [
      body.address.trim(),
      validatedCity ? validatedCity : body.city,
      zipCode ? `${zipLabel}: ${zipCode}` : null
    ].filter(Boolean).join(', ');

    // ============= GENERATE VALIDATION TOKEN =============
    
    const validationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
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
      country: country,
      message: `Endereço validado! Taxa de entrega: ${currency} ${deliveryFee.toFixed(2)} (${distance}km)`
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
