import { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AuthExpiredError } from '@/shared/api/http-client';
import { loginRequest, logoutRequest, getSessionBootstrap } from '@/modules/auth/api/auth-api';
import { clearStoredAuth, readStoredAuth } from '@/shared/auth/session-storage';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const stored = readStoredAuth();

  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: getSessionBootstrap,
    enabled: Boolean(stored?.accessToken),
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      toast.success('Sesion iniciada. Vamos al panel.');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: async () => {
      clearStoredAuth();
      await queryClient.removeQueries({ queryKey: ['auth'] });
      await queryClient.removeQueries({ queryKey: ['panel'] });
      toast.message('Sesion cerrada.');
    },
  });

  const value = useMemo(() => {
    const authError = sessionQuery.error instanceof AuthExpiredError;

    return {
      session: sessionQuery.data ?? null,
      isAuthenticated: Boolean(sessionQuery.data),
      isLoading: sessionQuery.isLoading || loginMutation.isPending || logoutMutation.isPending,
      hasStoredTokens: Boolean(readStoredAuth()?.accessToken),
      authError,
      login: async (credentials) => {
        try {
          await loginMutation.mutateAsync(credentials);
        } catch (error) {
          toast.error(error.message || 'No se pudo iniciar sesion.');
          throw error;
        }
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
      refreshSession: async () => {
        try {
          await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
        } catch (error) {
          if (error instanceof AuthExpiredError) {
            clearStoredAuth();
          }
        }
      },
    };
  }, [loginMutation, logoutMutation, queryClient, sessionQuery.data, sessionQuery.error, sessionQuery.isLoading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }

  return context;
};
