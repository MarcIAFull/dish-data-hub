import { Button } from "@/components/ui/button";
import { ChefHat, Menu, X } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-orange" />
          <span className="text-xl font-bold text-foreground">RestaurantAI</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-orange transition-colors">
            Recursos
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-orange transition-colors">
            Preços
          </a>
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-orange transition-colors">
            Sobre
          </a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" className="text-sm font-medium">
            Entrar
          </Button>
          <Button className="bg-orange hover:bg-orange/90 text-white">
            Começar Grátis
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            <a href="#features" className="block text-sm font-medium text-muted-foreground">
              Recursos
            </a>
            <a href="#pricing" className="block text-sm font-medium text-muted-foreground">
              Preços
            </a>
            <a href="#about" className="block text-sm font-medium text-muted-foreground">
              Sobre
            </a>
            <div className="pt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                Entrar
              </Button>
              <Button className="w-full bg-orange hover:bg-orange/90 text-white">
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};