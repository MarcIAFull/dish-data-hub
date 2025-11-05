import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingGuideProps {
  restaurantId: string;
  onNavigate?: (tab: string) => void;
}

export function OnboardingGuide({ restaurantId, onNavigate }: OnboardingGuideProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProgress();
  }, [restaurantId]);

  const checkProgress = async () => {
    try {
      setLoading(true);

      // Check categories
      const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      // Check products
      const { count: productsCount } = await supabase
        .from('products')
        .select(`
          id,
          categories!inner(restaurant_id)
        `, { count: 'exact', head: true })
        .eq('categories.restaurant_id', restaurantId)
        .eq('is_active', true);

      // Check modifiers
      const { count: modifiersCount } = await supabase
        .from('product_modifiers')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      // Check agent
      const { data: agent } = await supabase
        .from('agents')
        .select('evolution_api_instance, is_active')
        .eq('restaurant_id', restaurantId)
        .single();

      const newSteps: OnboardingStep[] = [
        {
          id: 1,
          title: 'Criar categorias',
          description: 'Organize seu cardápio em categorias (ex: Pizzas, Bebidas)',
          completed: (categoriesCount || 0) > 0,
          action: {
            label: 'Adicionar categorias',
            onClick: () => onNavigate?.('categories')
          }
        },
        {
          id: 2,
          title: 'Adicionar produtos',
          description: 'Cadastre pelo menos 3 produtos no seu cardápio',
          completed: (productsCount || 0) >= 3,
          action: {
            label: 'Adicionar produtos',
            onClick: () => onNavigate?.('products')
          }
        },
        {
          id: 3,
          title: 'Configurar complementos',
          description: 'Configure adicionais e modificadores para seus produtos',
          completed: (modifiersCount || 0) > 0,
          action: {
            label: 'Adicionar complementos',
            onClick: () => onNavigate?.('operation')
          }
        },
        {
          id: 4,
          title: 'Configurar agente IA',
          description: 'Configure a instância do WhatsApp para receber pedidos',
          completed: !!agent?.evolution_api_instance && agent?.is_active,
          action: {
            label: 'Configurar agente',
            onClick: () => onNavigate?.('agent')
          }
        },
        {
          id: 5,
          title: 'Testar no WhatsApp',
          description: 'Envie uma mensagem de teste para validar o fluxo completo',
          completed: false
        }
      ];

      setSteps(newSteps);

      const completedCount = newSteps.filter(s => s.completed).length;
      const progressPercentage = (completedCount / newSteps.length) * 100;
      setProgress(progressPercentage);

      // Auto-hide when 100% complete
      if (progressPercentage === 100) {
        setTimeout(() => setIsVisible(false), 3000);
      }

    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible || loading) {
    return null;
  }

  const completedSteps = steps.filter(s => s.completed).length;
  const isComplete = completedSteps === steps.length;

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {isComplete ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Configuração concluída! 🎉
                </>
              ) : (
                <>Guia de Configuração</>
              )}
            </CardTitle>
            <CardDescription>
              {isComplete 
                ? 'Seu restaurante está pronto para receber pedidos!' 
                : 'Complete os passos abaixo para ativar seu sistema de pedidos'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSteps} de {steps.length} passos concluídos
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.completed 
                ? 'bg-green-50 dark:bg-green-950/20' 
                : 'bg-muted/50 hover:bg-muted'
            }`}
          >
            <div className="mt-0.5">
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{step.title}</h4>
                {step.completed && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Concluído
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>

            {!step.completed && step.action && (
              <Button
                size="sm"
                variant="ghost"
                onClick={step.action.onClick}
                className="gap-1"
              >
                {step.action.label}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}