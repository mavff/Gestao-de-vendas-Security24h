'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { theme } from './theme';

type ToastType = 'error' | 'success' | 'warning';

type Toast = { id: number; message: string; type: ToastType };

type ToastCtx = {
  showToast: (message: string, type?: ToastType) => void;
};

const Ctx = createContext<ToastCtx>({ showToast: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const bgMap: Record<ToastType, string> = {
    error: theme.danger,
    success: theme.success,
    warning: theme.warning,
  };

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'grid', gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: bgMap[t.type],
              color: '#111',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              animation: 'fadeIn 200ms ease',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
