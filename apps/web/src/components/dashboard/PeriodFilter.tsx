'use client';

import { theme } from '../common/theme';
import type { PeriodKey } from '../../mocks/dashboard';

const options: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'Todos' },
];

interface PeriodFilterProps {
  selected: PeriodKey;
  onChange: (period: PeriodKey) => void;
}

export function PeriodFilter({ selected, onChange }: PeriodFilterProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              background: active ? theme.gold : theme.soft,
              color: active ? '#0B0B0B' : theme.text,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
