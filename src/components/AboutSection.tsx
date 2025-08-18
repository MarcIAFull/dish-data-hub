import { Users, Target, Lightbulb } from "lucide-react";

export const AboutSection = () => {
  const values = [
    {
      icon: Target,
      title: "Missão",
      description: "Simplificar a criação de dados estruturados de restaurantes para acelerar a adoção de IA no setor alimentício."
    },
    {
      icon: Lightbulb,
      title: "Visão",
      description: "Ser a plataforma líder em dados de restaurantes otimizados para IA, conectando estabelecimentos ao futuro digital."
    },
    {
      icon: Users,
      title: "Valores",
      description: "Inovação, simplicidade e excelência no atendimento aos nossos clientes e suas necessidades específicas."
    }
  ];

  return (
    <section id="about" className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sobre a RestaurantAI
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Nascemos da necessidade de conectar restaurantes ao mundo da inteligência artificial, 
            criando pontes entre dados gastronômicos e tecnologias emergentes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <div key={index} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center">
                  <IconComponent className="h-8 w-8 text-orange" />
                </div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold">
              Por que Escolher a RestaurantAI?
            </h3>
            <p className="text-lg text-muted-foreground">
              Entendemos que cada restaurante é único, e por isso criamos uma plataforma flexível 
              que se adapta às suas necessidades específicas. Nossa tecnologia garante que seus dados 
              sejam sempre acessíveis, estruturados e prontos para qualquer sistema de IA.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <h4 className="font-semibold text-orange">Tecnologia Moderna</h4>
                <p className="text-sm text-muted-foreground">
                  Utilizamos as mais recentes tecnologias web para garantir performance e confiabilidade.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-orange">Suporte Dedicado</h4>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe está sempre pronta para ajudar você a maximizar o potencial da plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};