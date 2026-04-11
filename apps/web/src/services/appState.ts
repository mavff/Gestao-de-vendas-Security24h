'use client';

import { apiClient } from '../lib/apiClient';

const isApiMode = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DATA_SOURCE === 'api';

// In-memory cache to avoid repeated API calls within the same session
const cache = new Map<string, { value: unknown; ts: number }>();
const CACHE_TTL = 30_000; // 30s

/**
 * Load state from SQLite (API mode) or localStorage (mock mode).
 * Returns the fallback if the key doesn't exist.
 */
export async function loadState<T>(key: string, fallback: T): Promise<T> {
  // Check memory cache first
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.value as T;
  }

  if (!isApiMode) {
    return loadLocal(key, fallback);
  }

  try {
    const { data } = await apiClient.get<{ value?: T }>(`/app-state/${encodeURIComponent(key)}`);
    const value = data.value ?? fallback;
    cache.set(key, { value, ts: Date.now() });
    return value as T;
  } catch {
    // Fallback to localStorage if API fails
    return loadLocal(key, fallback);
  }
}

/**
 * Save state to SQLite (API mode) and localStorage (as cache/fallback).
 * Never throws — API errors are logged (with error object) and the value
 * remains in localStorage. Open DevTools console to see the real reason
 * if a save doesn't stick across devices.
 */
export async function saveState<T>(key: string, value: T): Promise<void> {
  // Always update memory cache
  cache.set(key, { value, ts: Date.now() });

  // Always save to localStorage as fallback
  saveLocal(key, value);

  if (!isApiMode) return;

  try {
    await apiClient.put(`/app-state/${encodeURIComponent(key)}`, { body: { value } });
  } catch (err) {
    console.warn(`[appState] Falha ao salvar "${key}" na API, mantido em localStorage`, err);
  }
}

/**
 * Invalidate cache for a key (forces next loadState to re-fetch).
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

// ── localStorage helpers (used internally + as fallback) ───────────────────

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function saveLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* full */ }
}
