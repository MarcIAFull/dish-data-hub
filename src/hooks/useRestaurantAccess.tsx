import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantAccess {
  hasAccess: boolean;
  loading: boolean;
  restaurant: any | null;
}

export function useRestaurantAccess(restaurantId: string | undefined): RestaurantAccess {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any | null>(null);

  useEffect(() => {
    checkAccess();
  }, [restaurantId, user]);

  const checkAccess = async () => {
    if (!restaurantId || !user) {
      setHasAccess(false);
      setLoading(false);
      setRestaurant(null);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Access check error:', error);
        setHasAccess(false);
        setRestaurant(null);
      } else {
        setHasAccess(true);
        setRestaurant(data);
      }
    } catch (error) {
      console.error('Error checking restaurant access:', error);
      setHasAccess(false);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  return { hasAccess, loading, restaurant };
}