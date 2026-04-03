'use client';

const GOLD = '#C8A951';
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
  evolucao: { mes: string; equipamentos: number; instalacao: number }[];
  custoMensal: number;
};

export function ReceitaCustosBarChart({ evolucao, custoMensal }: Props) {
  if (!evolucao.length) return null;

  const svgW = 560;
  const svgH = 210;
  const padLeft = 60;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 36;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const data = evolucao.map((d) => ({
    mes: d.mes,
    receita: d.equipamentos + d.instalacao,
    custo: custoMensal,
  }));

  const maxVal = Math.max(...data.map((d) => Math.max(d.receita, d.custo)), 1);

  const n = data.length;
  const groupW = chartW / n;
  const barGap = 3;
  const barW = Math.max(8, Math.min(30, (groupW - barGap * 3) / 2));

  function bH(v: number) { return (v / maxVal) * chartH; }

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 4, paddingLeft: padLeft }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: GOLD }} />
          Receita
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: RED }} />
          Custos
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 300, maxHeight: 215 }}>
        {yTickVals.map((val) => {
          const y = padTop + chartH - (val / maxVal) * chartH;
          return (
            <g key={val}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padLeft - 7} y={y + 4} textAnchor="end" fontSize={10} fill={MUTED}>{fmtK(val)}</text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const x1 = cx - barW - barGap / 2;
          const x2 = cx + barGap / 2;
          const hR = bH(d.receita);
          const hC = bH(d.custo);
          const lucro = d.receita - d.custo;
          return (
            <g key={d.mes}>
              <rect x={x1} y={padTop + chartH - hR} width={barW} height={Math.max(hR, 1)} fill={GOLD} rx={3} opacity={0.92} />
              <rect x={x2} y={padTop + chartH - hC} width={barW} height={Math.max(hC, 1)} fill={RED} rx={3} opacity={0.75} />
              {hR > 20 && (
                <text x={x1 + barW / 2} y={padTop + chartH - hR - 4} textAnchor="middle" fontSize={9} fill={GOLD} fontWeight={700}>
                  {fmtK(d.receita)}
                </text>
              )}
              {hC > 20 && (
                <text x={x2 + barW / 2} y={padTop + chartH - hC - 4} textAnchor="middle" fontSize={9} fill={RED} fontWeight={700}>
                  {fmtK(d.custo)}
                </text>
              )}
              {/* Lucro label */}
              <text
                x={cx}
                y={padTop + chartH - Math.max(hR, hC) - 16}
                textAnchor="middle" fontSize={9}
                fill={lucro >= 0 ? '#43C17B' : RED}
                fontWeight={600}
              >
                {lucro >= 0 ? '+' : ''}{fmtK(lucro)}
              </text>
              <text x={cx} y={svgH - padBottom + 18} textAnchor="middle" fontSize={11} fill={MUTED}>{d.mes}</text>
            </g>
          );
        })}

        <line x1={padLeft} x2={svgW - padRight} y1={padTop + chartH} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
      </svg>
    </div>
  );
}
