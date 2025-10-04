import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminRoleState {
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useAdminRole(): AdminRoleState {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Call the is_admin function created in the database
        const { data, error: rpcError } = await supabase
          .rpc('is_admin', { _user_id: user.id });

        if (rpcError) {
          throw rpcError;
        }

        setIsAdmin(data ?? false);
      } catch (err) {
        console.error('Error checking admin role:', err);
        setError(err instanceof Error ? err : new Error('Failed to check admin role'));
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminRole();
  }, [user]);

  return { isAdmin, isLoading, error };
}
