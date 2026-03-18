'use client';

import { TecnicoRow } from '../../lib/dataSource/types';

const GOLD_DARK = '#A07830';
const GOLD     = '#C8A951';
const GREEN    = '#43C17B';
const MUTED    = '#B5B5B5';
const TEXT     = '#F2F2F2';
const SOFT     = '#1E1E1E';

function fmtK(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return v > 0 ? `R$${v}` : '—';
}

export function TecnicoPerformanceChart({ data }: { data: TecnicoRow[] }) {
  if (!data.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: MUTED, fontSize: 13, fontStyle: 'italic' }}>
        Sem OS fechadas no período selecionado
      </div>
    );
  }

  const ROW_H   = 52;
  const NAME_W  = 100;
  const BADGE_W = 130;
  const PAD_X   = 16;
  const BAR_AREA = 560 - NAME_W - BADGE_W - PAD_X * 2;
  const maxTotal = Math.max(...data.map((d) => d.receitaTotal), 1);

  const svgH = data.length * ROW_H + 24; // +24 for legend row
  const svgW = 560;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, paddingLeft: NAME_W + PAD_X }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: GOLD_DARK }} /> Equipamentos
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: GOLD }} /> Instalação
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: GREEN }} /> Manutenções (OS)
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 340 }}>
        {data.map((d, i) => {
          const y = i * ROW_H;
          const barY = y + ROW_H / 2 - 8; // center of double bar

          // Revenue bars
          const wEquip   = (d.receitaEquipamentos / maxTotal) * BAR_AREA;
          const wInstal  = (d.receitaInstalacao  / maxTotal) * BAR_AREA;

          // Maintenance indicator bar (proportional to count, max 40% of area)
          const maxManut = Math.max(...data.map((x) => x.osManutencoes), 1);
          const wManut   = (d.osManutencoes / maxManut) * (BAR_AREA * 0.4);

          const barX = PAD_X + NAME_W;
          const badgeX = barX + BAR_AREA + 8;

          const firstName = d.tecnico.split(' ')[0];

          return (
            <g key={d.tecnico}>
              {/* Row background (alternating) */}
              {i % 2 === 1 && (
                <rect x={0} y={y} width={svgW} height={ROW_H} fill={SOFT} opacity={0.4} />
              )}

              {/* Name */}
              <text x={PAD_X} y={y + ROW_H / 2 + 4} fontSize={12} fill={TEXT} fontWeight={600}>
                {firstName}
              </text>
              {d.tecnico.split(' ').length > 1 && (
                <text x={PAD_X} y={y + ROW_H / 2 + 17} fontSize={9} fill={MUTED}>
                  {d.tecnico.split(' ').slice(1).join(' ')}
                </text>
              )}

              {/* Bar track */}
              <rect x={barX} y={barY} width={BAR_AREA} height={8} rx={3} fill="#2A2A2A" />
              <rect x={barX} y={barY + 10} width={BAR_AREA * 0.4} height={6} rx={3} fill="#2A2A2A" opacity={0.6} />

              {/* Equipamentos bar */}
              {wEquip > 0 && (
                <rect x={barX} y={barY} width={wEquip} height={8} rx={3} fill={GOLD_DARK} opacity={0.9} />
              )}

              {/* Instalação bar (stacked after equipamentos) */}
              {wInstal > 0 && (
                <rect x={barX + wEquip} y={barY} width={wInstal} height={8} rx={3} fill={GOLD} opacity={0.9} />
              )}

              {/* Manutenção bar (second row, green) */}
              {wManut > 0 && (
                <rect x={barX} y={barY + 10} width={wManut} height={6} rx={3} fill={GREEN} opacity={0.85} />
              )}

              {/* Revenue total label (end of revenue bar) */}
              <text
                x={barX + Math.max(wEquip + wInstal, 2) + 6}
                y={barY + 7}
                fontSize={11}
                fill={TEXT}
                fontWeight={700}
              >
                {fmtK(d.receitaTotal)}
              </text>

              {/* Badge column: OS counts */}
              <text x={badgeX} y={y + ROW_H / 2 - 3} fontSize={11} fill={GOLD} fontWeight={700}>
                {d.osInstalacoes} instal.
              </text>
              <text x={badgeX} y={y + ROW_H / 2 + 13} fontSize={11} fill={GREEN} fontWeight={700}>
                {d.osManutencoes} manut.
              </text>
            </g>
          );
        })}

        {/* Bottom axis */}
        <line
          x1={PAD_X + NAME_W}
          x2={PAD_X + NAME_W + BAR_AREA}
          y1={svgH - 2}
          y2={svgH - 2}
          stroke="#3A3A3A"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
