'use client';

const GREEN = '#43C17B';
const RED = '#E55B5B';
const GOLD = '#C8A951';
const MUTED = '#B5B5B5';
const TEXT = '#F2F2F2';
const GRID = '#252525';

export type RetencaoMensalDataPoint = { mes: string; novos: number; cancelados: number; saldo: number };

type Props = {
  data: RetencaoMensalDataPoint[];
  onBarClick?: (point: RetencaoMensalDataPoint) => void;
};

export function RetencaoMensalChart({ data, onBarClick }: Props) {
  if (!data.length) return null;

  const svgW = 560;
  const svgH = 240;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 36;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const maxUp = Math.max(...data.map((d) => d.novos), 1);
  const maxDown = Math.max(...data.map((d) => d.cancelados), 1);
  const maxAbs = Math.max(maxUp, maxDown);

  const zeroY = padTop + chartH / 2;
  const halfH = chartH / 2;

  const n = data.length;
  const groupW = chartW / n;
  const barGap = 3;
  const barW = Math.max(6, Math.min(22, (groupW - barGap * 3) / 2));

  function hUp(v: number) { return (v / maxAbs) * halfH; }

  // Y-axis ticks
  const ticks = 3;
  const tickVals = Array.from({ length: ticks }, (_, i) => Math.round((maxAbs / ticks) * (i + 1)));

  // Saldo line points
  const linePoints = data.map((d, i) => {
    const x = padLeft + i * groupW + groupW / 2;
    const saldoH = (d.saldo / maxAbs) * halfH;
    const y = zeroY - saldoH;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 4, paddingLeft: padLeft, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: GREEN }} />
          Novos
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: RED }} />
          Cancelados
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 12, height: 2, borderRadius: 1, background: GOLD }} />
          Saldo líquido
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: 300, maxHeight: 245 }}>
        {/* Grid lines - positive */}
        {tickVals.map((val) => {
          const y = zeroY - hUp(val);
          return (
            <g key={`p-${val}`}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={GRID} strokeWidth={0.5} />
              <text x={padLeft - 5} y={y + 3} textAnchor="end" fontSize={9} fill={MUTED}>+{val}</text>
            </g>
          );
        })}
        {/* Grid lines - negative */}
        {tickVals.map((val) => {
          const y = zeroY + hUp(val);
          return (
            <g key={`n-${val}`}>
              <line x1={padLeft} x2={svgW - padRight} y1={y} y2={y} stroke={GRID} strokeWidth={0.5} />
              <text x={padLeft - 5} y={y + 3} textAnchor="end" fontSize={9} fill={MUTED}>-{val}</text>
            </g>
          );
        })}

        {/* Zero line */}
        <line x1={padLeft} x2={svgW - padRight} y1={zeroY} y2={zeroY} stroke="#3A3A3A" strokeWidth={1} />
        <text x={padLeft - 5} y={zeroY + 3} textAnchor="end" fontSize={9} fill={MUTED}>0</text>

        {/* Bars per month */}
        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const xNovos = cx - barW - barGap / 2;
          const xCancel = cx + barGap / 2;
          const hN = hUp(d.novos);
          const hC = hUp(d.cancelados);
          return (
            <g
              key={d.mes}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              onClick={() => onBarClick?.(d)}
            >
              {/* Green bar up */}
              <rect
                x={xNovos} y={zeroY - hN}
                width={barW} height={Math.max(hN, 1)}
                fill={GREEN} rx={2} opacity={0.9}
              />
              {/* Red bar down */}
              <rect
                x={xCancel} y={zeroY}
                width={barW} height={Math.max(hC, 1)}
                fill={RED} rx={2} opacity={0.9}
              />
              {/* Value labels */}
              {hN > 12 && (
                <text x={xNovos + barW / 2} y={zeroY - hN - 3} textAnchor="middle" fontSize={9} fill={GREEN} fontWeight={700}>
                  +{d.novos}
                </text>
              )}
              {hC > 12 && (
                <text x={xCancel + barW / 2} y={zeroY + hC + 11} textAnchor="middle" fontSize={9} fill={RED} fontWeight={700}>
                  -{d.cancelados}
                </text>
              )}
              {/* Month label */}
              <text x={cx} y={svgH - padBottom + 18} textAnchor="middle" fontSize={10} fill={MUTED}>
                {d.mes}
              </text>
            </g>
          );
        })}

        {/* Saldo line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={GOLD}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Saldo dots */}
        {data.map((d, i) => {
          const x = padLeft + i * groupW + groupW / 2;
          const saldoH = (d.saldo / maxAbs) * halfH;
          const y = zeroY - saldoH;
          return (
            <circle key={`dot-${i}`} cx={x} cy={y} r={3} fill={GOLD} />
          );
        })}

        {/* Axes */}
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={svgH - padBottom} stroke="#3A3A3A" strokeWidth={1} />
      </svg>
    </div>
  );
}
