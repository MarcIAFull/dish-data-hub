// 📍 Address validation tools

export function getAddressTools() {
  return [
    {
      type: "function",
      function: {
        name: "validate_delivery_address",
        description: "Valida endereço de entrega e calcula taxa",
        parameters: {
          type: "object",
          properties: {
            address: { type: "string" },
            city: { type: "string" },
            zip_code: { type: "string" }
          },
          required: ["address"]
        }
      }
    }
  ];
}

export async function executeValidateAddress(
  supabase: any,
  agent: any,
  args: { address: string; city?: string; zip_code?: string }
) {
  try {
    console.log('[ADDRESS_TOOL] Validating:', args.address);
    
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
      return {
        success: false,
        error: errorData.error,
        message: 'Endereço inválido ou fora da área de entrega'
      };
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: {
        formatted_address: result.formatted_address,
        delivery_fee: result.delivery_fee,
        distance_km: result.distance_km
      },
      message: `Endereço validado! Taxa: R$ ${result.delivery_fee.toFixed(2)}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Erro ao validar endereço'
    };
  }
}
