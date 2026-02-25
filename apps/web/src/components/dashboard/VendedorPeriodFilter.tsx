'use client';

import { PerformancePreset } from '../../mocks/mockPerformance';

type Props = {
  selected: PerformancePreset;
  onChange: (preset: PerformancePreset) => void;
};

const PRESETS: { key: PerformancePreset; label: string }[] = [
  { key: 'mes_atual', label: 'Mês Atual' },
  { key: '3m',        label: 'Últimos 3m' },
  { key: '6m',        label: 'Últimos 6m' },
  { key: '1a',        label: 'Ano Atual' },
];

const gold = '#C8A951';

export function VendedorPeriodFilter({ selected, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {PRESETS.map(({ key, label }) => {
        const active = selected === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              borderRadius: 8,
              border: `1px solid ${active ? gold : '#3A3A3A'}`,
              background: active ? `${gold}22` : 'rgba(255,255,255,0.03)',
              color: active ? gold : '#B5B5B5',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              letterSpacing: 0.3,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
