import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurantAccess } from '@/hooks/useRestaurantAccess';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRestaurantRouteProps {
  children: (restaurant: any) => React.ReactNode;
}

export function ProtectedRestaurantRoute({ children }: ProtectedRestaurantRouteProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAccess, loading, restaurant } = useRestaurantAccess(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar este restaurante ou ele não existe.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children(restaurant)}</>;
}