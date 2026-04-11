'use client';

import { useRef, useState } from 'react';
import { theme } from '../../../components/common/theme';
import { btnGold, btnSoft } from './styles';

type Mark = { x: number; y: number }; // normalized 0..1 relative to image

/**
 * Full-screen photo annotator. User taps on the image to place "X" markers
 * where the equipment should be installed — multiple marks per photo are
 * supported. On confirm, every X is burned into the image via canvas and
 * the annotated JPEG base64 data URL is returned.
 *
 * Props:
 *  - src: base64 image data URL (input)
 *  - onSave: called with the annotated base64 data URL
 *  - onCancel: close without saving
 */
export function PhotoAnnotator({ src, onSave, onCancel }: {
  src: string;
  onSave: (annotatedBase64: string) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [saving, setSaving] = useState(false);

  function addMarkFromPoint(clientX: number, clientY: number) {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = clamp01((clientX - rect.left) / rect.width);
    const y = clamp01((clientY - rect.top) / rect.height);
    setMarks((prev) => [...prev, { x, y }]);
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    addMarkFromPoint(e.clientX, e.clientY);
  }

  function handleTouch(e: React.TouchEvent<HTMLImageElement>) {
    const t = e.changedTouches[0] ?? e.touches[0];
    if (!t) return;
    // Prevent the subsequent synthetic click so touch devices don't add twice
    e.preventDefault();
    addMarkFromPoint(t.clientX, t.clientY);
  }

  function undo() {
    setMarks((prev) => prev.slice(0, -1));
  }

  function clearAll() {
    setMarks([]);
  }

  async function handleSave() {
    if (marks.length === 0) return;
    setSaving(true);
    try {
      const annotated = await burnMarksIntoImage(src, marks);
      onSave(annotated);
    } finally {
      setSaving(false);
    }
  }

  const canSave = marks.length > 0 && !saving;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ maxWidth: 720, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Marcar locais da instalação</h3>
          <span style={{ fontSize: 11, color: theme.muted }}>
            {marks.length === 0
              ? 'Toque em cada ponto onde um equipamento será instalado'
              : `${marks.length} ${marks.length === 1 ? 'marca' : 'marcas'}`}
          </span>
        </div>

        <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
          <img
            ref={imgRef}
            src={src}
            alt="Foto a marcar"
            onClick={handleImageClick}
            onTouchEnd={handleTouch}
            draggable={false}
            style={{ width: '100%', borderRadius: 12, display: 'block', cursor: 'crosshair', touchAction: 'manipulation' }}
          />
          {marks.map((m, i) => (
            <div
              key={i}
              aria-hidden
              style={{
                position: 'absolute',
                left: `${m.x * 100}%`,
                top: `${m.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                color: '#FF3B30',
                fontSize: 44,
                fontWeight: 900,
                lineHeight: 1,
                textShadow: '0 0 4px #000, 0 0 8px #000, 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              ✕
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <button onClick={onCancel} style={{ ...btnSoft, minWidth: 110 }}>Cancelar</button>
          <button
            onClick={undo}
            disabled={marks.length === 0}
            style={{ ...btnSoft, minWidth: 110, opacity: marks.length === 0 ? 0.4 : 1, cursor: marks.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Desfazer
          </button>
          <button
            onClick={clearAll}
            disabled={marks.length === 0}
            style={{ ...btnSoft, minWidth: 110, opacity: marks.length === 0 ? 0.4 : 1, cursor: marks.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Limpar tudo
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ ...btnGold, minWidth: 160, opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Salvando...' : 'Salvar com marcas'}
          </button>
        </div>

        <div style={{ fontSize: 11, color: theme.muted, textAlign: 'center', marginTop: 10 }}>
          Dica: adicione quantos X forem necessários. Use "Desfazer" para remover o último ou "Limpar tudo" para começar de novo.
        </div>
      </div>
    </div>
  );
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Draws the provided image into a canvas, stamps a red "X" at every normalized
 * mark position (0..1), and returns a JPEG base64 data URL. Size is preserved.
 */
function burnMarksIntoImage(src: string, marks: Mark[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0);

      // X size scales with image — ~9% of the shorter side
      const base = Math.min(canvas.width, canvas.height);
      const size = Math.max(28, Math.round(base * 0.09));
      const half = size / 2;
      const outlineWidth = Math.max(6, Math.round(base * 0.018));
      const coreWidth = Math.max(3, Math.round(base * 0.009));

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Pass 1 — white outline for every mark (ensures visibility on any bg)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = outlineWidth;
      for (const m of marks) {
        drawX(ctx, Math.round(m.x * canvas.width), Math.round(m.y * canvas.height), half);
      }

      // Pass 2 — red core for every mark
      ctx.strokeStyle = '#FF3B30';
      ctx.lineWidth = coreWidth;
      for (const m of marks) {
        drawX(ctx, Math.round(m.x * canvas.width), Math.round(m.y * canvas.height), half);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Failed to load image for annotation'));
    img.src = src;
  });
}

function drawX(ctx: CanvasRenderingContext2D, cx: number, cy: number, half: number) {
  ctx.beginPath();
  ctx.moveTo(cx - half, cy - half);
  ctx.lineTo(cx + half, cy + half);
  ctx.moveTo(cx + half, cy - half);
  ctx.lineTo(cx - half, cy + half);
  ctx.stroke();
}
