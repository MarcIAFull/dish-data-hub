import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">🇵🇹 Feito para Portugal</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Atendimento Automatizado que{" "}
                <span className="text-primary">Aumenta as Vendas</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                IA que atende, processa e gere pedidos 24/7 via WhatsApp. Configure em 5 minutos. Sem código.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
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
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Demonstração
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Pedidos/dia</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Restaurantes</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
            </div>
          </div>

          {/* Right preview */}
          <div className="relative">
            <div className="relative rounded-2xl border bg-card/50 backdrop-blur-sm shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">IA Zendy</div>
                  <div className="text-sm text-muted-foreground">Online agora</div>
                </div>
              </div>

              {/* Mock conversation */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                    <p className="text-sm">Olá! Gostaria de fazer um pedido</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                    <p className="text-sm">Olá! Com certeza! Aqui está o nosso menu...</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                    <p className="text-sm">🍕 Pizzas • 🍔 Hambúrgueres • 🥗 Saladas</p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Atendimento 24/7 automatizado</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Processamento instantâneo de pedidos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Validação automática de moradas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};