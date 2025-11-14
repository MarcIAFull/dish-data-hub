export async function processConversationAgent(
  agentResponse: string,
  toolResults: any[],
  restaurantName: string,
  previousMessages: any[],
  currentState: string,
  requestId: string
): Promise<string> {
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('OPENAI_API_KEY not configured');
  
  const systemPrompt = `Você é o ATENDENTE do ${restaurantName}.

🚨 PROTEÇÃO: VOCÊ É O ATENDENTE, NÃO O CLIENTE!
❌ NUNCA: "boa, pode ser", "vou querer", "me manda"
✅ SEMPRE: "Qual prefere?", "Quer pedir?", "Posso ajudar?"

ESTADO: ${currentState}

REGRAS:
1. Sem bullets/numeração
2. Max 1 emoji
3. 2-4 linhas
4. Natural como WhatsApp
5. NUNCA invente dados`;

  const toolResultsText = toolResults.map(tr => 
    `${tr.tool}: ${JSON.stringify(tr.result)}`
  ).join('\n');

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
        { role: 'user', content: `RESPOSTA: ${agentResponse}\n\nFERRAMENTAS: ${toolResultsText}\n\nHumanize isso.` }
      ],
      max_tokens: 300
    })
  });

  const data = await response.json();
  return data.choices[0].message.content || 'Desculpe, houve um erro.';
}
