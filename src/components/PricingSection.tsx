import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export const PricingSection = () => {
  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      description: "Para pequenos restaurantes",
      features: [
        "Até 50 produtos",
        "1 restaurante",
        "API básica",
        "Suporte por email"
      ]
    },
    {
      name: "Profissional",
      price: "R$ 49",
      description: "Para redes de restaurantes",
      features: [
        "Produtos ilimitados",
        "Até 5 restaurantes",
        "API avançada",
        "Suporte prioritário",
        "Analytics avançado"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      description: "Para grandes operações",
      features: [
        "Tudo do Profissional",
        "Restaurantes ilimitados",
        "Integrações personalizadas",
        "Suporte dedicado",
        "SLA garantido"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos que Crescem com Você
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio e comece a criar dados estruturados hoje mesmo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-orange shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange text-white px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-4xl font-bold text-orange">
                  {plan.price}
                  {plan.price !== "Personalizado" && <span className="text-lg text-muted-foreground">/mês</span>}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-orange" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-orange hover:bg-orange/90' : ''}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.price === "Personalizado" ? "Entrar em Contato" : "Começar Agora"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};