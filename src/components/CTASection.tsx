import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTASection = () => {
  const navigate = useNavigate();

  const benefits = [
    "Sem cartão de crédito",
    "Configuração em 5 minutos",
    "Suporte em português",
    "Cancelamento a qualquer momento"
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />

      <div className="container relative">
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-2xl max-w-4xl mx-auto">
            <CardContent className="p-12">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold">
                    Pronto para Automatizar o Seu Restaurante?
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Junte-se a dezenas de restaurantes em Portugal que já usam IA para atender melhor e vender mais
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="text-lg group"
                    onClick={() => navigate('/auth')}
                  >
                    Começar Teste Gratuito
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg"
                  >
                    Agendar Demonstração
                  </Button>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 pt-4">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </section>
  );
};
