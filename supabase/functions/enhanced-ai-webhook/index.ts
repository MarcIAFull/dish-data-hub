// Enhanced AI Webhook - V2.0 Humanized Service System - Force Deploy 2025-11-11
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { executeCreateOrder, executeCheckAvailability, executeCheckOrderPrerequisites } from './tools.ts';
import { executeCheckOrderStatus, executeNotifyStatusChange, executeTransferToHuman } from './order-tools.ts';
import { executeValidateAddress } from './address-tools.ts';
import { executeListPaymentMethods } from './payment-tools.ts';
import { executeListProductModifiers } from './modifier-tools.ts';
import { executeAddItemToOrder } from './cart-tools.ts';

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
    
    // Buscar histórico de mensagens
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('sender_type, content, created_at')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: false })
      .limit(15);
    
    console.log(`[${requestId}] Found ${messageHistory?.length || 0} previous messages`);
    
    // Buscar dados do restaurante
    console.log(`[${requestId}] 🏪 Fetching restaurant data for slug: ${agent.restaurants.slug}`);
    
    const trainingResponse = await fetch(`${supabaseUrl}/functions/v1/enhanced-restaurant-data/${agent.restaurants.slug}`);
    
    if (!trainingResponse.ok) {
      console.error(`[${requestId}] ❌ Failed to fetch restaurant data: ${trainingResponse.status}`);
      throw new Error(`Failed to fetch restaurant data: ${trainingResponse.status}`);
    }

    const restaurantData = await trainingResponse.json();
    
    if (!restaurantData.menu || !restaurantData.menu.categories) {
      console.error(`[${requestId}] ❌ Invalid restaurant data structure`);
      throw new Error('Invalid restaurant data structure');
    }
    
    console.log(`[${requestId}] ✅ Restaurant data fetched - ${restaurantData.menu.categories.length} categories`);
    
    // ========== BUILD SYSTEM PROMPT ==========
    
    const menuText = restaurantData.menu.categories.map((cat: any) => 
      `${cat.name}:\n${cat.products.map((p: any) => 
        `- ${p.name} (R$ ${p.price.toFixed(2)})${p.description ? ': ' + p.description : ''}`
      ).join('\n')}`
    ).join('\n\n');

    // Build rich context information
    const popularProductsText = restaurantData.analytics?.popular_products?.length > 0
      ? `\n=== PRODUTOS MAIS VENDIDOS (use para sugestões!) ===\n${
          restaurantData.analytics.popular_products.slice(0, 3).map((p: any) => 
            `- ${p.name} ${p.price ? `(R$ ${parseFloat(p.price).toFixed(2)})` : ''} - ${p.total_ordered} pedidos`
          ).join('\n')
        }\n`
      : '';
    
    const restaurantDescription = restaurantData.restaurant?.description 
      ? `\n=== SOBRE O RESTAURANTE ===\n${restaurantData.restaurant.description}\n`
      : '';
    
    const activityLevel = restaurantData.ai_context?.restaurant_activity_level || 'medium';
    const activityContext = activityLevel === 'high'
      ? `CONTEXTO: Somos um restaurante popular com alto volume de pedidos. Seja eficiente mas caloroso.`
      : `CONTEXTO: Valorizamos cada cliente. Seja atencioso e detalhado no atendimento.`;
    
    const instagramInfo = restaurantData.restaurant?.instagram 
      ? `\nInstagram: @${restaurantData.restaurant.instagram.replace('@', '')}`
      : '';

    const systemPrompt = `Você é o atendente virtual do restaurante ${restaurantData.restaurant.name}.
${restaurantDescription}
IMPORTANTE: Use NO MÁXIMO 1 emoji por conversa INTEIRA. Seja profissional e objetivo.
${activityContext}${instagramInfo}
${popularProductsText}
=== CARDÁPIO COMPLETO ===
${menuText}

=== TOM DE VOZ ===
- Natural e conversacional (como WhatsApp)
- Amigável mas profissional
- Empolgado com vendas
- MÁXIMO 1 emoji por conversa
- Quebras DUPLAS de linha entre parágrafos (\n\n)
- NÃO use negrito, itálico ou asteriscos
- Use "você" (informal)

=== FLUXO DE ATENDIMENTO (5 ESTADOS) ===

1. GREETING (saudação inicial):
   - Primeira mensagem do cliente
   - Responder: "Olá! Bem-vindo ao ${restaurantData.restaurant.name}. Como posso ajudar você hoje?"
   - Avançar para DISCOVERY

2. DISCOVERY (descobrir necessidade):
   - Entender o que o cliente quer
   - Fazer perguntas abertas: "O que você está com vontade de comer hoje?"
   - Sugerir categorias populares
   - Avançar para ITEMS quando cliente mencionar produto

3. ITEMS (adicionar itens ao pedido):
   - Cliente menciona produto → SEMPRE usar add_item_to_order()
   - Confirmar adição: "Perfeito! [PRODUTO] adicionado (R$ X,XX)"
   - SEMPRE fazer upsell: "Quer adicionar [COMPLEMENTO/BEBIDA]?"
   - Mostrar subtotal atual
   - Perguntar "Quer adicionar algo mais?"
   - Avançar para ADDRESS quando cliente confirmar que terminou

4. ADDRESS (coletar endereço):
   - Perguntar endereço completo (rua, número, bairro)
   - Usar validate_delivery_address() para validar
   - Informar taxa de entrega
   - Avançar para PAYMENT

5. PAYMENT (forma de pagamento):
   - Usar list_payment_methods()
   - Perguntar forma de pagamento
   - Se dinheiro: perguntar "Precisa de troco para quanto?"
   - Usar create_order() para finalizar
   - Avançar para CONFIRMATION

6. CONFIRMATION (confirmação final):
   - Mostrar resumo completo:
     * Itens + valores
     * Subtotal
     * Taxa de entrega
     * Total final
   - Agradecer: "Seu pedido foi enviado! Tempo estimado: 40-50 minutos"
   - Encerrar conversa

=== ESTRATÉGIA DE VENDEDOR EXPERT ===

UPSELL BASEADO EM DADOS REAIS:
${restaurantData.analytics?.popular_products?.length > 0 
  ? `Nossos best-sellers (SEMPRE sugira quando relevante):\n${
      restaurantData.analytics.popular_products.slice(0, 5).map((p: any) => `- ${p.name}`).join('\n')
    }`
  : `- Cliente pede hambúrguer → Sugerir batata frita ou refrigerante
- Cliente pede pizza → Sugerir borda recheada ou sobremesa
- Cliente pede cerveja → Sugerir petisco`
}

CROSS-SELL (produtos complementares):
- Hambúrguer → Batata frita + Refrigerante
- Pizza → Refrigerante ou cerveja
- Pastel → Caldo de cana
- Porção → Cerveja

TÉCNICAS:
1. "Combos mentais": "Que tal adicionar uma batata frita? Fica perfeito com hambúrguer!"
2. "Economia falsa": "Por só R$ 5 a mais você leva uma Coca-Cola 2L"
3. "Escassez": "Temos sobremesa de morango hoje, está saindo muito!"
4. "Social proof": Use os produtos mais vendidos como prova social

QUANDO USAR:
- SEMPRE após adicionar item principal
- NUNCA insistir se cliente recusar
- Máximo 1 sugestão por rodada

=== REGRAS DE RASTREAMENTO ===

1. SEMPRE usar add_item_to_order() quando cliente mencionar produto
2. MANTER metadata.order_items atualizado
3. MOSTRAR subtotal após cada adição
4. NÃO permitir finalizar pedido vazio (verificar com check_order_prerequisites)

=== FERRAMENTAS DISPONÍVEIS ===

1. send_menu_link - Envia link do cardápio online
2. check_product_availability - Verifica se produto está disponível
3. add_item_to_order - CRITICAL: Adiciona item ao carrinho (USE SEMPRE!)
4. validate_delivery_address - Valida endereço e calcula taxa
5. list_payment_methods - Lista formas de pagamento aceitas
6. check_order_prerequisites - Verifica se pode finalizar pedido
7. create_order - Finaliza e cria pedido no sistema

=== FORMATAÇÃO ===

CORRETO:
"Olá! Bem-vindo ao ${restaurantData.restaurant.name}.\n\nO que você está com vontade de comer hoje?"

ERRADO:
"Olá! 👋\n**Bem-vindo** ao ${restaurantData.restaurant.name}!\n\nO que você *gostaria*? 😊"

=== EXAMPLES ===

Cliente: "quero hambúrguer"
Você: "Ótima pedida! Temos vários hambúrgueres deliciosos:\n\n- Hambúrguer Clássico (R$ 15,00)\n- Hambúrguer Bacon (R$ 18,00)\n- Hambúrguer Especial (R$ 22,00)\n\nQual você prefere?"

Cliente: "o clássico"
Você: [USA add_item_to_order("Hambúrguer Clássico", 1, 15.00)]
Você: "Perfeito! Hambúrguer Clássico adicionado (R$ 15,00).\n\nQue tal adicionar uma batata frita crocante por R$ 8,00? Fica perfeito junto!"

Cliente: "não, só o hambúrguer"
Você: "Tudo bem! Subtotal: R$ 15,00.\n\nPosso finalizar seu pedido?"

=== ESTADO ATUAL DA CONVERSA ===
${chat.metadata?.current_state ? `Estado: ${chat.metadata.current_state}` : 'Estado: GREETING'}
${chat.metadata?.order_items?.length ? `Itens no carrinho: ${chat.metadata.order_items.length}` : 'Carrinho vazio'}
${chat.metadata?.customer_name ? `Nome do cliente: ${chat.metadata.customer_name}` : 'Nome não informado'}`;

    // ========== BUILD CONVERSATION HISTORY ==========
    
    const conversationHistory = (messageHistory || [])
      .reverse()
      .map(msg => ({
        role: msg.sender_type === 'customer' ? 'user' : 'assistant',
        content: msg.content
      }));

    // ========== DEFINE TOOLS ==========
    
    const tools = [
      {
        type: "function",
        function: {
          name: "send_menu_link",
          description: "Envia link do cardápio online do restaurante",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_product_availability",
          description: "Verifica disponibilidade de um produto específico",
          parameters: {
            type: "object",
            properties: {
              product_name: {
                type: "string",
                description: "Nome do produto a verificar"
              },
              category_name: {
                type: "string",
                description: "Nome da categoria do produto (opcional)"
              }
            },
            required: ["product_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "add_item_to_order",
          description: "CRITICAL: Adiciona item ao carrinho. USE SEMPRE que cliente mencionar produto!",
          parameters: {
            type: "object",
            properties: {
              product_name: {
                type: "string",
                description: "Nome exato do produto"
              },
              quantity: {
                type: "number",
                description: "Quantidade (padrão: 1)"
              },
              unit_price: {
                type: "number",
                description: "Preço unitário em reais"
              },
              notes: {
                type: "string",
                description: "Observações especiais (ex: sem cebola, ponto da carne)"
              }
            },
            required: ["product_name", "unit_price"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "validate_delivery_address",
          description: "Valida endereço de entrega e calcula taxa",
          parameters: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "Endereço completo (rua, número)"
              },
              city: {
                type: "string",
                description: "Cidade"
              },
              zip_code: {
                type: "string",
                description: "CEP (opcional)"
              }
            },
            required: ["address", "city"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_payment_methods",
          description: "Lista todas as formas de pagamento aceitas",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_order_prerequisites",
          description: "Verifica se todos os dados necessários estão preenchidos para finalizar pedido",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_order",
          description: "Finaliza e cria pedido no sistema (APENAS quando tiver todos os dados)",
          parameters: {
            type: "object",
            properties: {
              customer_name: {
                type: "string",
                description: "Nome do cliente"
              },
              customer_phone: {
                type: "string",
                description: "Telefone do cliente"
              },
              delivery_address: {
                type: "string",
                description: "Endereço completo de entrega"
              },
              payment_method: {
                type: "string",
                description: "Forma de pagamento escolhida"
              },
              change_for: {
                type: "number",
                description: "Valor para troco (se pagamento em dinheiro)"
              },
              notes: {
                type: "string",
                description: "Observações gerais do pedido"
              }
            },
            required: ["customer_name", "customer_phone", "delivery_address", "payment_method"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_restaurant_info",
          description: "Retorna informações de contato e localização do restaurante quando cliente perguntar sobre endereço, telefone, horário ou redes sociais",
          parameters: {
            type: "object",
            properties: {
              info_type: {
                type: "string",
                enum: ["address", "phone", "instagram", "all"],
                description: "Tipo de informação solicitada pelo cliente"
              }
            },
            required: ["info_type"]
          }
        }
      }
    ];

    // ========== CALL OPENAI ==========
    
    console.log(`[${requestId}] 🤖 Calling OpenAI API (gpt-5-mini-2025-08-07)...`);
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: messageContent }
        ],
        tools: tools,
        tool_choice: 'auto',
        max_completion_tokens: 1000
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`[${requestId}] ❌ OpenAI API error: ${openAIResponse.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message;
    
    // 🔍 DEBUG: Log completo da resposta
    console.log(`[${requestId}] 📊 OpenAI Response Debug:`, {
      has_content: !!assistantMessage.content,
      content_length: assistantMessage.content?.length || 0,
      has_tool_calls: !!assistantMessage.tool_calls,
      tool_calls_count: assistantMessage.tool_calls?.length || 0,
      finish_reason: openAIData.choices[0].finish_reason,
      usage: openAIData.usage
    });

    if (assistantMessage.content) {
      console.log(`[${requestId}] 💬 AI Content Preview: ${assistantMessage.content.substring(0, 100)}...`);
    }

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`[${requestId}] 🔧 Tool Calls:`, assistantMessage.tool_calls.map(tc => ({
        name: tc.function.name,
        args: tc.function.arguments
      })));
    }

    console.log(`[${requestId}] ✅ OpenAI response received`);
    
    // ========== PROCESS TOOL CALLS ==========
    
    let toolResults = [];
    
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`[${requestId}] 🔧 Processing ${assistantMessage.tool_calls.length} tool calls`);
      
      for (const toolCall of assistantMessage.tool_calls) {
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
              const { executeCheckAvailability } = await import('./tools.ts');
              toolResult = await executeCheckAvailability(supabase, agent, toolArgs);
              break;
            
            case 'add_item_to_order':
              const { executeAddItemToOrder } = await import('./cart-tools.ts');
              toolResult = await executeAddItemToOrder(supabase, chatId, toolArgs);
              break;
            
            case 'validate_delivery_address':
              const { executeValidateAddress } = await import('./address-tools.ts');
              toolResult = await executeValidateAddress(supabase, agent, toolArgs);
              break;
            
            case 'list_payment_methods':
              const { executeListPaymentMethods } = await import('./payment-tools.ts');
              toolResult = await executeListPaymentMethods(supabase, agent);
              break;
            
            case 'check_order_prerequisites':
              const { executeCheckOrderPrerequisites } = await import('./tools.ts');
              toolResult = await executeCheckOrderPrerequisites(supabase, chatId);
              break;
            
            case 'create_order':
              const { executeCreateOrder } = await import('./tools.ts');
              toolResult = await executeCreateOrder(supabase, agent, toolArgs, chatId, customerPhone);
              break;
            
            case 'get_restaurant_info':
              // Get restaurant info from agent data
              const restaurant = agent.restaurants;
              const infoType = toolArgs.info_type;
              
              const restaurantInfo: any = {
                address: restaurant.address || "Endereço não cadastrado",
                phone: restaurant.phone || "Telefone não cadastrado",
                whatsapp: restaurant.whatsapp || agent.evolution_whatsapp_number,
                instagram: restaurant.instagram ? `@${restaurant.instagram.replace('@', '')}` : null
              };
              
              if (infoType === 'all') {
                toolResult = {
                  success: true,
                  data: restaurantInfo,
                  message: `📍 Endereço: ${restaurantInfo.address}\n📞 Telefone: ${restaurantInfo.phone}${restaurantInfo.whatsapp ? `\n📱 WhatsApp: ${restaurantInfo.whatsapp}` : ''}${restaurantInfo.instagram ? `\n📷 Instagram: ${restaurantInfo.instagram}` : ''}`
                };
              } else {
                toolResult = {
                  success: true,
                  data: restaurantInfo[infoType],
                  message: restaurantInfo[infoType] || 'Informação não disponível'
                };
              }
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
    }
    
    // ========== GET FINAL AI MESSAGE ==========
    
    let aiMessage = assistantMessage.content || '';
    
    // If there were tool calls, always do a follow-up to get natural response
    if (toolResults.length > 0) {
      console.log(`[${requestId}] 🔄 Getting AI response based on ${toolResults.length} tool results...`);
      
      // Format tool results as user message (simpler and more reliable)
      const toolResultsText = toolResults.map(tr => {
        const resultStr = typeof tr.result === 'object' ? JSON.stringify(tr.result, null, 2) : String(tr.result);
        return `Ferramenta ${tr.tool} executada:\n${resultStr}`;
      }).join('\n\n');
      
      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: messageContent },
            { 
              role: 'user', 
              content: `[RESULTADOS DAS FERRAMENTAS EXECUTADAS]\n\n${toolResultsText}\n\n[FIM DOS RESULTADOS]\n\nCom base nos resultados acima, responda ao cliente de forma natural e humanizada. Lembre-se: máximo 1 emoji na conversa inteira, use quebras duplas de linha, seja direto e vendedor.`
            }
          ],
          max_completion_tokens: 800
        })
      });
      
      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        console.error(`[${requestId}] ❌ Follow-up API error: ${followUpResponse.status} - ${errorText}`);
      } else {
        const followUpData = await followUpResponse.json();
        const followUpContent = followUpData.choices[0].message.content || '';
        
        if (followUpContent) {
          aiMessage = followUpContent;
          console.log(`[${requestId}] ✅ Follow-up response received (${aiMessage.length} chars)`);
        }
      }
    }
    
    // Fallback: if still no message after all attempts
    if (!aiMessage || aiMessage.trim() === '') {
      console.warn(`[${requestId}] ⚠️ No AI response generated, using fallback`);
      aiMessage = getRandomResponse('confirmation');
    }
    
    // ========== CLEAN AI RESPONSE ==========
    
    aiMessage = cleanAIResponse(aiMessage);
    
    console.log(`[${requestId}] 📝 Final AI message (${aiMessage.length} chars): ${aiMessage.substring(0, 100)}...`);
    
    // ========== SAVE TO DATABASE ==========
    
    await supabase
      .from('messages')
      .insert({
        chat_id: chat.id,
        sender_type: 'agent',
        content: aiMessage,
        message_type: 'text'
      });
    
    console.log(`[${requestId}] 💾 Message saved to database`);
    
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
    
  } catch (error) {
    console.error(`[${requestId}] ❌ Erro no processamento da IA:`, error);
    throw error;
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
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
      const token = url.searchParams.get('token');
      const challenge = url.searchParams.get('challenge');
      
      console.log(`[${requestId}] GET request - token: ${token ? 'present' : 'missing'}, challenge: ${challenge ? 'present' : 'missing'}`);
      
      if (token && challenge) {
        console.log(`[${requestId}] ✅ Webhook verification successful`);
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      
      console.log(`[${requestId}] ℹ️ Health check request`);
      return new Response(JSON.stringify({ 
        status: 'Webhook is active',
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
      
      // Salvar mensagem no banco de dados (para histórico)
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender_type: 'customer',
          content: messageContent,
          message_type: 'text',
          whatsapp_message_id: data.key.id
        });
      
      if (msgError) {
        console.error(`[${requestId}] ❌ Error saving message:`, msgError);
      } else {
        console.log(`[${requestId}] ✅ Customer message saved to database`);
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
