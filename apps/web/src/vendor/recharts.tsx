'use client';
import { cloneElement, createContext, ReactElement, useContext } from 'react';

type Ctx = { data: any[]; width: number; height: number };
const ChartCtx = createContext<Ctx>({ data: [], width: 360, height: 220 });

export function ResponsiveContainer({ children }: { children: React.ReactNode }) { return <div style={{ width: '100%', height: '100%' }}>{children}</div>; }

function Base({ data, children }: { data?: any[]; children: React.ReactNode }) { return <ChartCtx.Provider value={{ data: data ?? [], width: 360, height: 220 }}><svg viewBox="0 0 360 220" width="100%" height="100%">{children}</svg></ChartCtx.Provider>; }
export function LineChart({ data, children }: any) { return <Base data={data}>{children}</Base>; }
export function BarChart({ data, children }: any) { return <Base data={data}>{children}</Base>; }
export function PieChart({ children }: any) { return <Base>{children}</Base>; }
export function FunnelChart({ children }: any) { return <Base>{children}</Base>; }
export function Tooltip() { return null; }
export function XAxis() { return null; }
export function YAxis() { return null; }

export function Line({ dataKey, stroke = '#fff' }: any) { const { data } = useContext(ChartCtx); const max = Math.max(...data.map((d) => d[dataKey] ?? 0), 1); const points = data.map((d, i) => `${(i/(Math.max(data.length-1,1)))*320+20},${190-(d[dataKey]/max)*160}`).join(' '); return <polyline points={points} fill="none" stroke={stroke} strokeWidth="3"/>; }
export function Bar({ dataKey, fill = '#fff' }: any) { const { data } = useContext(ChartCtx); const max = Math.max(...data.map((d) => d[dataKey] ?? 0), 1); const w = 280/Math.max(data.length,1); return <>{data.map((d,i)=><rect key={i} x={40+i*w} y={190-(d[dataKey]/max)*140} width={w-8} height={(d[dataKey]/max)*140} fill={fill}/> )}</>; }
export function Pie({ data, dataKey, innerRadius=40, outerRadius=80, children }: any) { const total = data.reduce((s:any,d:any)=>s+(d[dataKey]||0),0)||1; let acc=0; const slices=data.map((d:any,i:number)=>{const start=(acc/total)*Math.PI*2; acc += d[dataKey]||0; const end=(acc/total)*Math.PI*2; return {start,end,i};}); return <g transform="translate(180 110)">{slices.map(s=><circle key={s.i} r={(innerRadius+outerRadius)/2} fill="none" strokeWidth={outerRadius-innerRadius} stroke={(children?.[s.i]?.props?.fill)||'#999'} strokeDasharray={`${(s.end-s.start)*70} 999`} transform={`rotate(${(s.start*180)/Math.PI})`}/>)}</g>; }
export function Cell({ fill }: any) { return <g data-fill={fill} />; }
export function Funnel({ data, dataKey, fill }: any) { const max=Math.max(...data.map((d:any)=>d[dataKey]||0),1); return <>{data.map((d:any,i:number)=>{const w=(d[dataKey]/max)*280; return <rect key={i} x={40+(280-w)/2} y={20+i*34} width={w} height={24} fill={fill} opacity={1-i*0.1}/>;})}</>; }
export function LabelList() { return null; }
