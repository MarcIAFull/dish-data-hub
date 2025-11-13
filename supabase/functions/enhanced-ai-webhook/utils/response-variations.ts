// Natural response variations to make AI more human-like

export const responseVariations = {
  greeting: [
    "Oi! Tudo bem? 😊",
    "Olá! Como posso te ajudar?",
    "Oi! Seja bem-vindo(a)! 👋",
    "E aí! Tudo certo?",
    "Olá! Que bom ter você aqui! 😄"
  ],
  
  confirmation: [
    "Certinho!",
    "Entendido!",
    "Perfeito!",
    "Combinado! ✅",
    "Show de bola!",
    "Anotado!"
  ],
  
  thanks: [
    "Obrigado(a)! 😊",
    "Valeu!",
    "Agradeço!",
    "Muito obrigado(a)!",
    "Brigadão! 🙏"
  ],
  
  waiting: [
    "Só um momentinho...",
    "Deixa eu verificar...",
    "Aguarda só um segundo...",
    "Já vou checar isso pra você...",
    "Vou dar uma olhadinha..."
  ],
  
  error: [
    "Ops, tive um probleminha aqui... 😅",
    "Desculpa, não consegui processar isso...",
    "Hmm, algo deu errado... Pode tentar de novo?",
    "Eita, falhou aqui... Tenta mais uma vez?"
  ],
  
  goodbye: [
    "Até logo! 👋",
    "Falou! Qualquer coisa é só chamar!",
    "Até mais! Bom apetite! 🍕",
    "Tchau! Volte sempre!",
    "Até breve! 😊"
  ],
  
  askForMore: [
    "Quer mais alguma coisa?",
    "Algo mais?",
    "Posso te ajudar com mais alguma coisa?",
    "Mais algo? 😊",
    "Só isso ou vai querer mais alguma coisa?"
  ],
  
  transition: {
    toMenu: [
      "Deixa eu te mostrar nosso cardápio!",
      "Vou te falar das nossas opções!",
      "Olha só o que temos aqui:",
      "Temos várias coisas gostosas! Vou te contar:"
    ],
    toCheckout: [
      "Beleza! Vamos finalizar então?",
      "Show! Bora pra finalização?",
      "Certo! Vou precisar de algumas informações pra entregar:",
      "Perfeito! Agora só falta finalizar:"
    ],
    toSupport: [
      "Claro! Te ajudo com isso:",
      "Pode deixar! Vou te explicar:",
      "Tranquilo! Olha só:"
    ]
  }
};

export function getRandomResponse(category: keyof typeof responseVariations): string {
  const variations = responseVariations[category];
  
  if (Array.isArray(variations)) {
    return variations[Math.floor(Math.random() * variations.length)];
  }
  
  return '';
}

export function getRandomTransition(to: 'toMenu' | 'toCheckout' | 'toSupport'): string {
  const transitions = responseVariations.transition[to];
  return transitions[Math.floor(Math.random() * transitions.length)];
}

// Natural connectors to link sentences
export const connectors = {
  addition: ['Além disso,', 'E mais:', 'Também temos:', 'Ah, e'],
  continuation: ['Então,', 'Aí,', 'Daí,', 'E então,'],
  conclusion: ['Por fim,', 'Pra finalizar,', 'Pra terminar,', 'E por último,'],
  explanation: ['É que', 'Porque', 'Já que', 'Pois']
};

export function getRandomConnector(type: keyof typeof connectors): string {
  const options = connectors[type];
  return options[Math.floor(Math.random() * options.length)];
}
