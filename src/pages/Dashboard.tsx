import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, ChefHat, Settings, LogOut, Crown, Zap, Bot, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

console.log('Dashboard component loaded - icons:', { Plus, ChefHat, Settings, LogOut });

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { subscription, hasFeature, isWithinLimits } = useSubscription();
  const { progress, isCompleted, currentStep } = useOnboarding();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRestaurants();
    }
  }, [user]);

  const fetchRestaurants = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os restaurantes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!loading && progress && !isCompleted && currentStep < 5) {
      navigate('/onboarding');
    }
  }, [progress, isCompleted, currentStep, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Olá, {user?.user_metadata?.display_name || user?.email}! Gerencie seus restaurantes.
            </p>
          </div>
          <div className="flex gap-2">
            {subscription && (
              <div className="flex items-center gap-2">
                <Badge variant={subscription.plan.type === 'free' ? 'secondary' : 'default'}>
                  {subscription.plan.type === 'free' && <Zap className="w-3 h-3 mr-1" />}
                  {subscription.plan.type === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                  {subscription.plan.name}
                </Badge>
              </div>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Subscription Status Card */}
        {subscription && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Status da Assinatura
                  </CardTitle>
                  <CardDescription>
                    Plano {subscription.plan.name} - {subscription.plan.type}
                  </CardDescription>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status === 'active' ? 'Ativo' : subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Restaurantes</p>
                  <p className="text-2xl font-bold">
                    {restaurants.length}/{subscription.plan.max_restaurants}
                  </p>
                  <Progress 
                    value={(restaurants.length / subscription.plan.max_restaurants) * 100} 
                    className="mt-2"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Recursos Inclusos</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {subscription.plan.ai_classification && (
                      <Badge variant="outline" className="text-xs">IA</Badge>
                    )}
                    {subscription.plan.whatsapp_integration && (
                      <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                    )}
                    {subscription.plan.analytics && (
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                    )}
                    {subscription.plan.api_access && (
                      <Badge variant="outline" className="text-xs">API</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Preço</p>
                  <p className="text-2xl font-bold">
                    €{subscription.plan.price_monthly}{subscription.plan.price_monthly > 0 && '/mês'}
                  </p>
                  {subscription.plan.type === 'free' && (
                    <Button variant="outline" size="sm" className="mt-2">
                      Fazer Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Limits Warning */}
        {subscription && !isWithinLimits('restaurants', restaurants.length) && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">
                  Limite de restaurantes atingido! Faça upgrade para adicionar mais restaurantes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {restaurants.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle>Nenhum restaurante cadastrado</CardTitle>
                <CardDescription>
                  Crie seu primeiro restaurante para começar a gerenciar seu menu
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate('/restaurant/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Restaurante
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Meus Restaurantes</h2>
                <Button 
                  onClick={() => navigate('/restaurant/new')}
                  disabled={subscription && !isWithinLimits('restaurants', restaurants.length)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Restaurante
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                          <CardDescription>/{restaurant.slug}</CardDescription>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          restaurant.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {restaurant.is_active ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {restaurant.description || 'Sem descrição'}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                          className="flex-1"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Gerenciar
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => window.open(`/r/${restaurant.slug}`, '_blank')}
                          className="flex-1"
                        >
                          Ver Página
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}