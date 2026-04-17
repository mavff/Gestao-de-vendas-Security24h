'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getFallbackRouteForRole } from '../src/config/rbac';
import { useAuth } from '../src/contexts/AuthContext';

export default function Home() {
  const { role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    router.replace(getFallbackRouteForRole(role));
  }, [isAuthenticated, isLoading, role, router]);

  return null;
}
