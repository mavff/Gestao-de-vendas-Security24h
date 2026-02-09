'use client';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function LeadsLineChart({ data }: { data: { week: string; leads: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="week" stroke="#B5B5B5" />
        <YAxis stroke="#B5B5B5" />
        <Tooltip />
        <Line type="monotone" dataKey="leads" stroke="#C8A951" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
