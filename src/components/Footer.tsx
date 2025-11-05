import { Bot } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Zendy</span>
            </div>
            <p className="text-muted-foreground">
              Gestor de pedidos com IA para restaurantes em Portugal.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Produto</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Preços</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">Como Funciona</a></li>
              <li><a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Empresa</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Suporte</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Serviço</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">RGPD</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Zendy. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};