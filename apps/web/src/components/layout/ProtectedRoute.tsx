'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';
import { canAccess, getFallbackRouteForRole } from '../../config/rbac';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const redirected = useRef(false);

  const allowed = isAuthenticated && canAccess(role, pathname);
  const fallbackPath = getFallbackRouteForRole(role);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Não está autenticado — vai para login
      if (!redirected.current) {
        redirected.current = true;
        router.replace('/login');
      }
      return;
    }

    if (!canAccess(role, pathname) && !redirected.current) {
      redirected.current = true;
      showToast('Acesso negado: sem permissão para esta página.', 'error');
      router.replace(fallbackPath);
    }
  }, [isLoading, isAuthenticated, role, pathname, fallbackPath, router, showToast]);

  useEffect(() => {
    redirected.current = false;
  }, [pathname]);

  if (!allowed) return null;

  return <>{children}</>;
}
