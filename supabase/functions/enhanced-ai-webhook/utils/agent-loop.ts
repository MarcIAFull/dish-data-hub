// 🔄 Agent Loop Engine - Re-avaliação automática de agentes

import { processSalesAgent } from '../agents/sales-agent.ts';
import { processCheckoutAgent } from '../agents/checkout-agent.ts';
import { processMenuAgent } from '../agents/menu-agent.ts';
import { processSupportAgent } from '../agents/support-agent.ts';
import { processConversationAgent } from '../agents/conversation-agent.ts';
import { updateConversationContext } from './context-manager.ts';
import { getCartFromMetadata } from './db-helpers.ts';
import { ConversationState } from '../types/conversation-states.ts';

export interface AgentLoopResult {
  finalResponse: string;
  agentsCalled: string[];
  stateTransitions: string[];
  loopCount: number;
  exitReason: 'max_iterations' | 'no_more_agents' | 'terminal_state';
  allToolResults: any[];
  conversationHistory: any[];
  agentMetrics: {
    [agent: string]: {
      execution_time_ms: number;
      tools_called: number;
      success: boolean;
    };
  };
}

/**
 * Executa loop de agentes com re-avaliação automática
 */
export async function executeAgentLoop(
  initialAgent: string,
  userMessage: string,
  conversationHistory: any[],
  context: {
    supabase: any;
    chatId: number;
    chat: any;
    restaurant: any;
    sessionId: string;
    requestId: string;
    executeTools: (toolCalls: any[], supabase: any, chatId: number, agent: any, restaurantId: string, requestId: string) => Promise<any[]>;
  },
  maxIterations: number = 3
): Promise<AgentLoopResult> {
  
  const agentsCalled: string[] = [];
  const stateTransitions: string[] = [];
  const agentMetrics: Record<string, { execution_time_ms: number; tools_called: number; success: boolean }> = {};
  let currentAgent = initialAgent;
  let loopCount = 0;
  let lastAgentResult: any = null;
  let allToolResults: any[] = [];
  let updatedConversationHistory = [...conversationHistory];
  
  console.log(`[${context.requestId}] 🔄 Starting Agent Loop (max ${maxIterations} iterations)`);
  console.log(`[${context.requestId}] 📊 Initial state: ${context.chat.conversation_state}`);
  
  while (loopCount < maxIterations) {
    loopCount++;
    console.log(`[${context.requestId}] 🔁 Loop ${loopCount}/${maxIterations} - Agent: ${currentAgent}`);
    
    // 1. Executar agente atual (com métricas)
    const agentStartTime = Date.now();
    const agentResult = await callSpecializedAgent(
      currentAgent,
      userMessage,
      updatedConversationHistory,
      context
    );
    const agentExecutionTime = Date.now() - agentStartTime;
    
    agentsCalled.push(currentAgent);
    lastAgentResult = agentResult;
    
    console.log(`[${context.requestId}] ✅ ${currentAgent} processou em ${agentExecutionTime}ms. Tools: ${agentResult.toolCalls?.length || 0}`);
    
    // 2. Executar ferramentas
    const toolResults = await context.executeTools(
      agentResult.toolCalls || [],
      context.supabase,
      context.chatId,
      currentAgent,
      context.restaurant.id,
      context.requestId,
      context.enrichedContext  // ✅ FASE 3: Passar contexto para ferramentas inteligentes
    );
    
    allToolResults.push(...toolResults);
    
    // ✅ LOG DETALHADO: Ferramentas executadas
    console.log(`[${context.requestId}] 🔧 Ferramentas executadas:`, {
      count: toolResults.length,
      tools: toolResults.map(t => t.tool),
      results: toolResults.map(t => ({ 
        tool: t.tool, 
        success: t.result?.success !== false,
        summary: JSON.stringify(t.result || {}).substring(0, 100)
      }))
    });
    
    // ✅ VALIDAÇÃO CRÍTICA: SALES Agent deve adicionar ao carrinho
    if (currentAgent === 'SALES' && toolResults.length > 0) {
      const checkedProduct = toolResults.find(t => t.tool === 'check_product_availability' && t.result?.success);
      const addedToCart = toolResults.some(t => t.tool === 'add_item_to_order');
      
      if (checkedProduct && !addedToCart) {
        console.log(`[${context.requestId}] ⚠️ ALERTA: SALES consultou "${checkedProduct.result?.product_name}" mas NÃO adicionou ao carrinho`);
        console.log(`[${context.requestId}] 💡 Provável causa: Cliente confirmou mas agente não executou add_item_to_order`);
      }
    }
    
    // ✅ VALIDAÇÃO: SALES Agent deve adicionar ao carrinho quando cliente pede produto
    if (currentAgent === 'SALES' && toolResults.length > 0) {
      const checkedAvailability = toolResults.some(t => t.tool === 'check_product_availability' && t.result?.success);
      const addedToCart = toolResults.some(t => t.tool === 'add_item_to_order');
      
      // Detectar se usuário PEDIU produto (não apenas perguntou)
      const userMessageLower = userMessage.toLowerCase();
      const userWantsToAdd = /quero|adiciona|pede|fecha|finaliza|pode adicionar|vou querer|me traz/i.test(userMessageLower);
      const userJustAsking = /quanto|preço|custa|tem|disponível|cardápio/i.test(userMessageLower) && 
                            !userWantsToAdd;
      
      if (userWantsToAdd && checkedAvailability && !addedToCart && !userJustAsking) {
        console.warn(`[${context.requestId}] ⚠️ CRÍTICO: SALES verificou produto mas NÃO adicionou ao carrinho!`);
        console.warn(`[${context.requestId}] Mensagem do usuário: "${userMessage}"`);
        console.warn(`[${context.requestId}] Ferramentas chamadas: ${toolResults.map(t => t.tool).join(', ')}`);
      } else if (addedToCart) {
        console.log(`[${context.requestId}] ✅ SALES adicionou item ao carrinho corretamente`);
      }
    }
    
    // 3. Registrar métricas do agente
    agentMetrics[currentAgent] = {
      execution_time_ms: agentExecutionTime,
      tools_called: toolResults.length,
      success: toolResults.every(r => r.success !== false)
    };
    
    // 3. Atualizar contexto e avaliar próximo estado
    const contextUpdate = await updateConversationContext(
      context.supabase,
      context.chatId,
      context.chat,
      currentAgent,
      toolResults,
      context.requestId
    );
    
    const previousState = context.chat.conversation_state || 'greeting';
    stateTransitions.push(`${previousState} → ${contextUpdate.newState} (via ${currentAgent})`);
    
    // ✅ LOG DETALHADO: Transição de estado
    console.log(`[${context.requestId}] 📊 Transição de estado:`, {
      from: previousState,
      to: contextUpdate.newState,
      via: currentAgent,
      shouldCallNext: contextUpdate.shouldCallNextAgent,
      suggestedNext: contextUpdate.suggestedNextAgent,
      stateChanged: previousState !== contextUpdate.newState
    });
    
    // 4. Atualizar histórico de conversa para próxima iteração
    updatedConversationHistory.push({
      sender_type: 'assistant',
      content: agentResult.content,
      metadata: {
        agent: currentAgent,
        tools: toolResults.map(t => t.tool),
        state: contextUpdate.newState
      }
    });
    
    // 5. Verificar estado terminal
    if (isTerminalState(contextUpdate.newState)) {
      console.log(`[${context.requestId}] 🏁 Terminal state reached: ${contextUpdate.newState}`);
      break;
    }
    
    // 6. Verificar se deve chamar próximo agente
    if (!contextUpdate.shouldCallNextAgent) {
      console.log(`[${context.requestId}] ✅ No next agent suggested. Loop ended.`);
      break;
    }
    
    // 7. Preparar próximo agente
    currentAgent = contextUpdate.suggestedNextAgent!;
    console.log(`[${context.requestId}] ➡️ Next agent: ${currentAgent}`);
    
    // 8. Atualizar chat para próxima iteração
    context.chat = {
      ...context.chat,
      conversation_state: contextUpdate.newState,
      metadata: contextUpdate.contextUpdates.metadata
    };
  }
  
  // Determinar razão de saída
  let exitReason: AgentLoopResult['exitReason'] = 'no_more_agents';
  if (loopCount >= maxIterations) {
    exitReason = 'max_iterations';
    console.warn(`[${context.requestId}] ⚠️ Loop reached max iterations (${maxIterations})`);
  } else if (isTerminalState(context.chat.conversation_state)) {
    exitReason = 'terminal_state';
  }
  
  // Gerar resposta final humanizada
  const finalResponse = await processConversationAgent(
    userMessage,
    agentsCalled[agentsCalled.length - 1],
    lastAgentResult.content,
    allToolResults,
    context.restaurant.name,
    context.requestId,
    updatedConversationHistory
  );
  
  console.log(`[${context.requestId}] ✅ Loop completed:`, {
    agents: agentsCalled,
    iterations: loopCount,
    exitReason,
    transitions: stateTransitions.length
  });
  
  return {
    finalResponse,
    agentsCalled,
    stateTransitions,
    loopCount,
    exitReason,
    allToolResults,
    conversationHistory: updatedConversationHistory,
    agentMetrics
  };
}

/**
 * Chama agente especializado baseado no nome
 */
async function callSpecializedAgent(
  agent: string,
  userMessage: string,
  conversationHistory: any[],
  context: any
): Promise<{ content: string; toolCalls?: any[] }> {
  
  const cart = getCartFromMetadata(context.chat.metadata || {});
  
  if (agent === 'SALES') {
    return await processSalesAgent(
      userMessage,
      conversationHistory,
      {
        restaurantName: context.restaurant.name,
        currentCart: cart.items,
        cartTotal: cart.total,
        currentState: context.chat.conversation_state || 'initial',
        enrichedContext: context.enrichedContext  // ✅ FASE 5
      },
      context.requestId
    );
  } else if (agent === 'CHECKOUT') {
    return await processCheckoutAgent(
      userMessage,
      conversationHistory,
      {
        restaurantName: context.restaurant.name,
        currentCart: cart.items,
        cartTotal: cart.total,
        deliveryFee: context.chat.metadata?.delivery_fee || 0,
        enrichedContext: context.enrichedContext  // ✅ FASE 5
      },
      context.requestId
    );
  } else if (agent === 'MENU') {
    return await processMenuAgent(
      userMessage,
      conversationHistory,
      {
        restaurantName: context.restaurant.name,
        menuLink: `https://app.example.com/${context.restaurant.slug}`,
        enrichedContext: context.enrichedContext  // ✅ FASE 5
      },
      context.requestId
    );
  } else {
    return await processSupportAgent(
      userMessage,
      conversationHistory,
      {
        restaurantName: context.restaurant.name,
        restaurantAddress: context.restaurant.address,
        restaurantPhone: context.restaurant.phone,
        workingHours: context.restaurant.working_hours,
        enrichedContext: context.enrichedContext  // ✅ FASE 5
      },
      context.requestId
    );
  }
}

/**
 * Verifica se o estado é terminal (não deve continuar loop)
 */
function isTerminalState(state: string): boolean {
  return [
    ConversationState.ORDER_PLACED,
    ConversationState.ABANDONED
  ].includes(state as ConversationState);
}
