'use client';

import { useEffect, useState } from 'react';
import { ChartCard } from '../../components/charts/ChartCard';
import { ClosuresBarChart } from '../../components/charts/ClosuresBarChart';
import { FunnelStageChart } from '../../components/charts/FunnelStageChart';
import { LeadsLineChart } from '../../components/charts/LeadsLineChart';
import { LeadOriginDonutChart } from '../../components/charts/LeadOriginDonutChart';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { PeriodFilter } from '../../components/dashboard/PeriodFilter';
import { AppShell } from '../../components/layout/AppShell';
import { createDataSource, getDataSourceMode } from '../../lib/dataSource/factory';
import { DashboardStats, PeriodKey } from '../../lib/dataSource/types';
import { dashboardDataByPeriod } from '../../mocks/dashboard';
import { theme } from '../../components/common/theme';

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `R$${(value / 1000).toFixed(1)}k`;
  return `R$${value}`;
}

export function DashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [data, setData] = useState<DashboardStats>(dashboardDataByPeriod.all);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const ds = createDataSource();
        const stats = await ds.dashboard.getStats(period);
        if (!cancelled) {
          setData(stats);
          setIsReal(getDataSourceMode() === 'api');
        }
      } catch {
        // fallback para mock
        if (!cancelled) {
          setData(dashboardDataByPeriod[period] ?? dashboardDataByPeriod.all);
          setIsReal(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [period]);

  return (
    <AppShell title="Dashboard Comercial">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 0, marginBottom: 4 }}>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0, flex: 1 }}>
          Visão rápida do funil e performance comercial{' '}
          {loading
            ? '— carregando...'
            : isReal
              ? '— dados reais do banco'
              : '— modo demonstração'}
        </p>
        {loading && (
          <span style={{ fontSize: 12, color: theme.gold, animation: 'pulse 1s infinite' }}>●</span>
        )}
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
        <KpiCard label="Total Leads" value={String(data.kpis.totalLeads)} description="Leads no período" />
        <KpiCard label="Taxa Conversão" value={`${data.kpis.conversionRate}%`} description="Leads → Fechados" />
        <KpiCard label="Receita Estimada" value={formatCurrency(data.kpis.estimatedRevenue)} description="Valor projetado (orçamentos)" />
        <KpiCard label="Leads Novos" value={String(data.kpis.newLeadsThisWeek)} description="Novos esta semana" />
      </div>

      {/* Period Filter */}
      <div style={{ marginBottom: 16 }}>
        <PeriodFilter selected={period} onChange={setPeriod} />
      </div>

      {/* Charts Grid 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))', gap: 16, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <ChartCard title="Funil por etapa">
          {data.funnelData.length > 0
            ? <FunnelStageChart data={data.funnelData} />
            : <EmptyChart message="Sem dados de funil no período" />}
        </ChartCard>
        <ChartCard title="Leads por semana">
          {data.leadsByWeek.length > 0
            ? <LeadsLineChart data={data.leadsByWeek} />
            : <EmptyChart message="Sem cadastros no período" />}
        </ChartCard>
        <ChartCard title="Fechamentos por vendedor">
          {data.closuresBySeller.length > 0
            ? <ClosuresBarChart data={data.closuresBySeller} />
            : <EmptyChart message="Nenhum fechamento no período" />}
        </ChartCard>
        <ChartCard title="Origem dos leads">
          {data.leadsByOrigin.length > 0
            ? <LeadOriginDonutChart data={data.leadsByOrigin} />
            : <EmptyChart message="Sem dados de origem no período" />}
        </ChartCard>
      </div>
    </AppShell>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, fontSize: 13, fontStyle: 'italic' }}>
      {message}
    </div>
  );
}
