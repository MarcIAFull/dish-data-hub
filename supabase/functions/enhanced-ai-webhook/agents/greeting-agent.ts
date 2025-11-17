// 👋 Greeting Agent - Welcomes customers and discovers their needs

import { getGreetingPrompt } from '../utils/prompts.ts';

export async function processGreetingAgent(
  userMessage: string,
  conversationHistory: any[],
  context: {
    restaurantName: string;
    restaurantDescription?: string;
    enrichedContext?: any;
  },
  requestId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('OPENAI_API_KEY not configured');
  
  console.log(`[${requestId}] [3/5] 👋 Agente GREETING processando...`);
  
  const systemPrompt = getGreetingPrompt(context, context.enrichedContext);
  
  // GREETING agent has NO tools - just conversation
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
      max_tokens: 300
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  const message = data.choices[0].message;
  
  console.log(`[${requestId}] ✅ GREETING agent processou`);
  
  return {
    content: message.content || '',
    toolCalls: undefined // Never has tool calls
  };
}
