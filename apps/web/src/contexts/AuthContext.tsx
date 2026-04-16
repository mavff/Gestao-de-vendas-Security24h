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
const REFRESH_KEY   = 'sec24h_refresh';
const USER_KEY      = 'sec24h_user';

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

const VALID_ROLES: UserRole[] = ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR', 'TECNICO'];
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

  // Restaura sessão validando o token contra o backend
  useEffect(() => {
    async function restoreSession() {
      const storedRaw  = localStorage.getItem(USER_KEY);
      const token      = localStorage.getItem(TOKEN_KEY);
      const refresh    = localStorage.getItem(REFRESH_KEY);

      // Sem dados salvos → vai para login
      if (!storedRaw || !token) {
        clearStorage();
        setIsLoading(false);
        return;
      }

      let storedUser: AuthUser | null = null;
      try {
        const parsed = JSON.parse(storedRaw) as AuthUser;
        if (parsed?.role && isValidRole(parsed.role)) storedUser = parsed;
      } catch { /* JSON inválido */ }

      if (!storedUser) {
        clearStorage();
        setIsLoading(false);
        return;
      }

      try {
        // 1. Testa se o access token ainda é válido
        const meRes = await fetch(`${apiBase()}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meRes.ok) {
          // Token válido — restaura sessão normalmente
          setUser(storedUser);
          setIsLoading(false);
          return;
        }

        // 2. Access token expirou — tenta refresh
        if (refresh) {
          const refreshRes = await fetch(`${apiBase()}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refresh }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json() as { accessToken: string };
            localStorage.setItem(TOKEN_KEY, data.accessToken);
            setUser(storedUser);
            setIsLoading(false);
            return;
          }
        }

        // 3. Ambos falharam — sessão expirada, exige novo login
        clearStorage();
      } catch {
        // Backend inacessível — mantém sessão local (modo offline)
        setUser(storedUser);
      }

      setIsLoading(false);
    }

    restoreSession();
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
    clearStorage();
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
