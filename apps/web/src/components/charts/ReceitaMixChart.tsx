'use client';

const MIX_COLORS = ['#A07830', '#C8A951', '#5B9BD5'];
const MUTED = '#B5B5B5';
const TEXT = '#F2F2F2';
const PANEL = '#1D1D1D';

function fmtK(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

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

export type ReceitaMixDataPoint = { name: string; value: number };

type Props = {
  data: ReceitaMixDataPoint[];
  onSliceClick?: (slice: ReceitaMixDataPoint) => void;
};

export function ReceitaMixChart({ data, onSliceClick }: Props) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const svgW = 560;
  const svgH = 210;
  const cx = 140;
  const cy = 105;
  const ri = 52;
  const ro = 90;

  let deg = 0;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const start = deg;
    const end = deg + Math.max(sweep, 0.5);
    deg += sweep;
    return { ...d, start, end, pct: (d.value / total) * 100, color: MIX_COLORS[i % MIX_COLORS.length] };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
      {/* Donut slices */}
      {slices.map((s) => (
        <path
          key={s.name}
          d={slicePath(cx, cy, ri, ro, s.start, s.end)}
          fill={s.color}
          stroke="#141414"
          strokeWidth={2}
          style={{ cursor: onSliceClick ? 'pointer' : 'default', transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as SVGPathElement).style.opacity = '0.8'; }}
          onMouseLeave={(e) => { (e.currentTarget as SVGPathElement).style.opacity = '1'; }}
          onClick={() => onSliceClick?.(s)}
        />
      ))}

      {/* Center label */}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill={MUTED} letterSpacing={0.5}>
        TOTAL
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={19} fontWeight={700} fill={TEXT}>
        {fmtK(total)}
      </text>

      {/* Legend right side */}
      {slices.map((s, i) => {
        const ly = 30 + i * 56;
        const barW = Math.round((s.value / total) * 220);
        return (
          <g
            key={s.name}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
            onClick={() => onSliceClick?.(s)}
          >
            {/* Color dot */}
            <circle cx={285} cy={ly + 6} r={6} fill={s.color} />
            {/* Name */}
            <text x={298} y={ly + 11} fontSize={12} fill={TEXT}>
              {s.name}
            </text>
            {/* Value */}
            <text x={555} y={ly + 11} textAnchor="end" fontSize={12} fontWeight={700} fill={s.color}>
              {fmtK(s.value)}
            </text>
            {/* Percent badge */}
            <rect x={285} y={ly + 20} width={barW} height={6} rx={3} fill={s.color} opacity={0.35} />
            <text x={285} y={ly + 43} fontSize={10} fill={MUTED}>
              {s.pct.toFixed(1)}% da receita
            </text>
          </g>
        );
      })}
    </svg>
  );
}
