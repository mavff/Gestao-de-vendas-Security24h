'use client';
import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';

export function FunnelStageChart({ data }: { data: { stage: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>
        <Tooltip />
        <Funnel dataKey="total" data={data} isAnimationActive fill="#C8A951">
          <LabelList position="right" fill="#F2F2F2" stroke="none" dataKey="stage" />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
