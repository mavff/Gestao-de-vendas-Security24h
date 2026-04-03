'use client';

const COLORS = ['#E55B5B', '#C8A951', '#5B9BD5', '#43C17B', '#C077DB', '#FF9800'];
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

export type RetencaoDonutDataPoint = { modalidade: string; total: number };

type Props = {
  data: RetencaoDonutDataPoint[];
  label?: string;
};

export function RetencaoDonutChart({ data, label = 'CHURN' }: Props) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.total, 0) || 1;

  const svgW = 560;
  const svgH = 210;
  const cx = 140;
  const cy = 105;
  const ri = 52;
  const ro = 90;

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
      {/* Donut slices */}
      {slices.map((s) => (
        <path
          key={s.modalidade}
          d={slicePath(cx, cy, ri, ro, s.start, s.end)}
          fill={s.color}
          stroke="#141414"
          strokeWidth={2}
          style={{ transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as SVGPathElement).style.opacity = '0.8'; }}
          onMouseLeave={(e) => { (e.currentTarget as SVGPathElement).style.opacity = '1'; }}
        />
      ))}

      {/* Center label */}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill={MUTED} letterSpacing={0.5}>
        {label}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={19} fontWeight={700} fill={TEXT}>
        {total}
      </text>

      {/* Legend right side */}
      {slices.map((s, i) => {
        const ly = 30 + i * 50;
        const barW = Math.round((s.total / total) * 200);
        return (
          <g key={s.modalidade}>
            <circle cx={285} cy={ly + 6} r={6} fill={s.color} />
            <text x={298} y={ly + 11} fontSize={12} fill={TEXT}>
              {s.modalidade}
            </text>
            <text x={555} y={ly + 11} textAnchor="end" fontSize={12} fontWeight={700} fill={s.color}>
              {s.total}
            </text>
            <rect x={285} y={ly + 20} width={barW} height={5} rx={2.5} fill={s.color} opacity={0.35} />
            <text x={285} y={ly + 38} fontSize={10} fill={MUTED}>
              {s.pct.toFixed(1)}% do churn
            </text>
          </g>
        );
      })}
    </svg>
  );
}
