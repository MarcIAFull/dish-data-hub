import { HeroButton } from "@/components/ui/hero-button";
import { ArrowRight, Database, Bot, Globe } from "lucide-react";
import heroImage from "@/assets/hero-restaurant.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Pratos deliciosos de restaurante" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-center text-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Dados de <span className="bg-gradient-to-r from-orange to-red bg-clip-text text-transparent">Restaurante</span> para <span className="bg-gradient-to-r from-orange to-red bg-clip-text text-transparent">IA</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Plataforma completa para criar e gerenciar bancos de dados de restaurantes 
            otimizados para assistentes de IA e sistemas de raspagem
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <HeroButton variant="primary" className="text-lg">
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </HeroButton>
            <HeroButton variant="secondary" className="text-lg">
              Ver Demo
            </HeroButton>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="flex flex-col items-center space-y-4 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Database className="h-12 w-12 text-orange" />
              <h3 className="text-xl font-semibold">Dados Estruturados</h3>
              <p className="text-gray-300 text-center">Organize produtos, categorias e informações de forma otimizada para IA</p>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Bot className="h-12 w-12 text-orange" />
              <h3 className="text-xl font-semibold">IA-Ready</h3>
              <p className="text-gray-300 text-center">Formato otimizado para assistentes e agentes inteligentes</p>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Globe className="h-12 w-12 text-orange" />
              <h3 className="text-xl font-semibold">API Pública</h3>
              <p className="text-gray-300 text-center">URLs raspáveis com JSON-LD e HTML semântico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};