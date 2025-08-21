import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  User,
  Building,
  Image,
  Menu,
  Bot,
  Sparkles
} from 'lucide-react';

const stepIcons = [User, Building, Image, Menu, Bot];

export default function Onboarding() {
  const { progress, steps, currentStep, updateProgress, completeOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantDescription: '',
    address: '',
    phone: '',
    whatsapp: '',
    instagram: ''
  });
  const [activeStep, setActiveStep] = useState(Math.max(1, currentStep + 1));

  const progressPercentage = (currentStep / 5) * 100;

  const handleNext = async () => {
    try {
      await updateProgress(activeStep, { [activeStep]: formData });
      
      if (activeStep === 5) {
        await completeOnboarding();
        toast({
          title: 'Onboarding Concluído!',
          description: 'Seu restaurante foi configurado com sucesso.',
        });
        navigate('/dashboard');
      } else {
        setActiveStep(prev => prev + 1);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o progresso.',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Bem-vindo ao MenuBot!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Vamos configurar seu restaurante em alguns passos simples. 
                Em poucos minutos você terá um agente IA funcionando no WhatsApp!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium">Menu Digital</p>
                  <p className="text-sm text-muted-foreground">Página pública otimizada</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium">Agente IA</p>
                  <p className="text-sm text-muted-foreground">WhatsApp automatizado</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium">Classificação Automática</p>
                  <p className="text-sm text-muted-foreground">IA organiza seu cardápio</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">Insights do seu negócio</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Informações do Restaurante</h2>
              <p className="text-muted-foreground">Conte-nos sobre seu restaurante</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Restaurante</Label>
                <Input 
                  id="name"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
                  placeholder="Ex: Pizzaria do João"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description"
                  value={formData.restaurantDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, restaurantDescription: e.target.value }))}
                  placeholder="Descreva seu restaurante, tipo de culinária, especialidades..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="address">Endereço Completo</Label>
                <Textarea 
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade, código postal"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Contatos</h2>
              <p className="text-muted-foreground">Como os clientes podem entrar em contato</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+351 123 456 789"
                />
              </div>
              
              <div>
                <Label htmlFor="whatsapp">WhatsApp (Para o Bot)</Label>
                <Input 
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="+351 123 456 789"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Este será o número do seu agente IA no WhatsApp
                </p>
              </div>
              
              <div>
                <Label htmlFor="instagram">Instagram (Opcional)</Label>
                <Input 
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@meurestaurante"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Configurar Cardápio</h2>
              <p className="text-muted-foreground">Vamos criar sua primeira categoria e produto</p>
            </div>
            
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">O que você vai poder fazer:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Adicionar categorias (Entradas, Pratos Principais, Sobremesas...)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Criar produtos com fotos, preços e descrições</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Organizar automaticamente com IA</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Importar dados de CSV ou inserir manualmente</span>
                </li>
              </ul>
            </div>
            
            <p className="text-center text-muted-foreground">
              Após finalizar o onboarding, você será direcionado para configurar seu cardápio completo
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Agente IA Configurado!</h2>
              <p className="text-muted-foreground">Seu assistente virtual está quase pronto</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">MenuBot IA</h3>
                  <p className="text-sm text-muted-foreground">Assistente personalizado para {formData.restaurantName}</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Responde perguntas sobre o cardápio automaticamente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Recebe e processa pedidos via WhatsApp</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Personalidade adaptada ao seu restaurante</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Aprende continuamente com as interações</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Tudo pronto! Vamos para o dashboard onde você pode gerenciar tudo
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Configuração Inicial</h1>
              <span className="text-sm text-muted-foreground">
                Passo {activeStep} de 5
              </span>
            </div>
            <Progress value={progressPercentage} className="mb-4" />
            
            {/* Steps */}
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = stepIcons[index];
                const isActive = step.id === activeStep;
                const isCompleted = step.id < activeStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : isActive 
                        ? 'border-primary bg-primary text-white' 
                        : 'border-muted-foreground text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs text-center max-w-[80px] ${
                      isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={activeStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            <Button onClick={handleNext}>
              {activeStep === 5 ? 'Finalizar Configuração' : 'Próximo'}
              {activeStep < 5 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}