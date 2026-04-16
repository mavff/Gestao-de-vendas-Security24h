'use client';

/**
 * Cache local do browser (localStorage). Usado como fallback quando a API
 * não está disponível e para dados que só fazem sentido por máquina.
 * Para dados de negócio compartilhados, use `saveState`/`loadState` (AppKv).
 */

export function loadLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLocalCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[saveLocalCache] Falha ao salvar "${key}" no localStorage (possivelmente cheio):`, e);
  }
}
