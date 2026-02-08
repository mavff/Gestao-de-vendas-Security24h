import { ChartCard } from '../../components/charts/ChartCard';
import { ClosuresBarChart } from '../../components/charts/ClosuresBarChart';
import { FunnelStageChart } from '../../components/charts/FunnelStageChart';
import { LeadsLineChart } from '../../components/charts/LeadsLineChart';
import { LeadOriginDonutChart } from '../../components/charts/LeadOriginDonutChart';
import { AppShell } from '../../components/layout/AppShell';
import { closuresBySeller, funnelData, leadsByOrigin, leadsByWeek } from '../../mocks/dashboard';

export function DashboardPage() {
  return (
    <AppShell title="Dashboard Comercial">
      <p style={{ color: '#B5B5B5', fontSize: 16, marginTop: 0 }}>Visão rápida do funil e performance semanal (modo mock).</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))', gap: 16 }}>
        <ChartCard title="Funil por etapa"><FunnelStageChart data={funnelData} /></ChartCard>
        <ChartCard title="Leads por semana"><LeadsLineChart data={leadsByWeek} /></ChartCard>
        <ChartCard title="Fechamentos por vendedor"><ClosuresBarChart data={closuresBySeller} /></ChartCard>
        <ChartCard title="Origem dos leads"><LeadOriginDonutChart data={leadsByOrigin} /></ChartCard>
      </div>
    </AppShell>
  );
}
