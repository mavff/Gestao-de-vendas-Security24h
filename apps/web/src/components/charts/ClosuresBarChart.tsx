'use client';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function ClosuresBarChart({ data }: { data: { seller: string; closures: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="seller" stroke="#B5B5B5" />
        <YAxis stroke="#B5B5B5" />
        <Tooltip />
        <Bar dataKey="closures" fill="#C8A951" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
