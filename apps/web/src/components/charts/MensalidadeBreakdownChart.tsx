'use client';

import { VendedorPerformance } from '../../mocks/mockPerformance';

const COLORS = ['#C8A951', '#D4B870', '#B89A45', '#8A7030'];
const MUTED = '#B5B5B5';
const TEXT = '#F2F2F2';

const LABELS: { key: keyof VendedorPerformance; label: string }[] = [
  { key: 'mensalidadeMonitoramento', label: 'Monitoramento' },
  { key: 'mensalidadeLocacao', label: 'Locação Equip.' },
  { key: 'mensalidadeTecnico', label: 'Técnico Recorrente' },
  { key: 'mensalidadeOutros', label: 'Outros' },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, ri: number, ro: number, sDeg: number, eDeg: number): string {
  const os = polar(cx, cy, ro, sDeg);
  const oe = polar(cx, cy, ro, eDeg);
  const is_ = polar(cx, cy, ri, sDeg);
  const ie = polar(cx, cy, ri, eDeg);
  const large = eDeg - sDeg > 180 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${ro} ${ro} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${ri} ${ri} 0 ${large} 0 ${is_.x} ${is_.y}`,
    'Z',
  ].join(' ');
}

function fmtK(v: number): string {
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return `R$${v}`;
}

export function MensalidadeBreakdownChart({ data }: { data: VendedorPerformance[] }) {
  if (!data.length) return null;

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
  })).filter((d) => d.value > 0);

  const grandTotal = pieData.reduce((s, d) => s + d.value, 0) || 1;

  const svgW = 280;
  const svgH = 220;
  const cx = 100;
  const cy = 100;
  const ri = 44;
  const ro = 76;

  let deg = 0;
  const slices = pieData.map((d, i) => {
    const sweep = (d.value / grandTotal) * 360;
    const start = deg;
    const end = deg + Math.max(sweep, 0.5);
    deg += sweep;
    return { ...d, start, end, pct: (d.value / grandTotal) * 100, color: COLORS[i % COLORS.length] };
  });

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
        {slices.map((s) => (
          <path key={s.name} d={slicePath(cx, cy, ri, ro, s.start, s.end)} fill={s.color} stroke="#141414" strokeWidth={2} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill={MUTED}>Total</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={14} fontWeight={700} fill={TEXT}>{fmtK(grandTotal)}</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'grid', gap: 5, padding: '0 8px 8px' }}>
        {slices.map((s) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ color: MUTED, flex: 1 }}>{s.name}</span>
            <span style={{ color: s.color, fontWeight: 600 }}>{fmtK(s.value)}</span>
            <span style={{ color: MUTED }}>{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
