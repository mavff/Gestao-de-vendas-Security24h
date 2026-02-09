'use client';

import { useState } from 'react';
import { ChartCard } from '../../components/charts/ChartCard';
import { ClosuresBarChart } from '../../components/charts/ClosuresBarChart';
import { FunnelStageChart } from '../../components/charts/FunnelStageChart';
import { LeadsLineChart } from '../../components/charts/LeadsLineChart';
import { LeadOriginDonutChart } from '../../components/charts/LeadOriginDonutChart';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { PeriodFilter } from '../../components/dashboard/PeriodFilter';
import { AppShell } from '../../components/layout/AppShell';
import { dashboardDataByPeriod, type PeriodKey } from '../../mocks/dashboard';

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(1)}k`;
  }
  return `R$${value}`;
}

export function DashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>('all');
  const data = dashboardDataByPeriod[period];

  return (
    <AppShell title="Dashboard Comercial">
      <p style={{ color: '#B5B5B5', fontSize: 16, marginTop: 0 }}>
        Visão rápida do funil e performance semanal (modo mock).
      </p>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <KpiCard label="Total Leads" value={String(data.kpis.totalLeads)} description="Leads no período" />
        <KpiCard label="Taxa Conversão" value={`${data.kpis.conversionRate}%`} description="Leads → Fechados" />
        <KpiCard label="Receita Estimada" value={formatCurrency(data.kpis.estimatedRevenue)} description="Valor projetado" />
        <KpiCard label="Leads Novos" value={String(data.kpis.newLeadsThisWeek)} description="Novos esta semana" />
      </div>

      {/* Period Filter */}
      <div style={{ marginBottom: 16 }}>
        <PeriodFilter selected={period} onChange={setPeriod} />
      </div>

      {/* Charts Grid 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))', gap: 16 }}>
        <ChartCard title="Funil por etapa"><FunnelStageChart data={data.funnelData} /></ChartCard>
        <ChartCard title="Leads por semana"><LeadsLineChart data={data.leadsByWeek} /></ChartCard>
        <ChartCard title="Fechamentos por vendedor"><ClosuresBarChart data={data.closuresBySeller} /></ChartCard>
        <ChartCard title="Origem dos leads"><LeadOriginDonutChart data={data.leadsByOrigin} /></ChartCard>
      </div>
    </AppShell>
  );
}
