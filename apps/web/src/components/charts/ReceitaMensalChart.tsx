'use client';

const GOLD_DARK = '#A07830';
const GOLD = '#C8A951';
const MUTED = '#B5B5B5';
const GRID = '#252525';
const TEXT = '#F2F2F2';

function fmtK(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return `R$${v}`;
}

export type ReceitaMensalDataPoint = { mes: string; equipamentos: number; instalacao: number };

type Props = {
  data: ReceitaMensalDataPoint[];
  onBarClick?: (point: ReceitaMensalDataPoint) => void;
};

export function ReceitaMensalChart({ data, onBarClick }: Props) {
  if (!data.length) return null;

  const svgW = 560;
  const svgH = 210;
  const padLeft = 60;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 36;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.equipamentos + d.instalacao), 1);

  const n = data.length;
  const groupW = chartW / n;
  const barGap = 3;
  const barW = Math.max(8, Math.min(30, (groupW - barGap * 3) / 2));

  function bH(v: number) {
    return (v / maxVal) * chartH;
  }

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 4, paddingLeft: padLeft }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: GOLD_DARK }} />
          Equipamentos
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: GOLD }} />
          Instalação
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 300, maxHeight: 215 }}>
        {/* Grid + Y labels */}
        {yTickVals.map((val) => {
          const y = padTop + chartH - (val / maxVal) * chartH;
          return (
            <g key={val}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padLeft - 7} y={y + 4} textAnchor="end" fontSize={10} fill={MUTED}>
                {fmtK(val)}
              </text>
            </g>
          );
        })}

        {/* Bars per month */}
        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const x1 = cx - barW - barGap / 2;
          const x2 = cx + barGap / 2;
          const h1 = bH(d.equipamentos);
          const h2 = bH(d.instalacao);
          const total = d.equipamentos + d.instalacao;
          const hTotal = bH(total);
          return (
            <g
              key={d.mes}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              onClick={() => onBarClick?.(d)}
            >
              {/* Equip bar */}
              <rect
                x={x1} y={padTop + chartH - h1}
                width={barW} height={Math.max(h1, 1)}
                fill={GOLD_DARK} rx={3}
                opacity={0.92}
              />
              {/* Instal bar */}
              <rect
                x={x2} y={padTop + chartH - h2}
                width={barW} height={Math.max(h2, 1)}
                fill={GOLD} rx={3}
                opacity={0.92}
              />
              {/* Equip value */}
              {h1 > 20 && (
                <text x={x1 + barW / 2} y={padTop + chartH - h1 - 4} textAnchor="middle" fontSize={9} fill={GOLD_DARK} fontWeight={700}>
                  {fmtK(d.equipamentos)}
                </text>
              )}
              {/* Instal value */}
              {h2 > 20 && (
                <text x={x2 + barW / 2} y={padTop + chartH - h2 - 4} textAnchor="middle" fontSize={9} fill={GOLD} fontWeight={700}>
                  {fmtK(d.instalacao)}
                </text>
              )}
              {/* Total above the taller bar */}
              {hTotal > 30 && (
                <text x={cx} y={padTop + chartH - Math.max(h1, h2) - 14} textAnchor="middle" fontSize={10} fill={TEXT} fontWeight={600}>
                  {fmtK(total)}
                </text>
              )}
              {/* Month label */}
              <text x={cx} y={svgH - padBottom + 18} textAnchor="middle" fontSize={11} fill={MUTED}>
                {d.mes}
              </text>
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
