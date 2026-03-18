'use client';

const GOLD  = '#C8A951';
const GREEN = '#43C17B';
const MUTED = '#B5B5B5';
const GRID  = '#252525';

const SERIES = [
  { key: 'leads'   as const, label: 'Leads',   color: GOLD },
  { key: 'visitas' as const, label: 'Visitas',  color: GREEN },
];

type CanalData = {
  canal: string;
  leads: number;
  visitas: number;
  fechamentos: number;
};

export function CanalComparisonChart({ data }: { data: CanalData[] }) {
  if (!data.length) return null;

  const svgW = 560;
  const svgH = 210;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 40;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.leads, d.visitas]), 1);
  const n = data.length;
  const groupW = chartW / n;
  const barGap = 3;
  const barW = Math.max(8, Math.min(28, (groupW - barGap * 3) / 2));

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  function bH(v: number) { return (v / maxVal) * chartH; }
  function bY(v: number) { return padTop + chartH - bH(v); }

  // Truncate long canal names
  function shortLabel(s: string): string {
    return s.length > 10 ? s.slice(0, 9) + '…' : s;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 4, paddingLeft: padLeft }}>
        {SERIES.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 280, maxHeight: 215 }}>
        {/* Grid + Y labels */}
        {yTickVals.map((val) => {
          const y = padTop + chartH - (val / maxVal) * chartH;
          return (
            <g key={val}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill={MUTED}>{val}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const offsets = [-(barW / 2 + barGap / 2), barW / 2 + barGap / 2];
          return (
            <g key={d.canal}>
              {SERIES.map((s, si) => {
                const val = d[s.key];
                const h = bH(val);
                const x = cx + offsets[si] - barW / 2;
                return (
                  <g key={s.key}>
                    <rect x={x} y={bY(val)} width={barW} height={Math.max(h, 1)} fill={s.color} rx={3} opacity={0.9} />
                    {h > 14 && (
                      <text x={x + barW / 2} y={bY(val) - 3} textAnchor="middle" fontSize={9} fill={s.color} fontWeight={700}>{val}</text>
                    )}
                  </g>
                );
              })}
              <text x={cx} y={svgH - padBottom + 16} textAnchor="middle" fontSize={10} fill={MUTED}>{shortLabel(d.canal)}</text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={padLeft} x2={svgW - padRight} y1={padTop + chartH} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
      </svg>
    </div>
  );
}
