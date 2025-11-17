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
import { executeCheckProductAvailability, executeListProductsByCategory } from './tools/product-tools.ts';
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

// 🆕 Função para buscar ou criar chat ativo
async function getOrCreateActiveChat(supabase: any, phone: string, requestId: string) {
  console.log(`[${requestId}] 🔍 Buscando chat ativo para ${phone}...`);
  
  // 1. Buscar chat ativo
  let { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*, agents!inner(*, restaurants!inner(*))')
    .eq('phone', phone)
    .eq('ai_enabled', true)
    .eq('status', 'active')
    .maybeSingle();
  
  if (chatError) {
    console.error(`[${requestId}] ❌ Erro ao buscar chat:`, chatError);
    throw new Error(`Chat query failed: ${chatError.message}`);
  }
  
  if (chat) {
    console.log(`[${requestId}] ✅ Chat ativo encontrado: ${chat.id}`);
    return chat;
  }
  
  console.log(`[${requestId}] 🔄 Verificando chats recentes...`);
  
  // 2. Buscar último chat arquivado (< 24h) para reabertura
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentChat } = await supabase
    .from('chats')
    .select('*, agents!inner(*, restaurants!inner(*))')
    .eq('phone', phone)
    .eq('status', 'archived')
    .gte('archived_at', oneDayAgo)
    .order('archived_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (recentChat) {
    console.log(`[${requestId}] 🔄 Reabrindo chat recente: ${recentChat.id}`);
    
    const { data: reopenedChat } = await supabase
      .from('chats')
      .update({
        status: 'active',
        reopened_at: new Date().toISOString(),
        reopened_count: (recentChat.reopened_count || 0) + 1,
        archived_at: null,
        session_status: 'active',
        conversation_state: 'greeting',
        metadata: {
          ...recentChat.metadata,
          order_items: [], // Limpar carrinho antigo
          reopened_from: recentChat.id,
          previous_order: recentChat.metadata?.last_order_id
        }
      })
      .eq('id', recentChat.id)
      .select('*, agents!inner(*, restaurants!inner(*))')
      .single();
    
    return reopenedChat;
  }
  
  console.log(`[${requestId}] 📝 Criando novo chat...`);
  
  // 3. Buscar agente padrão (primeiro agente ativo)
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*, restaurants!inner(*)')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  
  if (agentError || !agent) {
    console.error(`[${requestId}] ❌ Nenhum agente ativo:`, agentError);
    throw new Error('Nenhum agente ativo configurado');
  }
  
  // 4. Criar novo chat
  const { data: newChat, error: createError } = await supabase
    .from('chats')
    .insert({
      phone: phone,
      agent_id: agent.id,
      restaurant_id: agent.restaurant_id,
      status: 'active',
      ai_enabled: true,
      conversation_state: 'greeting',
      session_status: 'active',
      metadata: {
        created_by: 'auto_webhook',
        created_at: new Date().toISOString()
      }
    })
    .select('*, agents!inner(*, restaurants!inner(*))')
    .single();
  
  if (createError) {
    console.error(`[${requestId}] ❌ Erro ao criar chat:`, createError);
    throw new Error(`Failed to create chat: ${createError.message}`);
  }
  
  console.log(`[${requestId}] ✅ Novo chat criado: ${newChat.id}`);
  return newChat;
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
      case 'list_products_by_category': result = await executeListProductsByCategory(supabase, restaurantId, args); break;
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
  console.log(`\n${'='.repeat(80)}\n[${requestId}] 🚀 NEW REQUEST v5.1 (Context + Debounce)\n${'='.repeat(80)}\n`);
  
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
    let userMessage = sanitizeInput(messageContent);
    
    console.log(`[${requestId}] 📱 ${phone}: "${userMessage}"`);
    
    // Get or create active chat
    const chat = await getOrCreateActiveChat(supabase, phone, requestId);
    
    // ⏱️ DEBOUNCE: Verificar se deve acumular ou processar
    const DEBOUNCE_MS = 8000;
    const metadata = chat.metadata || {};
    const pendingMessages = metadata.pending_messages || [];
    const lastMessageTime = metadata.last_message_timestamp;

    const timeSinceLastMessage = lastMessageTime 
      ? Date.now() - new Date(lastMessageTime).getTime()
      : 999999; // Primeira mensagem sempre processa

    console.log(`[${requestId}] ⏱️ Tempo desde última msg: ${timeSinceLastMessage}ms`);
    console.log(`[${requestId}] 📊 Mensagens pendentes atuais: ${pendingMessages.length}`);

    // Adicionar mensagem atual à fila
    const newPendingMessages = [
      ...pendingMessages,
      { content: userMessage, received_at: new Date().toISOString() }
    ];

    // DECISÃO: Acumular ou processar?
    // ⚠️ CORREÇÃO: Removido `&& pendingMessages.length > 0` para primeira mensagem também acumular
    console.log(`[${requestId}] 🔍 Debounce check: timeSince=${timeSinceLastMessage}ms, threshold=${DEBOUNCE_MS}ms, pending=${pendingMessages.length}`);
    
    if (timeSinceLastMessage < DEBOUNCE_MS) {
      // ⏳ ACUMULAR - Ainda dentro da janela de debounce
      console.log(`[${requestId}] ⏳ ACUMULANDO mensagem (${newPendingMessages.length} total) - aguardando ${DEBOUNCE_MS - timeSinceLastMessage}ms`);
      
      await supabase.from('chats').update({
        metadata: {
          ...metadata,
          pending_messages: newPendingMessages,
          last_message_timestamp: new Date().toISOString(),
          debounce_timer_active: true
        }
      }).eq('id', chat.id);
      
      console.log(`[${requestId}] ✅ Mensagem acumulada. Total na fila: ${newPendingMessages.length}`);
      
      return new Response(JSON.stringify({ 
        status: 'queued', 
        count: newPendingMessages.length,
        will_process_in_ms: DEBOUNCE_MS - timeSinceLastMessage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // ✅ PROCESSAR - Janela expirou
    console.log(`[${requestId}] ✅ PROCESSANDO ${newPendingMessages.length} mensagem(s) - debounce expirado`);

    // Combinar todas as mensagens pendentes
    if (newPendingMessages.length > 1) {
      userMessage = newPendingMessages.map((m: any) => m.content).join('\n');
      console.log(`[${requestId}] 📝 Mensagens combinadas (${newPendingMessages.length} msgs): "${userMessage}"`);
    } else if (newPendingMessages.length === 1) {
      userMessage = newPendingMessages[0].content;
      console.log(`[${requestId}] 📝 Mensagem única: "${userMessage}"`);
    }

    // Limpar fila e atualizar timestamp
    await supabase.from('chats').update({
      metadata: {
        ...metadata,
        pending_messages: [],
        last_message_timestamp: new Date().toISOString(),
        debounce_timer_active: false,
        last_processed_at: new Date().toISOString()
      }
    }).eq('id', chat.id);
    
    console.log(`[${requestId}] 🧹 Fila limpa, processamento iniciado`);
    
    // 📚 Load conversation context
    console.log(`[${requestId}] 📚 Carregando contexto...`);
    const conversationHistory = await loadConversationHistory(supabase, chat.id, 20);
    console.log(`[${requestId}] ✅ Contexto carregado: ${conversationHistory.length} mensagens`);
    
    const { id: chatId, agents: agent } = chat;
    const restaurant = agent.restaurants;
    let sessionId = chat.session_id;
    if (!sessionId) {
      const { data: newSession } = await supabase.rpc('generate_session_id');
      sessionId = newSession;
      await supabase.from('chats').update({ session_id: sessionId }).eq('id', chatId);
    }
    
    await supabase.from('messages').insert({ chat_id: chatId, session_id: sessionId, sender_type: 'user', content: userMessage });
    const cart = getCartFromMetadata(metadata);
    
    // [2/5] ORCHESTRATOR
    console.log(`[${requestId}] [2/5] 🧠 Orquestrando...`);
    const decision = await decideAgent(userMessage, cart, chat.conversation_state || 'initial', requestId);
    console.log(`[${requestId}] ✅ Decisão: ${decision.agent} (razão: ${decision.reasoning})`);
    
    // [3/5] AGENT: Route to specialized agent with history
    console.log(`[${requestId}] [3/5] 🤖 Chamando agente ${decision.agent}...`);
    
    let agentResult: { content: string; toolCalls?: any[] };
    
    if (decision.agent === 'SALES') {
      agentResult = await processSalesAgent(
        userMessage,
        conversationHistory,
        {
          restaurantName: restaurant.name,
          currentCart: cart.items,
          cartTotal: cart.total,
          currentState: chat.conversation_state || 'initial'
        },
        requestId
      );
    } else if (decision.agent === 'CHECKOUT') {
      agentResult = await processCheckoutAgent(
        userMessage,
        conversationHistory,
        {
          restaurantName: restaurant.name,
          currentCart: cart.items,
          cartTotal: cart.total,
          deliveryFee: metadata.delivery_fee || 0
        },
        requestId
      );
    } else if (decision.agent === 'MENU') {
      agentResult = await processMenuAgent(
        userMessage,
        conversationHistory,
        {
          restaurantName: restaurant.name,
          menuLink: `https://app.example.com/${restaurant.slug}`
        },
        requestId
      );
    } else {
      agentResult = await processSupportAgent(
        userMessage,
        conversationHistory,
        {
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address,
          restaurantPhone: restaurant.phone,
          workingHours: restaurant.working_hours
        },
        requestId
      );
    }
    
    const toolResults = await executeTools(agentResult.toolCalls || [], supabase, chatId, agent, restaurant.id, requestId);
    
    // [4/5] CONVERSATION: Humanize response with context
    const finalResponse = await processConversationAgent(
      userMessage,
      decision.agent,
      agentResult.content,
      toolResults,
      restaurant.name,
      requestId,
      conversationHistory
    );
    
    await supabase.from('messages').insert({ chat_id: chatId, session_id: sessionId, sender_type: 'assistant', content: finalResponse });
    
    const processingTime = Date.now() - startTime;
    
    // Save processing log with full context
    await saveProcessingLog(supabase, {
      chat_id: chat.id,
      session_id: sessionId,
      request_id: requestId,
      user_message: userMessage,
      current_state: chat.conversation_state || 'unknown',
      metadata_snapshot: metadata,
      orchestrator_decision: decision,
      agent_called: decision.agent,
      tool_results: toolResults,
      loaded_history: conversationHistory,
      loaded_summaries: [],
      final_response: finalResponse,
      processing_time_ms: processingTime
    });
    
    console.log(`[${requestId}] ⚡ Total: ${processingTime}ms`);
    
    // [5/5] WHATSAPP
    await sendWhatsAppMessage(phone, finalResponse, agent, requestId);
    
    console.log(`\n${'='.repeat(80)}\n[${requestId}] ✅ COMPLETED - ${Date.now() - startTime}ms\n${'='.repeat(80)}\n`);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
