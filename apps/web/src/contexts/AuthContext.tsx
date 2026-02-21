'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { UserRole } from '../types';

export type AuthUser = {
  id: number;
  username: string;
  name: string;
  role: UserRole;
};

type AuthCtx = {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const TOKEN_KEY = 'sec24h_token';
const REFRESH_KEY = 'sec24h_refresh';
const USER_KEY = 'sec24h_user';

const VALID_ROLES: UserRole[] = ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR', 'TECNICO', 'INFRA', 'MONITOR'];
function isValidRole(v: string): v is UserRole {
  return VALID_ROLES.includes(v as UserRole);
}

const Ctx = createContext<AuthCtx>({
  user: null,
  role: 'VENDEDOR',
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed?.role && isValidRole(parsed.role)) {
          setUser(parsed);
        }
      }
    } catch {
      // ignora JSON inválido
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((data?.message as string) || 'Credenciais inválidas');
    }

    const data = await res.json() as {
      accessToken: string;
      refreshToken: string;
      user: { sub: number; username: string; name: string; role: string };
    };

    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);

    const authUser: AuthUser = {
      id: data.user.sub,
      username: data.user.username,
      name: data.user.name,
      role: isValidRole(data.user.role) ? data.user.role : 'VENDEDOR',
    };
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Enquanto hidrata não renderiza nada (evita flash de rota protegida)
  if (isLoading) return null;

  return (
    <Ctx.Provider value={{
      user,
      role: user?.role ?? 'VENDEDOR',
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
