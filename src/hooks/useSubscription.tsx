import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'free' | 'basic' | 'premium' | 'enterprise';
  price_monthly: number;
  price_yearly: number;
  max_restaurants: number;
  max_products: number;
  ai_classification: boolean;
  whatsapp_integration: boolean;
  analytics: boolean;
  api_access: boolean;
  features: any;
}

interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  trial_end: string | null;
  current_period_end: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  hasFeature: (feature: string) => boolean;
  isWithinLimits: (type: 'restaurants' | 'products', current: number) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');
      
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSubscription({
          id: data.id,
          plan: data.plan as SubscriptionPlan,
          status: data.status,
          trial_end: data.trial_end,
          current_period_end: data.current_period_end
        });
      } else {
        // Usuário sem assinatura ativa - criar assinatura free
        const freePlan = plans.find(p => p.type === 'free');
        if (freePlan) {
          const { data: newSub, error: subError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: user.id,
              plan_id: freePlan.id,
              status: 'active'
            })
            .select(`
              *,
              plan:subscription_plans(*)
            `)
            .single();

          if (subError) throw subError;
          
          setSubscription({
            id: newSub.id,
            plan: newSub.plan as SubscriptionPlan,
            status: newSub.status,
            trial_end: newSub.trial_end,
            current_period_end: newSub.current_period_end
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    setLoading(true);
    await fetchSubscription();
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription || !subscription.plan.features) return false;
    return Array.isArray(subscription.plan.features) ? subscription.plan.features.includes(feature) : false;
  };

  const isWithinLimits = (type: 'restaurants' | 'products', current: number): boolean => {
    if (!subscription) return false;
    
    const limit = type === 'restaurants' 
      ? subscription.plan.max_restaurants 
      : subscription.plan.max_products;
    
    return current < limit;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      fetchSubscription();
    }
  }, [user, plans]);

  return (
    <SubscriptionContext.Provider 
      value={{
        subscription,
        plans,
        loading,
        hasFeature,
        isWithinLimits,
        refreshSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve ser usado dentro de um SubscriptionProvider');
  }
  return context;
}