// 🆘 Support Agent - Simplified

import { getSupportPrompt } from '../utils/prompts.ts';

export async function processSupportAgent(
  userMessage: string,
  conversationHistory: any[],
  context: {
    restaurantName: string;
    restaurantAddress?: string;
    restaurantPhone?: string;
    workingHours?: any;
    enrichedContext?: any;  // ✅ FASE 5
  },
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('OPENAI_API_KEY not configured');
  
  console.log(`[${requestId}] [3/5] 🆘 Agente SUPPORT processando...`);
  
  const systemPrompt = getSupportPrompt(context, context.enrichedContext);  // ✅ FASE 5
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-3).map((msg: any) => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 400
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  const message = data.choices[0].message;
  
  console.log(`[${requestId}] ✅ SUPPORT agent processou`);
  
  return {
    content: message.content || '',
    toolCalls: message.tool_calls
  };
}
