'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';
import { canAccess, getFallbackRouteForRole } from '../../config/rbac';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const redirected = useRef(false);

  const allowed = canAccess(role, pathname);
  const fallbackPath = getFallbackRouteForRole(role);

  useEffect(() => {
    if (!allowed && !redirected.current) {
      redirected.current = true;
      showToast('Acesso negado: sem permissao para esta pagina.', 'error');
      router.replace(fallbackPath);
    }
  }, [allowed, fallbackPath, router, showToast]);

  // Reset ref when pathname changes (user navigated to a new valid page)
  useEffect(() => {
    redirected.current = false;
  }, [pathname]);

  if (!allowed) return null;

  return <>{children}</>;
}
