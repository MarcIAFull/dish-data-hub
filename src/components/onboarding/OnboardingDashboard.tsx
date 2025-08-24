import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Trophy, 
  Zap,
  AlertTriangle,
  Clock
} from 'lucide-react';

export function OnboardingDashboard() {
  const { progress, steps, currentStep, isCompleted } = useOnboarding();
  const navigate = useNavigate();

  if (isCompleted) return null;

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const nextStep = steps.find(step => !step.completed);

  const getMotivationalMessage = () => {
    if (progressPercentage === 0) {
      return "Vamos começar sua jornada! Complete seu perfil para desbloquear todas as funcionalidades.";
    } else if (progressPercentage < 40) {
      return "Ótimo começo! Continue configurando seu restaurante para maximizar suas vendas.";
    } else if (progressPercentage < 80) {
      return "Você está indo muito bem! Faltam apenas alguns passos para finalizar.";
    } else {
      return "Quase lá! Complete os últimos detalhes e comece a vender hoje mesmo.";
    }
  };

  const getBadgeVariant = () => {
    if (progressPercentage < 25) return 'destructive';
    if (progressPercentage < 50) return 'secondary';
    if (progressPercentage < 75) return 'default';
    return 'default';
  };

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              {progressPercentage === 100 ? (
                <Trophy className="w-5 h-5 text-primary" />
              ) : progressPercentage > 50 ? (
                <Zap className="w-5 h-5 text-primary" />
              ) : (
                <Clock className="w-5 h-5 text-orange-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {progressPercentage === 100 ? 'Configuração Completa!' : 'Complete sua Configuração'}
              </CardTitle>
              <CardDescription>
                {getMotivationalMessage()}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getBadgeVariant()}>
            {completedSteps}/{steps.length} etapas
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.slice(0, 4).map((step) => (
            <div 
              key={step.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                step.completed ? 'bg-green-50 border-green-200' : 'bg-muted/30'
              }`}
            >
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.completed ? 'text-green-800' : ''}`}>
                  {step.title}
                </p>
                <p className={`text-xs ${step.completed ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Next Step Call to Action */}
        {nextStep && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-primary">Próximo Passo</h4>
                  <p className="text-sm text-muted-foreground">{nextStep.description}</p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/onboarding')}
                size="sm"
                className="ml-4"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Benefits reminder */}
        {progressPercentage < 100 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Desbloqueie todo o potencial da plataforma
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Complete a configuração para acessar: Menu IA, Chat WhatsApp, Analytics e muito mais!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}