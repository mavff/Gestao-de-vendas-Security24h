'use client';

const GOLD = '#C8A951';
const MUTED = '#B5B5B5';
const GRID = '#252525';
const TEXT = '#F2F2F2';

export function LeadsLineChart({ data }: { data: { week: string; leads: number }[] }) {
  if (!data.length) return null;

  const svgW = 560;
  const svgH = 210;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 36;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.leads), 1);
  const n = data.length;

  function xAt(i: number) {
    return padLeft + (i / Math.max(n - 1, 1)) * chartW;
  }
  function yAt(v: number) {
    return padTop + chartH - (v / maxVal) * chartH;
  }

  const points = data.map((d, i) => `${xAt(i)},${yAt(d.leads)}`).join(' ');
  const areaPoints = [
    `${xAt(0)},${padTop + chartH}`,
    ...data.map((d, i) => `${xAt(i)},${yAt(d.leads)}`),
    `${xAt(n - 1)},${padTop + chartH}`,
  ].join(' ');

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 280, maxHeight: 215 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
        </defs>

        {yTickVals.map((val) => {
          const y = yAt(val);
          return (
            <g key={val}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill={MUTED}>
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#lineGrad)" />

        {/* Line */}
        <polyline points={points} fill="none" stroke={GOLD} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots + values */}
        {data.map((d, i) => (
          <g key={d.week}>
            <circle cx={xAt(i)} cy={yAt(d.leads)} r={4} fill={GOLD} stroke="#141414" strokeWidth={2} />
            {(n <= 8 || i % 2 === 0) && (
              <text x={xAt(i)} y={yAt(d.leads) - 10} textAnchor="middle" fontSize={10} fill={TEXT} fontWeight={600}>
                {d.leads}
              </text>
            )}
            <text x={xAt(i)} y={svgH - padBottom + 18} textAnchor="middle" fontSize={10} fill={MUTED}>
              {d.week}
            </text>
          </g>
        ))}

        <line x1={padLeft} x2={svgW - padRight} y1={padTop + chartH} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
      </svg>
    </div>
  );
}
