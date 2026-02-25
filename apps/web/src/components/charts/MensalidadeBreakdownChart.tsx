'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { VendedorPerformance } from '../../mocks/mockPerformance';

type Props = {
  data: VendedorPerformance[];
};

const COLORS = ['#C8A951', '#D4B870', '#B89A45', '#8A7030'];
const MUTED = '#B5B5B5';

const LABELS: { key: keyof VendedorPerformance; label: string }[] = [
  { key: 'mensalidadeMonitoramento', label: 'Monitoramento' },
  { key: 'mensalidadeLocacao',       label: 'Locação Equip.' },
  { key: 'mensalidadeTecnico',       label: 'Técnico Recorrente' },
  { key: 'mensalidadeOutros',        label: 'Outros' },
];

export function MensalidadeBreakdownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 13, fontStyle: 'italic' }}>
        Sem dados
      </div>
    );
  }

  const totals = data.reduce(
    (acc, row) => ({
      mensalidadeMonitoramento: acc.mensalidadeMonitoramento + row.mensalidadeMonitoramento,
      mensalidadeLocacao: acc.mensalidadeLocacao + row.mensalidadeLocacao,
      mensalidadeTecnico: acc.mensalidadeTecnico + row.mensalidadeTecnico,
      mensalidadeOutros: acc.mensalidadeOutros + row.mensalidadeOutros,
    }),
    { mensalidadeMonitoramento: 0, mensalidadeLocacao: 0, mensalidadeTecnico: 0, mensalidadeOutros: 0 },
  );

  const pieData = LABELS.map(({ key, label }) => ({
    name: label,
    value: totals[key as keyof typeof totals] as number,
  }));

  const grandTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Tooltip />
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>
            {pieData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Manual legend below chart */}
      <div style={{ display: 'grid', gap: 6, padding: '4px 8px' }}>
        {pieData.map((entry, idx) => {
          const pct = grandTotal > 0 ? Math.round((entry.value / grandTotal) * 100) : 0;
          return (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
              <span style={{ color: MUTED, flex: 1 }}>{entry.name}</span>
              <span style={{ color: '#F2F2F2', fontWeight: 600 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
