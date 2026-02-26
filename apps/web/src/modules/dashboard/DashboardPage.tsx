'use client';

import { useEffect, useState } from 'react';
import { ChartCard } from '../../components/charts/ChartCard';
import { ReceitaMensalChart } from '../../components/charts/ReceitaMensalChart';
import { ReceitaMixChart } from '../../components/charts/ReceitaMixChart';
import { VendedorPerformanceChart } from '../../components/charts/VendedorPerformanceChart';
import { ChartDetailModal, InsightCard, DataTable } from '../../components/charts/ChartDetailModal';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { AppShell } from '../../components/layout/AppShell';
import { createDataSource, getDataSourceMode } from '../../lib/dataSource/factory';
import { FinanceiroDashboard } from '../../lib/dataSource/types';
import { theme } from '../../components/common/theme';
import { useAuth } from '../../contexts/AuthContext';

type FinanceiroPeriodPreset = '7d' | '30d' | '90d' | 'ano' | 'custom';
type ModalKey = 'evolucao' | 'mix' | 'vendedor' | 'operacoes' | null;

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

  const showPerformance = role === 'ADMIN' || role === 'GESTOR';

  useEffect(() => {
    if (preset === 'custom' && !customStart && !customEnd) return;
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

  const maxOs = Math.max(data.osInstalacoes, data.osManutencoes, 1);

  return (
    <AppShell title="Dashboard Financeiro">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0, flex: 1 }}>
          Receita, recorrência e performance comercial —{' '}
          {loading
            ? 'carregando...'
            : isReal
              ? <span style={{ color: theme.gold }}>● dados reais do banco</span>
              : 'modo demonstração'}
        </p>
        <span style={{ fontSize: 12, color: theme.muted }}>Clique em qualquer gráfico para análise detalhada</span>
      </div>

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
      </div>

      {/* KPI Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 16, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <KpiCard label="Receita Total" value={fmtCurrency(data.receitaTotal)} description="Equip. + Instalação fechados" />
        <KpiCard label="MRR Base" value={fmtCurrency(data.mrrBase) + '/mês'} description="Base ativa de monitoramento" />
        <KpiCard label="ARR Projeção" value={fmtCurrency(data.arr)} description="Receita recorrente anual" />
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <KpiCard label="Ticket Médio" value={fmtCurrency(data.ticketMedio)} description="Por contrato fechado" />
        <KpiCard label="Fechados" value={String(data.orcamentosFechados)} description="Contratos no período" />
        <KpiCard label="Pipeline Aberto" value={fmtCurrency(data.pipelineAberto)} description="Orçamentos em aberto" />
      </div>

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
