'use client';

const GOLD = '#C8A951';
const GOLD_DARK = '#A07830';
const MUTED = '#B5B5B5';
const TEXT = '#F2F2F2';

export function FunnelStageChart({ data }: { data: { stage: string; total: number }[] }) {
  if (!data.length) return null;

  const svgW = 560;
  const svgH = 210;
  const padX = 20;
  const padTop = 12;
  const slotH = Math.min(34, (svgH - padTop) / data.length - 2);
  const gapY = 4;
  const maxW = svgW - padX * 2 - 120; // space for label on right
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const totalAll = data.reduce((s, d) => s + d.total, 0) || 1;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 280, maxHeight: 215 }}>
        {data.map((d, i) => {
          const w = (d.total / maxVal) * maxW;
          const x = padX + (maxW - w) / 2;
          const y = padTop + i * (slotH + gapY);
          const pct = Math.round((d.total / totalAll) * 100);
          const fill = i === 0 ? GOLD : `rgba(200,169,81,${0.85 - i * 0.12})`;

          return (
            <g key={d.stage}>
              <rect x={x} y={y} width={Math.max(w, 2)} height={slotH} rx={4} fill={fill} />
              {/* Stage label */}
              <text x={x + 10} y={y + slotH / 2 + 4} fontSize={11} fill="#0B0B0B" fontWeight={700}>
                {d.stage}
              </text>
              {/* Count */}
              <text x={padX + maxW + 16} y={y + slotH / 2 + 4} fontSize={12} fill={TEXT} fontWeight={700}>
                {d.total}
              </text>
              {/* Pct */}
              <text x={padX + maxW + 56} y={y + slotH / 2 + 4} fontSize={11} fill={MUTED}>
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
