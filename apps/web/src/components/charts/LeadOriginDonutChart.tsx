'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const colors = ['#C8A951', '#A5A5A5', '#6B6B6B', '#3F3F3F'];

export function LeadOriginDonutChart({ data }: { data: { origin: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip />
        <Pie data={data} dataKey="total" nameKey="origin" innerRadius={55} outerRadius={88}>
          {data.map((entry, idx) => (
            <Cell key={entry.origin} fill={colors[idx % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
