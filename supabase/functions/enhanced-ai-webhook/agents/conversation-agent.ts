// 🎨 Conversation Agent - Humanizes responses for WhatsApp

import { getConversationAgentPrompt } from '../utils/prompts.ts';

/**
 * Takes raw agent output and tool results, humanizes into natural WhatsApp message
 */
export async function processConversationAgent(
  userMessage: string,
  agentType: string,
  agentOutput: string,
  toolResults: any[],
  restaurantName: string,
  requestId: string
): Promise<string> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    console.error(`[${requestId}] ❌ OPENAI_API_KEY not configured`);
    return agentOutput; // Fallback to raw output
  }
  
  console.log(`[${requestId}] [4/5] 🎨 Humanizando resposta...`);
  
  const systemPrompt = getConversationAgentPrompt(restaurantName, agentType);
  
  // Build context from tool results
  const toolsContext = toolResults.map(tr => 
    `[${tr.tool}]: ${JSON.stringify(tr.result)}`
  ).join('\n');
  
  const userPrompt = `MENSAGEM ORIGINAL DO CLIENTE:
"${userMessage}"

RESPOSTA DO AGENTE ${agentType}:
${agentOutput}

FERRAMENTAS USADAS:
${toolsContext || 'Nenhuma ferramenta usada'}

Transforme isso em uma mensagem natural de WhatsApp seguindo as regras.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error(`[${requestId}] ❌ OpenAI error:`, response.status);
      return agentOutput;
    }

    const data = await response.json();
    const humanizedResponse = data.choices[0].message.content || agentOutput;
    
    console.log(`[${requestId}] ✅ Resposta humanizada criada`);
    
    return humanizedResponse;
    
  } catch (error) {
    console.error(`[${requestId}] ❌ Error in conversation agent:`, error);
    return agentOutput; // Fallback
  }
}
