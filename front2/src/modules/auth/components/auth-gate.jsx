import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/modules/auth/providers/session-provider';
import { FullScreenLoader } from '@/shared/ui/full-screen-loader';

export const AuthGate = ({ children }) => {
  const { isAuthenticated, isLoading, hasStoredTokens, authError } = useSession();
  const location = useLocation();

  useEffect(() => {
    if (authError) {
      toast.error('La sesion expiro. Volve a ingresar.');
    }
  }, [authError]);

  if (isLoading) {
    return <FullScreenLoader label="Levantando session y permisos..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};
