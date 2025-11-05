import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, LayoutGrid, MessagesSquare, Store, BarChart3, Plug } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Atendimento IA via WhatsApp",
      description: "A IA conversa com clientes, apresenta o menu, faz upsell e processa pedidos automaticamente",
      highlights: ["24/7", "Upsell inteligente", "Multi-idioma"],
      color: "text-blue-500"
    },
    {
      icon: LayoutGrid,
      title: "Central de Pedidos Kanban",
      description: "Visualize todos os pedidos em tempo real com notificações e gestão drag-and-drop",
      highlights: ["7 estados", "Notificações sonoras", "Filtros avançados"],
      color: "text-purple-500"
    },
    {
      icon: MessagesSquare,
      title: "Gestão de Conversas",
      description: "Histórico completo de todas as conversas, estatísticas e insights de atendimento",
      highlights: ["Busca avançada", "Estatísticas", "Filtros inteligentes"],
      color: "text-green-500"
    },
    {
      icon: Store,
      title: "Multi-Restaurante",
      description: "Gerencie vários restaurantes numa única conta com configurações independentes",
      highlights: ["Ilimitado", "Configuração individual", "Relatórios por loja"],
      color: "text-orange-500"
    },
    {
      icon: BarChart3,
      title: "Analíticas Inteligentes",
      description: "Métricas em tempo real de vendas, produtos mais vendidos e performance",
      highlights: ["Tempo real", "Exportação CSV", "Insights de IA"],
      color: "text-cyan-500"
    },
    {
      icon: Plug,
      title: "Integrações Nativas",
      description: "WhatsApp Business, validação de moradas e sistemas de pagamento",
      highlights: ["WhatsApp API", "Validação PT", "Pagamentos"],
      color: "text-pink-500"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Funcionalidades <span className="text-primary">Completas</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tudo o que precisa para automatizar e gerir pedidos com inteligência artificial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index}>
              <Card className="group hover:shadow-lg transition-all duration-300 h-full border-border/50 hover:border-primary/50">
                <CardHeader>
                  <feature.icon className={`h-10 w-10 mb-4 ${feature.color}`} />
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
