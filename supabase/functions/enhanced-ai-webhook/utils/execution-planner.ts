// Execution Planner - Creates execution plan from detected intents

import type { DetectedIntent } from '../agents/orchestrator-v2.ts';
import type { ConversationState } from './context-builder.ts';

export interface ExecutionStep {
  stepId: string;
  agent: 'SALES' | 'CHECKOUT' | 'MENU' | 'SUPPORT' | 'LOGISTICS_HANDLER';
  action: string;
  parameters: Record<string, any>;
  dependencies: string[]; // stepIds that must complete first
  canRunInParallel: boolean;
}

/**
 * Creates an execution plan based on detected intents
 */
export function createExecutionPlan(
  intents: DetectedIntent[],
  currentState: ConversationState,
  metadata: any,
  requestId: string
): ExecutionStep[] {
  const plan: ExecutionStep[] = [];
  let stepCounter = 0;

  console.log(`[${requestId}] 📋 Creating Execution Plan...`);
  console.log(`  Current State: ${currentState}`);
  console.log(`  Intents: ${intents.map(i => i.type).join(', ')}`);

  for (const intent of intents) {
    const stepId = `step_${++stepCounter}`;

    switch (intent.type) {
      case 'GREETING':
        // Only handle greeting if first contact
        if (!metadata?.hasGreeted) {
          plan.push({
            stepId,
            agent: 'MENU',
            action: 'greet_and_show_menu',
            parameters: {},
            dependencies: [],
            canRunInParallel: false
          });
        }
        break;

      case 'MENU':
        plan.push({
          stepId,
          agent: 'MENU',
          action: 'show_menu',
          parameters: {
            category: intent.extractedData?.category,
            searchTerm: intent.extractedData?.searchTerm
          },
          dependencies: [],
          canRunInParallel: true
        });
        break;

      case 'ORDER':
        // Check if products mentioned
        const products = intent.extractedData?.products || [];
        
        plan.push({
          stepId,
          agent: 'SALES',
          action: 'process_order',
          parameters: {
            products,
            userMessage: intent.extractedData?.rawMessage
          },
          dependencies: [],
          canRunInParallel: false
        });
        break;

      case 'LOGISTICS':
        const deliveryType = intent.extractedData?.delivery_type;
        const address = intent.extractedData?.address;

        if (deliveryType) {
          plan.push({
            stepId,
            agent: 'LOGISTICS_HANDLER',
            action: 'set_delivery_type',
            parameters: { delivery_type: deliveryType },
            dependencies: [],
            canRunInParallel: true
          });
        }

        if (address) {
          plan.push({
            stepId: `step_${++stepCounter}`,
            agent: 'LOGISTICS_HANDLER',
            action: 'set_address',
            parameters: { address },
            dependencies: [stepId], // Must set delivery type first
            canRunInParallel: false
          });
        }
        break;

      case 'PAYMENT':
        plan.push({
          stepId,
          agent: 'LOGISTICS_HANDLER',
          action: 'set_payment_method',
          parameters: {
            payment_method: intent.extractedData?.payment_method
          },
          dependencies: [],
          canRunInParallel: true
        });
        break;

      case 'CHECKOUT':
        // Validate prerequisites
        const hasItems = metadata?.order_items?.length > 0 || metadata?.cart?.items?.length > 0;
        
        if (!hasItems) {
          console.log(`[${requestId}] ⚠️ CHECKOUT without items → redirect to SALES`);
          plan.push({
            stepId,
            agent: 'SALES',
            action: 'handle_empty_cart',
            parameters: {},
            dependencies: [],
            canRunInParallel: false
          });
        } else {
          plan.push({
            stepId,
            agent: 'CHECKOUT',
            action: 'finalize_order',
            parameters: {},
            dependencies: plan.map(s => s.stepId), // Must complete all previous steps
            canRunInParallel: false
          });
        }
        break;

      case 'SUPPORT':
        plan.push({
          stepId,
          agent: 'SUPPORT',
          action: 'answer_question',
          parameters: {
            question: intent.extractedData?.question
          },
          dependencies: [],
          canRunInParallel: true
        });
        break;

      case 'UNCLEAR':
        // Fallback based on state
        if (!metadata?.hasGreeted) {
          plan.push({
            stepId,
            agent: 'MENU',
            action: 'greet_and_show_menu',
            parameters: {},
            dependencies: [],
            canRunInParallel: false
          });
        } else if (!metadata?.order_items?.length && !metadata?.cart?.items?.length) {
          plan.push({
            stepId,
            agent: 'MENU',
            action: 'show_menu',
            parameters: {},
            dependencies: [],
            canRunInParallel: false
          });
        } else {
          plan.push({
            stepId,
            agent: 'SALES',
            action: 'clarify',
            parameters: {},
            dependencies: [],
            canRunInParallel: false
          });
        }
        break;
    }
  }

  // Log execution plan
  console.log(`[${requestId}] 📋 Execution Plan Created (${plan.length} steps):`);
  plan.forEach((step, i) => {
    console.log(`  ${i + 1}. [${step.agent}] ${step.action}`);
    if (step.dependencies.length > 0) {
      console.log(`     Dependencies: ${step.dependencies.join(', ')}`);
    }
  });

  return plan;
}
