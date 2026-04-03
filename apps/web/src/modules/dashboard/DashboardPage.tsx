'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChartCard } from '../../components/charts/ChartCard';
import { ReceitaMensalChart } from '../../components/charts/ReceitaMensalChart';
import { ReceitaMixChart } from '../../components/charts/ReceitaMixChart';
import { VendedorPerformanceChart } from '../../components/charts/VendedorPerformanceChart';
import { FunnelStageChart } from '../../components/charts/FunnelStageChart';
import { LeadsLineChart } from '../../components/charts/LeadsLineChart';
import { ClosuresBarChart } from '../../components/charts/ClosuresBarChart';
import { LeadOriginDonutChart } from '../../components/charts/LeadOriginDonutChart';
import { ProspeccaoMensalChart } from '../../components/charts/ProspeccaoMensalChart';
import { CanalComparisonChart } from '../../components/charts/CanalComparisonChart';
import { TecnicoPerformanceChart } from '../../components/charts/TecnicoPerformanceChart';
import { ReceitaCustosBarChart } from '../../components/charts/ReceitaCustosBarChart';
import { CustosDonutChart } from '../../components/charts/CustosDonutChart';
import { RetencaoMensalChart } from '../../components/charts/RetencaoMensalChart';
import { RetencaoDonutChart } from '../../components/charts/RetencaoDonutChart';
import { ChartDetailModal, InsightCard, DataTable } from '../../components/charts/ChartDetailModal';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { CustosConfigModal } from '../../components/dashboard/CustosConfigModal';
import { AppShell } from '../../components/layout/AppShell';
import { createDataSource, getDataSourceMode } from '../../lib/dataSource/factory';
import { DashboardStats, FinanceiroDashboard, RetencaoDashboard, PeriodKey, SheetsLeadStats, TecnicoRow, CustosEmpresaConfig, DEFAULT_CUSTOS_CONFIG } from '../../lib/dataSource/types';
import { dashboardDataByPeriod } from '../../mocks/dashboard';
import { theme } from '../../components/common/theme';
import { useAuth } from '../../contexts/AuthContext';
import { loadState } from '../../services/appState';

type FinanceiroPeriodPreset = '7d' | '30d' | '90d' | 'ano' | 'custom';
type DashTab = 'financeiro' | 'crm' | 'prospeccao' | 'marketing';
type ModalKey = 'evolucao' | 'mix' | 'vendedor' | 'operacoes' | 'funil' | 'leads' | 'fechamentos' | 'origens'
  | 'sh_funil' | 'sh_canal' | 'sh_mensal' | 'sh_status' | 'sh_recentes' | 'tecnico' | 'retencao' | null;

const MOCK_FINANCEIRO: FinanceiroDashboard = {
  receitaEquipamentos: 185000,
  receitaInstalacao: 42000,
  receitaTotal: 227000,
  mrrBase: 38500,
  arr: 462000,
  orcamentosFechados: 14,
  ticketMedio: 16214,
  pipelineAberto: 450000,
  osInstalacoes: 18,
  osManutencoes: 7,
  porVendedor: [
    { usuario: 'Ana', equipamentos: 72000, instalacao: 16000, total: 88000 },
    { usuario: 'Carlos', equipamentos: 54000, instalacao: 12000, total: 66000 },
    { usuario: 'Renata', equipamentos: 38000, instalacao: 9000, total: 47000 },
    { usuario: 'Felipe', equipamentos: 21000, instalacao: 5000, total: 26000 },
  ],
  evolucaoMensal: [
    { mes: 'Out/24', equipamentos: 28000, instalacao: 6000 },
    { mes: 'Nov/24', equipamentos: 31000, instalacao: 7500 },
    { mes: 'Dez/24', equipamentos: 22000, instalacao: 5000 },
    { mes: 'Jan/25', equipamentos: 35000, instalacao: 8000 },
    { mes: 'Fev/25', equipamentos: 42000, instalacao: 9500 },
  ],
  mixReceita: [
    { name: 'Equipamentos', value: 185000 },
    { name: 'Instalação', value: 42000 },
    { name: 'Monitoramento MRR', value: 38500 },
  ],
  porTecnico: [],
};

function getDateRange(
  preset: FinanceiroPeriodPreset,
  start: string,
  end: string,
): { dataInicio?: string; dataFim?: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  switch (preset) {
    case '7d': return { dataInicio: fmt(new Date(Date.now() - 7 * 86400000)), dataFim: fmt(today) };
    case '30d': return { dataInicio: fmt(new Date(Date.now() - 30 * 86400000)), dataFim: fmt(today) };
    case '90d': return { dataInicio: fmt(new Date(Date.now() - 90 * 86400000)), dataFim: fmt(today) };
    case 'ano': { const y = today.getFullYear(); return { dataInicio: `${y}-01-01`, dataFim: `${y}-12-31` }; }
    case 'custom': return { dataInicio: start || undefined, dataFim: end || undefined };
    default: return {};
  }
}

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

function fmtPct(v: number) { return v.toFixed(1) + '%'; }

const PRESETS: { key: FinanceiroPeriodPreset; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'ano', label: 'Este ano' },
  { key: 'custom', label: 'Personalizado' },
];

const CRM_PRESETS: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'Tudo' },
];

/* ─── Modal content components ─── */

function EvolucaoModalContent({ data }: { data: FinanceiroDashboard['evolucaoMensal'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados no período selecionado.</p>;

  const totals = data.map((d) => ({ ...d, total: d.equipamentos + d.instalacao }));
  const grandTotal = totals.reduce((s, d) => s + d.total, 0);
  const bestMonth = totals.reduce((a, b) => b.total > a.total ? b : a);
  const avgMonthly = grandTotal / totals.length;
  const lastTwo = totals.slice(-2);
  const momPct = lastTwo.length === 2 && lastTwo[0].total > 0
    ? ((lastTwo[1].total - lastTwo[0].total) / lastTwo[0].total) * 100
    : null;

  const rows = totals.map((d) => [
    d.mes,
    fmtCurrency(d.equipamentos),
    fmtCurrency(d.instalacao),
    fmtCurrency(d.total),
    fmtPct((d.total / grandTotal) * 100),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Total no Período" value={fmtCurrency(grandTotal)} sub="Equip. + Instalação" />
        <InsightCard label="Melhor Mês" value={bestMonth.mes} sub={fmtCurrency(bestMonth.total)} />
        <InsightCard label="Média Mensal" value={fmtCurrency(avgMonthly)} sub={`${totals.length} meses`} />
        {momPct !== null && (
          <InsightCard
            label="MoM Último Mês"
            value={(momPct >= 0 ? '+' : '') + fmtPct(momPct)}
            sub={`${lastTwo[0].mes} → ${lastTwo[1].mes}`}
            accent={momPct >= 0 ? '#43C17B' : '#E55B5B'}
          />
        )}
      </div>

      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>
          Detalhamento por Mês
        </p>
        <DataTable
          headers={['Mês', 'Equipamentos', 'Instalação', 'Total', '% do Período']}
          rows={rows}
        />
      </div>

      <div style={{ background: theme.soft, borderRadius: 10, padding: 14, fontSize: 13, color: theme.muted, lineHeight: 1.7 }}>
        <strong style={{ color: theme.text }}>Análise:</strong>{' '}
        Equipamentos representam{' '}
        <strong style={{ color: theme.gold }}>
          {fmtPct(totals.reduce((s, d) => s + d.equipamentos, 0) / (grandTotal || 1) * 100)}
        </strong>{' '}
        da receita do período. O melhor mês foi{' '}
        <strong style={{ color: theme.gold }}>{bestMonth.mes}</strong>{' '}
        com{' '}
        <strong style={{ color: theme.gold }}>{fmtCurrency(bestMonth.total)}</strong>.
        {momPct !== null && (
          <>{' '}Comparando os dois últimos meses, houve{' '}
          <strong style={{ color: momPct >= 0 ? '#43C17B' : '#E55B5B' }}>
            {momPct >= 0 ? 'crescimento' : 'queda'} de {Math.abs(momPct).toFixed(1)}%
          </strong>.
          </>
        )}
      </div>
    </div>
  );
}

function MixModalContent({ data, total }: { data: FinanceiroDashboard['mixReceita']; total: number }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados.</p>;

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const maior = sorted[0];
  const recorrente = data.find((d) => d.name.toLowerCase().includes('monitoramento'));

  const rows = data.map((d) => [d.name, fmtCurrency(d.value), fmtPct((d.value / (total || 1)) * 100)]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Maior Fonte" value={maior.name} sub={fmtCurrency(maior.value)} />
        <InsightCard label="Receita Total" value={fmtCurrency(total)} sub="todas as fontes" />
        {recorrente && (
          <InsightCard
            label="MRR (Base Ativa)"
            value={fmtCurrency(recorrente.value)}
            sub={fmtPct((recorrente.value / (total || 1)) * 100) + ' da receita'}
            accent="#5B9BD5"
          />
        )}
        <InsightCard
          label="Participação Equip."
          value={fmtPct((sorted[0].value / (total || 1)) * 100)}
          sub="maior componente"
        />
      </div>

      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>
          Composição da Receita
        </p>
        <DataTable headers={['Fonte', 'Valor', '% do Total']} rows={rows} />
      </div>

      {/* Mini bar chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((d, i) => {
          const pct = (d.value / (total || 1)) * 100;
          const colors = ['#A07830', '#C8A951', '#5B9BD5'];
          return (
            <div key={d.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: theme.text }}>{d.name}</span>
                <span style={{ color: colors[i % colors.length], fontWeight: 700 }}>{fmtPct(pct)}</span>
              </div>
              <div style={{ height: 8, background: theme.soft, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: theme.soft, borderRadius: 10, padding: 14, fontSize: 13, color: theme.muted, lineHeight: 1.7 }}>
        <strong style={{ color: theme.text }}>Análise:</strong>{' '}
        A principal fonte de receita é{' '}
        <strong style={{ color: theme.gold }}>{maior.name}</strong>{' '}
        ({fmtPct((maior.value / (total || 1)) * 100)}).
        {recorrente && (
          <>{' '}A receita recorrente (MRR) de{' '}
          <strong style={{ color: '#5B9BD5' }}>{fmtCurrency(recorrente.value)}/mês</strong>{' '}
          garante previsibilidade ao negócio.
          </>
        )}
      </div>
    </div>
  );
}

function VendedorModalContent({ data }: { data: FinanceiroDashboard['porVendedor'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados de vendedor no período.</p>;

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const grandTotal = sorted.reduce((s, d) => s + d.total, 0);
  const top = sorted[0];

  const rows = sorted.map((d, i) => [
    `#${i + 1} ${d.usuario}`,
    fmtCurrency(d.equipamentos),
    fmtCurrency(d.instalacao),
    fmtCurrency(d.total),
    fmtPct((d.total / (grandTotal || 1)) * 100),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Top Performer" value={top.usuario} sub={fmtCurrency(top.total)} />
        <InsightCard label="Total Equipe" value={fmtCurrency(grandTotal)} sub={`${sorted.length} vendedores`} />
        <InsightCard label="Média por Vendedor" value={fmtCurrency(grandTotal / sorted.length)} />
        <InsightCard
          label="Participação do #1"
          value={fmtPct((top.total / (grandTotal || 1)) * 100)}
          sub="do total da equipe"
        />
      </div>

      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>
          Ranking de Vendedores
        </p>
        <DataTable
          headers={['Vendedor', 'Equipamentos', 'Instalação', 'Total', '% Equipe']}
          rows={rows}
        />
      </div>

      {/* Performance bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((d) => (
          <div key={d.usuario}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
              <span style={{ color: theme.text }}>{d.usuario}</span>
              <span style={{ color: theme.gold, fontWeight: 700 }}>{fmtCurrency(d.total)}</span>
            </div>
            <div style={{ height: 6, background: theme.soft, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(d.total / (top.total || 1)) * 100}%`,
                background: `linear-gradient(to right, #A07830, #C8A951)`,
                borderRadius: 3,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperacoesModalContent({ data }: { data: FinanceiroDashboard }) {
  const total = data.osInstalacoes + data.osManutencoes;
  const ratio = data.osManutencoes > 0 ? (data.osInstalacoes / data.osManutencoes).toFixed(1) : '—';

  const rows = [
    ['Instalações (tipo I)', String(data.osInstalacoes), fmtPct((data.osInstalacoes / (total || 1)) * 100)],
    ['Manutenções (tipo M)', String(data.osManutencoes), fmtPct((data.osManutencoes / (total || 1)) * 100)],
    ['Total OS', String(total), '100%'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Instalações" value={String(data.osInstalacoes)} sub="Novos clientes atendidos" accent="#43C17B" />
        <InsightCard label="Manutenções" value={String(data.osManutencoes)} sub="Suporte a base ativa" accent="#C8A951" />
        <InsightCard label="Total de OS" value={String(total)} sub="no período" />
        <InsightCard label="Razão Instal/Manut" value={ratio} sub="instalações por manutenção" />
      </div>

      <DataTable headers={['Tipo de OS', 'Quantidade', '% do Total']} rows={rows} />

      <div style={{ background: theme.soft, borderRadius: 10, padding: 14, fontSize: 13, color: theme.muted, lineHeight: 1.7 }}>
        <strong style={{ color: theme.text }}>Análise:</strong>{' '}
        A empresa realizou{' '}
        <strong style={{ color: '#43C17B' }}>{data.osInstalacoes} instalações</strong>{' '}
        e{' '}
        <strong style={{ color: theme.gold }}>{data.osManutencoes} manutenções</strong>{' '}
        no período.{' '}
        {data.osInstalacoes > data.osManutencoes
          ? 'O volume de novas instalações está acima das manutenções — sinal de crescimento da base.'
          : 'O volume de manutenções indica base ativa robusta. Acompanhe indicadores de instalações para expandir.'}
      </div>
    </div>
  );
}

function TecnicoModalContent({ data }: { data: TecnicoRow[] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados de técnico no período.</p>;

  const sorted = [...data].sort((a, b) => b.receitaTotal - a.receitaTotal);
  const grandTotal = sorted.reduce((s, d) => s + d.receitaTotal, 0);
  const totalInstal = sorted.reduce((s, d) => s + d.osInstalacoes, 0);
  const totalManut = sorted.reduce((s, d) => s + d.osManutencoes, 0);
  const top = sorted[0];

  const rows = sorted.map((d, i) => [
    `#${i + 1} ${d.tecnico}`,
    String(d.osInstalacoes),
    String(d.osManutencoes),
    fmtCurrency(d.receitaEquipamentos),
    fmtCurrency(d.receitaInstalacao),
    fmtCurrency(d.receitaTotal),
    fmtPct((d.receitaTotal / (grandTotal || 1)) * 100),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Top Técnico" value={top.tecnico} sub={fmtCurrency(top.receitaTotal)} />
        <InsightCard label="Total Receita" value={fmtCurrency(grandTotal)} sub={`${sorted.length} técnicos`} />
        <InsightCard label="OS Instalações" value={String(totalInstal)} sub="no período" accent="#43C17B" />
        <InsightCard label="OS Manutenções" value={String(totalManut)} sub="no período" accent="#C8A951" />
      </div>

      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>Ranking de Técnicos</p>
        <DataTable
          headers={['Técnico', 'Instal.', 'Manut.', 'Equipamentos', 'Instalação', 'Total', '% Equipe']}
          rows={rows}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((d) => (
          <div key={d.tecnico}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
              <span style={{ color: theme.text }}>{d.tecnico}</span>
              <span style={{ color: theme.gold, fontWeight: 700 }}>{fmtCurrency(d.receitaTotal)}</span>
            </div>
            <div style={{ height: 6, background: theme.soft, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(d.receitaTotal / (top.receitaTotal || 1)) * 100}%`,
                background: 'linear-gradient(to right, #A07830, #C8A951)',
                borderRadius: 3,
              }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 11, color: theme.muted }}>
              <span style={{ color: '#43C17B' }}>{d.osInstalacoes} instalações</span>
              <span style={{ color: '#C8A951' }}>{d.osManutencoes} manutenções</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal content components (CRM) ─── */

function FunilModalContent({ data }: { data: DashboardStats['funnelData'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados do funil no período.</p>;

  const topo = data[0].total || 1;
  const fundo = data[data.length - 1];
  const convChain = data.slice(1).map((d, i) => ({
    from: data[i].stage,
    to: d.stage,
    rate: data[i].total > 0 ? ((d.total / data[i].total) * 100).toFixed(1) + '%' : '—',
  }));
  const rows = data.map((d) => [d.stage, String(d.total), fmtPct((d.total / topo) * 100)]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Topo do Funil" value={String(data[0].total)} sub={data[0].stage} />
        <InsightCard label="Fundo do Funil" value={String(fundo.total)} sub={fundo.stage} />
        <InsightCard
          label="Conversão Geral"
          value={fmtPct((fundo.total / topo) * 100)}
          sub="topo → fundo"
          accent={fundo.total / topo > 0.2 ? '#43C17B' : '#C8A951'}
        />
        <InsightCard label="Etapas" value={String(data.length)} sub="no funil" />
      </div>
      <DataTable headers={['Etapa', 'Leads', '% do Topo']} rows={rows} />
      {convChain.length > 0 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>Conversão entre etapas</p>
          <DataTable headers={['De', 'Para', 'Taxa']} rows={convChain.map((c) => [c.from, c.to, c.rate])} />
        </div>
      )}
    </div>
  );
}

function LeadsModalContent({ data }: { data: DashboardStats['leadsByWeek'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados de leads no período.</p>;

  const total = data.reduce((s, d) => s + d.leads, 0);
  const avg = total / data.length;
  const maxItem = data.reduce((a, b) => (b.leads > a.leads ? b : a));
  const minItem = data.reduce((a, b) => (b.leads < a.leads ? b : a));
  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half).reduce((s, d) => s + d.leads, 0);
  const secondHalf = data.slice(half).reduce((s, d) => s + d.leads, 0);
  const trendPct = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : null;
  const rows = data.map((d) => [d.week, String(d.leads), fmtPct((d.leads / (total || 1)) * 100)]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Total no Período" value={String(total)} sub="leads captados" />
        <InsightCard label="Média" value={avg.toFixed(1)} sub="por período" />
        <InsightCard label="Pico" value={String(maxItem.leads)} sub={maxItem.week} accent="#43C17B" />
        {trendPct !== null && (
          <InsightCard
            label="Tendência"
            value={(trendPct >= 0 ? '+' : '') + trendPct.toFixed(1) + '%'}
            sub="1ª vs 2ª metade"
            accent={trendPct >= 0 ? '#43C17B' : '#E55B5B'}
          />
        )}
      </div>
      <div style={{ background: theme.soft, borderRadius: 10, padding: 14, fontSize: 13, color: theme.muted, lineHeight: 1.7 }}>
        <strong style={{ color: theme.text }}>Análise:</strong>{' '}
        O período registrou <strong style={{ color: theme.gold }}>{total} leads</strong>, média de{' '}
        <strong style={{ color: theme.gold }}>{avg.toFixed(1)}/período</strong>. Pico em{' '}
        <strong style={{ color: theme.gold }}>{maxItem.week}</strong> ({maxItem.leads} leads)
        {minItem.week !== maxItem.week && `, mínimo em ${minItem.week} (${minItem.leads})`}.
      </div>
      <DataTable headers={['Período', 'Leads', '% do Total']} rows={rows} />
    </div>
  );
}

function FechamentosModalContent({ data }: { data: DashboardStats['closuresBySeller'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem fechamentos no período.</p>;

  const sorted = [...data].sort((a, b) => b.closures - a.closures);
  const total = sorted.reduce((s, d) => s + d.closures, 0);
  const top = sorted[0];
  const rows = sorted.map((d, i) => [
    `#${i + 1} ${d.seller}`,
    String(d.closures),
    fmtPct((d.closures / (total || 1)) * 100),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Top Fechador" value={top.seller} sub={`${top.closures} fechamentos`} />
        <InsightCard label="Total" value={String(total)} sub={`${sorted.length} vendedores`} />
        <InsightCard label="Média/Vendedor" value={(total / sorted.length).toFixed(1)} />
        <InsightCard label="Share do #1" value={fmtPct((top.closures / (total || 1)) * 100)} sub="do total" />
      </div>
      <DataTable headers={['Vendedor', 'Fechamentos', '% do Total']} rows={rows} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((d) => (
          <div key={d.seller}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
              <span style={{ color: theme.text }}>{d.seller}</span>
              <span style={{ color: theme.gold, fontWeight: 700 }}>{d.closures} fechamentos</span>
            </div>
            <div style={{ height: 6, background: theme.soft, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(d.closures / (top.closures || 1)) * 100}%`,
                background: `linear-gradient(to right, #A07830, #C8A951)`,
                borderRadius: 3,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrigensModalContent({ data }: { data: DashboardStats['leadsByOrigin'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados de origem no período.</p>;

  const total = data.reduce((s, d) => s + d.total, 0);
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const top = sorted[0];
  const rows = sorted.map((d, i) => [
    `#${i + 1} ${d.origin}`,
    String(d.total),
    fmtPct((d.total / (total || 1)) * 100),
  ]);
  const COLORS = ['#C8A951', '#A5A5A5', '#7A7A7A', '#505050'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Principal Origem" value={top.origin} sub={`${top.total} leads`} />
        <InsightCard label="Total Leads" value={String(total)} sub={`${sorted.length} origens`} />
        <InsightCard label="Share da #1" value={fmtPct((top.total / (total || 1)) * 100)} sub="origem líder" />
        {sorted.length >= 2 && (
          <InsightCard label="2ª Origem" value={sorted[1].origin} sub={`${sorted[1].total} leads`} accent="#A5A5A5" />
        )}
      </div>
      <DataTable headers={['Origem', 'Leads', '% do Total']} rows={rows} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((d, i) => {
          const pct = (d.total / (total || 1)) * 100;
          return (
            <div key={d.origin}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: theme.text }}>{d.origin}</span>
                <span style={{ color: COLORS[i % COLORS.length], fontWeight: 700 }}>{fmtPct(pct)}</span>
              </div>
              <div style={{ height: 8, background: theme.soft, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Sheets modal content components ─── */

const PRIORIDADE_COLOR: Record<string, string> = {
  alta: '#E55B5B', média: '#C8A951', media: '#C8A951', baixa: '#43C17B',
};

function ShFunilModalContent({ data }: { data: SheetsLeadStats['funnelCrm'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados.</p>;
  // data[0]=WhatsApp, data[1]=Instagram, data[2]=Visitas, last=Fechou
  const totalLeads = (data[0]?.total ?? 0) + (data[1]?.total ?? 0);
  const visitas = data[2]?.total ?? 0;
  const fundo = data[data.length - 1];
  const topo = totalLeads || 1;
  const rows = data.map((d) => [d.stage, String(d.total), fmtPct((d.total / topo) * 100)]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Total de Leads" value={String(totalLeads)} sub="WhatsApp + Instagram" />
        <InsightCard label="Visitas Marcadas" value={String(visitas)} sub="agendamentos realizados" />
        <InsightCard label="Fechamentos" value={String(fundo.total)} sub="contratos fechados" accent="#43C17B" />
        <InsightCard label="Conv. Lead→Visita" value={fmtPct((visitas / topo) * 100)} sub="do total de leads" />
      </div>
      <DataTable headers={['Canal', 'Quantidade', '% do Total']} rows={rows} />
    </div>
  );
}

function ShCanalModalContent({ data }: { data: SheetsLeadStats['porCanal'] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const rows = data.map((d) => [d.origin, String(d.total), fmtPct((d.total / (total || 1)) * 100)]);
  const CANAL_COLORS: Record<string, string> = { WhatsApp: '#43C17B', Instagram: '#C8A951' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {data.map((d) => (
          <InsightCard key={d.origin} label={d.origin} value={String(d.total)} sub={fmtPct((d.total / (total || 1)) * 100)} accent={CANAL_COLORS[d.origin]} />
        ))}
        <InsightCard label="Total" value={String(total)} sub="leads captados" />
      </div>
      <DataTable headers={['Canal', 'Leads', '% do Total']} rows={rows} />
    </div>
  );
}

function ShMensalModalContent({ data }: { data: SheetsLeadStats['evolucaoMensal'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem dados de período.</p>;
  const rows = data.map((d) => [d.mes, String(d.whatsapp), String(d.instagram), String(d.visitas), String(d.whatsapp + d.instagram + d.visitas)]);
  const grandTotal = data.reduce((s, d) => s + d.whatsapp + d.instagram + d.visitas, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Total no Período" value={String(grandTotal)} sub="todos os canais" />
        <InsightCard label="Meses com dados" value={String(data.length)} />
      </div>
      <DataTable headers={['Mês', 'WhatsApp', 'Instagram', 'Visitas', 'Total']} rows={rows} />
    </div>
  );
}

function ShStatusModalContent({ data }: { data: SheetsLeadStats['porStatus'] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const rows = data.map((d) => [d.status, String(d.total), fmtPct((d.total / (total || 1)) * 100)]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Total" value={String(total)} sub="leads com status" />
        <InsightCard label="Status únicos" value={String(data.length)} />
        {data[0] && <InsightCard label="Mais frequente" value={data[0].status} sub={`${data[0].total} leads`} />}
      </div>
      <DataTable headers={['Status', 'Quantidade', '% do Total']} rows={rows} />
    </div>
  );
}

function ShRecentesModalContent({ data }: { data: SheetsLeadStats['leadsRecentes'] }) {
  if (!data.length) return <p style={{ color: theme.muted }}>Sem leads recentes.</p>;
  const rows = data.map((d) => [d.nome, d.empresa, d.canal, d.status, d.data]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: theme.muted }}>{data.length} leads mais recentes (WhatsApp + Instagram)</p>
      <DataTable headers={['Nome', 'Empresa', 'Canal', 'Status', 'Data']} rows={rows} />
    </div>
  );
}

function RetencaoModalContent({ data }: { data: RetencaoDashboard }) {
  const totalCancel = data.permanenciaPorFaixa.reduce((s, f) => s + f.total, 0);
  const worstMonth = data.evolucaoMensal.reduce((a, b) => b.cancelados > a.cancelados ? b : a, data.evolucaoMensal[0]);
  const bestMonth = data.evolucaoMensal.reduce((a, b) => b.saldo > a.saldo ? b : a, data.evolucaoMensal[0]);
  const avgNovos = data.evolucaoMensal.length > 0 ? data.evolucaoMensal.reduce((s, d) => s + d.novos, 0) / data.evolucaoMensal.length : 0;
  const avgCancel = data.evolucaoMensal.length > 0 ? data.evolucaoMensal.reduce((s, d) => s + d.cancelados, 0) / data.evolucaoMensal.length : 0;

  const rows = data.evolucaoMensal.map((d) => [
    d.mes,
    `+${d.novos}`,
    `-${d.cancelados}`,
    (d.saldo >= 0 ? '+' : '') + String(d.saldo),
  ]);

  const faixaRows = data.permanenciaPorFaixa.map((f) => [
    f.faixa,
    String(f.total),
    totalCancel > 0 ? fmtPct((f.total / totalCancel) * 100) : '0%',
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <InsightCard label="Clientes Ativos" value={String(data.totalAtivos)} sub={`MRR: ${fmtCurrency(data.mrrAtual)}`} />
        <InsightCard label="Taxa Retenção" value={fmtPct(data.taxaRetencao)} accent={data.taxaRetencao >= 90 ? '#43C17B' : '#E55B5B'} />
        <InsightCard label="Maior Churn" value={worstMonth?.mes ?? '-'} sub={`${worstMonth?.cancelados ?? 0} cancelamentos`} accent="#E55B5B" />
        <InsightCard label="Melhor Mês" value={bestMonth?.mes ?? '-'} sub={`saldo +${bestMonth?.saldo ?? 0}`} accent="#43C17B" />
        <InsightCard label="Média Mensal Novos" value={avgNovos.toFixed(1)} sub="clientes/mês" />
        <InsightCard label="Média Mensal Churn" value={avgCancel.toFixed(1)} sub="cancelamentos/mês" accent="#E55B5B" />
      </div>

      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>
          Evolução Mensal — Novos vs Cancelados
        </p>
        <DataTable headers={['Mês', 'Novos', 'Cancelados', 'Saldo']} rows={rows} />
      </div>

      {faixaRows.length > 0 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>
            Tempo de Permanência dos Cancelados
          </p>
          <DataTable headers={['Faixa', 'Clientes', '% do Total']} rows={faixaRows} />
        </div>
      )}

      {data.churnPorModalidade.length > 0 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>
            Churn por Modalidade
          </p>
          <DataTable
            headers={['Modalidade', 'Cancelados', '% do Total']}
            rows={data.churnPorModalidade.map((m) => [
              m.modalidade,
              String(m.total),
              totalCancel > 0 ? fmtPct((m.total / totalCancel) * 100) : '0%',
            ])}
          />
        </div>
      )}

      <div style={{ background: theme.soft, borderRadius: 10, padding: 14, fontSize: 13, color: theme.muted, lineHeight: 1.7 }}>
        <strong style={{ color: theme.text }}>Análise:</strong>{' '}
        Nos últimos {data.evolucaoMensal.length} meses, a empresa ganhou em média{' '}
        <strong style={{ color: '#43C17B' }}>{avgNovos.toFixed(1)}</strong> clientes/mês e perdeu{' '}
        <strong style={{ color: '#E55B5B' }}>{avgCancel.toFixed(1)}</strong>.{' '}
        {data.saldoLiquido >= 0
          ? <>O saldo líquido é <strong style={{ color: '#43C17B' }}>positivo (+{data.saldoLiquido})</strong>, indicando crescimento da base.</>
          : <>O saldo líquido é <strong style={{ color: '#E55B5B' }}>negativo ({data.saldoLiquido})</strong>, indicando encolhimento da base.</>
        }{' '}
        Tempo médio de permanência:{' '}
        <strong style={{ color: theme.gold }}>{data.tempoMedioPermanencia} meses</strong>.
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export function DashboardPage() {
  const { role } = useAuth();
  const [preset, setPreset] = useState<FinanceiroPeriodPreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<FinanceiroDashboard>(MOCK_FINANCEIRO);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false);
  const [modal, setModal] = useState<ModalKey>(null);

  const [crmPeriod, setCrmPeriod] = useState<PeriodKey>('30d');
  const [crmData, setCrmData] = useState<DashboardStats>(dashboardDataByPeriod['30d'] as DashboardStats);
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmIsReal, setCrmIsReal] = useState(false);

  const [sheetsData, setSheetsData] = useState<SheetsLeadStats | null>(null);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [sheetsIsReal, setSheetsIsReal] = useState(false);

  const [dashTab, setDashTab] = useState<DashTab>('financeiro');
  const [investimento, setInvestimento] = useState<number>(2000);
  const [invFocused, setInvFocused] = useState<boolean>(false);

  const [custosConfig, setCustosConfig] = useState<CustosEmpresaConfig>(DEFAULT_CUSTOS_CONFIG);
  const [showCustosModal, setShowCustosModal] = useState(false);

  const [retencao, setRetencao] = useState<RetencaoDashboard | null>(null);
  const [retLoading, setRetLoading] = useState(true);
  const [retIsReal, setRetIsReal] = useState(false);

  const showPerformance = role === 'ADMIN' || role === 'GESTOR';

  useEffect(() => {
    if (preset === 'custom' && (!customStart || !customEnd)) return;
    let cancelled = false;
    setLoading(true);
    const range = getDateRange(preset, customStart, customEnd);

    async function load() {
      try {
        const ds = createDataSource();
        const fin = await ds.dashboard.getFinanceiro(range);
        if (!cancelled) { setData(fin); setIsReal(getDataSourceMode() === 'api'); }
      } catch {
        if (!cancelled) { setData(MOCK_FINANCEIRO); setIsReal(false); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    let cancelled = false;
    setCrmLoading(true);

    async function loadCrm() {
      try {
        const ds = createDataSource();
        const stats = await ds.dashboard.getStats(crmPeriod);
        if (!cancelled) { setCrmData(stats); setCrmIsReal(getDataSourceMode() === 'api'); }
      } catch {
        if (!cancelled) {
          setCrmData((dashboardDataByPeriod[crmPeriod] ?? dashboardDataByPeriod.all) as DashboardStats);
          setCrmIsReal(false);
        }
      } finally {
        if (!cancelled) setCrmLoading(false);
      }
    }

    loadCrm();
    return () => { cancelled = true; };
  }, [crmPeriod]);

  useEffect(() => {
    let cancelled = false;
    setSheetsLoading(true);

    async function loadSheets() {
      try {
        const ds = createDataSource();
        const stats = await ds.sheets.getLeads();
        if (!cancelled) { setSheetsData(stats); setSheetsIsReal(getDataSourceMode() === 'api'); }
      } catch {
        if (!cancelled) setSheetsLoading(false);
      } finally {
        if (!cancelled) setSheetsLoading(false);
      }
    }

    loadSheets();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem('inv_pago_mensal'));
    if (stored > 0) setInvestimento(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('inv_pago_mensal', String(investimento));
  }, [investimento]);

  // Load custos config from AppKv
  useEffect(() => {
    loadState<CustosEmpresaConfig>('config:custos_empresa', DEFAULT_CUSTOS_CONFIG)
      .then((c) => {
        setCustosConfig(c);
        if (c.investimentoMarketing > 0) setInvestimento(c.investimentoMarketing);
      });
  }, []);

  // Load retention data (same period filter as financeiro)
  useEffect(() => {
    if (preset === 'custom' && (!customStart || !customEnd)) return;
    let cancelled = false;
    setRetLoading(true);
    const range = getDateRange(preset, customStart, customEnd);

    async function loadRet() {
      try {
        const ds = createDataSource();
        const ret = await ds.dashboard.getRetencao(range);
        if (!cancelled) { setRetencao(ret); setRetIsReal(getDataSourceMode() === 'api'); }
      } catch {
        if (!cancelled) { setRetencao(null); setRetIsReal(false); }
      } finally {
        if (!cancelled) setRetLoading(false);
      }
    }

    loadRet();
    return () => { cancelled = true; };
  }, [preset, customStart, customEnd]);

  // Compute profit/margin KPIs from revenue + config
  const financials = useMemo(() => {
    const c = custosConfig;
    const rev = data.receitaTotal;
    const cmv = c.cmvModo === 'percentual'
      ? data.receitaEquipamentos * (c.cmvPercentual / 100)
      : c.cmvFixo;
    const lucroBruto = rev - cmv;
    const margemBruta = rev > 0 ? (lucroBruto / rev) * 100 : 0;
    const totalOperacional = c.custosOperacionais.reduce((s, o) => s + o.valor, 0);
    const folhaTotal = c.folhaSalarial.total ||
      (c.folhaSalarial.tecnicos + c.folhaSalarial.vendedores + c.folhaSalarial.administrativo);
    const despesasTotal = totalOperacional + folhaTotal + c.investimentoMarketing;
    const lucroOperacional = lucroBruto - despesasTotal - (data.totalComissao ?? 0);
    const margemOperacional = rev > 0 ? (lucroOperacional / rev) * 100 : 0;
    const custosFixos = folhaTotal + totalOperacional;
    const margemContribuicao = rev > 0 ? (rev - cmv) / rev : 0;
    const pontoEquilibrio = margemContribuicao > 0 ? custosFixos / margemContribuicao : 0;
    const hasCustos = folhaTotal > 0 || totalOperacional > 0 || c.cmvFixo > 0 || c.cmvPercentual > 0;

    return {
      cmv: Math.round(cmv),
      lucroBruto: Math.round(lucroBruto),
      margemBruta,
      totalOperacional,
      folhaTotal,
      despesasTotal,
      lucroOperacional: Math.round(lucroOperacional),
      margemOperacional,
      pontoEquilibrio: Math.round(pontoEquilibrio),
      custosFixos,
      custoMensalTotal: Math.round(cmv + despesasTotal + (data.totalComissao ?? 0)),
      hasCustos,
    };
  }, [data, custosConfig]);

  const maxOs = Math.max(data.osInstalacoes, data.osManutencoes, 1);

  // ── Marketing tab KPIs ─────────────────────────────────────────────────────
  const mktCanal = sheetsData?.analiseCanal ?? [];
  const mktTotal = mktCanal.reduce((s, c) => s + c.leads, 0);
  const mktPago = mktCanal.find((c) => c.canal === 'Tráfego Pago');
  const mktLeadsPagos = mktPago?.leads ?? 0;
  const mktVisitasPagas = mktPago?.visitas ?? 0;
  const mktFechouPago = mktPago?.fechamentos ?? 0;
  const mktCpl = mktLeadsPagos > 0 ? investimento / mktLeadsPagos : 0;
  const mktCpa = mktFechouPago > 0 ? investimento / mktFechouPago : null;
  const mktTaxaConv = mktLeadsPagos > 0 ? (mktVisitasPagas / mktLeadsPagos) * 100 : 0;
  const invDisplay = invFocused
    ? String(investimento)
    : 'R$ ' + investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <AppShell title="Dashboard">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0, flex: 1 }}>
          Financeiro, leads e performance comercial —{' '}
          {loading
            ? 'carregando...'
            : isReal
              ? <span style={{ color: theme.gold }}>● dados reais do banco</span>
              : 'modo demonstração'}
        </p>
        <span style={{ fontSize: 12, color: theme.muted }}>Clique em qualquer gráfico para análise detalhada</span>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${theme.border}` }}>
        {(['financeiro', 'crm', 'prospeccao', 'marketing'] as DashTab[]).map((tab) => {
          const labels: Record<DashTab, string> = { financeiro: 'Financeiro', crm: 'CRM', prospeccao: 'Prospecção', marketing: 'Marketing' };
          const active = dashTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setDashTab(tab)}
              style={{
                padding: '8px 18px',
                border: `1px solid ${active ? theme.gold : theme.border}`,
                borderBottom: active ? `1px solid ${theme.panel}` : `1px solid ${theme.border}`,
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                background: active ? theme.gold : 'transparent',
                color: active ? '#0B0B0B' : theme.muted,
                transition: 'all 0.15s',
                marginBottom: -1,
                position: 'relative' as const,
                zIndex: active ? 1 : 0,
              }}
              onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = theme.gold; (e.currentTarget as HTMLElement).style.color = theme.text; } }}
              onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = theme.border; (e.currentTarget as HTMLElement).style.color = theme.muted; } }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ─── Tab: Financeiro ─── */}
      {dashTab === 'financeiro' && (<>

      {/* Period Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ color: theme.muted, fontSize: 13, fontWeight: 600 }}>Período:</span>
        {PRESETS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPreset(opt.key)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: preset === opt.key ? theme.gold : theme.soft,
              color: preset === opt.key ? '#0B0B0B' : theme.text,
              transition: 'background 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
              style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '5px 10px', fontSize: 13 }} />
            <span style={{ color: theme.muted, fontSize: 13 }}>até</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '5px 10px', fontSize: 13 }} />
          </>
        )}
        {role === 'ADMIN' && (
          <button
            onClick={() => setShowCustosModal(true)}
            style={{
              marginLeft: 'auto', padding: '6px 14px', borderRadius: 8,
              border: `1px solid ${theme.border}`, cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: theme.soft, color: theme.gold,
              transition: 'all 0.15s',
            }}
          >
            Configurar Custos
          </button>
        )}
      </div>

      {/* KPI Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 16, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <KpiCard label="Receita Total" value={fmtCurrency(data.receitaTotal)} description="Equip. + Instalação fechados" />
        <KpiCard label="MRR Base" value={fmtCurrency(data.mrrBase) + '/mês'} description="Base ativa atual (sem filtro de período)" />
        <KpiCard label="ARR Projeção" value={fmtCurrency(data.arr)} description="MRR × 12 — base ativa atual" />
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <KpiCard label="Ticket Médio" value={fmtCurrency(data.ticketMedio)} description="Por contrato fechado" />
        <KpiCard label="Fechados" value={String(data.orcamentosFechados)} description="Contratos no período" />
        <KpiCard label="Pipeline Aberto" value={fmtCurrency(data.pipelineAberto)} description="Orçamentos em aberto" />
      </div>

      {/* KPI Row 3 — Rentabilidade (ADMIN/GESTOR, quando custos configurados) */}
      {showPerformance && financials.hasCustos && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <KpiCard
            label="Lucro Bruto"
            value={fmtCurrency(financials.lucroBruto)}
            description={`Margem: ${fmtPct(financials.margemBruta)}`}
            accent={financials.lucroBruto >= 0 ? '#43C17B' : '#E55B5B'}
          />
          <KpiCard
            label="Lucro Operacional"
            value={fmtCurrency(financials.lucroOperacional)}
            description={`Margem: ${fmtPct(financials.margemOperacional)}`}
            accent={financials.lucroOperacional >= 0 ? '#43C17B' : '#E55B5B'}
          />
          <KpiCard
            label="Ponto de Equilíbrio"
            value={fmtCurrency(financials.pontoEquilibrio)}
            description="Receita mínima p/ cobrir custos fixos"
          />
          <KpiCard
            label="Comissões"
            value={fmtCurrency(data.totalComissao ?? 0)}
            description="Total pago no período"
          />
          <KpiCard
            label="Descontos"
            value={fmtCurrency(data.totalDesconto ?? 0)}
            description="Total concedido no período"
          />
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: 16, marginBottom: 24, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <ChartClickable title="Evolução Mensal de Receita" onClick={() => setModal('evolucao')}>
          {data.evolucaoMensal.length > 0
            ? <ReceitaMensalChart data={data.evolucaoMensal} />
            : <EmptyChart message="Sem fechamentos no período" />}
        </ChartClickable>

        <ChartClickable title="Mix de Receita" onClick={() => setModal('mix')}>
          {data.mixReceita.length > 0
            ? <ReceitaMixChart data={data.mixReceita} />
            : <EmptyChart message="Sem dados de receita" />}
        </ChartClickable>
      </div>

      {/* ── Análise Financeira (ADMIN/GESTOR, quando custos configurados) ── */}
      {showPerformance && financials.hasCustos && (<>
        <SectionDivider label="Análise Financeira" />

        {/* Charts: Receita vs Custos + Composição */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: 16, marginBottom: 24, opacity: loading ? 0.5 : 1 }}>
          <ChartCard title="Receita vs Custos (Mensal)">
            {data.evolucaoMensal.length > 0
              ? <ReceitaCustosBarChart evolucao={data.evolucaoMensal} custoMensal={financials.custoMensalTotal} />
              : <EmptyChart message="Sem dados no período" />}
          </ChartCard>
          <ChartCard title="Composição dos Custos">
            <CustosDonutChart
              cmv={financials.cmv}
              folha={financials.folhaTotal}
              operacional={financials.totalOperacional}
              marketing={custosConfig.investimentoMarketing}
            />
          </ChartCard>
        </div>

        {/* DRE Simplificado */}
        <div style={{
          background: theme.panel, border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: 20, marginBottom: 24,
          opacity: loading ? 0.5 : 1,
        }}>
          <h3 style={{ color: theme.gold, margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>
            DRE Simplificado — Demonstrativo de Resultados
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: '(+) Receita Equipamentos', valor: data.receitaEquipamentos, tipo: 'item' as const },
              { label: '(+) Receita Instalação', valor: data.receitaInstalacao, tipo: 'item' as const },
              { label: '(+) Monitoramento MRR', valor: data.mrrBase, tipo: 'item' as const },
              { label: '(=) RECEITA TOTAL', valor: data.receitaTotal + data.mrrBase, tipo: 'total' as const },
              { label: '(-) CMV', valor: financials.cmv, tipo: 'custo' as const },
              { label: '(=) LUCRO BRUTO', valor: financials.lucroBruto + data.mrrBase, tipo: 'total' as const },
              { label: '(-) Folha Salarial', valor: financials.folhaTotal, tipo: 'custo' as const },
              { label: '(-) Custos Operacionais', valor: financials.totalOperacional, tipo: 'custo' as const },
              { label: '(-) Marketing', valor: custosConfig.investimentoMarketing, tipo: 'custo' as const },
              { label: '(-) Comissões', valor: data.totalComissao ?? 0, tipo: 'custo' as const },
              { label: '(-) Descontos', valor: data.totalDesconto ?? 0, tipo: 'custo' as const },
              { label: '(=) LUCRO OPERACIONAL', valor: financials.lucroOperacional + data.mrrBase, tipo: 'resultado' as const },
            ].map((row, i) => {
              const isTotal = row.tipo === 'total' || row.tipo === 'resultado';
              const color = row.tipo === 'resultado'
                ? (row.valor >= 0 ? '#43C17B' : '#E55B5B')
                : row.tipo === 'total' ? theme.gold
                : row.tipo === 'custo' ? '#E55B5B'
                : theme.text;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderTop: isTotal ? `1px solid ${theme.border}` : 'none',
                    background: isTotal ? 'rgba(200,169,81,0.06)' : 'transparent',
                    fontWeight: isTotal ? 700 : 400,
                    fontSize: isTotal ? 14 : 13,
                  }}
                >
                  <span style={{ color: isTotal ? theme.text : theme.muted }}>{row.label}</span>
                  <span style={{ color, fontWeight: 600, fontFamily: 'monospace' }}>
                    {row.tipo === 'custo' ? '- ' : ''}{fmtCurrency(Math.abs(row.valor))}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: 12, padding: '10px 12px',
            background: theme.soft, borderRadius: 8,
            display: 'flex', gap: 24, fontSize: 13,
          }}>
            <span style={{ color: theme.muted }}>
              Margem Bruta: <strong style={{ color: theme.gold }}>{fmtPct(financials.margemBruta)}</strong>
            </span>
            <span style={{ color: theme.muted }}>
              Margem Operacional:{' '}
              <strong style={{ color: financials.margemOperacional >= 0 ? '#43C17B' : '#E55B5B' }}>
                {fmtPct(financials.margemOperacional)}
              </strong>
            </span>
            <span style={{ color: theme.muted }}>
              Ponto de Equilíbrio: <strong style={{ color: theme.text }}>{fmtCurrency(financials.pontoEquilibrio)}</strong>
            </span>
          </div>
        </div>
      </>)}

      {/* Vendor Performance */}
      {showPerformance && (
        <div style={{ marginBottom: 24, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <SectionDivider label="Performance por Vendedor" />
          <ChartClickable title="Equipamentos + Instalação por Vendedor" onClick={() => setModal('vendedor')}>
            <VendedorPerformanceChart financeiro={data.porVendedor} />
          </ChartClickable>
        </div>
      )}

      {/* Operations */}
      <ChartClickable title="Operações no Período" onClick={() => setModal('operacoes')}>
        <div style={{ padding: '8px 0', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <OperationBar label="Instalações realizadas" value={data.osInstalacoes} max={maxOs} color="#43C17B" />
          <OperationBar label="Manutenções realizadas" value={data.osManutencoes} max={maxOs} color={theme.gold} />
        </div>
      </ChartClickable>

      {/* Técnico Performance */}
      {showPerformance && data.porTecnico.length > 0 && (
        <div style={{ marginBottom: 24, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <SectionDivider label="Performance dos Técnicos" />
          <section
            onClick={() => setModal('tecnico')}
            style={{
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.gold; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ color: theme.gold, margin: 0, fontSize: 14 }}>Receita e OS por Técnico</h3>
              <span style={{ fontSize: 11, color: theme.muted, opacity: 0.7 }}>↗ detalhes</span>
            </div>
            <TecnicoPerformanceChart data={data.porTecnico} />
          </section>
        </div>
      )}

      {/* ── Análise de Retenção de Clientes ── */}
      <SectionDivider label="Análise de Retenção de Clientes" />

      {retLoading && !retencao ? (
        <div style={{ padding: 40, textAlign: 'center', color: theme.muted, fontSize: 14 }}>Carregando dados de retenção...</div>
      ) : retencao ? (<>
        {/* Retention indicator */}
        {!retIsReal && (
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>Dados de demonstração</div>
        )}

        {/* KPI Row — Retenção */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 16, opacity: retLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <KpiCard label="Clientes Ativos" value={String(retencao.totalAtivos)} description={`MRR: ${fmtCurrency(retencao.mrrAtual)}/mês`} />
          <KpiCard label="Novos no Período" value={`+${retencao.novosNoPeriodo}`} description={`MRR ganho: ${fmtCurrency(retencao.mrrNovos)}/mês`} accent="#43C17B" />
          <KpiCard label="Cancelados" value={`-${retencao.canceladosNoPeriodo}`} description={`MRR perdido: ${fmtCurrency(retencao.mrrPerdido)}/mês`} accent="#E55B5B" />
          <KpiCard
            label="Taxa de Retenção"
            value={fmtPct(retencao.taxaRetencao)}
            description={retencao.taxaRetencao >= 90 ? 'Saudável' : retencao.taxaRetencao >= 75 ? 'Atenção' : 'Crítico'}
            accent={retencao.taxaRetencao >= 90 ? '#43C17B' : retencao.taxaRetencao >= 75 ? '#C8A951' : '#E55B5B'}
          />
          <KpiCard
            label="Churn Rate"
            value={fmtPct(retencao.churnRate)}
            description="No período selecionado"
            accent={retencao.churnRate <= 5 ? '#43C17B' : retencao.churnRate <= 10 ? '#C8A951' : '#E55B5B'}
          />
          <KpiCard
            label="Saldo Líquido"
            value={(retencao.saldoLiquido >= 0 ? '+' : '') + String(retencao.saldoLiquido)}
            description={`Permanência média: ${retencao.tempoMedioPermanencia} meses`}
            accent={retencao.saldoLiquido >= 0 ? '#43C17B' : '#E55B5B'}
          />
        </div>

        {/* Charts — Evolução + Churn por Modalidade */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: 16, marginBottom: 24, opacity: retLoading ? 0.5 : 1 }}>
          <ChartClickable title="Evolução Mensal — Novos vs Cancelados" onClick={() => setModal('retencao')}>
            {retencao.evolucaoMensal.length > 0
              ? <RetencaoMensalChart data={retencao.evolucaoMensal} />
              : <EmptyChart message="Sem dados de evolução" />}
          </ChartClickable>

          <ChartCard title="Churn por Modalidade">
            {retencao.churnPorModalidade.length > 0
              ? <RetencaoDonutChart data={retencao.churnPorModalidade} />
              : <EmptyChart message="Sem dados de churn" />}
          </ChartCard>
        </div>

        {/* Permanência por Faixa */}
        {retencao.permanenciaPorFaixa.length > 0 && (
          <div style={{
            background: theme.panel, border: `1px solid ${theme.border}`,
            borderRadius: 12, padding: 20, marginBottom: 24,
            opacity: retLoading ? 0.5 : 1,
          }}>
            <h3 style={{ color: theme.gold, margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>
              Tempo de Permanência dos Cancelados
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {retencao.permanenciaPorFaixa.map((f) => {
                const maxFaixa = Math.max(...retencao.permanenciaPorFaixa.map((x) => x.total), 1);
                const pct = (f.total / maxFaixa) * 100;
                const isEarly = f.faixa.startsWith('0-6');
                return (
                  <div key={f.faixa}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: theme.text }}>{f.faixa}</span>
                      <span style={{ color: isEarly ? '#E55B5B' : theme.gold, fontWeight: 700 }}>
                        {f.total} clientes
                      </span>
                    </div>
                    <div style={{ height: 8, background: theme.soft, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: isEarly ? '#E55B5B' : f.faixa.startsWith('6-12') ? '#FF9800' : '#43C17B',
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: theme.soft, borderRadius: 8,
              fontSize: 13, color: theme.muted, lineHeight: 1.7,
            }}>
              <strong style={{ color: theme.text }}>Insight:</strong>{' '}
              {(() => {
                const early = retencao.permanenciaPorFaixa.find((f) => f.faixa === '0-6 meses');
                const totalCancel = retencao.permanenciaPorFaixa.reduce((s, f) => s + f.total, 0);
                const earlyPct = early && totalCancel > 0 ? (early.total / totalCancel) * 100 : 0;
                if (earlyPct > 30) {
                  return <>
                    <strong style={{ color: '#E55B5B' }}>{fmtPct(earlyPct)}</strong> dos cancelamentos acontecem nos primeiros 6 meses.
                    Isso indica problemas no onboarding ou expectativas desalinhadas na venda.
                  </>;
                }
                return <>
                  A maioria dos cancelamentos acontece após 6 meses, indicando que o onboarding está funcionando.
                  Foco em retenção de longo prazo e relacionamento.
                </>;
              })()}
            </div>
          </div>
        )}
      </>) : (
        <div style={{ padding: 40, textAlign: 'center', color: theme.muted, fontSize: 14 }}>
          Não foi possível carregar dados de retenção.
        </div>
      )}

      </>)}

      {/* ─── Tab: CRM ─── */}
      {dashTab === 'crm' && (<>
      <SectionDivider label="CRM & Pipeline" />

      {/* CRM Period Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ color: theme.muted, fontSize: 13, fontWeight: 600 }}>Período:</span>
        {CRM_PRESETS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setCrmPeriod(opt.key)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: crmPeriod === opt.key ? theme.gold : theme.soft,
              color: crmPeriod === opt.key ? '#0B0B0B' : theme.text,
              transition: 'background 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: theme.muted, marginLeft: 4 }}>
          {crmLoading
            ? 'carregando...'
            : crmIsReal
              ? <span style={{ color: theme.gold }}>● dados reais do banco</span>
              : 'modo demonstração'}
        </span>
      </div>

      {/* CRM KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24, opacity: crmLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <KpiCard label="Leads Ativos" value={String(crmData.kpis.totalLeads)} description="No período selecionado" />
        <KpiCard label="Novos esta Semana" value={String(crmData.kpis.newLeadsThisWeek)} description="Últimos 7 dias (fixo)" />
        <KpiCard label="Taxa de Conversão" value={fmtPct(crmData.kpis.conversionRate)} description="Leads → Clientes" />
        <KpiCard label="Receita Estimada" value={fmtCurrency(crmData.kpis.estimatedRevenue)} description="Pipeline ativo no período" />
      </div>

      {/* CRM Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: 16, marginBottom: 16, opacity: crmLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <ChartClickable title="Funil de Vendas" onClick={() => setModal('funil')}>
          {crmData.funnelData.length > 0
            ? <FunnelStageChart data={crmData.funnelData} />
            : <EmptyChart message="Sem dados do funil no período" />}
        </ChartClickable>

        <ChartClickable title="Leads por Período" onClick={() => setModal('leads')}>
          {crmData.leadsByWeek.length > 0
            ? <LeadsLineChart data={crmData.leadsByWeek} />
            : <EmptyChart message="Sem dados de leads no período" />}
        </ChartClickable>
      </div>

      {/* CRM Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: 16, marginBottom: 24, opacity: crmLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {showPerformance && (
          <ChartClickable title="Fechamentos por Vendedor" onClick={() => setModal('fechamentos')}>
            {crmData.closuresBySeller.length > 0
              ? <ClosuresBarChart data={crmData.closuresBySeller} />
              : <EmptyChart message="Sem fechamentos no período" />}
          </ChartClickable>
        )}

        <ChartClickable title="Leads por Origem" onClick={() => setModal('origens')}>
          {crmData.leadsByOrigin.length > 0
            ? <LeadOriginDonutChart data={crmData.leadsByOrigin} />
            : <EmptyChart message="Sem dados de origem no período" />}
        </ChartClickable>
      </div>

      </>)}

      {/* ─── Tab: Prospecção ─── */}
      {dashTab === 'prospeccao' && (<>
      <SectionDivider label="Prospecção Ativa" />

      {/* Status header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: theme.muted }}>
          {sheetsLoading
            ? 'buscando planilha…'
            : sheetsIsReal
              ? <span style={{ color: '#43C17B' }}>● Google Sheets ao vivo</span>
              : sheetsData
                ? <span style={{ color: theme.gold }}>● dados reais (cache)</span>
                : <span style={{ color: theme.muted }}>modo demonstração</span>}
        </span>
        <span style={{ fontSize: 11, color: theme.muted, marginLeft: 'auto' }}>
          WhatsApp · Instagram · Visitas marcadas
        </span>
      </div>

      {sheetsData && (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24, opacity: sheetsLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <KpiCard label="Total de Leads" value={String(sheetsData.kpis.totalLeads)} description="WhatsApp + Instagram" />
            <KpiCard label="Novos esta Semana" value={String(sheetsData.kpis.newThisWeek)} description="Últimos 7 dias" />
            <KpiCard label="Visitas Marcadas" value={String(sheetsData.kpis.totalVisitas)} description="Agendamentos realizados" />
            <KpiCard label="Fechamentos" value={String(sheetsData.kpis.totalFechou)} description="Contratos fechados" />
            <KpiCard label="Taxa de Fechamento" value={sheetsData.kpis.taxaFechamento.toFixed(1) + '%'} description="Visitas → fechou" />
          </div>

          {/* Charts Row 1: Funil + Canal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            <ChartClickable title="Funil de Prospecção" onClick={() => setModal('sh_funil')}>
              {sheetsData.funnelCrm.length > 0
                ? <FunnelStageChart data={sheetsData.funnelCrm} />
                : <EmptyChart message="Sem dados" />}
            </ChartClickable>

            <ChartClickable title="Leads por Canal" onClick={() => setModal('sh_canal')}>
              {sheetsData.porCanal.length > 0
                ? <LeadOriginDonutChart data={sheetsData.porCanal} />
                : <EmptyChart message="Sem dados" />}
            </ChartClickable>
          </div>

          {/* Charts Row 2: Evolução + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            <ChartClickable title="Evolução Mensal por Canal" onClick={() => setModal('sh_mensal')}>
              {sheetsData.evolucaoMensal.length > 0
                ? <ProspeccaoMensalChart data={sheetsData.evolucaoMensal} />
                : <EmptyChart message="Sem dados mensais" />}
            </ChartClickable>

            <ChartClickable title="Leads por Status" onClick={() => setModal('sh_status')}>
              {sheetsData.porStatus.length > 0
                ? <ClosuresBarChart data={sheetsData.porStatus.map((s) => ({ seller: s.status, closures: s.total }))} />
                : <EmptyChart message="Sem dados de status" />}
            </ChartClickable>
          </div>

          {/* SDR performance (admin/gestor only) */}
          {showPerformance && sheetsData.porResponsavel.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <ChartClickable title="Leads por SDR / Responsável" onClick={() => setModal('fechamentos')}>
                <ClosuresBarChart data={sheetsData.porResponsavel} />
              </ChartClickable>
            </div>
          )}

          {/* Leads recentes table */}
          <section
            style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 8, cursor: 'pointer' }}
            onClick={() => setModal('sh_recentes')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.gold; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ color: theme.gold, margin: 0, fontSize: 14 }}>Leads Recentes</h3>
              <span style={{ fontSize: 11, color: theme.muted }}>↗ ver todos</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Nome', 'Empresa', 'Canal', 'Status', 'Prioridade', 'SDR', 'Data'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: theme.muted, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${theme.border}`, textTransform: 'uppercase', letterSpacing: 0.3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetsData.leadsRecentes.slice(0, 8).map((l, i) => {
                    const prioKey = (l.prioridade || '').toLowerCase();
                    const prioColor = PRIORIDADE_COLOR[prioKey] ?? theme.muted;
                    const canalColor = l.canal === 'WhatsApp' ? '#43C17B' : '#C8A951';
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${i === 7 ? 'transparent' : '#1E1E1E'}` }}>
                        <td style={{ padding: '7px 8px', color: theme.text }}>{l.nome}</td>
                        <td style={{ padding: '7px 8px', color: theme.muted, fontSize: 11 }}>{l.empresa}</td>
                        <td style={{ padding: '7px 8px' }}>
                          <span style={{ color: canalColor, fontSize: 11, fontWeight: 600 }}>{l.canal}</span>
                        </td>
                        <td style={{ padding: '7px 8px', color: theme.muted, fontSize: 11 }}>{l.status}</td>
                        <td style={{ padding: '7px 8px' }}>
                          {l.prioridade && <span style={{ color: prioColor, fontSize: 11, fontWeight: 600 }}>{l.prioridade}</span>}
                        </td>
                        <td style={{ padding: '7px 8px', color: theme.muted, fontSize: 11 }}>{l.responsavel}</td>
                        <td style={{ padding: '7px 8px', color: theme.muted, fontSize: 11 }}>{l.data}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!sheetsData && !sheetsLoading && (
        <div style={{ padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13, background: theme.soft, borderRadius: 12 }}>
          Não foi possível carregar a planilha de prospecção. Verifique a conexão com o backend.
        </div>
      )}

      {sheetsLoading && (
        <div style={{ padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13 }}>
          Carregando dados da planilha…
        </div>
      )}

      </>)}

      {/* ─── Tab: Marketing ─── */}
      {dashTab === 'marketing' && (<>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.gold }}>Análise de Investimento em Marketing</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.muted }}>ROI do tráfego pago vs canais orgânicos — dados da planilha de prospecção</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: theme.muted, background: theme.soft, padding: '3px 8px', borderRadius: 6 }}>
            {sheetsIsReal ? '● Google Sheets ao vivo' : sheetsData ? '● dados reais (cache)' : 'modo demonstração'}
          </span>
        </div>

        {/* Investimento Input */}
        <div style={{ background: theme.soft, borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: theme.muted, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Investimento Mensal em Tráfego Pago
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={invDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                const n = parseInt(raw, 10);
                setInvestimento(isNaN(n) ? 0 : n);
              }}
              onFocus={() => setInvFocused(true)}
              onBlur={() => setInvFocused(false)}
              style={{
                background: theme.panel,
                border: `1px solid ${theme.gold}`,
                borderRadius: 8,
                color: theme.text,
                fontSize: 16,
                fontWeight: 700,
                padding: '8px 14px',
                width: 180,
                outline: 'none',
              }}
            />
            <span style={{ color: theme.muted, fontSize: 12 }}>/ mês — valor editável, salvo automaticamente</span>
          </div>
        </div>

        {!sheetsData && sheetsLoading && (
          <div style={{ padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13 }}>Carregando dados de marketing…</div>
        )}
        {!sheetsData && !sheetsLoading && (
          <div style={{ padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13, background: theme.soft, borderRadius: 12 }}>
            Não foi possível carregar dados de prospecção. Verifique a conexão com o backend.
          </div>
        )}

        {sheetsData && (<>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Leads Pagos (ADS)" value={String(mktLeadsPagos)} description="Gerados por tráfego pago" />
            <KpiCard label="CPL — Custo por Lead" value={mktCpl > 0 ? fmtCurrency(mktCpl) : '—'} description="Investimento ÷ leads pagos" />
            <KpiCard label="Leads Orgânicos" value={String(mktTotal - mktLeadsPagos)} description="Canais sem investimento direto" />
            <KpiCard label="Visitas (Tráfego Pago)" value={String(mktVisitasPagas)} description="Agendamentos do ADS" />
            <KpiCard label="Conv. Lead → Visita" value={mktTaxaConv.toFixed(1) + '%'} description="Taxa do tráfego pago" />
            <KpiCard label="CPA — Custo por Aquisição" value={mktCpa !== null ? fmtCurrency(mktCpa) : '—'} description={mktCpa !== null ? 'Invest. ÷ fechamentos pagos' : 'Sem fechamentos no pago'} />
          </div>

          {/* Canal Comparison Chart */}
          <section style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <h3 style={{ color: theme.gold, margin: '0 0 12px', fontSize: 14 }}>Leads e Visitas por Canal</h3>
            <div style={{ height: 260 }}>
              <CanalComparisonChart data={mktCanal} />
            </div>
          </section>

          {/* Canal Analysis Table */}
          <section style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 8 }}>
            <h3 style={{ color: theme.gold, margin: '0 0 12px', fontSize: 14 }}>Análise Detalhada por Canal</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Canal', 'Leads', '% Total', 'Visitas', 'Conv.%', 'Fechamentos', 'CPL', 'CPA'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: theme.muted, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${theme.border}`, textTransform: 'uppercase' as const, letterSpacing: 0.3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mktCanal.map((c, i) => {
                    const pctTotal = mktTotal > 0 ? ((c.leads / mktTotal) * 100).toFixed(1) + '%' : '—';
                    const convPct = c.leads > 0 ? ((c.visitas / c.leads) * 100).toFixed(1) + '%' : '—';
                    const isPago = c.canal === 'Tráfego Pago';
                    const cplVal = isPago && c.leads > 0 ? fmtCurrency(investimento / c.leads) : '—';
                    const cpaVal = isPago && c.fechamentos > 0 ? fmtCurrency(investimento / c.fechamentos) : '—';
                    return (
                      <tr key={c.canal} style={{ borderBottom: `1px solid ${i === mktCanal.length - 1 ? 'transparent' : '#1E1E1E'}` }}>
                        <td style={{ padding: '7px 10px', color: theme.text, fontWeight: 600 }}>{c.canal}</td>
                        <td style={{ padding: '7px 10px', color: theme.gold }}>{c.leads}</td>
                        <td style={{ padding: '7px 10px', color: theme.muted }}>{pctTotal}</td>
                        <td style={{ padding: '7px 10px', color: '#43C17B' }}>{c.visitas}</td>
                        <td style={{ padding: '7px 10px', color: theme.muted }}>{convPct}</td>
                        <td style={{ padding: '7px 10px', color: '#5B9BD5' }}>{c.fechamentos}</td>
                        <td style={{ padding: '7px 10px', color: theme.muted }}>{cplVal}</td>
                        <td style={{ padding: '7px 10px', color: theme.muted }}>{cpaVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>)}
      </>)}

      {/* ─── Detail Modals ─── */}
      {modal === 'evolucao' && (
        <ChartDetailModal title="Evolução Mensal de Receita — Análise Detalhada" onClose={() => setModal(null)}>
          <EvolucaoModalContent data={data.evolucaoMensal} />
        </ChartDetailModal>
      )}
      {modal === 'mix' && (
        <ChartDetailModal title="Mix de Receita — Composição da Receita" onClose={() => setModal(null)}>
          <MixModalContent data={data.mixReceita} total={data.receitaTotal} />
        </ChartDetailModal>
      )}
      {modal === 'vendedor' && (
        <ChartDetailModal title="Performance por Vendedor — Ranking Detalhado" onClose={() => setModal(null)}>
          <VendedorModalContent data={data.porVendedor} />
        </ChartDetailModal>
      )}
      {modal === 'operacoes' && (
        <ChartDetailModal title="Operações no Período — Análise de OS" onClose={() => setModal(null)}>
          <OperacoesModalContent data={data} />
        </ChartDetailModal>
      )}
      {modal === 'tecnico' && (
        <ChartDetailModal title="Performance dos Técnicos — Ranking Detalhado" onClose={() => setModal(null)}>
          <TecnicoModalContent data={data.porTecnico} />
        </ChartDetailModal>
      )}
      {modal === 'funil' && (
        <ChartDetailModal title="Funil de Vendas — Análise Detalhada" onClose={() => setModal(null)}>
          <FunilModalContent data={crmData.funnelData} />
        </ChartDetailModal>
      )}
      {modal === 'leads' && (
        <ChartDetailModal title="Leads por Período — Tendência de Captação" onClose={() => setModal(null)}>
          <LeadsModalContent data={crmData.leadsByWeek} />
        </ChartDetailModal>
      )}
      {modal === 'fechamentos' && (
        <ChartDetailModal title="Fechamentos por Vendedor — Ranking" onClose={() => setModal(null)}>
          <FechamentosModalContent data={crmData.closuresBySeller} />
        </ChartDetailModal>
      )}
      {modal === 'origens' && (
        <ChartDetailModal title="Leads por Origem — Canais de Aquisição" onClose={() => setModal(null)}>
          <OrigensModalContent data={crmData.leadsByOrigin} />
        </ChartDetailModal>
      )}
      {modal === 'sh_funil' && sheetsData && (
        <ChartDetailModal title="Funil de Prospecção — Planilha" onClose={() => setModal(null)}>
          <ShFunilModalContent data={sheetsData.funnelCrm} />
        </ChartDetailModal>
      )}
      {modal === 'sh_canal' && sheetsData && (
        <ChartDetailModal title="Leads por Canal — WhatsApp vs Instagram" onClose={() => setModal(null)}>
          <ShCanalModalContent data={sheetsData.porCanal} />
        </ChartDetailModal>
      )}
      {modal === 'sh_mensal' && sheetsData && (
        <ChartDetailModal title="Evolução Mensal por Canal" onClose={() => setModal(null)}>
          <ShMensalModalContent data={sheetsData.evolucaoMensal} />
        </ChartDetailModal>
      )}
      {modal === 'sh_status' && sheetsData && (
        <ChartDetailModal title="Leads por Status — Distribuição" onClose={() => setModal(null)}>
          <ShStatusModalContent data={sheetsData.porStatus} />
        </ChartDetailModal>
      )}
      {modal === 'sh_recentes' && sheetsData && (
        <ChartDetailModal title="Todos os Leads Recentes" onClose={() => setModal(null)}>
          <ShRecentesModalContent data={sheetsData.leadsRecentes} />
        </ChartDetailModal>
      )}

      {/* Custos Config Modal */}
      {modal === 'retencao' && retencao && (
        <ChartDetailModal title="Análise de Retenção — Detalhamento Mensal" onClose={() => setModal(null)}>
          <RetencaoModalContent data={retencao} />
        </ChartDetailModal>
      )}

      {showCustosModal && (
        <CustosConfigModal
          onClose={() => setShowCustosModal(false)}
          onSave={(c) => { setCustosConfig(c); setInvestimento(c.investimentoMarketing); }}
        />
      )}
    </AppShell>
  );
}

/* ─── Small helper components ─── */

function ChartClickable({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <section
      onClick={onClick}
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.gold; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ color: theme.gold, margin: 0, fontSize: 14 }}>{title}</h3>
        <span style={{ fontSize: 11, color: theme.muted, opacity: 0.7 }}>↗ detalhes</span>
      </div>
      <div style={{ height: 260 }}>{children}</div>
    </section>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, #3A3A3A, transparent)' }} />
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.gold, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
        {label}
      </h2>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, #3A3A3A, transparent)' }} />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, fontSize: 13, fontStyle: 'italic' }}>
      {message}
    </div>
  );
}

function OperationBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: theme.text }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 8, background: theme.soft, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}
