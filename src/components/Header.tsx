import { Button } from "@/components/ui/button";
import { Bot, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <span className="text-xl font-bold text-foreground">Zendy</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Gestor de Pedidos com IA</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Funcionalidades
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Como Funciona
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Preços
          </a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <Button 
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="text-sm font-medium"
                onClick={() => navigate('/auth')}
              >
                Entrar
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
              >
                Começar Teste Gratuito
              </Button>
            </>
          )}
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
              Funcionalidades
            </a>
            <a href="#how-it-works" className="block text-sm font-medium text-muted-foreground">
              Como Funciona
            </a>
            <a href="#pricing" className="block text-sm font-medium text-muted-foreground">
              Preços
            </a>
            <div className="pt-4 space-y-2">
              {user ? (
                <Button 
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => navigate('/auth')}
                  >
                    Entrar
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/auth')}
                  >
                    Começar Teste Gratuito
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};