'use client';

import { useEffect, useRef } from 'react';

/**
 * Dispara `callback` em intervalos regulares enquanto o componente estiver montado
 * e a aba estiver visível. Quando a aba fica oculta, o polling pausa automaticamente
 * e retoma ao voltar.
 *
 * Complementa `useRefreshOnFocus` — juntos garantem:
 *   1. Atualização imediata ao voltar pra aba (focus)
 *   2. Atualização periódica enquanto o usuário permanece na aba (polling)
 */
export function usePollingRefresh(
  callback: () => void,
  intervalMs: number = 120_000,
  enabled: boolean = true,
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer) return;
      timer = setInterval(() => cbRef.current(), intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        stop();
      }
    }

    // Inicia se a aba estiver visível
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}
