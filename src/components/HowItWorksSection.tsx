import { MessageSquare, Bot, ShoppingCart, LayoutGrid } from "lucide-react";

export const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Cliente Inicia Conversa",
      description: "Cliente envia mensagem via WhatsApp para o número do restaurante",
      icon: MessageSquare,
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: "02",
      title: "IA Processa e Atende",
      description: "A IA apresenta o menu, responde dúvidas, sugere produtos e valida morada",
      icon: Bot,
      color: "from-purple-500 to-pink-500"
    },
    {
      number: "03",
      title: "Pedido Criado Automaticamente",
      description: "Sistema cria o pedido com todos os dados validados e calcula valores",
      icon: ShoppingCart,
      color: "from-orange-500 to-red-500"
    },
    {
      number: "04",
      title: "Gestão no Kanban",
      description: "Pedido aparece na central para acompanhamento e gestão visual",
      icon: LayoutGrid,
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Como <span className="text-primary">Funciona</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Do atendimento ao pedido em 4 passos simples
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary to-primary/20 hidden md:block" />
          
          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Number badge */}
                <div className="flex-shrink-0 relative z-10">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
                    <div className={`flex items-start gap-4 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse md:justify-end'}`}>
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className={index % 2 === 0 ? 'text-left' : 'md:text-right text-left'}>
                        <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
