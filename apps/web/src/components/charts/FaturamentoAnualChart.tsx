'use client';

import { FaturamentoAnualItem } from '../../lib/dataSource/types';

const MOD_COLORS: Record<string, string> = {
  L: '#43C17B',   // Monitoramento — verde
  V: '#C8A951',   // Venda — dourado
  R: '#5B9BD5',   // Rastreamento — azul
};
const MOD_LABELS: Record<string, string> = {
  L: 'Monitoramento',
  V: 'Venda',
  R: 'Rastreamento',
};
const DEFAULT_COLOR = '#888';
const GREEN = '#43C17B';
const RED = '#E55B5B';
const MUTED = '#B5B5B5';
const GRID = '#252525';
const TEXT = '#F2F2F2';

function fmtK(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return `R$${v}`;
}

type Props = {
  data: FaturamentoAnualItem[];
  filtroModalidade?: string | null;
};

export function FaturamentoAnualChart({ data, filtroModalidade }: Props) {
  if (!data.length) return null;

  // Coletar todas as modalidades presentes
  const allMods = new Set<string>();
  for (const d of data) {
    for (const m of d.porModalidade) {
      if (m.codigo) allMods.add(m.codigo);
    }
  }
  const mods = [...allMods].sort();

  // Filtrar dados por modalidade se necessário
  const getTotal = (d: FaturamentoAnualItem) => {
    if (!filtroModalidade) return d.total;
    const m = d.porModalidade.find((p) => p.codigo === filtroModalidade);
    return m ? m.total : 0;
  };

  const svgW = 620;
  const svgH = 280;
  const padLeft = 65;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 50;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => getTotal(d)), 1);

  const n = data.length;
  const groupW = chartW / n;
  const barW = Math.max(16, Math.min(55, groupW * 0.6));

  function bH(v: number) {
    return (v / maxVal) * chartH;
  }

  const yTicks = 5;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  // Crescimento YoY
  const totals = data.map(getTotal);
  const crescimentos: (number | null)[] = totals.map((t, i) => {
    if (i === 0 || totals[i - 1] === 0) return null;
    return ((t - totals[i - 1]) / totals[i - 1]) * 100;
  });

  // Trend line
  const trendPoints = data.map((d, i) => {
    const cx = padLeft + i * groupW + groupW / 2;
    const y = padTop + chartH - bH(getTotal(d));
    return `${cx},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 6, paddingLeft: padLeft, flexWrap: 'wrap' }}>
        {mods.map((mod) => (
          <div key={mod} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: MOD_COLORS[mod] ?? DEFAULT_COLOR }} />
            {MOD_LABELS[mod] ?? mod}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 8, height: 2, borderRadius: 1, background: TEXT }} />
          Tendência
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 350, maxHeight: 290 }}>
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

        {/* Trend line */}
        {data.length > 1 && (
          <polyline
            points={trendPoints}
            fill="none"
            stroke={TEXT}
            strokeWidth={1.5}
            strokeDasharray="4,3"
            opacity={0.5}
          />
        )}

        {/* Stacked bars per year */}
        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const xBar = cx - barW / 2;
          const total = getTotal(d);
          const hTotal = bH(total);
          const cresc = crescimentos[i];

          // Build stacked segments
          const segments: { codigo: string; value: number; color: string }[] = [];
          if (filtroModalidade) {
            const m = d.porModalidade.find((p) => p.codigo === filtroModalidade);
            if (m) segments.push({ codigo: m.codigo, value: m.total, color: MOD_COLORS[m.codigo] ?? DEFAULT_COLOR });
          } else {
            for (const mod of mods) {
              const m = d.porModalidade.find((p) => p.codigo === mod);
              if (m && m.total > 0) segments.push({ codigo: mod, value: m.total, color: MOD_COLORS[mod] ?? DEFAULT_COLOR });
            }
          }

          let yOffset = 0;
          return (
            <g key={d.ano}>
              {segments.map((seg) => {
                const h = bH(seg.value);
                const y = padTop + chartH - yOffset - h;
                yOffset += h;
                return (
                  <rect
                    key={seg.codigo}
                    x={xBar} y={y}
                    width={barW} height={Math.max(h, 1)}
                    fill={seg.color} rx={3}
                    opacity={0.88}
                  />
                );
              })}
              {/* Total above bar */}
              {hTotal > 20 && (
                <text x={cx} y={padTop + chartH - hTotal - 16} textAnchor="middle" fontSize={11} fill={TEXT} fontWeight={700}>
                  {fmtK(total)}
                </text>
              )}
              {/* Crescimento YoY */}
              {cresc !== null && hTotal > 20 && (
                <text x={cx} y={padTop + chartH - hTotal - 4} textAnchor="middle" fontSize={9} fill={cresc >= 0 ? GREEN : RED} fontWeight={600}>
                  {cresc >= 0 ? '+' : ''}{cresc.toFixed(0)}%
                </text>
              )}
              {/* Year label */}
              <text x={cx} y={svgH - padBottom + 16} textAnchor="middle" fontSize={12} fill={TEXT} fontWeight={600}>
                {d.ano}
              </text>
              {/* Orcamentos count */}
              <text x={cx} y={svgH - padBottom + 30} textAnchor="middle" fontSize={9} fill={MUTED}>
                {d.orcamentos} orç.
              </text>
            </g>
          );
        })}

        {/* Trend dots */}
        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const y = padTop + chartH - bH(getTotal(d));
          return <circle key={`dot-${d.ano}`} cx={cx} cy={y} r={3} fill={TEXT} opacity={0.7} />;
        })}

        {/* Axes */}
        <line x1={padLeft} x2={svgW - padRight} y1={padTop + chartH} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
      </svg>
    </div>
  );
}
