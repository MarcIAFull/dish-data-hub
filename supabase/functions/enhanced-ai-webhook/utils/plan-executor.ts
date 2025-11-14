// Plan Executor - Executes the execution plan

import type { ExecutionStep } from './execution-planner.ts';
import { processSalesAgent } from '../agents/sales-agent.ts';
import { processCheckoutAgent } from '../agents/checkout-agent.ts';
import { processMenuAgent } from '../agents/menu-agent.ts';
import { processSupportAgent } from '../agents/support-agent.ts';
import { processLogisticsHandler } from '../agents/logistics-handler.ts';
import { buildSalesContext, buildCheckoutContext, buildMenuContext, buildSupportContext } from './context-builder.ts';
import { executeToolCalls } from './tool-executor.ts';

export interface ExecutionResult {
  stepId: string;
  agent: string;
  step: ExecutionStep;
  output: string;
  toolResults: any[];
  updatedMetadata: any;
}

/**
 * Executes the execution plan sequentially
 */
export async function executePlan(
  plan: ExecutionStep[],
  chatId: number,
  supabase: any,
  restaurantData: any,
  conversationHistory: any[],
  currentMetadata: any,
  currentState: string,
  requestId: string
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  let workingMetadata = { ...currentMetadata };

  console.log(`[${requestId}] 🚀 Executing Plan (${plan.length} steps)...`);

  for (const step of plan) {
    console.log(`[${requestId}] ▶️ Executing Step: [${step.agent}] ${step.action}`);

    // Check dependencies
    const dependenciesMet = step.dependencies.every(depId => 
      results.some(r => r.stepId === depId)
    );

    if (!dependenciesMet) {
      console.warn(`[${requestId}] ⚠️ Dependencies not met for ${step.stepId}, skipping`);
      continue;
    }

    let agentOutput = '';
    let toolCalls: any[] = [];
    let toolResults: any[] = [];

    try {
      switch (step.agent) {
        case 'SALES': {
          const salesContext = buildSalesContext(
            restaurantData.restaurant,
            restaurantData.categories,
            restaurantData.products,
            workingMetadata,
            restaurantData.agent
          );

          const result = await processSalesAgent(
            salesContext,
            conversationHistory,
            chatId,
            supabase,
            restaurantData.agent,
            currentState,
            requestId
          );

          agentOutput = result.content;
          toolCalls = result.toolCalls || [];

          // Execute tools
          if (toolCalls.length > 0) {
            toolResults = await executeToolCalls(
              toolCalls,
              supabase,
              restaurantData.agent,
              chatId,
              restaurantData.agent.restaurants?.phone || '',
              requestId
            );

            // Update metadata with tool results
            for (const tr of toolResults) {
              if (tr.tool === 'add_item_to_order' && tr.result?.success) {
                workingMetadata.order_items = workingMetadata.order_items || [];
                workingMetadata.order_items.push(tr.result.item);
              }
            }
          }
          break;
        }

        case 'CHECKOUT': {
          const checkoutContext = buildCheckoutContext(
            restaurantData.restaurant,
            restaurantData.deliveryZones,
            restaurantData.paymentMethods,
            workingMetadata,
            restaurantData.agent
          );

          const result = await processCheckoutAgent(
            checkoutContext,
            conversationHistory,
            chatId,
            supabase,
            restaurantData.agent,
            currentState,
            requestId
          );

          agentOutput = result.content;
          toolCalls = result.toolCalls || [];

          if (toolCalls.length > 0) {
            toolResults = await executeToolCalls(
              toolCalls,
              supabase,
              restaurantData.agent,
              chatId,
              restaurantData.agent.restaurants?.phone || '',
              requestId
            );
          }
          break;
        }

        case 'MENU': {
          const menuContext = buildMenuContext(
            restaurantData.restaurant,
            restaurantData.categories,
            restaurantData.products,
            restaurantData.agent
          );

          const result = await processMenuAgent(
            menuContext,
            conversationHistory,
            chatId,
            supabase,
            restaurantData.agent,
            currentState,
            requestId
          );

          agentOutput = result.content;
          toolCalls = result.toolCalls || [];

          if (toolCalls.length > 0) {
            toolResults = await executeToolCalls(
              toolCalls,
              supabase,
              restaurantData.agent,
              chatId,
              restaurantData.agent.restaurants?.phone || '',
              requestId
            );
          }
          break;
        }

        case 'SUPPORT': {
          const supportContext = buildSupportContext(
            restaurantData.restaurant,
            restaurantData.agent
          );

          const result = await processSupportAgent(
            supportContext,
            conversationHistory,
            chatId,
            supabase,
            restaurantData.agent,
            currentState,
            requestId
          );

          agentOutput = result.content;
          break;
        }

        case 'LOGISTICS_HANDLER': {
          const result = await processLogisticsHandler(
            step.action,
            step.parameters,
            workingMetadata,
            supabase,
            restaurantData.agent,
            requestId
          );

          agentOutput = result.output;
          toolResults = result.toolResults;
          workingMetadata = result.updatedMetadata;
          break;
        }
      }

      results.push({
        stepId: step.stepId,
        agent: step.agent,
        step: step,
        output: agentOutput,
        toolResults,
        updatedMetadata: workingMetadata
      });

      console.log(`[${requestId}] ✅ Step ${step.stepId} completed`);

    } catch (error) {
      console.error(`[${requestId}] ❌ Error executing step ${step.stepId}:`, error);
      
      results.push({
        stepId: step.stepId,
        agent: step.agent,
        step: step,
        output: `Erro ao processar: ${error.message}`,
        toolResults: [],
        updatedMetadata: workingMetadata
      });
    }
  }

  console.log(`[${requestId}] ✅ Plan execution completed (${results.length} steps)`);

  return results;
}
