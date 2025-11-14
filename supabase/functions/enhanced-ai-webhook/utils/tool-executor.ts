// 🔧 Tool Executor v2.0 - Static Imports Only
// 📅 Last updated: 2025-11-14
// ✨ All imports are static - no dynamic imports allowed

// Static imports for all tool functions
import { executeCheckAvailability, executeCheckOrderPrerequisites, executeCreateOrder } from '../tools.ts';
import { executeAddItemToOrder } from '../cart-tools.ts';
import { executeValidateAddress } from '../address-tools.ts';
import { executeListPaymentMethods } from '../payment-tools.ts';

// Shared tool execution logic for all agents

/**
 * Executes tool calls from any agent
 */
export async function executeToolCalls(
  toolCalls: any[],
  supabase: any,
  agent: any,
  chatId: number,
  customerPhone: string,
  requestId: string
): Promise<any[]> {
  console.log('🔧 Tool Executor v2.0 - Static Imports Deployed');
  
  const toolResults = [];
  
  console.log(`[${requestId}] 🔧 Processing ${toolCalls.length} tool calls`);
  
  for (const toolCall of toolCalls) {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments);
    
    console.log(`[${requestId}] 🔨 Executing tool: ${toolName}`, toolArgs);
    
    let toolResult;
    
    try {
      switch (toolName) {
        case 'send_menu_link':
          toolResult = {
            success: true,
            link: `https://ebbe56d2-234f-45f9-8d89-11b4c6add970.lovableproject.com/r/${agent.restaurants.slug}`,
            message: 'Link do cardápio enviado'
          };
          break;
        
        case 'check_product_availability':
          toolResult = await executeCheckAvailability(supabase, agent, toolArgs);
          break;
        
        case 'add_item_to_order':
          toolResult = await executeAddItemToOrder(supabase, chatId, toolArgs);
          break;
        
        case 'get_cart_summary':
          // Get cart from chat metadata
          const { data: chat } = await supabase
            .from('chats')
            .select('metadata')
            .eq('id', chatId)
            .single();
          
          const orderItems = chat?.metadata?.order_items || [];
          const total = orderItems.reduce((sum: number, item: any) => 
            sum + (item.quantity * item.unit_price), 0
          );
          
          toolResult = {
            success: true,
            items: orderItems,
            total,
            message: orderItems.length === 0 
              ? 'Carrinho vazio'
              : `${orderItems.length} itens no carrinho (R$ ${total.toFixed(2)})`
          };
          break;
        
        case 'validate_delivery_address':
          toolResult = await executeValidateAddress(supabase, agent, toolArgs);
          break;
        
        case 'list_payment_methods':
          toolResult = await executeListPaymentMethods(supabase, agent);
          break;
        
        case 'check_order_prerequisites':
          toolResult = await executeCheckOrderPrerequisites(supabase, chatId);
          break;
        
        case 'create_order':
          toolResult = await executeCreateOrder(supabase, agent, toolArgs, chatId, customerPhone);
          break;
        
        case 'get_restaurant_info':
          // Get restaurant info from agent data - NEVER invent data
          const restaurant = agent.restaurants;
          const infoType = toolArgs.info_type;
          
          const restaurantInfo: any = {};
          
          if (infoType === 'all' || infoType === 'address') {
            if (restaurant.address && restaurant.address.trim() !== '') {
              restaurantInfo.address = restaurant.address;
            }
          }
          
          if (infoType === 'all' || infoType === 'phone') {
            if (restaurant.phone && restaurant.phone.trim() !== '') {
              restaurantInfo.phone = restaurant.phone;
            }
            if (restaurant.whatsapp && restaurant.whatsapp.trim() !== '') {
              restaurantInfo.whatsapp = restaurant.whatsapp;
            } else if (agent.evolution_whatsapp_number) {
              restaurantInfo.whatsapp = agent.evolution_whatsapp_number;
            }
          }
          
          if (infoType === 'all' || infoType === 'instagram') {
            if (restaurant.instagram && restaurant.instagram.trim() !== '') {
              restaurantInfo.instagram = `@${restaurant.instagram.replace('@', '')}`;
            }
          }
          
          toolResult = restaurantInfo;
          break;
        
        default:
          console.warn(`[${requestId}] ⚠️ Unknown tool: ${toolName}`);
          toolResult = { error: 'Unknown tool' };
      }
      
      toolResults.push({
        tool: toolName,
        result: toolResult
      });
      
      console.log(`[${requestId}] ✅ Tool ${toolName} executed:`, toolResult);
      
    } catch (error) {
      console.error(`[${requestId}] ❌ Tool ${toolName} error:`, error);
      toolResults.push({
        tool: toolName,
        result: { error: error.message }
      });
    }
  }
  
  return toolResults;
}

/**
 * Gets natural language response from AI based on tool results
 */
export async function getFollowUpResponse(
  toolResults: any[],
  previousMessages: any[],
  systemContext: string,
  requestId: string
): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log(`[${requestId}] 🔄 Getting AI response based on ${toolResults.length} tool results...`);
  
  // Format tool results as user message
  const toolResultsText = toolResults.map(tr => {
    const resultStr = typeof tr.result === 'object' ? JSON.stringify(tr.result, null, 2) : String(tr.result);
    return `Ferramenta: ${tr.tool}\nResultado: ${resultStr}`;
  }).join('\n\n---\n\n');

  const conversationHistory = previousMessages.slice(-5).map(m => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: systemContext },
        ...conversationHistory,
        {
          role: 'user',
          content: `[RESULTADOS DAS FERRAMENTAS EXECUTADAS]\n\n${toolResultsText}\n\n[FIM DOS RESULTADOS]\n\nCom base nos resultados acima, responda ao cliente de forma natural e humanizada. Lembre-se: máximo 1 emoji na conversa inteira, use quebras duplas de linha, seja direto e vendedor.`
        }
      ],
      max_completion_tokens: 600
    })
  });

  if (!followUpResponse.ok) {
    const errorText = await followUpResponse.text();
    console.error(`[${requestId}] ❌ Follow-up API error:`, followUpResponse.status, errorText);
    throw new Error(`Follow-up API error: ${followUpResponse.status}`);
  }

  const followUpData = await followUpResponse.json();
  const finalMessage = followUpData.choices[0].message.content || '';
  
  console.log(`[${requestId}] 📝 Final AI message (${finalMessage.length} chars): ${finalMessage.substring(0, 100)}...`);
  
  return finalMessage;
}
