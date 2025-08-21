import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface OnboardingProgress {
  id: string;
  step_completed: number;
  total_steps: number;
  data: any;
  completed_at: string | null;
}

interface OnboardingContextType {
  progress: OnboardingProgress | null;
  steps: OnboardingStep[];
  loading: boolean;
  currentStep: number;
  isCompleted: boolean;
  updateProgress: (step: number, data?: Record<string, any>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const defaultSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Bem-vindo ao MenuBot',
    description: 'Configure suas informações básicas',
    completed: false
  },
  {
    id: 2,
    title: 'Informações do Restaurante',
    description: 'Adicione detalhes do seu restaurante',
    completed: false
  },
  {
    id: 3,
    title: 'Upload de Imagens',
    description: 'Adicione logo e imagem de capa',
    completed: false
  },
  {
    id: 4,
    title: 'Configurar Cardápio',
    description: 'Crie categorias e produtos',
    completed: false
  },
  {
    id: 5,
    title: 'Configurar Agente IA',
    description: 'Personalize seu assistente virtual',
    completed: false
  }
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProgress(data);
        updateStepsCompletion(data.step_completed);
      } else {
        // Criar progresso inicial
        const { data: newProgress, error: createError } = await supabase
          .from('onboarding_progress')
          .insert({
            user_id: user.id,
            step_completed: 0,
            total_steps: 5,
            data: {}
          })
          .select()
          .single();

        if (createError) throw createError;
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('Erro ao carregar progresso do onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStepsCompletion = (completedStep: number) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      completed: step.id <= completedStep
    })));
  };

  const updateProgress = async (step: number, data: Record<string, any> = {}) => {
    if (!user || !progress) return;

    try {
      const updatedData = { ...progress.data, ...data };
      
      const { data: updatedProgress, error } = await supabase
        .from('onboarding_progress')
        .update({
          step_completed: Math.max(step, progress.step_completed),
          data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id)
        .select()
        .single();

      if (error) throw error;
      
      setProgress(updatedProgress);
      updateStepsCompletion(updatedProgress.step_completed);
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    if (!user || !progress) return;

    try {
      const { data: updatedProgress, error } = await supabase
        .from('onboarding_progress')
        .update({
          step_completed: 5,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id)
        .select()
        .single();

      if (error) throw error;
      
      setProgress(updatedProgress);
      updateStepsCompletion(5);
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    if (!user || !progress) return;

    try {
      const { data: updatedProgress, error } = await supabase
        .from('onboarding_progress')
        .update({
          step_completed: 0,
          completed_at: null,
          data: {},
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id)
        .select()
        .single();

      if (error) throw error;
      
      setProgress(updatedProgress);
      updateStepsCompletion(0);
    } catch (error) {
      console.error('Erro ao resetar onboarding:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user]);

  const currentStep = progress?.step_completed || 0;
  const isCompleted = !!progress?.completed_at;

  return (
    <OnboardingContext.Provider 
      value={{
        progress,
        steps,
        loading,
        currentStep,
        isCompleted,
        updateProgress,
        completeOnboarding,
        resetOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding deve ser usado dentro de um OnboardingProvider');
  }
  return context;
}