import { theme } from '../common/theme';

interface KpiCardProps {
  label: string;
  value: string;
  description: string;
  accent?: string;
}

export function KpiCard({ label, value, description, accent }: KpiCardProps) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${accent ? accent + '33' : theme.border}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: theme.muted }}>{label}</p>
      <p style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 700, color: accent ?? theme.text }}>{value}</p>
      <p style={{ margin: 0, fontSize: 12, color: theme.muted }}>{description}</p>
    </div>
  );
}
