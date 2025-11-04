// Address validation tool for AI agent

export async function executeValidateAddress(
  supabase: any,
  agent: any,
  args: any
) {
  try {
    console.log('[VALIDATE_ADDRESS] Starting validation for:', args.address);
    
    // Call validate-address edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/validate-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        address: args.address,
        city: args.city,
        zip_code: args.zip_code,
        restaurant_id: agent.restaurants.id,
        restaurant_address: agent.restaurants.address
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[VALIDATE_ADDRESS] Validation failed:', errorData);
      return {
        valid: false,
        error: errorData.error,
        message: errorData.message || 'Não foi possível validar o endereço.'
      };
    }
    
    const validationResult = await response.json();
    
    console.log('[VALIDATE_ADDRESS] ✅ Validation successful:', validationResult);
    
    return {
      valid: true,
      formatted_address: validationResult.formatted_address,
      city: validationResult.city,
      state: validationResult.state,
      zip_code: validationResult.zip_code,
      distance_km: validationResult.distance_km,
      delivery_fee: validationResult.delivery_fee,
      validation_token: validationResult.validation_token,
      message: validationResult.message
    };
    
  } catch (error) {
    console.error('[VALIDATE_ADDRESS] ❌ Error:', error);
    return {
      valid: false,
      error: 'validation_error',
      message: 'Erro ao validar endereço. Por favor, verifique os dados e tente novamente.'
    };
  }
}
