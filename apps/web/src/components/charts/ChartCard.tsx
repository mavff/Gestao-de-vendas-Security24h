import { theme } from '../common/theme';

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
      <h3 style={{ color: theme.gold, margin: '0 0 8px 0' }}>{title}</h3>
      <div style={{ height: 260 }}>{children}</div>
    </section>
  );
}
