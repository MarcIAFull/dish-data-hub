import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Teste Gratuito",
      price: "€0",
      period: "14 dias",
      description: "Experimente todas as funcionalidades",
      features: [
        "Até 50 pedidos",
        "1 restaurante",
        "Atendimento IA 24/7",
        "WhatsApp integrado",
        "Central de pedidos",
        "Sem custo de implantação"
      ],
      cta: "Começar Teste",
      highlighted: false,
      setupFee: null
    },
    {
      name: "Profissional",
      price: "€97",
      period: "mês",
      setupFee: "€247",
      setupLabel: "Taxa de implantação única",
      description: "Para restaurantes em crescimento",
      features: [
        "Até 1000 pedidos/mês",
        "Restaurantes ilimitados",
        "IA personalizada com treino",
        "Validação de moradas PT",
        "Analíticas avançadas",
        "Notificações WhatsApp",
        "Suporte prioritário",
        "Configuração assistida"
      ],
      cta: "Começar Agora",
      highlighted: true,
      badge: "Mais Popular"
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: null,
      description: "Para grandes operações",
      features: [
        "Tudo do Profissional",
        "Pedidos ilimitados",
        "SLA garantido",
        "Suporte dedicado 24/7",
        "Integrações personalizadas",
        "Gestão de contas",
        "Relatórios personalizados",
        "Onboarding premium"
      ],
      cta: "Contactar Vendas",
      highlighted: false,
      setupFee: null
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Preços <span className="text-primary">Transparentes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano que melhor se adequa ao seu negócio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={plan.highlighted ? "md:scale-105" : ""}
            >
              <Card className={`h-full relative ${
                plan.highlighted 
                  ? "border-primary shadow-2xl" 
                  : "border-border/50"
              }`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1 inline" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="text-5xl font-bold">
                      {plan.price}
                      {plan.period && (
                        <span className="text-lg text-muted-foreground font-normal">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    
                    {plan.setupFee && (
                      <div className="mt-3">
                        <Badge variant="outline" className="text-sm py-1">
                          + {plan.setupFee} {plan.setupLabel}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-block p-6 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              💼 <strong>Mais de 1000 pedidos/mês?</strong> Contacte-nos para um plano personalizado que se adequa ao volume do seu negócio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};