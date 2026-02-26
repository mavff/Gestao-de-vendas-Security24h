'use client';

import { useEffect } from 'react';
import { theme } from '../common/theme';

interface ChartDetailModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function ChartDetailModal({ title, onClose, children }: ChartDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          width: '100%',
          maxWidth: 760,
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px 14px',
          borderBottom: `1px solid ${theme.border}`,
          position: 'sticky', top: 0,
          background: theme.panel,
          zIndex: 1,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.gold }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.muted, fontSize: 22, lineHeight: 1, padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── shared sub-components for modal content ─── */

export function InsightCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: theme.soft,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      padding: '12px 16px',
    }}>
      <p style={{ margin: 0, fontSize: 12, color: theme.muted }}>{label}</p>
      <p style={{ margin: '4px 0 2px', fontSize: 22, fontWeight: 700, color: accent ?? theme.gold }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: theme.muted }}>{sub}</p>}
    </div>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                textAlign: 'left', padding: '8px 10px', fontSize: 11,
                color: theme.muted, borderBottom: `1px solid ${theme.border}`,
                fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${i === rows.length - 1 ? 'transparent' : '#252525'}` }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '9px 10px',
                  color: j === 0 ? theme.text : theme.gold,
                  fontWeight: j > 0 ? 600 : 400,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
