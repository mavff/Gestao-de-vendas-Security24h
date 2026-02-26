'use client';

const COLORS = ['#C8A951', '#A5A5A5', '#7A7A7A', '#505050'];
const MUTED = '#B5B5B5';
const TEXT = '#F2F2F2';

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

export function LeadOriginDonutChart({ data }: { data: { origin: string; total: number }[] }) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.total, 0) || 1;
  const svgW = 560;
  const svgH = 210;
  const cx = 130;
  const cy = 105;
  const ri = 50;
  const ro = 88;

  let deg = 0;
  const slices = data.map((d, i) => {
    const sweep = (d.total / total) * 360;
    const start = deg;
    const end = deg + Math.max(sweep, 0.5);
    deg += sweep;
    return { ...d, start, end, pct: (d.total / total) * 100, color: COLORS[i % COLORS.length] };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
      {slices.map((s) => (
        <path
          key={s.origin}
          d={slicePath(cx, cy, ri, ro, s.start, s.end)}
          fill={s.color}
          stroke="#141414"
          strokeWidth={2}
        />
      ))}

      {/* Center */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={10} fill={MUTED}>Total</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={18} fontWeight={700} fill={TEXT}>{total}</text>

      {/* Legend */}
      {slices.map((s, i) => {
        const ly = 20 + i * 44;
        return (
          <g key={s.origin}>
            <circle cx={278} cy={ly + 7} r={6} fill={s.color} />
            <text x={292} y={ly + 12} fontSize={12} fill={TEXT}>{s.origin}</text>
            <text x={554} y={ly + 12} textAnchor="end" fontSize={12} fontWeight={700} fill={s.color}>{s.total}</text>
            <text x={554} y={ly + 27} textAnchor="end" fontSize={10} fill={MUTED}>{s.pct.toFixed(1)}%</text>
          </g>
        );
      })}
    </svg>
  );
}
