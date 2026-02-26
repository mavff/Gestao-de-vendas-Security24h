'use client';

const GOLD = '#C8A951';
const MUTED = '#B5B5B5';
const GRID = '#252525';

export function ClosuresBarChart({ data }: { data: { seller: string; closures: number }[] }) {
  if (!data.length) return null;

  const svgW = 560;
  const svgH = 210;
  const padLeft = 52;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 36;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.closures), 1);
  const n = data.length;
  const barW = Math.max(8, Math.min(48, (chartW / n) - 10));
  const groupW = chartW / n;

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 280, maxHeight: 215 }}>
        {yTickVals.map((val) => {
          const y = padTop + chartH - (val / maxVal) * chartH;
          return (
            <g key={val}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill={MUTED}>
                {val}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const h = (d.closures / maxVal) * chartH;
          return (
            <g key={d.seller}>
              <rect
                x={cx - barW / 2}
                y={padTop + chartH - h}
                width={barW}
                height={Math.max(h, 1)}
                fill={GOLD}
                rx={4}
                opacity={0.9}
              />
              {h > 16 && (
                <text x={cx} y={padTop + chartH - h - 4} textAnchor="middle" fontSize={10} fill={GOLD} fontWeight={700}>
                  {d.closures}
                </text>
              )}
              <text x={cx} y={svgH - padBottom + 18} textAnchor="middle" fontSize={11} fill={MUTED}>
                {d.seller}
              </text>
            </g>
          );
        })}

        <line x1={padLeft} x2={svgW - padRight} y1={padTop + chartH} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
      </svg>
    </div>
  );
}
