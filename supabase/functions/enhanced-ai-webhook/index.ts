// 🚀 Enhanced AI Webhook v4.0 - FORCE DEPLOY - Multi-Intent Architecture
// 📅 Last deployed: 2025-11-14 16:00 UTC
// ✨ Features: Multi-Intent Detection → Execution Planner → Multi-Agent → Smart State Machine → Response Combiner
// 🔧 Supports parallel intent processing, dynamic agent routing, and non-linear state transitions
// 🎯 Architecture: Orchestrator V2 → Plan Creator → Plan Executor → Logistics Handler → State Machine V2
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { executeCreateOrder, executeCheckAvailability, executeCheckOrderPrerequisites } from './tools.ts';
import { executeCheckOrderStatus, executeNotifyStatusChange, executeTransferToHuman } from './order-tools.ts';
import { executeValidateAddress } from './address-tools.ts';
import { executeListPaymentMethods } from './payment-tools.ts';
import { executeListProductModifiers } from './modifier-tools.ts';
import { executeAddItemToOrder } from './cart-tools.ts';

// Multi-Agent Architecture v2 - Multi-Intent Support
import { classifyMultipleIntents } from './agents/orchestrator-v2.ts';
import { processSalesAgent } from './agents/sales-agent.ts';
import { processCheckoutAgent } from './agents/checkout-agent.ts';
import { processMenuAgent } from './agents/menu-agent.ts';
import { processSupportAgent } from './agents/support-agent.ts';
import { processConversationAgent } from './agents/conversation-agent.ts';
import { 
  analyzeConversationState, 
  buildSalesContext,
  buildCheckoutContext,
  buildMenuContext,
  buildSupportContext
} from './utils/context-builder.ts';
import { executeToolCalls } from './utils/tool-executor.ts';
import { calculateCompletionCriteria, getNextState, type ConversationState } from './utils/state-machine-v2.ts';
import { validateResponse } from './utils/response-validator.ts';
import { createExecutionPlan } from './utils/execution-planner.ts';
import { executePlan } from './utils/plan-executor.ts';
import { combineResponses, createExecutionSummary } from './utils/response-combiner.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// ============= DEBOUNCE CONFIGURATION =============
const DEBOUNCE_DELAY_MS = 8000; // 8 segundos para agrupar mensagens
const MAX_PENDING_MESSAGES = 15; // Limite de segurança

// ============= SECURITY FUNCTIONS =============

function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length to prevent DoS
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized.trim();
}

function detectSuspiciousInput(input: string): string[] {
  const patterns: string[] = [];
  const lowerInput = input.toLowerCase();
  
  // SQL Injection patterns
  if (/(\bdrop\b|\bdelete\b|\btruncate\b|\balter\b)/i.test(lowerInput)) {
    patterns.push('sql_injection');
  }
  
  // Prompt injection patterns
  if (/ignore (previous|above|all) (instructions?|rules?|prompts?)/i.test(lowerInput)) {
    patterns.push('prompt_injection');
  }
  
  if (/(you are now|act as|pretend to be|roleplay as)/i.test(lowerInput)) {
    patterns.push('role_manipulation');
  }
  
  // System command patterns
  if (/(sudo|admin mode|debug mode|developer mode)/i.test(lowerInput)) {
    patterns.push('privilege_escalation');
  }
  
  return patterns;
}

function sanitizeAIResponse(response: string): string {
  if (!response) return '';
  
  // Remove potential system information leakage
  let sanitized = response
    .replace(/\[SYSTEM\]/gi, '')
    .replace(/\[DEBUG\]/gi, '')
    .replace(/\[INTERNAL\]/gi, '')
    .replace(/\[TOOL\]/gi, '')
    .replace(/\[FUNCTION\]/gi, '')
    .replace(/API[_\s]KEY/gi, '***')
    .replace(/TOKEN/gi, '***')
    .replace(/PASSWORD/gi, '***')
    .replace(/(?<![\w.])SUPABASE(?![\w.])/gi, 'banco de dados');
  
  // Remove null bytes and control characters, but preserve \n, \r, \t for proper formatting
  sanitized = sanitized
    .replace(/\0/g, '')  // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');  // Remove control chars except \t(\x09), \n(\x0A), \r(\x0D)
  
  // Limit length to prevent extremely long responses
  const MAX_LENGTH = 4000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '...';
  }
  
  return sanitized.trim();
}

/**
 * Limpa resposta da IA: remove emojis excessivos, garante quebras duplas
 */
function cleanAIResponse(response: string): string {
  let cleaned = response;
  
  // 1. Detectar e limitar emojis (máximo 1 por mensagem)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = cleaned.match(emojiRegex) || [];
  
  if (emojis.length > 1) {
    console.log(`[CLEAN] ⚠️ Removendo ${emojis.length - 1} emojis extras`);
    
    // Manter apenas 1 emoji aleatório
    const randomIndex = Math.floor(Math.random() * emojis.length);
    const keepEmoji = emojis[randomIndex];
    
    // Remover todos os emojis
    cleaned = cleaned.replace(emojiRegex, '');
    
    // Adicionar o emoji escolhido no final (antes de pontuação se houver)
    if (cleaned.match(/[.!?]\s*$/)) {
      cleaned = cleaned.replace(/([.!?])\s*$/, ` ${keepEmoji}$1`);
    } else {
      cleaned = cleaned.trim() + ` ${keepEmoji}`;
    }
  }
  
  // 2. Garantir quebras duplas entre blocos (se não tiver)
  // Detecta padrões como "frase.\nOutra" e transforma em "frase.\n\nOutra"
  cleaned = cleaned.replace(/([.!?])\n(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g, '$1\n\n');
  
  // 3. Remover asteriscos redundantes (já temos negrito no WhatsApp)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // **texto** → texto
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');     // *texto* → texto
  
  // 4. Limpar espaços extras
  cleaned = cleaned.replace(/ +/g, ' ');  // múltiplos espaços → 1 espaço
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');  // 3+ quebras → 2 quebras
  
  return cleaned.trim();
}

// ============= NATURAL LANGUAGE HELPER FUNCTIONS =============

/**
 * Biblioteca de respostas naturais para evitar repetição
 */
const naturalResponses = {
  greeting: [
    "Oi! Que bom te ver por aqui!",
    "E aí! Tudo bem? Seja bem-vindo(a)!",
    "Olá! Prazer em te atender!",
    "Opa! Bem-vindo(a)!"
  ],
  askName: [
    "Pra gente começar, qual seu nome?",
    "Me conta, como você se chama?",
    "Qual seu nome?",
    "Pode me dizer seu nome, por favor?"
  ],
  confirmation: [
    "Perfeito!",
    "Ótimo!",
    "Maravilha!",
    "Entendido!",
    "Beleza!",
    "Show!",
    "Combinado!"
  ],
  thanks: [
    "Obrigado!",
    "Valeu!",
    "Muito obrigado pela preferência!",
    "Obrigado pelo seu pedido!"
  ],
  goodbye: [
    "Até logo!",
    "Até mais! Volte sempre!",
    "Tchau! Foi um prazer te atender!",
    "Até breve!"
  ]
};

/**
 * Retorna resposta aleatória de uma categoria
 */
function getRandomResponse(category: keyof typeof naturalResponses): string {
  const responses = naturalResponses[category];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Divide mensagem longa em chunks naturais (como humano digitaria)
 * @param message - Mensagem completa
 * @param maxChars - Tamanho máximo por chunk (padrão: 240)
 * @returns Array de chunks preservando contexto
 */
function splitMessageNaturally(message: string, maxChars: number = 240): string[] {
  if (message.length <= maxChars) {
    return [message];
  }

  const chunks: string[] = [];
  let remaining = message;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining.trim());
      break;
    }

    let splitIndex = maxChars;
    
    // 1. PRIORIDADE: Quebrar em parágrafos (\n\n)
    const paragraphIndex = remaining.lastIndexOf('\n\n', maxChars);
    if (paragraphIndex > maxChars * 0.5) {
      splitIndex = paragraphIndex + 2;
    }
    
    // 2. SECUNDÁRIA: Quebrar no fim de frase (.!?)
    else {
      const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
      let bestIndex = -1;
      
      for (const ending of sentenceEndings) {
        const idx = remaining.lastIndexOf(ending, maxChars);
        if (idx > bestIndex && idx > maxChars * 0.4) {
          bestIndex = idx + ending.length;
        }
      }
      
      if (bestIndex > -1) {
        splitIndex = bestIndex;
      }
      
      // 3. TERCIÁRIA: Quebrar em vírgula ou ponto-e-vírgula
      else {
        const punctuation = [', ', '; ', ',\n', ';\n'];
        bestIndex = -1;
        
        for (const punct of punctuation) {
          const idx = remaining.lastIndexOf(punct, maxChars);
          if (idx > bestIndex && idx > maxChars * 0.3) {
            bestIndex = idx + punct.length;
          }
        }
        
        if (bestIndex > -1) {
          splitIndex = bestIndex;
        }
        
        // 4. ÚLTIMA OPÇÃO: Quebrar em espaço
        else {
          const spaceIndex = remaining.lastIndexOf(' ', maxChars);
          if (spaceIndex > maxChars * 0.3) {
            splitIndex = spaceIndex + 1;
          } else {
            splitIndex = maxChars;
          }
        }
      }
    }

    // Extrair chunk e atualizar remaining
    const chunk = remaining.substring(0, splitIndex).trim();
    
    // PROTEÇÃO: Nunca quebrar no meio de URLs
    if (chunk.includes('http://') || chunk.includes('https://')) {
      const urlStart = chunk.lastIndexOf('http');
      if (urlStart > maxChars * 0.3) {
        splitIndex = urlStart;
      }
    }
    
    chunks.push(chunk);
    remaining = remaining.substring(splitIndex).trim();
  }

  return chunks;
}

/**
 * Envia chunks de mensagem com delays simulando digitação humana
 */
async function sendMessageChunks(
  chunks: string[],
  evolutionApiUrl: string,
  instanceId: string,
  customerPhone: string,
  apiKey: string
): Promise<void> {
  console.log(`[SEND_CHUNKS] Enviando ${chunks.length} mensagens`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkNumber = i + 1;
    
    // Calcular delay baseado no tamanho da mensagem
    // Simula velocidade de digitação: ~35ms por caractere
    const typingDelay = Math.min(
      Math.max(chunk.length * 35, 500),
      3000
    );
    
    console.log(`[SEND_CHUNKS] Chunk ${chunkNumber}/${chunks.length}: ${chunk.length} chars, delay: ${typingDelay}ms`);
    
    try {
      const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number: customerPhone,
          text: chunk
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SEND_CHUNKS] ❌ Erro ao enviar chunk ${chunkNumber}:`, errorText);
      } else {
        console.log(`[SEND_CHUNKS] ✅ Chunk ${chunkNumber} enviado com sucesso`);
      }

      // Aguardar antes de enviar próximo chunk (exceto no último)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, typingDelay));
      }
      
    } catch (error) {
      console.error(`[SEND_CHUNKS] ❌ Erro fatal no chunk ${chunkNumber}:`, error);
    }
  }
  
  console.log(`[SEND_CHUNKS] ✅ Todos os ${chunks.length} chunks foram processados`);
}

/**
 * Extrai dados estruturados de mensagem de pedido do site
 */
function parseWebOrder(message: string): any | null {
  try {
    const lines = message.split('\n');
    
    const nameLine = lines.find(l => l.includes('👤 *Cliente:*'));
    const customerName = nameLine?.split(':')[1]?.trim().replace(/\*/g, '') || '';
    
    const phoneLine = lines.find(l => l.includes('📱 *Telefone:*'));
    const customerPhone = phoneLine?.split(':')[1]?.trim().replace(/\*/g, '') || '';
    
    const addressLine = lines.find(l => l.includes('📍 *Endereço:*'));
    const deliveryAddress = addressLine?.split(':')[1]?.trim().replace(/\*/g, '') || '';
    
    const items: any[] = [];
    let inItemsSection = false;
    
    for (const line of lines) {
      if (line.includes('📋 *ITENS DO PEDIDO:*') || line.includes('📦 *ITENS DO PEDIDO:*')) {
        inItemsSection = true;
        continue;
      }
      if (line.includes('━━━━━━━━━━━━━━━━') || line.includes('💰 *TOTAL')) {
        inItemsSection = false;
      }
      
      if (inItemsSection && /^\d+\./.test(line.trim())) {
        const match = line.match(/(\d+)x\s+(.+)/);
        if (match) {
          items.push({
            quantity: parseInt(match[1]),
            name: match[2].trim()
          });
        }
      }
    }
    
    const totalLine = lines.find(l => l.includes('💰 *TOTAL:') || l.includes('💰 *Total:'));
    const total = totalLine?.match(/R\$\s*([\d,\.]+)/)?.[1] || '0';
    
    return {
      customerName,
      customerPhone,
      deliveryAddress,
      items,
      total,
      source: 'website'
    };
    
  } catch (error) {
    console.error('[PARSE_WEB_ORDER] ❌ Erro ao parsear pedido:', error);
    return null;
  }
}

// ============= METADATA HELPER FUNCTION =============

async function updateChatMetadata(
  supabase: any,
  chatId: number,
  updates: Record<string, any>
) {
  const { data: currentChat } = await supabase
    .from('chats')
    .select('metadata')
    .eq('id', chatId)
    .single();
  
  const updatedMetadata = {
    ...(currentChat?.metadata || {}),
    ...updates
  };
  
  await supabase
    .from('chats')
    .update({ metadata: updatedMetadata })
    .eq('id', chatId);
  
  console.log('[METADATA] Updated:', JSON.stringify(updates, null, 2));
  
  return updatedMetadata;
}

// ============= SESSION MANAGEMENT =============

/**
 * Verifica se precisa criar uma nova sessão de pedido
 */
async function checkIfNeedNewSession(
  supabase: any,
  chat: any,
  messageContent: string,
  requestId: string
): Promise<boolean> {
  // 1. Se não tem session_id, precisa criar
  if (!chat.session_id) {
    console.log(`[${requestId}] 🆕 Chat sem session_id - criando primeira sessão`);
    return true;
  }
  
  // 2. Se sessão anterior está completada, precisa salvar resumo e criar nova
  if (chat.session_status === 'completed') {
    console.log(`[${requestId}] 🆕 Sessão anterior completada - salvando resumo e criando nova`);
    
    // ETAPA 3: Salvar resumo da sessão anterior antes de criar nova
    await saveSessionSummary(supabase, chat, requestId);
    
    return true;
  }
  
  // 3. Detectar keywords de "novo pedido"
  const newOrderKeywords = [
    /\bnovo pedido\b/i,
    /\brecome çar\b/i,
    /\bcomeçar de novo\b/i,
    /\bquero fazer outro pedido\b/i,
    /\bfazer mais um pedido\b/i,
    /\bpedir de novo\b/i,
    /\boutro pedido\b/i
  ];
  
  const hasNewOrderKeyword = newOrderKeywords.some(regex => regex.test(messageContent));
  
  if (hasNewOrderKeyword) {
    console.log(`[${requestId}] 🆕 Detectada keyword de novo pedido - salvando resumo`);
    await saveSessionSummary(supabase, chat, requestId);
    return true;
  }
  
  // 4. Verificar gap de tempo (> 6 horas desde última mensagem)
  if (chat.last_message_at) {
    const lastMessageTime = new Date(chat.last_message_at).getTime();
    const currentTime = Date.now();
    const hoursSinceLastMessage = (currentTime - lastMessageTime) / (1000 * 60 * 60);
    
    if (hoursSinceLastMessage > 12) {
      console.log(`[${requestId}] 🆕 Gap de ${hoursSinceLastMessage.toFixed(1)}h detectado (>12h) - salvando resumo e criando nova sessão`);
      await saveSessionSummary(supabase, chat, requestId);
      return true;
    }
  }
  
  // Manter sessão atual
  return false;
}

/**
 * ETAPA 4: Salva resumo compacto da sessão atual antes de criar nova
 */
async function saveSessionSummary(
  supabase: any,
  chat: any,
  requestId: string
): Promise<void> {
  try {
    const metadata = chat.metadata || {};
    const orderItems = metadata.order_items || [];
    const orderTotal = metadata.order_total || 0;
    
    // Se não há dados significativos, não salvar resumo
    if (orderItems.length === 0 && !metadata.delivery_type && !metadata.payment_method) {
      console.log(`[${requestId}] ℹ️ Sessão sem dados significativos - pulando resumo`);
      return;
    }
    
    // Gerar resumo compacto (~50 tokens)
    let summary = '';
    
    if (orderItems.length > 0) {
      const itemNames = orderItems.map((item: any) => 
        `${item.quantity}x ${item.name}`
      ).join(', ');
      summary += `Pedido: ${itemNames}. `;
    }
    
    if (metadata.delivery_type) {
      summary += `${metadata.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}. `;
    }
    
    if (metadata.payment_method) {
      summary += `Pgto: ${metadata.payment_method}. `;
    }
    
    if (metadata.address) {
      summary += `End: ${metadata.address.substring(0, 30)}... `;
    }
    
    const sessionStatus = chat.session_status || 'incomplete';
    summary += `Status: ${sessionStatus}.`;
    
    // Salvar resumo na tabela
    const { error } = await supabase
      .from('session_summaries')
      .insert({
        chat_id: chat.id,
        session_id: chat.session_id,
        summary: summary.trim(),
        order_total: orderTotal,
        items_ordered: orderItems,
        delivery_type: metadata.delivery_type || null,
        payment_method: metadata.payment_method || null,
        customer_preferences: {
          customer_name: metadata.customer_name || null,
          phone: chat.phone || null
        }
      });
    
    if (error) {
      console.error(`[${requestId}] ❌ Erro ao salvar resumo da sessão:`, error);
    } else {
      console.log(`[${requestId}] ✅ Resumo da sessão salvo: ${summary.substring(0, 100)}`);
    }
  } catch (error) {
    console.error(`[${requestId}] ❌ Erro ao salvar resumo da sessão:`, error);
  }
}

/**
 * ETAPA 4: Carrega resumos das últimas 5 sessões
 */
async function loadSessionSummaries(
  supabase: any,
  chatId: number,
  requestId: string
): Promise<string> {
  try {
    const { data: summaries, error } = await supabase
      .from('session_summaries')
      .select('summary, order_total, items_ordered, completed_at')
      .eq('chat_id', chatId)
      .order('completed_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error(`[${requestId}] ❌ Erro ao carregar resumos:`, error);
      return '';
    }
    
    if (!summaries || summaries.length === 0) {
      console.log(`[${requestId}] ℹ️ Nenhum resumo de sessão anterior encontrado`);
      return '';
    }
    
    console.log(`[${requestId}] 📚 Carregados ${summaries.length} resumos de sessões anteriores`);
    
    // Formatar resumos para contexto
    const formattedSummaries = summaries.map((s: any, idx: number) => {
      const daysAgo = Math.floor((Date.now() - new Date(s.completed_at).getTime()) / (1000 * 60 * 60 * 24));
      return `[Sessão ${idx + 1} - ${daysAgo}d atrás] ${s.summary}`;
    }).join('\n');
    
    return `\n=== HISTÓRICO DE PEDIDOS ANTERIORES ===\n${formattedSummaries}\n=== FIM DO HISTÓRICO ===\n`;
  } catch (error) {
    console.error(`[${requestId}] ❌ Erro ao carregar resumos:`, error);
    return '';
  }
}


// ============= DEBOUNCE SYSTEM =============

/**
 * Processa mensagens agrupadas após período de debounce
 */
async function processMessagesAfterDebounce(
  supabase: any,
  chatId: number,
  customerPhone: string,
  agentId: number,
  originalRequestId: string
) {
  const debounceRequestId = `${originalRequestId}-db`;
  
  console.log(`[${debounceRequestId}] ⏱️ Iniciando debounce de ${DEBOUNCE_DELAY_MS}ms para chat ${chatId}`);
  
  // Aguardar período de debounce
  await new Promise(resolve => setTimeout(resolve, DEBOUNCE_DELAY_MS));
  
  console.log(`[${debounceRequestId}] ⏰ Debounce completo - verificando mensagens pendentes`);
  
  // Buscar estado atual do chat
  const { data: currentChat } = await supabase
    .from('chats')
    .select('metadata, ai_enabled, status')
    .eq('id', chatId)
    .single();
  
  if (!currentChat) {
    console.error(`[${debounceRequestId}] ❌ Chat não encontrado`);
    return;
  }
  
  const metadata = currentChat.metadata || {};
  const pendingMessages = metadata.pending_messages || [];
  
  if (pendingMessages.length === 0) {
    console.log(`[${debounceRequestId}] ℹ️ Nenhuma mensagem pendente`);
    return;
  }
  
  // Verificar se chegaram mensagens recentemente (reset de timer)
  const lastMessageTime = new Date(metadata.last_message_timestamp).getTime();
  const timeSinceLastMessage = Date.now() - lastMessageTime;
  
  if (timeSinceLastMessage < DEBOUNCE_DELAY_MS - 500) {
    console.log(`[${debounceRequestId}] 🔄 Mensagens recentes detectadas (${timeSinceLastMessage}ms) - reiniciando timer`);
    
    // Nova mensagem chegou - reiniciar debounce
    EdgeRuntime.waitUntil(
      processMessagesAfterDebounce(supabase, chatId, customerPhone, agentId, originalRequestId)
    );
    return;
  }
  
  // Processar mensagens agrupadas
  console.log(`[${debounceRequestId}] ✅ Processando ${pendingMessages.length} mensagens agrupadas`);
  
  // Agrupar conteúdo
  const groupedMessage = pendingMessages
    .map((msg: any) => msg.content)
    .join('\n');
  
  console.log(`[${debounceRequestId}] 📝 Mensagem agrupada (${groupedMessage.length} chars):\n${groupedMessage.substring(0, 200)}...`);
  
  // Limpar pending_messages
  await supabase
    .from('chats')
    .update({
      metadata: {
        ...metadata,
        pending_messages: [],
        debounce_timer_active: false,
        last_processed_at: new Date().toISOString()
      }
    })
    .eq('id', chatId);
  
  // Buscar dados do agente para processar
  const { data: agent } = await supabase
    .from('agents')
    .select(`
      *,
      restaurants (
        id,
        name,
        slug,
        description,
        address,
        phone,
        whatsapp
      )
    `)
    .eq('id', agentId)
    .single();
  
  if (!agent) {
    console.error(`[${debounceRequestId}] ❌ Agente não encontrado`);
    return;
  }
  
  // Processar com a IA
  try {
    await processAIResponse(
      supabase,
      agent,
      chatId,
      groupedMessage,
      customerPhone,
      debounceRequestId
    );
    
    console.log(`[${debounceRequestId}] ✅ Mensagens processadas com sucesso`);
  } catch (error) {
    console.error(`[${debounceRequestId}] ❌ Erro ao processar mensagens:`, error);
  }
}

/**
 * Processa resposta da IA para uma mensagem (ou mensagens agrupadas)
 * Esta função contém toda a lógica de chamada OpenAI e envio de resposta
 */
async function processAIResponse(
  supabase: any,
  agent: any,
  chatId: number,
  messageContent: string,
  customerPhone: string,
  requestId: string
) {
  console.log(`[${requestId}] 🤖 Processando mensagem com IA`);
  
  // Initialize debug log
  const processingStart = Date.now();
  const debugLog: any = {
    chat_id: chatId,
    request_id: requestId,
    user_messages: [{ content: messageContent }]
  };
  
  if (!openAIApiKey) {
    console.error(`[${requestId}] ❌ OpenAI API key não configurada`);
    return;
  }
  
  try {
    // Buscar dados do chat
    const { data: chat } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();
    
    if (!chat || !chat.ai_enabled) {
      console.log(`[${requestId}] ⚠️ IA não habilitada para este chat`);
      return;
    }
    
    // ========== SESSION MANAGEMENT ==========
    // Session já foi criado/validado ANTES de salvar mensagem do cliente
    let currentSessionId = chat.session_id;
    
    console.log(`[${requestId}] 📋 Usando session_id do chat: ${currentSessionId}`);
    
    if (!currentSessionId) {
      console.error(`[${requestId}] ❌ CRITICAL: session_id deveria existir mas está null!`);
      // Fallback de emergência
      const { data: newSessionData } = await supabase.rpc('generate_session_id');
      currentSessionId = newSessionData;
      
      await supabase
        .from('chats')
        .update({ session_id: currentSessionId, session_status: 'active' })
        .eq('id', chatId);
      
      console.log(`[${requestId}] ⚠️ Session_id criado como fallback: ${currentSessionId}`);
    }
    
    // Add session_id and metadata snapshot to debug log
    debugLog.session_id = currentSessionId;
    debugLog.current_state = chat.metadata?.conversation_state || 'STATE_1_GREETING';
    
    // ✅ Inicializar metadata_snapshot apenas com chat.metadata (api_structure virá depois)
    debugLog.metadata_snapshot = {
      ...chat.metadata
    };
    
    // ========== FIX #1: Save customer message FIRST with session_id ==========
    console.log(`[${requestId}] 💾 Saving customer message WITH session_id...`);
    
    const { data: customerMessage, error: customerMessageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: 'customer',  // ✅ FIX: 'customer' não 'user'
        content: messageContent,
        session_id: currentSessionId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (customerMessageError) {
      console.error(`[${requestId}] ❌ Error saving customer message:`, customerMessageError);
    } else {
      console.log(`[${requestId}] ✅ Customer message saved with session_id: ${currentSessionId}`);
      // ✅ FIX #5: Pequeno delay para garantir que o DB comitou
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // ========== FIX #3: Load history (now includes current message) ==========
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('sender_type, content, created_at')
      .eq('chat_id', chat.id)
      .eq('session_id', currentSessionId || `temp_${chat.id}`)
      .order('created_at', { ascending: true })
      .limit(30);
    
    const recentMessages = messageHistory || [];
    
    // Carregar resumos de sessões anteriores
    const sessionSummariesText = await loadSessionSummaries(supabase, chat.id, requestId);
    
    console.log(`[${requestId}] 📊 Context Info:`);
    console.log(`  - Current session_id: ${currentSessionId || 'NONE (using temp)'}`);
    console.log(`  - Messages in session: ${recentMessages.length}/30 (includes current message)`);
    console.log(`  - Session summaries: ${sessionSummariesText ? 'Loaded' : 'None'}`);
    console.log(`  - Session status: ${chat.session_status || 'N/A'}`);
    
    // Converter para formato OpenAI (histórico JÁ inclui mensagem atual)
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // ETAPA 5: Injetar resumos como "system message" no início do contexto
    if (sessionSummariesText) {
      conversationHistory.unshift({
        role: 'system',
        content: sessionSummariesText
      });
    }
    
    console.log(`[${requestId}] 📝 Total context: ${conversationHistory.length} mensagens`);
    
    
    // Buscar dados do restaurante via edge function
    console.log(`[${requestId}] 🏪 Fetching restaurant data for slug: ${agent.restaurants.slug}`);
    
    const restaurantDataResponse = await supabase.functions.invoke('enhanced-restaurant-data', {
      body: { slug: agent.restaurants.slug }
    });
    
    if (restaurantDataResponse.error) {
      console.error(`[${requestId}] ❌ Error fetching restaurant data:`, restaurantDataResponse.error);
      throw new Error('Failed to fetch restaurant data');
    }
    
    const restaurantData = restaurantDataResponse.data;
    
    // ========== FIX #4: Verify API structure & save to debug log ==========
    console.log(`[${requestId}] 🔍 DEBUG Restaurant Data Structure:`);
    
    const categories = restaurantData.menu?.categories || [];
    const productsFromCategories = categories.flatMap(cat => cat.products || []);
    const productsFlat = restaurantData.menu?.products || [];
    
    // ✅ DECLARAR products ANTES de usar no debug log
    const products = productsFlat.length > 0 ? productsFlat : productsFromCategories;
    
    // ✅ Adicionar API structure dentro de metadata_snapshot (APÓS ter categories e products)
    debugLog.metadata_snapshot = {
      ...debugLog.metadata_snapshot,
      api_structure: {
        categories_count: categories.length,
        categories_sample: categories.slice(0, 2).map(c => ({
          id: c.id,
          name: c.name,
          products_count: (c.products || []).length
        })),
        products_total: products.length,  // ✅ Agora products já existe!
        products_sample: products.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          category_id: p.category_id,
          price: p.price
        }))
      }
    };
    
    console.log(`[${requestId}] 📊 API structure adicionada ao debug log`);
    
    console.log(`[${requestId}]   - Categories: ${categories.length}`);
    console.log(`[${requestId}]   - Products from categories: ${productsFromCategories.length}`);
    console.log(`[${requestId}]   - Products flat: ${productsFlat.length}`);
    console.log(`[${requestId}]   - Using: ${products.length} products`);
    
    if (categories.length > 0) {
      console.log(`[${requestId}]   - Sample category:`, {
        id: categories[0].id,
        name: categories[0].name,
        hasProducts: !!categories[0].products,
        productsCount: categories[0].products?.length || 0
      });
    }
    
    if (products.length > 0) {
      console.log(`[${requestId}]   - Sample product:`, {
        id: products[0].id,
        name: products[0].name,
        category_id: products[0].category_id,
        category: products[0].category
      });
    }
    
        // ✅ FIX #4: Save API structure inside metadata_snapshot
        const apiStructure = {
          categories_count: categories.length,
          categories_sample: categories.slice(0, 2).map(c => ({
            id: c.id,
            name: c.name,
            products_in_category: (c.products || []).length
          })),
          products_from_categories: productsFromCategories.length,
          products_flat: productsFlat.length,
          products_final: products.length,
          products_sample: products.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            category_id: p.category_id,
            category: p.category,
            price: p.price
          }))
        };
        
        debugLog.metadata_snapshot = {
          ...chat.metadata,
          api_structure: apiStructure
        };
    
    console.log(`[${requestId}] ✅ Restaurant data fetched - ${categories.length} categories, ${products.length} products`);
    
    // ========== MULTI-INTENT ORCHESTRATION V2 ==========
    console.log(`[${requestId}] 🎯 Starting Multi-Intent Orchestration V2...`);
    
    // Step 1: Analyze conversation state
    const conversationState = analyzeConversationState(chat.metadata, messageHistory || []);
    console.log(`[${requestId}] 📊 Conversation State:`, conversationState);
    
    // Step 2: Classify MULTIPLE intents
    const detectedIntents = await classifyMultipleIntents(conversationHistory, conversationState, requestId);
    console.log(`[${requestId}] 🎯 Detected ${detectedIntents.length} intents:`, detectedIntents.map(i => i.type).join(', '));
    
    // Add detected intents to debug log
    debugLog.detected_intents = detectedIntents;
    
    // Step 3: Create execution plan
    const currentStateForPlan: ConversationState = (chat.metadata?.conversation_state as ConversationState) || 'STATE_2_DISCOVERY';
    
    const executionPlan = createExecutionPlan(
      detectedIntents,
      currentStateForPlan,
      chat.metadata,
      requestId
    );
    
    console.log(`[${requestId}] 📋 Execution Plan created: ${executionPlan.length} steps`);
    
    // Add execution plan to debug log
    debugLog.execution_plan = executionPlan;
    
    // Fetch delivery zones and payment methods (needed for checkout/logistics)
    const { data: deliveryZones } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('restaurant_id', agent.restaurants.id)
      .eq('is_active', true);
    
    const { data: paymentMethods } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('restaurant_id', agent.restaurants.id);
    
    // Prepare restaurant data for plan executor
    const restaurantDataForPlan = {
      restaurant: restaurantData.restaurant,
      categories,
      products,
      deliveryZones: deliveryZones || [],
      paymentMethods: paymentMethods || [],
      agent
    };
    
    // Step 4: Execute plan
    const executionResults = await executePlan(
      executionPlan,
      chatId,
      supabase,
      restaurantDataForPlan,
      conversationHistory,
      chat.metadata,
      currentStateForPlan,
      requestId
    );
    
    console.log(`[${requestId}] ✅ Plan execution completed: ${executionResults.length} results`);
    
    // Step 5: Combine responses
    const { combinedOutput, allToolResults } = combineResponses(executionResults, requestId);
    
    // Get final metadata from last execution result
    const finalMetadata = executionResults.length > 0 
      ? executionResults[executionResults.length - 1].updatedMetadata 
      : chat.metadata;
    
    // Create assistant message structure
    const assistantMessage = {
      content: combinedOutput,
      tool_calls: [] // Tool calls already executed
    };
    
    const toolResults = allToolResults;
    
    // ========== UNIFIED RESPONSE LOGGING ==========
    if (assistantMessage.content) {
      console.log(`[${requestId}] 💬 AI Content Preview: ${assistantMessage.content.substring(0, 100)}...`);
    }

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`[${requestId}] 🔧 Tool Calls:`, assistantMessage.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        args: tc.function.arguments
      })));
    }
    
    // ========== TOOLS ALREADY EXECUTED BY EXECUTION PLAN ==========
    // Tools executed in plan-executor.ts - results in allToolResults
    
    // Log tool results summary
    if (toolResults.length > 0) {
      console.log(`[${requestId}] 📊 Tool Results Summary:`, toolResults.length);
      toolResults.forEach((result: any, idx: number) => {
        console.log(`  ${idx + 1}. ${result.tool_name || 'unknown'}:`);
        console.log(`     Success: ${result.result?.success !== false ? '✅' : '❌'}`);
        if (result.result?.error) {
          console.log(`     Error: ${result.result.error}`);
        }
        if (result.result?.message) {
          console.log(`     Message: ${result.result.message}`);
        }
      });
    }
    
    // Add agents called and tools executed to debug log
    debugLog.agents_called = executionResults.map(r => ({
      agent: r.agent,
      action: r.step.action,
      input: r.context || r.step.parameters || {},
      output: r.output
    }));
    
    debugLog.tools_executed = allToolResults;
    debugLog.loaded_history = conversationHistory;
    debugLog.loaded_summaries = sessionSummariesText ? [{ summary: sessionSummariesText }] : [];
    
    // ========== GET FINAL AI MESSAGE ==========
    
    let aiMessage = assistantMessage.content || '';
    
    // ALWAYS use Conversation Agent when there are tool results OR content
    // Even if agent returned no content, tools results need to be humanized
    if (toolResults.length > 0 || (aiMessage && aiMessage.trim() !== '')) {
      console.log(`[${requestId}] 💬 Humanizing response (content: ${aiMessage.length} chars, tools: ${toolResults.length})...`);
      
      try {
        const humanizedMessage = await processConversationAgent(
          assistantMessage.content || '',
          toolResults,
          restaurantData.restaurant.name,
          messageHistory || [],
          currentStateForPlan,
          requestId
        );
        
        // Validate response before sending
        const validation = validateResponse(
          humanizedMessage,
          currentStateForPlan,
          toolResults,
          messageContent,
          chat.metadata
        );
        
        if (!validation.valid) {
          console.error(`[${requestId}] ❌ Response validation failed:`, validation.errors);
        }
        if (validation.warnings.length > 0) {
          console.warn(`[${requestId}] ⚠️ Response warnings:`, validation.warnings);
        }
        
        // Calculate completion criteria and next state (Smart State Machine V2)
        const completionCriteria = calculateCompletionCriteria(finalMetadata);
        console.log(`[${requestId}] 📊 Completion Criteria:`, completionCriteria);
        
        const nextState = getNextState(currentStateForPlan, completionCriteria, messageContent);
        
        // Update metadata with new state and completion data
        await supabase
          .from('chats')
          .update({ 
            metadata: {
              ...finalMetadata,
              conversation_state: nextState,
              last_state_change: new Date().toISOString(),
              completion_criteria: completionCriteria
            }
          })
          .eq('id', chatId);
        
        console.log(`[${requestId}] 🔄 State transition: ${currentStateForPlan} → ${nextState}`);
        
        // Add output to debug log
        debugLog.final_response = humanizedMessage;
        debugLog.new_state = nextState;
        debugLog.updated_metadata = {
          ...finalMetadata,
          conversation_state: nextState,
          last_state_change: new Date().toISOString(),
          completion_criteria: completionCriteria
        };
        
        console.log(`[${requestId}] ✅ Humanized message ready (${humanizedMessage.length} chars)`);
        aiMessage = humanizedMessage;
        
      } catch (error) {
        console.error(`[${requestId}] ❌ Humanization failed:`, error);
        console.log(`[${requestId}] ⚠️ Using fallback response`);
        // If humanization fails and we have tool results, at least show them
        if (toolResults.length > 0) {
          aiMessage = toolResults.map(r => r.result).join('\n');
        }
      }
    }
    
    // Fallback: if still no message after all attempts
    if (!aiMessage || aiMessage.trim() === '') {
      console.warn(`[${requestId}] ⚠️ No AI response generated, using natural fallback`);
      aiMessage = getRandomResponse('confirmation');
    }
    
    // ========== CLEAN AI RESPONSE ==========
    
    aiMessage = cleanAIResponse(aiMessage);
    
    console.log(`[${requestId}] 📝 Final AI message (${aiMessage.length} chars): ${aiMessage.substring(0, 100)}...`);
    
    // ========== SAVE TO DATABASE ==========
    
    // Salvar com session_id
    await supabase
      .from('messages')
      .insert({
        chat_id: chat.id,
        sender_type: 'agent',
        content: aiMessage,
        message_type: 'text',
        session_id: currentSessionId // Adicionar session_id
      });
    
    console.log(`[${requestId}] 💾 Message saved to database`);
    
    // ✅ ATUALIZAR CHAT METADATA E ESTADO
    console.log(`[${requestId}] 💾 Atualizando chat metadata...`);

    const updatedMetadata = {
      ...finalMetadata, // Metadata já atualizado pelos agentes
      hasGreeted: true, // Sempre true após primeira resposta
      conversation_state: newState,
      completion_criteria: {
        ...completionCriteria,
        hasGreeted: true
      },
      last_processed_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('chats')
      .update({
        metadata: updatedMetadata,
        conversation_state: newState,
        last_message_at: new Date().toISOString()
      })
      .eq('id', chat.id);

    if (updateError) {
      console.error(`[${requestId}] ❌ Erro ao atualizar metadata:`, updateError);
    } else {
      console.log(`[${requestId}] ✅ Metadata atualizado - hasGreeted: true, state: ${newState}`);
    }
    
    // ========== SEND VIA WHATSAPP ==========
    
    if (agent.evolution_api_token && agent.evolution_api_instance) {
      const chunks = splitMessageNaturally(aiMessage, 240);
      await sendMessageChunks(
        chunks,
        'https://evolution.fullbpo.com',
        agent.evolution_api_instance,
        customerPhone,
        agent.evolution_api_token
      );
      
      console.log(`[${requestId}] ✅ Message sent via WhatsApp (${chunks.length} chunks)`);
    } else {
      console.warn(`[${requestId}] ⚠️ Evolution API credentials missing - message not sent`);
    }
    
    // Calculate processing time and save debug log
    debugLog.processing_time_ms = Date.now() - processingStart;
    
    try {
      // ✅ Validar campos obrigatórios
      if (!debugLog.chat_id) {
        console.error(`[${requestId}] ❌ Missing chat_id for debug log`);
        throw new Error('Missing chat_id');
      }
      if (!debugLog.request_id) {
        console.error(`[${requestId}] ❌ Missing request_id for debug log`);
        throw new Error('Missing request_id');
      }

      console.log(`[${requestId}] 📊 Salvando debug log...`, {
        chat_id: debugLog.chat_id,
        session_id: debugLog.session_id,
        has_final_response: !!debugLog.final_response,
        final_response_length: debugLog.final_response?.length || 0,
        detected_intents_count: debugLog.detected_intents?.length || 0,
        agents_called_count: debugLog.agents_called?.length || 0
      });

      const { data: logData, error: logError } = await supabase
        .from('ai_processing_logs')
        .insert(debugLog)
        .select();

      if (logError) {
        console.error(`[${requestId}] ❌ Erro ao inserir debug log:`, {
          code: logError.code,
          message: logError.message,
          details: logError.details,
          hint: logError.hint
        });
        throw logError;
      }

      console.log(`[${requestId}] ✅ Debug log salvo com sucesso - ID: ${logData[0]?.id}`);
    } catch (error) {
      console.error(`[${requestId}] ❌ CRITICAL: Erro ao salvar debug log:`, {
        message: error.message,
        stack: error.stack,
        debugLog_keys: Object.keys(debugLog)
      });
      
      // Tentar salvar erro em fallback table para não perder
      try {
        await supabase.from('error_logs').insert({
          request_id: requestId,
          error_type: 'debug_log_save_failed',
          error_message: error.message,
          context: {
            chat_id: debugLog.chat_id,
            session_id: debugLog.session_id
          }
        });
      } catch (e) {
        console.error(`[${requestId}] ❌ Failed to save error log:`, e);
      }
    }
    
  } catch (error) {
    console.error(`[${requestId}] ❌ Erro no processamento da IA:`, error);
    throw error;
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  // VERSION CONFIRMATION LOG (v4.0)
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Enhanced AI Webhook v4.0 - Multi-Intent Architecture');
  console.log('📅 Deployed:', new Date().toISOString());
  console.log('🎯 Multi-Intent: Orchestrator V2 → Execution Planner → Multi-Agent');
  console.log('🧠 Smart State Machine: Non-linear transitions, skip logic');
  console.log('🔧 Logistics Handler: Metadata updates without GPT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[${requestId}] ============ NEW REQUEST ============`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] CORS preflight - responding with headers`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const debug = url.searchParams.get('debug');
      const token = url.searchParams.get('token');
      const challenge = url.searchParams.get('challenge');
      
      // Webhook verification (Evolution API)
      if (token && challenge) {
        console.log(`[${requestId}] ✅ Webhook verification successful`);
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      
      // ✅ DEBUG ENDPOINT
      if (debug === 'true') {
        console.log(`[${requestId}] 🔍 Debug endpoint called`);
        
        const { data: recentChats } = await supabase
          .from('chats')
          .select('id, phone, conversation_state, session_id, session_status, metadata, last_message_at, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        
        const { data: recentLogs } = await supabase
          .from('ai_processing_logs')
          .select('id, chat_id, request_id, final_response, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('id, chat_id, sender_type, content, session_id, created_at')
          .order('created_at', { ascending: false })
          .limit(15);
        
        const { count: totalLogs } = await supabase
          .from('ai_processing_logs')
          .select('*', { count: 'exact', head: true });
        
        const { count: activeSessions } = await supabase
          .from('chats')
          .select('*', { count: 'exact', head: true })
          .eq('session_status', 'active');
        
        return new Response(JSON.stringify({
          status: 'active',
          version: '5.0',
          timestamp: new Date().toISOString(),
          stats: {
            total_debug_logs: totalLogs,
            active_sessions: activeSessions
          },
          recent_chats: recentChats?.map(c => ({
            id: c.id,
            phone: c.phone,
            session_id: c.session_id,
            session_status: c.session_status,
            conversation_state: c.conversation_state,
            hasGreeted: c.metadata?.hasGreeted,
            last_message_at: c.last_message_at
          })),
          recent_logs: recentLogs?.map(l => ({
            id: l.id,
            chat_id: l.chat_id,
            request_id: l.request_id,
            response_preview: l.final_response?.substring(0, 100),
            created_at: l.created_at
          })),
          recent_messages: recentMessages?.map(m => ({
            id: m.id,
            chat_id: m.chat_id,
            sender: m.sender_type,
            session_id: m.session_id,
            content_preview: m.content?.substring(0, 50),
            created_at: m.created_at
          }))
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Health check padrão
      console.log(`[${requestId}] ℹ️ Health check request`);
      return new Response(JSON.stringify({ 
        status: 'Webhook is active',
        version: '5.0',
        timestamp: new Date().toISOString(),
        requestId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (req.method === 'POST') {
      const body = await req.json();
      console.log(`[${requestId}] ========== WEBHOOK PAYLOAD ==========`);
      console.log(`[${requestId}] Payload:`, JSON.stringify(body, null, 2));
      console.log(`[${requestId}] Payload keys:`, Object.keys(body));
      
      const { data, instance, key, event } = body;
      
      // Filter events - only process user messages
      console.log(`[${requestId}] 📌 Event type: ${event}`);
      
      if (event !== 'messages.upsert') {
        console.log(`[${requestId}] ⏭️ Ignoring event type: ${event}`);
        return new Response(JSON.stringify({ 
          status: 'ignored', 
          reason: 'not_user_message',
          event_type: event,
          requestId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log(`[${requestId}] ✅ Processing user message event`);
      
      // CRITICAL: Ignore messages sent by the bot itself to prevent infinite loops
      if (data?.key?.fromMe === true) {
        console.log(`[${requestId}] ⚠️ Ignoring message from bot (fromMe: true)`);
        return new Response(JSON.stringify({ status: 'ignored', reason: 'bot_message', requestId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (!data || !data.message) {
        console.warn(`[${requestId}] ⚠️ No message data found - ignoring webhook`);
        return new Response(JSON.stringify({ status: 'ignored', requestId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const message = data.message;
      const remoteJid = data.key.remoteJid;
      const customerPhone = remoteJid.replace('@s.whatsapp.net', '');
      
      console.log(`[${requestId}] 📱 Customer Phone: ${customerPhone}`);
      console.log(`[${requestId}] 📧 Instance: ${instance}`);
      
      // Find agent with enhanced AI configuration
      console.log(`[${requestId}] 🔍 Searching for agent - Phone: ${customerPhone}, Instance: ${instance}`);
      
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select(`
          *,
          restaurants (
            id,
            name,
            slug,
            description,
            address,
            phone,
            whatsapp
          )
        `)
        .eq('is_active', true)
        .eq('evolution_api_instance', instance)
        .single();
      
      console.log(`[${requestId}] Agent query result - Found: ${agent ? 'YES' : 'NO'}, Error: ${agentError?.message || 'none'}`);
      
      if (agentError || !agent) {
        console.error(`[${requestId}] ❌ No enhanced agent found - Phone: ${customerPhone}, Instance: ${instance}`);
        return new Response(JSON.stringify({ 
          status: 'no_agent',
          requestId,
          searchCriteria: { customerPhone, instance }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[${requestId}] ✅ Agent found - ID: ${agent.id}, Restaurant: ${agent.restaurants?.name}, Name: ${agent.name}`);

      // Validate restaurant_id exists
      if (!agent.restaurants || !agent.restaurants.id) {
        console.error(`[${requestId}] ❌ Agent ${agent.id} has no restaurant linked`);
        return new Response(JSON.stringify({ 
          error: 'Agent configuration error: no restaurant linked',
          requestId 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[${requestId}] ✅ Restaurant ID validated: ${agent.restaurants.id}`);

      // ============= SECURITY: CHECK BLOCKED NUMBERS =============
      
      const { data: blockedNumber } = await supabase
        .from('blocked_numbers')
        .select('*')
        .eq('phone', customerPhone)
        .maybeSingle();
      
      if (blockedNumber) {
        console.error(`[${requestId}] 🔒 Blocked number detected: ${customerPhone} - Reason: ${blockedNumber.reason}`);
        return new Response(JSON.stringify({ 
          status: 'blocked', 
          reason: blockedNumber.reason,
          requestId 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ENTREGA 1: Find or create conversation - REOPEN if ended
      console.log(`[${requestId}] 🔍 Looking for conversation - Phone: ${customerPhone}, Agent: ${agent.id}`);
      
      let { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('phone', customerPhone)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!chat) {
        console.log(`[${requestId}] 🆕 Creating new chat for restaurant: ${agent.restaurants.id}`);
        
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            agent_id: agent.id,
            restaurant_id: agent.restaurants.id,
            phone: customerPhone,
            status: 'active',
            app: 'whatsapp',
            ai_enabled: true
          })
          .select()
          .single();
        
        console.log(`[${requestId}] Chat insert payload:`, {
          agent_id: agent.id,
          restaurant_id: agent.restaurants.id,
          phone: customerPhone,
          status: 'active',
          app: 'whatsapp',
          ai_enabled: true
        });
        
        if (createError) {
          console.error(`[${requestId}] ❌ Error creating chat:`, createError);
          return new Response(JSON.stringify({ error: 'Failed to create chat', requestId }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        chat = newChat;
        console.log(`[${requestId}] ✅ Chat created - ID: ${chat.id}`);
      } else {
        console.log(`[${requestId}] ♻️ Using existing chat - ID: ${chat.id}, Status: ${chat.status}, AI: ${chat.ai_enabled}`);
        
        // ENTREGA 1: CRITICAL FIX - Reopen ended conversations
        if (chat.status === 'ended') {
          console.log(`[${requestId}] 🔄 Reopening ended conversation`);
          
          const { error: updateError } = await supabase
            .from('chats')
            .update({ 
              status: 'active',
              reopened_at: new Date().toISOString(),
              reopened_count: (chat.reopened_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', chat.id);
          
          if (updateError) {
            console.error(`[${requestId}] ❌ Error reopening chat:`, updateError);
          } else {
            chat.status = 'active';
            console.log(`[${requestId}] ✅ Chat reopened successfully (count: ${(chat.reopened_count || 0) + 1})`);
          }
        }
      }

      // FRENTE 1: Get chat history for full conversation context
      console.log(`[${requestId}] 📚 Fetching complete chat history`);
      
      const { data: messageHistory } = await supabase
        .from('messages')
        .select('sender_type, content, created_at')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(15);

      console.log(`[${requestId}] Found ${messageHistory?.length || 0} previous messages`);

      // ============= SECURITY LAYER 4: RATE LIMITING =============
      
      const RATE_LIMIT_WINDOW = 60; // 1 minute
      const RATE_LIMIT_MAX = 10; // 10 messages per minute
      
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('created_at')
        .eq('chat_id', chat.id)
        .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString());
      
      if (recentMessages && recentMessages.length >= RATE_LIMIT_MAX) {
        console.warn(`[${requestId}] ⚠️ RATE LIMIT EXCEEDED for ${customerPhone}`);
        
        // Send warning message
        if (agent.evolution_api_token) {
          await fetch(`https://evolution.fullbpo.com/message/sendText/${agent.evolution_api_instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': agent.evolution_api_token
            },
            body: JSON.stringify({
              number: customerPhone,
              text: 'Por favor, aguarde um momento. Você está enviando mensagens muito rapidamente. ⏱️'
            })
          });
        }
        
        return new Response(JSON.stringify({ 
          status: 'rate_limited', 
          requestId,
          retry_after: RATE_LIMIT_WINDOW 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`[${requestId}] ✓ Rate limit check passed (${recentMessages?.length || 0}/${RATE_LIMIT_MAX})`);

      // Save incoming message - Apply sanitization
      const rawMessageContent = message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || '';
      const messageContent = sanitizeInput(rawMessageContent);
      
      console.log(`[${requestId}] 📝 Sanitized message: ${messageContent.substring(0, 100)}...`);
      
      // ============= SESSION MANAGEMENT (AFTER messageContent) =============
      // ✅ CRIAR/VALIDAR SESSION_ID **ANTES** DE SALVAR MENSAGEM DO CLIENTE
      
      console.log(`[${requestId}] 🔄 Verificando session_id do chat...`);
      
      // Verificar se precisa criar nova sessão
      const shouldCreateNewSession = await checkIfNeedNewSession(
        supabase,
        chat,
        messageContent,
        requestId
      );
      
      let currentSessionId = chat.session_id;
      
      if (shouldCreateNewSession) {
        console.log(`[${requestId}] 🆕 Criando nova sessão de pedido`);
        
        // Finalizar sessão anterior se existir
        if (chat.session_id) {
          await supabase
            .from('chats')
            .update({ session_status: 'completed' })
            .eq('id', chat.id)
            .eq('session_id', chat.session_id);
        }
        
        // Gerar novo session_id
        const { data: newSessionData } = await supabase.rpc('generate_session_id');
        currentSessionId = newSessionData;
        
        // Inicializar metadata para nova sessão
        const initialMetadata = {
          customer_name: chat.metadata?.customer_name || null,
          hasGreeted: false,
          conversation_state: 'STATE_1_GREETING',
          order_items: [],
          order_total: 0,
          completion_criteria: {
            hasGreeted: false,
            hasProducts: false,
            hasAddress: false,
            hasDeliveryType: false,
            hasPaymentMethod: false,
            allRequirementsMet: false
          }
        };
        
        // Atualizar chat com nova sessão
        await supabase
          .from('chats')
          .update({
            session_id: currentSessionId,
            session_status: 'active',
            session_created_at: new Date().toISOString(),
            metadata: initialMetadata,
            conversation_state: 'STATE_1_GREETING'
          })
          .eq('id', chat.id);
        
        // Atualizar objeto chat local
        chat.session_id = currentSessionId;
        chat.metadata = initialMetadata;
        
        console.log(`[${requestId}] ✅ Nova sessão criada: ${currentSessionId}`);
        
      } else if (!currentSessionId) {
        // ✅ PRIMEIRA MENSAGEM EVER - Criar sessão inicial
        console.log(`[${requestId}] 🆕 Primeira mensagem do contato - criando session_id inicial`);
        
        const { data: newSessionData } = await supabase.rpc('generate_session_id');
        currentSessionId = newSessionData;
        
        // Inicializar metadata
        const initialMetadata = {
          customer_name: chat.metadata?.customer_name || null,
          hasGreeted: false,
          conversation_state: 'STATE_1_GREETING',
          order_items: [],
          order_total: 0,
          completion_criteria: {
            hasGreeted: false,
            hasProducts: false,
            hasAddress: false,
            hasDeliveryType: false,
            hasPaymentMethod: false,
            allRequirementsMet: false
          }
        };
        
        await supabase
          .from('chats')
          .update({
            session_id: currentSessionId,
            session_status: 'active',
            session_created_at: new Date().toISOString(),
            metadata: initialMetadata,
            conversation_state: 'STATE_1_GREETING'
          })
          .eq('id', chat.id);
        
        // Atualizar objeto chat local
        chat.session_id = currentSessionId;
        chat.metadata = initialMetadata;
        
        console.log(`[${requestId}] ✅ Primeira sessão criada: ${currentSessionId}`);
      } else {
        console.log(`[${requestId}] ✅ Usando session_id existente: ${currentSessionId}`);
      }
      
      console.log(`[${requestId}] 📋 Session_id confirmado: ${currentSessionId} (status: ${chat.session_status || 'active'})`);
      
      // ============= SECURITY LAYER 6: DETECT SUSPICIOUS INPUT =============
      
      const suspiciousPatterns = detectSuspiciousInput(messageContent);
      
      if (suspiciousPatterns.length > 0) {
        console.warn(`[${requestId}] 🚨 SUSPICIOUS INPUT DETECTED:`, suspiciousPatterns);
        
        // Log to security_alerts table
        await supabase.from('security_alerts').insert({
          agent_id: agent.id,
          phone: customerPhone,
          alert_type: 'suspicious_input',
          patterns_detected: suspiciousPatterns,
          message_content: messageContent.substring(0, 500),
          request_id: requestId
        });
        
        // Check for auto-block after 3 suspicious attempts in 24h
        const { data: alertCount } = await supabase
          .from('security_alerts')
          .select('id')
          .eq('phone', customerPhone)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (alertCount && alertCount.length >= 3) {
          console.error(`[${requestId}] 🔒 AUTO-BLOCKING ${customerPhone} after ${alertCount.length} suspicious attempts`);
          
          await supabase.from('blocked_numbers').insert({
            phone: customerPhone,
            reason: 'automated_security_block',
            alert_count: alertCount.length
          });
          
          return new Response(JSON.stringify({ 
            status: 'blocked', 
            reason: 'security_violation' 
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      // DETECÇÃO AUTOMÁTICA: Pedido vindo do site
      if (messageContent.includes('🌐 *PEDIDO DO SITE*') || messageContent.includes('🛍️ *Novo Pedido*')) {
        console.log(`[${requestId}] 🌐 Pedido do site detectado!`);
        
        const orderData = parseWebOrder(messageContent);
        
        if (orderData) {
          await updateChatMetadata(supabase, chat.id, {
            web_order: orderData,
            order_source: 'website',
            awaiting_confirmation: true,
            customer_name: orderData.customerName
          });
          
          await supabase
            .from('chats')
            .update({ conversation_state: 'summary' })
            .eq('id', chat.id);
          
          console.log(`[${requestId}] ✅ Pedido salvo no metadata. Estado: summary`);
        }
      }

      console.log(`[${requestId}] 💬 Customer message: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"`);
      
      // ============= DEBOUNCE: Adicionar mensagem ao buffer =============
      
      console.log(`[${requestId}] 📦 Adicionando mensagem ao buffer de debounce`);
      
      const currentMetadata = chat.metadata || {};
      const pendingMessages = currentMetadata.pending_messages || [];
      
      // Adicionar nova mensagem ao buffer
      pendingMessages.push({
        content: messageContent,
        timestamp: new Date().toISOString(),
        whatsapp_id: data.key.id
      });
      
      // Limitar buffer (segurança)
      if (pendingMessages.length > MAX_PENDING_MESSAGES) {
        console.warn(`[${requestId}] ⚠️ Buffer excedeu limite (${MAX_PENDING_MESSAGES}), removendo mensagens antigas`);
        pendingMessages.splice(0, pendingMessages.length - MAX_PENDING_MESSAGES);
      }
      
      // Salvar mensagem no banco de dados (para histórico) COM session_id
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender_type: 'customer',
          content: messageContent,
          message_type: 'text',
          whatsapp_message_id: data.key.id,
          session_id: currentSessionId  // ✅ AGORA SIM!
        });
      
      if (msgError) {
        console.error(`[${requestId}] ❌ Error saving message:`, msgError);
      } else {
        console.log(`[${requestId}] 💾 Mensagem do cliente salva com session_id: ${currentSessionId}`);
      }
      
      // Atualizar metadata com buffer
      await supabase
        .from('chats')
        .update({
          metadata: {
            ...currentMetadata,
            pending_messages: pendingMessages,
            last_message_timestamp: new Date().toISOString(),
            debounce_timer_active: true
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', chat.id);
      
      console.log(`[${requestId}] 📦 Buffer atualizado: ${pendingMessages.length} mensagens pendentes`);
      
      // FASE 2: Detecção inteligente de nome após saudação
      if (chat.conversation_state === 'greeting' && !chat.metadata?.customer_name) {
        const trimmedMessage = messageContent.trim();
        
        const notNameKeywords = [
          'oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite',
          'menu', 'cardápio', 'cardapio', 'quero', 'queria', 'gostaria',
          'sim', 'não', 'nao', 'ok', 'tudo bem', 'beleza'
        ];
        
        const isNotName = notNameKeywords.some(keyword => 
          trimmedMessage.toLowerCase() === keyword || 
          trimmedMessage.toLowerCase().startsWith(keyword + ' ')
        );
        
        const isValidName = !isNotName && 
                           trimmedMessage.length >= 2 &&
                           !/^\d+$/.test(trimmedMessage) &&
                           /^[a-zA-ZÀ-ÿ\s]{2,}$/.test(trimmedMessage);
        
        if (isValidName) {
          console.log(`[${requestId}] ✅ Nome detectado: "${trimmedMessage}"`);
          
          await updateChatMetadata(supabase, chat.id, {
            customer_name: trimmedMessage,
            name_collected_at: new Date().toISOString()
          });
          
          await supabase
            .from('chats')
            .update({ conversation_state: 'discovery' })
            .eq('id', chat.id);
          
          console.log(`[${requestId}] Estado alterado: greeting → discovery`);
        } else {
          console.log(`[${requestId}] ⚠️ Resposta não parece ser um nome: "${trimmedMessage}"`);
        }
      }
      
      // ============= DEBOUNCE: Iniciar background task =============
      
      console.log(`[${requestId}] ⏱️ Iniciando timer de debounce (${DEBOUNCE_DELAY_MS}ms)`);
      
      // Verificar se AI está habilitada antes de iniciar debounce
      if (openAIApiKey && chat.ai_enabled && (chat.status === 'active' || chat.status === 'human_handoff')) {
        // Iniciar background task de debounce
        EdgeRuntime.waitUntil(
          processMessagesAfterDebounce(
            supabase,
            chat.id,
            customerPhone,
            agent.id,
            requestId
          )
        );
        
        console.log(`[${requestId}] ✅ Background task de debounce iniciado`);
      } else {
        console.warn(`[${requestId}] ⚠️ AI response skipped - OpenAI Key: ${!!openAIApiKey}, AI Enabled: ${chat.ai_enabled}, Status: ${chat.status}`);
        if (!chat.ai_enabled) {
          console.log(`[${requestId}] 👤 Human mode active - message saved but no AI response generated`);
        }
      }
      
      console.log(`[${requestId}] ============ REQUEST COMPLETE ============`);
      
      return new Response(JSON.stringify({ 
        status: 'message_queued',
        debounce_active: true,
        pending_messages: pendingMessages.length,
        will_process_after_ms: DEBOUNCE_DELAY_MS,
        enhanced: true,
        requestId,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[${requestId}] ❌ Method not allowed: ${req.method}`);
    
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      requestId 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
    
  } catch (error) {
    console.error(`❌ Error in enhanced AI webhook function:`, error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
