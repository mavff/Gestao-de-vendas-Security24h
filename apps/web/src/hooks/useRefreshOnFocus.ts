'use client';

import { useEffect, useRef } from 'react';

/**
 * Dispara `callback` quando a aba volta a ficar visível ou ganha foco,
 * evitando disparos repetidos em sequência (debounce de 500ms).
 * Útil para revalidar dados que podem ter mudado no BD enquanto a aba
 * estava em segundo plano.
 */
export function useRefreshOnFocus(callback: () => void, enabled: boolean = true): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    let lastRun = 0;
    const DEBOUNCE_MS = 500;

    function trigger() {
      const now = Date.now();
      if (now - lastRun < DEBOUNCE_MS) return;
      lastRun = now;
      cbRef.current();
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') trigger();
    }

    window.addEventListener('focus', trigger);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', trigger);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);
}
