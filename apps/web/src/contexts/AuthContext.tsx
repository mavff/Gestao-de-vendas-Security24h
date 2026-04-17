'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { UserRole } from '../types';
import { AUTH_EXPIRED_EVENT } from '../lib/apiClient';

export type AuthSource = 'master' | 'app' | 'erp';

export type AuthUser = {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  mustChangePassword?: boolean;
  source?: AuthSource;
};

type AuthCtx = {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearMustChangePassword: () => void;
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

// Envolve fetch com AbortController + timeout. Sem isso, se o backend ficar
// pendurado o restoreSession trava o loading eterno.
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 5000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
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
  changePassword: async () => {},
  clearMustChangePassword: () => {},
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
        const meRes = await fetchWithTimeout(`${apiBase()}/me`, {
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
          const refreshRes = await fetchWithTimeout(`${apiBase()}/auth/refresh`, {
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
        // Backend inacessível ou timeout — mantém sessão local (modo offline)
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
      user: { sub: number; username: string; name: string; role: string; mustChangePassword?: boolean; source?: AuthSource };
    };

    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);

    const authUser: AuthUser = {
      id: data.user.sub,
      username: data.user.username,
      name: data.user.name,
      role: isValidRole(data.user.role) ? data.user.role : 'VENDEDOR',
      mustChangePassword: !!data.user.mustChangePassword,
      source: data.user.source,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
  }, []);

  // Escuta o evento disparado pelo apiClient quando refresh falha — desloga
  // o usuário imediatamente em vez de deixá-lo vendo 401 em loop.
  useEffect(() => {
    function onAuthExpired() {
      setUser(null);
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${apiBase()}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((data?.message as string) || 'Falha ao alterar senha');
    }
    setUser((cur) => {
      if (!cur) return cur;
      const next = { ...cur, mustChangePassword: false };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearMustChangePassword = useCallback(() => {
    setUser((cur) => {
      if (!cur) return cur;
      const next = { ...cur, mustChangePassword: false };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
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
      changePassword,
      clearMustChangePassword,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
