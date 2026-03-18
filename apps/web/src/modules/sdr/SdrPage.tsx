'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useToast } from '../../components/common/Toast';
import { theme } from '../../components/common/theme';
import { createDataSource, getDataSourceMode } from '../../lib/dataSource/factory';
import { CrmLead, CrmLeadsResult, CrmQuery, CrmSource } from '../../lib/dataSource/types';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON STYLES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const btnStyle = (active: boolean): React.CSSProperties => ({
  background: active ? theme.gold : theme.soft,
  color: active ? '#000' : theme.muted,
  border: `1px solid ${active ? theme.gold : theme.border}`,
  borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12,
  fontWeight: active ? 700 : 400, transition: 'all 0.15s',
});

const mainTabStyle = (active: boolean): React.CSSProperties => ({
  background: active ? theme.panel : 'transparent',
  color: active ? theme.gold : theme.muted,
  border: `1px solid ${active ? theme.border : 'transparent'}`,
  borderBottom: active ? `2px solid ${theme.gold}` : `2px solid transparent`,
  padding: '12px 22px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 400,
  transition: 'all 0.15s', whiteSpace: 'nowrap',
});

const th: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', fontSize: 11, color: theme.muted,
  fontWeight: 600, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '8px 12px', fontSize: 13, color: theme.text,
  borderBottom: `1px solid ${theme.soft}`, verticalAlign: 'middle',
};

function csvEscape(v: string): string {
  const s = v.replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRM STATUS & PRIORITY COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, string> = {
  'Novo': '#5B9BD5',
  'Primeiro contato': theme.warning,
  'Conversando': '#E3B341',
  'Qualificado': '#43C17B',
  'Agendado': '#C8A951',
  'Orçamento enviado': '#7B68EE',
  'Fechado': '#43C17B',
  'Perdido': theme.danger,
  'Nutrição': '#888',
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? theme.muted;
}

const PRIORIDADE_COLORS: Record<string, string> = {
  alta: theme.danger,
  media: theme.warning,
  baixa: '#888',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KpiCard({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{
      background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10,
      padding: '14px 18px', minWidth: 120, flex: '1 1 120px',
    }}>
      <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? theme.gold }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function HealthBadge({ online, latencyMs, checking }: { online: boolean | null; latencyMs: number; checking: boolean }) {
  const color = checking ? theme.warning : online === true ? theme.success : online === false ? theme.danger : theme.muted;
  const label = checking ? 'verificando...' : online === true ? `online · ${latencyMs}ms` : online === false ? 'offline' : '—';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: theme.soft, border: `1px solid ${theme.border}`,
      borderRadius: 20, padding: '4px 12px', fontSize: 12,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
        display: 'inline-block',
        animation: checking ? 'pulse 1s ease-in-out infinite' : 'none',
      }} />
      <span style={{ color: theme.muted }}>{label}</span>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      background: `${color}22`, color, padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: PAINEL CRM (Dashboard)
// ═══════════════════════════════════════════════════════════════════════════════

function PainelCrm({ data, loading }: { data: CrmLeadsResult | null; loading: boolean }) {
  if (loading || !data) return <div style={{ padding: 40, textAlign: 'center', color: theme.muted }}>Carregando painel...</div>;

  const { stats } = data;
  const pipeline = [
    { label: 'Novos', value: stats.novos, color: '#5B9BD5' },
    { label: 'Em Contato', value: stats.emContato, color: theme.warning },
    { label: 'Qualificados', value: stats.qualificados, color: theme.success },
    { label: 'Orçamento', value: stats.orcamentoEnviado, color: '#7B68EE' },
    { label: 'Fechados', value: stats.fechados, color: '#43C17B' },
    { label: 'Perdidos', value: stats.perdidos, color: theme.danger },
  ];

  const maxPipeline = Math.max(...pipeline.map(p => p.value), 1);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Total de Leads" value={stats.total} />
        <KpiCard label="Sem Atendimento" value={stats.semAtendimento} color={stats.semAtendimento > 0 ? theme.danger : theme.success} />
        <KpiCard label="Novos" value={stats.novos} color="#5B9BD5" />
        <KpiCard label="Qualificados" value={stats.qualificados} color={theme.success} />
        <KpiCard label="Fechados" value={stats.fechados} color="#43C17B" />
        <KpiCard label="Taxa Conversão" value={stats.total > 0 ? `${((stats.fechados / stats.total) * 100).toFixed(1)}%` : '0%'} color={theme.gold} />
      </div>

      {/* Pipeline Visual */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Pipeline Comercial</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
          {pipeline.map(p => (
            <div key={p.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: p.color, marginBottom: 6 }}>{p.value}</div>
              <div style={{
                height: Math.max(8, (p.value / maxPipeline) * 80),
                background: `${p.color}33`,
                borderTop: `3px solid ${p.color}`,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s',
              }} />
              <div style={{ fontSize: 10, color: theme.muted, marginTop: 6, whiteSpace: 'nowrap' }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Origem + Produto + Responsável */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Por Origem */}
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12 }}>Por Origem</div>
          {stats.porOrigem.slice(0, 8).map(o => {
            const pct = stats.total > 0 ? (o.total / stats.total) * 100 : 0;
            return (
              <div key={o.origem} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 12, color: theme.text }}>{o.origem}</div>
                <div style={{ width: 80, height: 6, background: theme.soft, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: theme.gold, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: theme.muted, width: 30, textAlign: 'right' }}>{o.total}</div>
              </div>
            );
          })}
        </div>

        {/* Por Produto */}
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12 }}>Por Produto/Interesse</div>
          {stats.porProduto.slice(0, 8).map(p => {
            const pct = stats.total > 0 ? (p.total / stats.total) * 100 : 0;
            return (
              <div key={p.produto} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 12, color: theme.text }}>{p.produto || '(não informado)'}</div>
                <div style={{ width: 80, height: 6, background: theme.soft, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#7B68EE', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: theme.muted, width: 30, textAlign: 'right' }}>{p.total}</div>
              </div>
            );
          })}
          {stats.porProduto.length === 0 && <div style={{ fontSize: 12, color: theme.muted }}>Nenhum dado</div>}
        </div>

        {/* Por Responsável */}
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12 }}>Por Responsável</div>
          {stats.porResponsavel.filter(r => r.responsavel).slice(0, 8).map(r => (
            <div key={r.responsavel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: theme.text }}>{r.responsavel}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.gold }}>{r.total}</div>
            </div>
          ))}
          {stats.porResponsavel.filter(r => r.responsavel).length === 0 && <div style={{ fontSize: 12, color: theme.muted }}>Nenhum dado</div>}
        </div>
      </div>

      {/* Evolução Mensal */}
      {stats.porPeriodo.length > 1 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Evolução Mensal</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 100 }}>
            {stats.porPeriodo.map(p => {
              const maxMes = Math.max(...stats.porPeriodo.map(m => m.total), 1);
              const h = Math.max(4, (p.total / maxMes) * 80);
              return (
                <div key={p.mes} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: theme.gold, marginBottom: 4 }}>{p.total}</div>
                  <div style={{ height: h, background: `${theme.gold}44`, borderTop: `2px solid ${theme.gold}`, borderRadius: '3px 3px 0 0' }} />
                  <div style={{ fontSize: 9, color: theme.muted, marginTop: 4 }}>{p.mes}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: TODOS OS LEADS (Unified Table)
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_SIZE = 25;

function LeadDetailModal({ lead, onClose }: { lead: CrmLead; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12,
        padding: 24, maxWidth: 600, width: '90%', maxHeight: '85vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>{lead.nome}</div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
              {lead.origemLabel} · {lead.dataEntrada}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.muted, fontSize: 20, cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <DetailField label="Status" value={lead.statusNorm} badge color={statusColor(lead.statusNorm)} />
          <DetailField label="Prioridade" value={lead.prioridade.toUpperCase()} badge color={PRIORIDADE_COLORS[lead.prioridade]} />
          <DetailField label="Score" value={`${lead.score}/100`} />
          <DetailField label="Responsável" value={lead.responsavel || '(não atribuído)'} />
          <DetailField label="Telefone" value={lead.telefone || '—'} />
          <DetailField label="Email" value={lead.email || '—'} />
          <DetailField label="Cidade/Bairro" value={[lead.cidade, lead.bairro].filter(Boolean).join(' / ') || '—'} />
          <DetailField label="Empresa" value={lead.empresa || '—'} />
          <DetailField label="Produto" value={lead.produtoInteresse || '—'} />
          <DetailField label="Tipo Local" value={lead.tipoLocal || '—'} />
          <DetailField label="Urgência" value={lead.urgencia || '—'} />
          <DetailField label="Valor Pretendido" value={lead.valorPretendido || '—'} />
          {lead.instagramHandle && <DetailField label="Instagram" value={`@${lead.instagramHandle}`} />}
          {lead.fechou && <DetailField label="Fechou?" value={lead.fechou} badge color={lead.fechou === 'SIM' ? theme.success : theme.danger} />}
          {lead.valorOrcamento && <DetailField label="Valor Orçamento" value={lead.valorOrcamento} />}
          {lead.motivoPerda && <DetailField label="Motivo Perda" value={lead.motivoPerda} />}
        </div>

        {/* Fontes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Fontes ({lead.fontes.length})</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {lead.fontes.map(f => <Badge key={f} text={f} color={theme.gold} />)}
          </div>
          {lead.duplicatas > 0 && (
            <div style={{ fontSize: 11, color: theme.warning, marginTop: 4 }}>
              Encontrado em {lead.duplicatas + 1} fontes (deduplicado)
            </div>
          )}
        </div>

        {/* Observações */}
        {lead.observacoes && (
          <div>
            <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Observações</div>
            <div style={{ fontSize: 13, color: theme.text, background: theme.soft, padding: 12, borderRadius: 8 }}>
              {lead.observacoes}
            </div>
          </div>
        )}

        {/* Status original */}
        {lead.status && lead.status !== lead.statusNorm && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: theme.muted }}>Status original: <span style={{ color: theme.text }}>{lead.status}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value, badge, color }: { label: string; value: string; badge?: boolean; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: theme.muted, marginBottom: 2 }}>{label}</div>
      {badge && color ? <Badge text={value} color={color} /> : <div style={{ fontSize: 13, color: theme.text }}>{value}</div>}
    </div>
  );
}

function TodosOsLeads({ data, loading, sources, query, onQueryChange }: {
  data: CrmLeadsResult | null;
  loading: boolean;
  sources: CrmSource[];
  query: CrmQuery;
  onQueryChange: (q: CrmQuery) => void;
}) {
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  useEffect(() => setPage(1), [query]);

  const leads = data?.leads ?? [];
  const totalPages = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  const paginated = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Unique values for filters
  const statuses = ['Novo', 'Primeiro contato', 'Conversando', 'Qualificado', 'Agendado', 'Orçamento enviado', 'Fechado', 'Perdido'];
  const prioridades = ['alta', 'media', 'baixa'];

  const handleExport = () => {
    const header = 'Nome,Telefone,Email,Origem,Produto,Status,Prioridade,Score,Responsável,Data,Cidade,Empresa,Observações';
    const rows = leads.map(l =>
      [l.nome, l.telefone, l.email, l.origemLabel, l.produtoInteresse, l.statusNorm,
       l.prioridade, l.score, l.responsavel, l.dataEntrada, l.cidade, l.empresa, l.observacoes]
        .map(v => csvEscape(String(v ?? ''))).join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `crm-leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input
          value={query.search ?? ''} onChange={e => onQueryChange({ ...query, search: e.target.value })}
          placeholder="Buscar nome, telefone, email..."
          style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '6px 10px', color: theme.text, fontSize: 12, width: 220 }}
        />
        <select value={query.origem ?? ''} onChange={e => onQueryChange({ ...query, origem: e.target.value || undefined })}
          style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '6px 8px', color: theme.text, fontSize: 12 }}>
          <option value="">Todas as origens</option>
          {sources.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={query.status ?? ''} onChange={e => onQueryChange({ ...query, status: e.target.value || undefined })}
          style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '6px 8px', color: theme.text, fontSize: 12 }}>
          <option value="">Todos os status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={query.prioridade ?? ''} onChange={e => onQueryChange({ ...query, prioridade: e.target.value || undefined })}
          style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '6px 8px', color: theme.text, fontSize: 12 }}>
          <option value="">Todas prioridades</option>
          {prioridades.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <button onClick={handleExport} disabled={leads.length === 0}
          style={{ ...btnStyle(false), marginLeft: 'auto' }}>
          ↓ CSV ({leads.length})
        </button>
      </div>

      {/* Table */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.muted }}>Carregando leads...</div>
        ) : leads.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.muted }}>Nenhum lead encontrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Nome</th>
                <th style={th}>Telefone</th>
                <th style={th}>Origem</th>
                <th style={th}>Produto</th>
                <th style={th}>Status</th>
                <th style={th}>Prioridade</th>
                <th style={th}>Score</th>
                <th style={th}>Responsável</th>
                <th style={th}>Data</th>
                <th style={th}>Fontes</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(lead => (
                <tr key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.soft)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...td, fontWeight: 600, maxWidth: 180 }}>
                    {lead.nome || '—'}
                    {lead.empresa && <div style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>{lead.empresa}</div>}
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{lead.telefone || '—'}</td>
                  <td style={td}><Badge text={lead.origemLabel} color={theme.gold} /></td>
                  <td style={{ ...td, fontSize: 12 }}>{lead.produtoInteresse || '—'}</td>
                  <td style={td}><Badge text={lead.statusNorm} color={statusColor(lead.statusNorm)} /></td>
                  <td style={td}><Badge text={lead.prioridade} color={PRIORIDADE_COLORS[lead.prioridade] ?? theme.muted} /></td>
                  <td style={td}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      background: `${lead.score >= 60 ? theme.success : lead.score >= 35 ? theme.warning : theme.danger}22`,
                      color: lead.score >= 60 ? theme.success : lead.score >= 35 ? theme.warning : theme.danger,
                    }}>{lead.score}</div>
                  </td>
                  <td style={{ ...td, fontSize: 12 }}>{lead.responsavel || '—'}</td>
                  <td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>{lead.dataEntrada || '—'}</td>
                  <td style={td}>
                    {lead.fontes.length > 1
                      ? <Badge text={`${lead.fontes.length} fontes`} color={theme.warning} />
                      : <span style={{ fontSize: 11, color: theme.muted }}>{lead.fontes[0] ?? '—'}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnStyle(false)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - page) <= 2)
            .map(p => <button key={p} onClick={() => setPage(p)} style={btnStyle(p === page)}>{p}</button>)}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnStyle(false)}>›</button>
          <span style={{ fontSize: 12, color: theme.muted, marginLeft: 8 }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Detail modal */}
      {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: POR FONTE (All sources — unified CRM view per source)
// ═══════════════════════════════════════════════════════════════════════════════

// Source grouping for sidebar navigation
const SOURCE_GROUPS = [
  {
    group: 'SDR (Gestão Interna)',
    sources: [
      { id: 'sdr-whatsapp', label: 'WhatsApp' },
      { id: 'sdr-instagram', label: 'Instagram' },
      { id: 'sdr-visitas', label: 'Visitas Marcadas' },
    ],
  },
  {
    group: 'Site e Landing Pages',
    sources: [
      { id: 'site', label: 'Site Principal' },
      { id: 'insta-form', label: 'Formulário Instagram' },
      { id: 'lp-seguranca', label: 'LP Segurança' },
      { id: 'lp-empresas', label: 'LP Empresas' },
      { id: 'lp-residencial', label: 'LP Residencial' },
      { id: 'lp-geral', label: 'LP Geral' },
      { id: 'lp-outro', label: 'LP Outro' },
    ],
  },
];

function PorFonte({ crmData, crmLoading, ds }: {
  crmData: CrmLeadsResult | null;
  crmLoading: boolean;
  ds: ReturnType<typeof createDataSource>;
}) {
  const [selectedSource, setSelectedSource] = useState('sdr-whatsapp');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  // Filter CRM leads by selected source
  const allLeads = crmData?.leads ?? [];
  const sourceLeads = allLeads.filter(l => l.fontes.includes(selectedSource) || l.origem === selectedSource);

  // Count per source (for badges)
  const countBySource = new Map<string, number>();
  for (const l of allLeads) {
    const key = l.origem;
    countBySource.set(key, (countBySource.get(key) ?? 0) + 1);
  }

  // Client search filter
  const filtered = search.trim()
    ? sourceLeads.filter(l => {
        const q = search.trim().toLowerCase();
        return l.nome.toLowerCase().includes(q) ||
               l.telefone.includes(q) ||
               l.email.toLowerCase().includes(q) ||
               l.empresa.toLowerCase().includes(q) ||
               l.observacoes.toLowerCase().includes(q);
      })
    : sourceLeads;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats for this source
  const statusMap = new Map<string, number>();
  for (const l of sourceLeads) {
    const s = l.statusNorm || 'Novo';
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
  }
  const topStatuses = [...statusMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const handleExport = () => {
    const header = 'Nome,Telefone,Email,Produto,Status,Prioridade,Score,Responsável,Data,Cidade,Empresa,Observações';
    const rows = filtered.map(l =>
      [l.nome, l.telefone, l.email, l.produtoInteresse, l.statusNorm,
       l.prioridade, l.score, l.responsavel, l.dataEntrada, l.cidade, l.empresa, l.observacoes]
        .map(v => csvEscape(String(v ?? ''))).join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fonte-${selectedSource}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedLabel = SOURCE_GROUPS.flatMap(g => g.sources).find(s => s.id === selectedSource)?.label ?? selectedSource;

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Sidebar — source list */}
      <div style={{
        minWidth: 200, maxWidth: 220,
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10,
        padding: 12, alignSelf: 'flex-start', position: 'sticky', top: 80,
      }}>
        {SOURCE_GROUPS.map(g => (
          <div key={g.group} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, padding: '0 6px' }}>
              {g.group}
            </div>
            {g.sources.map(s => {
              const count = countBySource.get(s.id) ?? 0;
              const active = selectedSource === s.id;
              return (
                <button key={s.id}
                  onClick={() => { setSelectedSource(s.id); setSearch(''); setPage(1); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left',
                    background: active ? `${theme.gold}22` : 'transparent',
                    color: active ? theme.gold : theme.text,
                    border: 'none', borderRadius: 6, padding: '7px 10px', cursor: 'pointer',
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    transition: 'all 0.1s',
                  }}>
                  <span>{s.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: count > 0 ? (active ? theme.gold : theme.soft) : theme.soft,
                    color: count > 0 ? (active ? '#000' : theme.text) : theme.muted,
                    padding: '1px 6px', borderRadius: 10, minWidth: 20, textAlign: 'center',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Content — leads from selected source */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Source header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{selectedLabel}</div>
            <div style={{ fontSize: 12, color: theme.muted }}>{sourceLeads.length} lead{sourceLeads.length !== 1 ? 's' : ''} nesta fonte</div>
          </div>
          <button onClick={handleExport} disabled={filtered.length === 0}
            style={{ ...btnStyle(false) }}>
            ↓ CSV ({filtered.length})
          </button>
        </div>

        {/* KPIs for this source */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <KpiCard label="Total" value={sourceLeads.length} />
          {topStatuses.map(([status, total]) => (
            <KpiCard key={status} label={status} value={total} color={statusColor(status)} />
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 14 }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar nome, telefone, empresa..."
            style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '6px 10px', color: theme.text, fontSize: 12, width: 280 }} />
        </div>

        {/* Table */}
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, overflowX: 'auto' }}>
          {crmLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: theme.muted }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: theme.muted }}>
              {sourceLeads.length === 0 ? 'Nenhum lead nesta fonte ainda.' : 'Nenhum resultado para a busca.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Nome</th>
                  <th style={th}>Telefone</th>
                  <th style={th}>Email</th>
                  <th style={th}>Produto</th>
                  <th style={th}>Status</th>
                  <th style={th}>Score</th>
                  <th style={th}>Responsável</th>
                  <th style={th}>Data</th>
                  <th style={th}>Obs</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(lead => (
                  <tr key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.soft)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...td, fontWeight: 600, maxWidth: 160 }}>
                      {lead.nome || '—'}
                      {lead.empresa && <div style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>{lead.empresa}</div>}
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{lead.telefone || '—'}</td>
                    <td style={{ ...td, fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.email || '—'}</td>
                    <td style={{ ...td, fontSize: 12 }}>{lead.produtoInteresse || '—'}</td>
                    <td style={td}>
                      <Badge text={lead.statusNorm} color={statusColor(lead.statusNorm)} />
                      {lead.status && lead.status !== lead.statusNorm && (
                        <div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>{lead.status}</div>
                      )}
                    </td>
                    <td style={td}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                        background: `${lead.score >= 60 ? theme.success : lead.score >= 35 ? theme.warning : theme.danger}22`,
                        color: lead.score >= 60 ? theme.success : lead.score >= 35 ? theme.warning : theme.danger,
                      }}>{lead.score}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12 }}>{lead.responsavel || '—'}</td>
                    <td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>{lead.dataEntrada || '—'}</td>
                    <td style={{ ...td, fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.observacoes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnStyle(false)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
              <button key={p} onClick={() => setPage(p)} style={btnStyle(p === page)}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnStyle(false)}>›</button>
          </div>
        )}

        {/* Detail modal */}
        {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SDR PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type MainTab = 'painel' | 'leads' | 'fontes';

export function SdrPage() {
  const { showToast } = useToast();
  const ds = createDataSource();
  const mode = getDataSourceMode();

  const [mainTab, setMainTab] = useState<MainTab>('painel');

  // CRM state
  const [crmData, setCrmData] = useState<CrmLeadsResult | null>(null);
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmQuery, setCrmQuery] = useState<CrmQuery>({});
  const [sources, setSources] = useState<CrmSource[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Health
  const [healthOnline, setHealthOnline] = useState<boolean | null>(null);
  const [healthLatency, setHealthLatency] = useState(0);
  const [healthChecking, setHealthChecking] = useState(false);

  // Period filter (shared between painel and leads)
  type Period = 'week' | 'month' | '30d' | '90d' | 'custom' | 'all';
  const [period, setPeriod] = useState<Period>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCrm = useCallback(async (quiet = false) => {
    if (!quiet) setCrmLoading(true);
    try {
      const q: CrmQuery = { ...crmQuery };
      if (period !== 'all') q.period = period as CrmQuery['period'];
      if (period === 'custom') { q.start = customStart; q.end = customEnd; }
      const data = await ds.crm.getLeads(q);
      setCrmData(data);
      setLastRefresh(new Date());
    } catch {
      if (!quiet) showToast('Erro ao carregar CRM', 'error');
    } finally {
      setCrmLoading(false);
    }
  }, [ds.crm, crmQuery, period, customStart, customEnd, showToast]);

  const checkHealth = useCallback(async () => {
    setHealthChecking(true);
    try {
      const h = await ds.sdr.checkHealth();
      setHealthOnline(h.online);
      setHealthLatency(h.latencyMs);
    } catch {
      setHealthOnline(false);
    } finally {
      setHealthChecking(false);
    }
  }, [ds.sdr]);

  // Load on mount and query change
  useEffect(() => {
    loadCrm();
  }, [period, customStart, customEnd, crmQuery]);

  useEffect(() => {
    ds.crm.getSources().then(setSources).catch(() => {});
  }, []);

  // Health + auto-refresh
  useEffect(() => {
    checkHealth();
    const h = setInterval(checkHealth, 60_000);
    return () => clearInterval(h);
  }, [checkHealth]);

  useEffect(() => {
    intervalRef.current = setInterval(() => loadCrm(true), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadCrm]);

  return (
    <AppShell title="CRM SDR">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: 0 }}>CRM — Gestão de Leads</h1>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
            {crmData ? `${crmData.stats.total} leads unificados de ${sources.length} fontes` : 'Carregando...'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HealthBadge online={healthOnline} latencyMs={healthLatency} checking={healthChecking} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: theme.soft, border: `1px solid ${theme.border}`,
            borderRadius: 20, padding: '4px 12px', fontSize: 12,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: crmLoading ? theme.warning : theme.success,
              display: 'inline-block',
              animation: crmLoading ? 'pulse 1s ease-in-out infinite' : 'none',
            }} />
            <span style={{ color: theme.muted }}>
              {mode === 'api' ? 'ao vivo' : 'mock'}
              {lastRefresh ? ` · ${lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>
          <button onClick={() => loadCrm(false)} style={btnStyle(false)} title="Atualizar">↻</button>
        </div>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `2px solid ${theme.border}` }}>
        <button onClick={() => setMainTab('painel')} style={mainTabStyle(mainTab === 'painel')}>
          Painel CRM
        </button>
        <button onClick={() => setMainTab('leads')} style={mainTabStyle(mainTab === 'leads')}>
          Todos os Leads
          {crmData && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({crmData.stats.total})</span>}
        </button>
        <button onClick={() => setMainTab('fontes')} style={mainTabStyle(mainTab === 'fontes')}>
          Por Fonte
        </button>
      </div>

      {/* Period filter (painel + leads) */}
      {mainTab !== 'fontes' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          {(['week', 'month', '30d', '90d', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={btnStyle(period === p)}>
              {{ week: 'Esta semana', month: 'Este mês', '30d': '30 dias', '90d': '90 dias', all: 'Tudo' }[p]}
            </button>
          ))}
          <button onClick={() => setPeriod('custom')} style={btnStyle(period === 'custom')}>Personalizado</button>
          {period === 'custom' && (
            <>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '5px 8px', color: theme.text, fontSize: 12 }} />
              <span style={{ color: theme.muted, fontSize: 12 }}>até</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '5px 8px', color: theme.text, fontSize: 12 }} />
            </>
          )}
        </div>
      )}

      {/* Tab content */}
      {mainTab === 'painel' && <PainelCrm data={crmData} loading={crmLoading} />}
      {mainTab === 'leads' && (
        <TodosOsLeads
          data={crmData} loading={crmLoading} sources={sources}
          query={crmQuery} onQueryChange={setCrmQuery}
        />
      )}
      {mainTab === 'fontes' && <PorFonte crmData={crmData} crmLoading={crmLoading} ds={ds} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </AppShell>
  );
}
