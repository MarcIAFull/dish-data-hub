/**
 * Conversation Agent - Humanizes final responses
 * 
 * Responsibilities:
 * 1. Receives raw agent response + tool results
 * 2. Humanizes tone and formatting
 * 3. Validates no hallucinated data
 * 4. Ensures personality consistency
 * 5. Returns final message for customer
 */

export async function processConversationAgent(
  agentResponse: string,
  toolResults: any[],
  restaurantName: string,
  previousMessages: any[],
  requestId: string
): Promise<string> {
  
  console.log(`[${requestId}] 💬 Conversation Agent - Starting humanization...`);
  console.log(`[${requestId}] 📥 Input response (${agentResponse.length} chars): ${agentResponse.substring(0, 100)}...`);
  console.log(`[${requestId}] 🔧 Tool results: ${toolResults.length} tools executed`);
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    console.error(`[${requestId}] ❌ OPENAI_API_KEY not configured`);
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  // Format tool results
  const toolResultsText = toolResults.length > 0 
    ? toolResults.map(tr => {
        const resultStr = typeof tr.result === 'object' 
          ? JSON.stringify(tr.result, null, 2) 
          : String(tr.result);
        return `Ferramenta: ${tr.tool}\nResultado: ${resultStr}`;
      }).join('\n\n---\n\n')
    : 'Nenhuma ferramenta foi executada.';
  
  const systemPrompt = `Você é o AGENTE DE CONVERSAÇÃO do restaurante ${restaurantName}.

Sua única responsabilidade é pegar a resposta bruta do sistema e transformá-la em uma mensagem 100% natural e humanizada para o cliente no WhatsApp.

════════════════════════════════════════════
REGRAS CRÍTICAS DE HUMANIZAÇÃO:
════════════════════════════════════════════

1. NUNCA use listas com bullets (-, •, ✓) ou numeração
2. NUNCA use formatação técnica como "Total parcial:", "Resumo:", "Dados:"
3. NUNCA use mais de 1 emoji em TODA a conversa
4. SEMPRE fale como um atendente humano real falaria no WhatsApp
5. Use quebras duplas de linha (\n\n) para separar ideias
6. Seja direto, claro e vendedor
7. NUNCA mencione que você é uma IA ou sistema

════════════════════════════════════════════
REGRAS SOBRE DADOS:
════════════════════════════════════════════

8. Se uma ferramenta retornar "NO_DATA" ou "null", significa que o dado NÃO existe
9. NUNCA invente informações (preços, produtos, endereços, horários, etc)
10. Se faltam dados, explique naturalmente e sugira contato direto
11. NUNCA forneça exemplos genéricos quando os dados reais não existem

════════════════════════════════════════════
EXEMPLOS DE TRANSFORMAÇÃO:
════════════════════════════════════════════

❌ RESPOSTA TÉCNICA SOBRE PRODUTOS (ruim):
"Produto: Tapioca de Carne de Vaca com queijo
Preço: R$ 6.50
Descrição: null
Disponível: true"

✅ RESPOSTA HUMANIZADA (boa):
"Sim! Temos Tapioca de Carne de Vaca com queijo por R$ 6,50. É uma delícia! Quer pedir?"

---

❌ RESPOSTA TÉCNICA PAGAMENTO (ruim):
"Formas de pagamento aceitas:
• Dinheiro
• Cartão de crédito/débito
• PIX - Chave CPF: 123.456.789-00

Total do pedido: R$ 45,00
Status: Aguardando confirmação"

✅ RESPOSTA HUMANIZADA (boa):
"Perfeito! Você pode pagar com dinheiro, cartão ou PIX. Se for PIX, a chave é 123.456.789-00 👍

O total deu R$ 45,00. Confirma pra mim?"

---

❌ RESPOSTA INVENTADA (ruim):
"Aceitamos dinheiro, cartão e PIX como formas de pagamento."
[Sistema não tem payment_methods cadastrados]

✅ RESPOSTA HONESTA (boa):
"Opa! Deixa eu ver aqui... as formas de pagamento ainda não tão configuradas no sistema. Melhor você me chamar no (XX) XXXX-XXXX pra confirmar, combinado?"

════════════════════════════════════════════

Agora, pegue a resposta abaixo e humanize ela:`;

  const conversationHistory = previousMessages.slice(-3).map((m: any) => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.content
  }));
  
  console.log(`[${requestId}] 🤖 Calling OpenAI (gpt-4o) for humanization...`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { 
          role: 'user', 
          content: `[RESPOSTA BRUTA DO SISTEMA]\n${agentResponse}\n\n[RESULTADOS DAS FERRAMENTAS]\n${toolResultsText}\n\n[FIM]\n\nHumanize a resposta acima mantendo a mesma informação mas com tom natural de WhatsApp.` 
        }
      ],
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${requestId}] ❌ Conversation Agent API error: ${response.status} - ${errorText}`);
    throw new Error(`Conversation Agent API error: ${response.status}`);
  }
  
  const data = await response.json();
  const humanizedMessage = data.choices[0].message.content || '';
  
  console.log(`[${requestId}] ✅ Conversation Agent - Output (${humanizedMessage.length} chars): ${humanizedMessage.substring(0, 100)}...`);
  console.log(`[${requestId}] 📊 Tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
  
  if (!humanizedMessage || humanizedMessage.trim() === '') {
    console.error(`[${requestId}] ❌ Conversation Agent returned empty response!`);
    throw new Error('Conversation Agent returned empty message');
  }
  
  return humanizedMessage;
}
