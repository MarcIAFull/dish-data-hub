// Menu Agent - Specialized in menu presentation

import { getMenuPrompt } from '../utils/prompt-templates.ts';
import type { MenuContext } from '../utils/context-builder.ts';

/**
 * Menu Agent tools - focused on menu display
 */
export function getMenuTools() {
  return [
    {
      type: "function",
      function: {
        name: "send_menu_link",
        description: "Envia link do cardápio digital completo. USE APENAS quando cliente pedir explicitamente para 'ver o cardápio todo' ou 'quero o cardápio completo'. NÃO use para perguntas sobre produtos específicos.",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    },
    {
      type: "function",
      function: {
        name: "check_product_availability",
        description: "Verifica disponibilidade de um produto. Use apenas se precisar confirmar estoque/disponibilidade em tempo real.",
        parameters: {
          type: "object",
          properties: {
            product_name: {
              type: "string",
              description: "Nome do produto"
            }
          },
          required: ["product_name"]
        }
      }
    }
  ];
}

/**
 * Process Menu Agent response
 */
export async function processMenuAgent(
  context: MenuContext,
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

  console.log(`[${requestId}] 📋 Menu Agent - Starting processing...`);
  console.log(`[${requestId}] 📊 Context:`);
  console.log(`  - Restaurant: ${context.restaurantName}`);
  console.log(`  - Categories: ${context.categories?.length || 0}`);
  console.log(`  - Total products: ${context.totalProducts || 0}`);

  const systemPrompt = getMenuPrompt(context, agent?.personality, agent?.tone);
  const tools = getMenuTools();

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
      max_completion_tokens: 1500  // Increased for GPT-5 reasoning mode
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${requestId}] ❌ OpenAI API error:`, response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message;

  console.log(`[${requestId}] 📊 Menu Agent Response:`, {
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
