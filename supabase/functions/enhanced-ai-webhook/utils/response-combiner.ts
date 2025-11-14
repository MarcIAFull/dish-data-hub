// Response Combiner - Combines multiple agent responses into one coherent message

import type { ExecutionResult } from './plan-executor.ts';

/**
 * Combines multiple agent outputs into a single, coherent response
 */
export function combineResponses(
  results: ExecutionResult[],
  requestId: string
): { combinedOutput: string; allToolResults: any[] } {
  
  console.log(`[${requestId}] 🔗 Combining ${results.length} agent responses...`);

  // Collect all outputs and tool results
  const outputs: string[] = [];
  const allToolResults: any[] = [];

  for (const result of results) {
    if (result.output && result.output.trim()) {
      outputs.push(result.output.trim());
    }
    allToolResults.push(...result.toolResults);
  }

  // Combine outputs with context awareness
  let combinedOutput = '';

  if (outputs.length === 0) {
    combinedOutput = 'Processado com sucesso';
  } else if (outputs.length === 1) {
    combinedOutput = outputs[0];
  } else {
    // Multiple outputs - join intelligently
    combinedOutput = outputs.join('\n\n');
  }

  console.log(`[${requestId}] ✅ Combined response (${combinedOutput.length} chars)`);
  console.log(`[${requestId}] 📊 Total tool results: ${allToolResults.length}`);

  return {
    combinedOutput,
    allToolResults
  };
}

/**
 * Creates a summary of what was accomplished
 */
export function createExecutionSummary(results: ExecutionResult[]): string {
  const actions: string[] = [];

  for (const result of results) {
    for (const tr of result.toolResults) {
      if (tr.tool === 'add_item_to_order' && tr.result?.success) {
        actions.push(`✅ ${tr.result.item.product_name} adicionado`);
      } else if (tr.tool === 'set_delivery_type' && tr.result?.success) {
        actions.push(`✅ Entrega: ${tr.result.delivery_type === 'pickup' ? 'Retirada' : 'Delivery'}`);
      } else if (tr.tool === 'set_payment_method' && tr.result?.success) {
        actions.push(`✅ Pagamento: ${tr.result.payment_method}`);
      }
    }
  }

  return actions.length > 0 ? actions.join(' | ') : 'Processado';
}
