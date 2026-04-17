'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { theme } from './theme';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

type Props = {
  height?: number;
  disabled?: boolean;
};

/** Canvas simples para captura de assinatura touch/mouse.
 *  - Fundo branco + traço preto (para queimar no PDF com boa leitura).
 *  - Exposto via ref: clear / isEmpty / toDataURL. */
export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { height = 180, disabled = false },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasStrokesRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111111';
    hasStrokesRef.current = false;
  }, [height]);

  useEffect(() => {
    fitCanvas();
    const onResize = () => fitCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitCanvas]);

  function pointerPos(e: PointerEvent | React.PointerEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    drawingRef.current = true;
    const p = pointerPos(e);
    lastRef.current = p;
    hasStrokesRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const p = pointerPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastRef.current) return;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  }

  function handleUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    lastRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  }

  useImperativeHandle(ref, () => ({
    clear() { fitCanvas(); },
    isEmpty() { return !hasStrokesRef.current; },
    toDataURL() {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      return canvas.toDataURL('image/png');
    },
  }), [fitCanvas]);

  return (
    <div style={{ position: 'relative', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden', touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height, display: 'block', cursor: disabled ? 'not-allowed' : 'crosshair', touchAction: 'none' }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={handleUp}
      />
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 8, borderTop: '1px dashed #bbb', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 10, color: '#888', pointerEvents: 'none' }}>
        Assine acima
      </div>
    </div>
  );
});
