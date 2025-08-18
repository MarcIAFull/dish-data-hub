import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, Code, Search, Shield, Zap } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Upload,
      title: "Upload Simples",
      description: "Interface intuitiva para cadastrar produtos e informações dos restaurantes"
    },
    {
      icon: Camera,
      title: "Gestão de Fotos",
      description: "Upload otimizado de imagens com compressão automática e múltiplos formatos"
    },
    {
      icon: Code,
      title: "API Estruturada",
      description: "Dados organizados em JSON-LD com schema.org para máxima compatibilidade"
    },
    {
      icon: Search,
      title: "SEO Otimizado",
      description: "Páginas públicas otimizadas para motores de busca e raspagem de dados"
    },
    {
      icon: Shield,
      title: "Acesso Controlado",
      description: "Sistema de login simples para uso interno com controle de permissões"
    },
    {
      icon: Zap,
      title: "Performance",
      description: "Páginas rápidas com cache inteligente e CDN para imagens"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Recursos <span className="text-orange">Completos</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tudo que você precisa para criar e gerenciar dados de restaurantes 
            otimizados para assistentes de IA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-card transition-all duration-300 border-border/50 hover:border-orange/50">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-light rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-8 w-8 text-orange group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};