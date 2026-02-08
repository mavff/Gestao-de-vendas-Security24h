'use client';
import { createContext, ReactNode, useContext } from 'react';

type Ctx = { data: any[]; width: number; height: number };
const ChartCtx = createContext<Ctx>({ data: [], width: 360, height: 220 });

export function ResponsiveContainer({
  children,
  width,
  height,
}: {
  children: ReactNode;
  width?: string | number;
  height?: string | number;
}) {
  return <div style={{ width: width ?? '100%', height: height ?? '100%' }}>{children}</div>;
}

function Base({ data, children }: { data?: any[]; children: ReactNode }) {
  return (
    <ChartCtx.Provider value={{ data: data ?? [], width: 360, height: 220 }}>
      <svg viewBox="0 0 360 220" width="100%" height="100%">
        {children}
      </svg>
    </ChartCtx.Provider>
  );
}

export function LineChart({ data, children }: { data?: any[]; children: ReactNode }) {
  return <Base data={data}>{children}</Base>;
}
export function BarChart({ data, children }: { data?: any[]; children: ReactNode }) {
  return <Base data={data}>{children}</Base>;
}
export function PieChart({ children }: { children: ReactNode }) {
  return <Base>{children}</Base>;
}
export function FunnelChart({ children }: { children: ReactNode }) {
  return <Base>{children}</Base>;
}

export function Tooltip() {
  return null;
}
export function XAxis(_props: { dataKey?: string; stroke?: string }) {
  return null;
}
export function YAxis(_props: { stroke?: string }) {
  return null;
}

export function Line({ dataKey, stroke = '#fff' }: { dataKey: string; stroke?: string; type?: string; strokeWidth?: number; dot?: any }) {
  const { data } = useContext(ChartCtx);
  const max = Math.max(...data.map((d) => d[dataKey] ?? 0), 1);
  const points = data
    .map(
      (d, i) =>
        `${(i / Math.max(data.length - 1, 1)) * 320 + 20},${190 - (d[dataKey] / max) * 160}`,
    )
    .join(' ');
  return <polyline points={points} fill="none" stroke={stroke} strokeWidth="3" />;
}

export function Bar({ dataKey, fill = '#fff' }: { dataKey: string; fill?: string; radius?: number[] }) {
  const { data } = useContext(ChartCtx);
  const max = Math.max(...data.map((d) => d[dataKey] ?? 0), 1);
  const w = 280 / Math.max(data.length, 1);
  return (
    <>
      {data.map((d, i) => (
        <rect
          key={i}
          x={40 + i * w}
          y={190 - (d[dataKey] / max) * 140}
          width={w - 8}
          height={(d[dataKey] / max) * 140}
          fill={fill}
        />
      ))}
    </>
  );
}

export function Pie({
  data,
  dataKey,
  nameKey,
  innerRadius = 40,
  outerRadius = 80,
  children,
}: {
  data: any[];
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  children?: ReactNode;
}) {
  const total = data.reduce((s: number, d: any) => s + (d[dataKey] || 0), 0) || 1;
  const childArray = Array.isArray(children) ? children : children ? [children] : [];
  let acc = 0;
  const slices = data.map((d: any, i: number) => {
    const start = (acc / total) * Math.PI * 2;
    acc += d[dataKey] || 0;
    const end = (acc / total) * Math.PI * 2;
    const label = nameKey ? d[nameKey] : undefined;
    return { start, end, i, label };
  });

  const midRadius = (innerRadius + outerRadius) / 2;

  return (
    <g transform="translate(180 110)">
      {slices.map((s) => (
        <g key={s.i}>
          <circle
            r={midRadius}
            fill="none"
            strokeWidth={outerRadius - innerRadius}
            stroke={childArray[s.i]?.props?.fill || '#999'}
            strokeDasharray={`${(s.end - s.start) * midRadius} 999`}
            transform={`rotate(${(s.start * 180) / Math.PI - 90})`}
          />
          {s.label && (
            <text
              x={Math.cos((s.start + s.end) / 2 - Math.PI / 2) * (outerRadius + 14)}
              y={Math.sin((s.start + s.end) / 2 - Math.PI / 2) * (outerRadius + 14)}
              fill="#B5B5B5"
              fontSize={10}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {s.label}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

export function Cell(_props: { fill?: string }) {
  return <g />;
}

export function Funnel({
  data,
  dataKey,
  fill,
  children,
}: {
  data: any[];
  dataKey: string;
  fill?: string;
  isAnimationActive?: boolean;
  children?: ReactNode;
}) {
  const max = Math.max(...data.map((d: any) => d[dataKey] || 0), 1);
  return (
    <>
      {data.map((d: any, i: number) => {
        const w = (d[dataKey] / max) * 280;
        return (
          <rect
            key={i}
            x={40 + (280 - w) / 2}
            y={20 + i * 34}
            width={w}
            height={24}
            fill={fill}
            opacity={1 - i * 0.1}
            rx={4}
          />
        );
      })}
    </>
  );
}

export function LabelList({
  dataKey,
  fill = '#F2F2F2',
  position,
}: {
  dataKey?: string;
  fill?: string;
  stroke?: string;
  position?: string;
}) {
  const { data } = useContext(ChartCtx);
  if (!dataKey || !data.length) return null;
  const maxVal = Math.max(...data.map((d) => d.total ?? d[dataKey] ?? 0), 1);
  return (
    <>
      {data.map((d, i) => {
        const barW = ((d.total ?? d[dataKey] ?? 0) / maxVal) * 280;
        const xPos =
          position === 'right'
            ? 40 + (280 + barW) / 2 + 8
            : 40 + (280 - barW) / 2 + barW / 2;
        return (
          <text
            key={i}
            x={xPos}
            y={20 + i * 34 + 14}
            fill={fill}
            fontSize={12}
            textAnchor={position === 'right' ? 'start' : 'middle'}
            dominantBaseline="central"
          >
            {d[dataKey]}
          </text>
        );
      })}
    </>
  );
}
