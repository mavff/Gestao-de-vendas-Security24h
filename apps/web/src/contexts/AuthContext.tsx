'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { UserRole } from '../types';

type AuthCtx = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const STORAGE_KEY = 'sec24h_demo_role';
const DEFAULT_ROLE: UserRole = 'ADMIN';

const Ctx = createContext<AuthCtx>({ role: DEFAULT_ROLE, setRole: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidRole(stored)) {
      setRoleState(stored as UserRole);
    }
    setReady(true);
  }, []);

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    localStorage.setItem(STORAGE_KEY, r);
  }, []);

  // Avoid flash of wrong role on hydration
  if (!ready) return null;

  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}

const validRoles: UserRole[] = ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR', 'TECNICO', 'INFRA', 'MONITOR'];

function isValidRole(value: string): value is UserRole {
  return validRoles.includes(value as UserRole);
}
