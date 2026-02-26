'use client';

import { VendedorPerformance } from '../../mocks/mockPerformance';

type FinanceiroVendedorRow = { usuario: string; equipamentos: number; instalacao: number; total: number };

type Props =
  | { data: VendedorPerformance[]; financeiro?: never }
  | { data?: never; financeiro: FinanceiroVendedorRow[] };

const GOLD_DARK = '#A07830';
const GOLD = '#C8A951';
const MUTED = '#B5B5B5';
const BG_LINE = '#2A2A2A';

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return `R$${v}`;
}

export function VendedorPerformanceChart(props: Props) {
  const rows = props.financeiro
    ? props.financeiro.map((d) => ({
        label: d.usuario.split(' ')[0],
        fullName: d.usuario,
        produtos: d.equipamentos,
        mensalidades: d.instalacao,
      }))
    : (props.data ?? []).map((d) => ({
        label: d.vendedor.split(' ')[0],
        fullName: d.vendedor,
        produtos: d.produtosVendidos,
        mensalidades: d.mensalidadeMonitoramento + d.mensalidadeLocacao + d.mensalidadeTecnico + d.mensalidadeOutros,
      }));

  if (rows.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 13, fontStyle: 'italic' }}>
        Sem dados no período selecionado
      </div>
    );
  }

  const svgW = 560;
  const svgH = 220;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 52;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const n = rows.length;
  const groupW = chartW / n;
  const barGap = 4;
  const barW = Math.max(8, Math.min(28, (groupW - barGap * 3) / 2));

  const maxVal = Math.max(...rows.flatMap((r) => [r.produtos, r.mensalidades]), 1);

  function barHeight(v: number) { return (v / maxVal) * chartH; }

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, paddingLeft: padLeft }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: MUTED }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: GOLD_DARK }} />
          {props.financeiro ? 'Equipamentos' : 'Produtos Vendidos'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: MUTED }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: GOLD }} />
          {props.financeiro ? 'Instalação' : 'Total Mensalidades'}
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 320, maxHeight: 215 }}>
        {/* Y-axis grid lines + labels */}
        {yTickVals.map((val) => {
          const y = padTop + chartH - (val / maxVal) * chartH;
          return (
            <g key={val}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={BG_LINE} strokeWidth={1} />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill={MUTED}>
                {fmtCurrency(val)}
              </text>
            </g>
          );
        })}

        {/* Bars + X labels */}
        {rows.map((row, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const x1 = cx - barW - barGap / 2;
          const x2 = cx + barGap / 2;
          const h1 = barHeight(row.produtos);
          const h2 = barHeight(row.mensalidades);
          return (
            <g key={row.label}>
              {/* Produtos bar */}
              <rect
                x={x1}
                y={padTop + chartH - h1}
                width={barW}
                height={Math.max(h1, 1)}
                fill={GOLD_DARK}
                rx={3}
              />
              {/* Mensalidades bar */}
              <rect
                x={x2}
                y={padTop + chartH - h2}
                width={barW}
                height={Math.max(h2, 1)}
                fill={GOLD}
                rx={3}
              />
              {/* X label */}
              <text
                x={cx}
                y={svgH - padBottom + 16}
                textAnchor="middle"
                fontSize={11}
                fill={MUTED}
              >
                {row.label}
              </text>
              {/* Tooltip-like value on hover is not possible in SVG without JS, so show value above bar */}
              {h1 > 20 && (
                <text x={x1 + barW / 2} y={padTop + chartH - h1 - 3} textAnchor="middle" fontSize={9} fill={GOLD_DARK}>
                  {fmtCurrency(row.produtos)}
                </text>
              )}
              {h2 > 20 && (
                <text x={x2 + barW / 2} y={padTop + chartH - h2 - 3} textAnchor="middle" fontSize={9} fill={GOLD}>
                  {fmtCurrency(row.mensalidades)}
                </text>
              )}
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={padLeft} x2={svgW - padRight} y1={padTop + chartH} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + chartH} stroke="#3A3A3A" strokeWidth={1} />
      </svg>
    </div>
  );
}
