// Support Agent - Specialized in customer support

import { getSupportPrompt } from '../utils/prompt-templates.ts';
import type { SupportContext } from '../utils/context-builder.ts';

/**
 * Support Agent tools - focused on restaurant info
 */
export function getSupportTools() {
  return [
    {
      type: "function",
      function: {
        name: "get_restaurant_info",
        description: "Retorna informações de contato e localização do restaurante",
        parameters: {
          type: "object",
          properties: {
            info_type: {
              type: "string",
              enum: ["address", "phone", "instagram", "all"],
              description: "Tipo de informação solicitada"
            }
          },
          required: ["info_type"]
        }
      }
    }
  ];
}

/**
 * Process Support Agent response
 */
export async function processSupportAgent(
  context: SupportContext,
  messages: any[],
  chatId: number,
  supabase: any,
  agent: any,
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log(`[${requestId}] 🆘 Support Agent - Starting processing...`);
  console.log(`[${requestId}] 📊 Context:`);
  console.log(`  - Restaurant: ${context.restaurantName}`);
  console.log(`  - Phone: ${context.phone || 'N/A'}`);
  console.log(`  - Address: ${context.address || 'N/A'}`);

  const systemPrompt = getSupportPrompt(context, agent?.personality, agent?.tone);
  const tools = getSupportTools();

  // Usar histórico completo (não fazer slice)
  const conversationHistory = messages.map(m => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  console.log(`[${requestId}] 📥 Conversation history: ${conversationHistory.length} messages`);
  console.log(`[${requestId}] 🤖 Calling OpenAI (gpt-5-2025-08-07)...`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      tools,
      tool_choice: 'auto',
      max_completion_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message;

  console.log(`[${requestId}] 📊 Support Agent Response:`, {
    has_content: !!assistantMessage.content,
    content_length: assistantMessage.content?.length || 0,
    has_tool_calls: !!assistantMessage.tool_calls,
    tool_calls_count: assistantMessage.tool_calls?.length || 0,
    finish_reason: data.choices[0].finish_reason,
    tokens: data.usage
  });

  return {
    content: assistantMessage.content || '',
    toolCalls: assistantMessage.tool_calls || []
  };
}
