// Logistics Handler - Handles delivery/pickup logistics without calling GPT

export interface LogisticsResult {
  output: string;
  toolResults: any[];
  updatedMetadata: any;
}

/**
 * Processes logistics actions (delivery type, address, payment method)
 * No GPT call needed - just metadata updates
 */
export async function processLogisticsHandler(
  action: string,
  parameters: any,
  currentMetadata: any,
  supabase: any,
  agent: any,
  requestId: string
): Promise<LogisticsResult> {
  
  console.log(`[${requestId}] 🚚 Logistics Handler: ${action}`);
  console.log(`  Parameters:`, parameters);

  const updatedMetadata = { ...currentMetadata };
  const toolResults: any[] = [];
  let output = '';

  try {
    switch (action) {
      case 'set_delivery_type': {
        const deliveryType = parameters.delivery_type;
        
        if (!deliveryType || !['delivery', 'pickup'].includes(deliveryType)) {
          output = 'Tipo de entrega inválido';
          break;
        }

        updatedMetadata.delivery_type = deliveryType;
        
        toolResults.push({
          tool: 'set_delivery_type',
          result: {
            success: true,
            delivery_type: deliveryType
          }
        });

        output = deliveryType === 'pickup' 
          ? 'Pedido configurado para RETIRADA no local'
          : 'Pedido configurado para ENTREGA';

        console.log(`[${requestId}] ✅ Delivery type set to: ${deliveryType}`);
        break;
      }

      case 'set_address': {
        const address = parameters.address;
        
        if (!address) {
          output = 'Endereço não fornecido';
          break;
        }

        // Store raw address (validation will happen in checkout)
        updatedMetadata.delivery_address = address;
        updatedMetadata.address_validated = false;

        toolResults.push({
          tool: 'set_address',
          result: {
            success: true,
            address
          }
        });

        output = `Endereço registrado: ${address}`;
        console.log(`[${requestId}] ✅ Address set: ${address}`);
        break;
      }

      case 'set_payment_method': {
        const paymentMethod = parameters.payment_method;
        
        if (!paymentMethod) {
          output = 'Método de pagamento não fornecido';
          break;
        }

        updatedMetadata.payment_method = paymentMethod;

        toolResults.push({
          tool: 'set_payment_method',
          result: {
            success: true,
            payment_method: paymentMethod
          }
        });

        output = `Forma de pagamento: ${paymentMethod}`;
        console.log(`[${requestId}] ✅ Payment method set: ${paymentMethod}`);
        break;
      }

      default:
        output = `Ação desconhecida: ${action}`;
        console.warn(`[${requestId}] ⚠️ Unknown logistics action: ${action}`);
    }

  } catch (error) {
    console.error(`[${requestId}] ❌ Error in logistics handler:`, error);
    output = 'Erro ao processar informação de logística';
  }

  return {
    output,
    toolResults,
    updatedMetadata
  };
}
