import { ChefHat } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange" />
              <span className="text-xl font-bold">RestaurantAI</span>
            </div>
            <p className="text-muted-foreground">
              Plataforma para criar bancos de dados de restaurantes otimizados para IA.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Produto</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-orange transition-colors">Recursos</a></li>
              <li><a href="#pricing" className="hover:text-orange transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-orange transition-colors">Documentação</a></li>
              <li><a href="#" className="hover:text-orange transition-colors">API</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Empresa</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#about" className="hover:text-orange transition-colors">Sobre</a></li>
              <li><a href="#" className="hover:text-orange transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-orange transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-orange transition-colors">Suporte</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-orange transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-orange transition-colors">Termos</a></li>
              <li><a href="#" className="hover:text-orange transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 RestaurantAI. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};