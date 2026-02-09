'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/components/common/Toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
