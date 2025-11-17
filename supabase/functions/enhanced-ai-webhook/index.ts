// 🚀 Enhanced AI Webhook v5.0 - SIMPLIFIED ARCHITECTURE
// 📅 Refatorado: 2025-11-17
// ✨ Arquitetura: 5 Etapas Lineares
// 🎯 Fluxo: Webhook → Orchestrator → Agent → Conversation → WhatsApp

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Agents
import { decideAgent } from './agents/orchestrator.ts';
import { processSalesAgent } from './agents/sales-agent.ts';
import { processCheckoutAgent } from './agents/checkout-agent.ts';
import { processMenuAgent } from './agents/menu-agent.ts';
import { processSupportAgent } from './agents/support-agent.ts';
import { processConversationAgent } from './agents/conversation-agent.ts';

// Tools
import { executeCheckProductAvailability } from './tools/product-tools.ts';
import { executeAddItemToOrder, executeGetCartSummary } from './tools/order-tools.ts';
import { executeValidateAddress } from './tools/address-tools.ts';
import { executeListPaymentMethods } from './tools/payment-tools.ts';
import { executeCreateOrder } from './tools.ts';

// Utils
import { loadConversationHistory, saveProcessingLog, getCartFromMetadata } from './utils/db-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function sanitizeInput(input: string): string {
  if (!input) return '';
  let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  return sanitized.trim().substring(0, 10000);
}

async function executeTools(toolCalls: any[], supabase: any, chatId: number, agent: any, restaurantId: string, requestId: string): Promise<any[]> {
  const results: any[] = [];
  for (const toolCall of toolCalls || []) {
    const toolName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments || '{}');
    console.log(`[${requestId}] 🔧 Executing: ${toolName}`);
    let result: any;
    switch (toolName) {
      case 'check_product_availability': result = await executeCheckProductAvailability(supabase, restaurantId, args); break;
      case 'add_item_to_order': result = await executeAddItemToOrder(supabase, chatId, args); break;
      case 'get_cart_summary': result = await executeGetCartSummary(supabase, chatId); break;
      case 'validate_delivery_address': result = await executeValidateAddress(supabase, agent, args); break;
      case 'list_payment_methods': result = await executeListPaymentMethods(supabase, agent); break;
      case 'create_order': result = await executeCreateOrder(supabase, chatId, args); break;
      case 'send_menu_link': result = { success: true, message: 'Link enviado' }; break;
      default: result = { success: false, error: `Unknown: ${toolName}` };
    }
    results.push({ tool: toolName, arguments: args, result });
  }
  return results;
}

async function sendWhatsAppMessage(phone: string, message: string, agent: any, requestId: string): Promise<boolean> {
  try {
    console.log(`[${requestId}] [5/5] 📱 Enviando WhatsApp...`);
    if (!agent.evolution_api_base_url) return false;
    const response = await fetch(`${agent.evolution_api_base_url}/message/sendText/${agent.evolution_api_instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': agent.evolution_api_token },
      body: JSON.stringify({ number: phone, text: message, delay: 1000 })
    });
    console.log(`[${requestId}] ✅ WhatsApp ${response.ok ? 'sent' : 'failed'}`);
    return response.ok;
  } catch (error) {
    console.error(`[${requestId}] ❌ WhatsApp error:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  console.log(`\n${'='.repeat(80)}\n[${requestId}] 🚀 NEW REQUEST v5.0\n${'='.repeat(80)}\n`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    
    // [1/5] WEBHOOK
    console.log(`[${requestId}] [1/5] 📥 Recebendo mensagem...`);
    if (body.event !== 'messages.upsert' || !body.data?.message) {
      return new Response(JSON.stringify({ ignored: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const phone = body.data.key.remoteJid.replace('@s.whatsapp.net', '');
    const messageContent = body.data.message?.conversation || body.data.message?.extendedTextMessage?.text || '';
    const sanitizedMessage = sanitizeInput(messageContent);
    
    console.log(`[${requestId}] 📱 ${phone}: "${sanitizedMessage}"`);
    
    let { data: chat } = await supabase.from('chats').select('*, agents!inner(*, restaurants!inner(*))').eq('phone', phone).eq('ai_enabled', true).single();
    if (!chat) return new Response(JSON.stringify({ error: 'No chat' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const { id: chatId, agents: agent } = chat;
    const restaurant = agent.restaurants;
    let sessionId = chat.session_id;
    if (!sessionId) {
      const { data: newSession } = await supabase.rpc('generate_session_id');
      sessionId = newSession;
      await supabase.from('chats').update({ session_id: sessionId }).eq('id', chatId);
    }
    
    await supabase.from('messages').insert({ chat_id: chatId, session_id: sessionId, sender_type: 'user', content: sanitizedMessage });
    const conversationHistory = await loadConversationHistory(supabase, chatId, 10);
    const cart = getCartFromMetadata(chat.metadata);
    
    // [2/5] ORCHESTRATOR
    const decision = await decideAgent(sanitizedMessage, {
      hasItemsInCart: cart.count > 0,
      itemCount: cart.count,
      cartTotal: cart.total,
      currentState: chat.metadata?.conversation_state || 'INIT',
      restaurantName: restaurant.name
    }, requestId);
    
    // [3/5] AGENT
    let agentResult: { content: string; toolCalls?: any[] };
    switch (decision.agent) {
      case 'SALES': agentResult = await processSalesAgent(sanitizedMessage, conversationHistory, { restaurantName: restaurant.name, currentCart: cart.items, cartTotal: cart.total, currentState: 'DISCOVERY' }, requestId); break;
      case 'CHECKOUT': agentResult = await processCheckoutAgent(sanitizedMessage, conversationHistory, { restaurantName: restaurant.name, currentCart: cart.items, cartTotal: cart.total, deliveryFee: 0 }, requestId); break;
      case 'MENU': agentResult = await processMenuAgent(sanitizedMessage, conversationHistory, { restaurantName: restaurant.name }, requestId); break;
      case 'SUPPORT': agentResult = await processSupportAgent(sanitizedMessage, conversationHistory, { restaurantName: restaurant.name, restaurantAddress: restaurant.address }, requestId); break;
      default: agentResult = { content: 'Como posso ajudar?' };
    }
    
    const toolResults = await executeTools(agentResult.toolCalls || [], supabase, chatId, agent, restaurant.id, requestId);
    
    // [4/5] CONVERSATION
    const finalResponse = await processConversationAgent(sanitizedMessage, decision.agent, agentResult.content, toolResults, restaurant.name, requestId);
    
    await supabase.from('messages').insert({ chat_id: chatId, session_id: sessionId, sender_type: 'assistant', content: finalResponse });
    await saveProcessingLog(supabase, { chat_id: chatId, session_id: sessionId, request_id: requestId, user_message: sanitizedMessage, orchestrator_decision: decision, agent_called: decision.agent, tools_used: toolResults, final_response: finalResponse, processing_time_ms: Date.now() - startTime });
    
    // [5/5] WHATSAPP
    await sendWhatsAppMessage(phone, finalResponse, agent, requestId);
    
    console.log(`\n${'='.repeat(80)}\n[${requestId}] ✅ COMPLETED - ${Date.now() - startTime}ms\n${'='.repeat(80)}\n`);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
