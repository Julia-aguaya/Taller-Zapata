import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '@/modules/auth/providers/session-provider';

export const AuthorizationGate = ({ navigationCode, children }) => {
  const { session } = useSession();
  const location = useLocation();
  const allowed = session?.navigation?.items?.some((item) => item.code === navigationCode && item.enabled);
  const fallbackRoute = session?.navigation?.defaultRoute || '/panel';

  useEffect(() => {
    if (!allowed) {
      toast.error('No tenés permisos para acceder a esta sección.');
    }
  }, [allowed]);

  if (!allowed) {
    return <Navigate to={fallbackRoute} replace state={{ deniedFrom: location.pathname }} />;
  }

  return children;
};
