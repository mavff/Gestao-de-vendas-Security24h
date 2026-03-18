'use client';

import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { CrmLead } from '../../lib/dataSource/types';
import { loadState, saveState } from '../../services/appState';

// ── Pipeline stages baseadas no funil real das planilhas ────────────────────
const PIPELINE_STAGES = [
  { id: 'novo', label: 'Novos Leads', color: '#5B9BD5', statusMatch: ['Novo', ''] },
  { id: 'tentativa', label: 'Tentativa de Contato', color: '#FF9800', statusMatch: ['Primeiro contato'] },
  { id: 'conversa', label: 'Em Conversa', color: '#C077DB', statusMatch: ['Conversando'] },
  { id: 'qualificado', label: 'Qualificado', color: '#43C17B', statusMatch: ['Qualificado'] },
  { id: 'visita', label: 'Visita / Reunião', color: '#E3B341', statusMatch: ['Agendado'] },
  { id: 'orcamento', label: 'Orçamento Enviado', color: '#E8875B', statusMatch: ['Orçamento enviado'] },
  { id: 'fechado', label: 'Fechado', color: '#2ECC71', statusMatch: ['Fechado'] },
] as const;

type StageId = typeof PIPELINE_STAGES[number]['id'];
const STAGE_IDS = PIPELINE_STAGES.map(s => s.id);

// localStorage keys
const STAGE_OVERRIDES_KEY = 'crm_pipeline_stages';
const DISMISSED_KEY = 'crm_pipeline_dismissed';
const LOST_OVERRIDES_KEY = 'crm_pipeline_lost';

function statusToStage(statusNorm: string, fechou?: string): StageId {
  // Se o lead tem "SIM" ou variação em "Fechou?", é Fechado independente do status
  if (fechou) {
    const f = fechou.toUpperCase().trim();
    if (f === 'SIM' || f === 'FECHADO' || f === 'FCH' || f === 'FECHOU') return 'fechado';
  }
  for (const stage of PIPELINE_STAGES) {
    if ((stage.statusMatch as readonly string[]).includes(statusNorm)) return stage.id;
  }
  return 'novo';
}

function diasDesdeEntrada(dataEntrada: string): number {
  if (!dataEntrada) return 0;
  const d = new Date(dataEntrada);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function scoreColor(score: number): string {
  if (score >= 70) return '#2ECC71';
  if (score >= 40) return '#E3B341';
  return '#E8875B';
}

function prioridadeLabel(p: string): { text: string; color: string } {
  if (p === 'alta') return { text: 'ALTA', color: '#FF4D4D' };
  if (p === 'media') return { text: 'MÉDIA', color: '#E3B341' };
  return { text: 'BAIXA', color: '#B5B5B5' };
}

function origemIcon(origem: string): string {
  const o = origem.toLowerCase();
  if (o.includes('whatsapp') || o.includes('sdr-log')) return '💬';
  if (o.includes('instagram') || o.includes('insta')) return '📷';
  if (o.includes('site') || o.includes('landing') || o.includes('lp-')) return '🌐';
  if (o.includes('visita')) return '📍';
  return '📋';
}

type LeadWithStage = CrmLead & { _stage: StageId };

export function KanbanPage() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stageOverrides, setStageOverrides] = useState<Record<string, StageId>>({});
  const [dismissed, setDismissed] = useState<Record<string, string>>({}); // id → motivo
  const [lostOverrides, setLostOverrides] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [showLost, setShowLost] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState<{ stageId: StageId; days: number } | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterOrigem, setFilterOrigem] = useState('todos');
  const [filterResponsavel, setFilterResponsavel] = useState('todos');
  const [filterPrioridade, setFilterPrioridade] = useState('todos');
  const [filterPeriodo, setFilterPeriodo] = useState('30d');

  const canDrag = role !== 'INFRA' && role !== 'MONITOR';
  const canManage = role === 'ADMIN' || role === 'GESTOR' || role === 'SDR' || role === 'VENDEDOR';

  // ── Fetch CRM leads ──────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const ds = createDataSource();
      const result = await ds.crm.getLeads({ period: 'all' });
      setLeads(result.leads);
      const [stages, dism, lostArr] = await Promise.all([
        loadState<Record<string, StageId>>(STAGE_OVERRIDES_KEY, {}),
        loadState<Record<string, string>>(DISMISSED_KEY, {}),
        loadState<string[]>(LOST_OVERRIDES_KEY, []),
      ]);
      setStageOverrides(stages);
      setDismissed(dism);
      setLostOverrides(new Set(lostArr));
    } catch {
      setError('Falha ao carregar leads do CRM.');
      showToast('Erro ao carregar pipeline do CRM.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Ações sobre leads ────────────────────────────────────────────────────
  function dismissLead(id: string, motivo: string) {
    const updated = { ...dismissed, [id]: motivo };
    setDismissed(updated);
    saveState(DISMISSED_KEY, updated);
    setSelectedLead(null);
    showToast('Lead descartado.', 'success');
  }

  function markAsLost(id: string) {
    const updated = new Set(lostOverrides);
    updated.add(id);
    setLostOverrides(updated);
    saveState(LOST_OVERRIDES_KEY, Array.from(updated));
    setSelectedLead(null);
    showToast('Lead marcado como perdido.', 'success');
  }

  function restoreLead(id: string) {
    const updDismissed = { ...dismissed };
    delete updDismissed[id];
    setDismissed(updDismissed);
    saveState(DISMISSED_KEY, updDismissed);
    const updLost = new Set(lostOverrides);
    updLost.delete(id);
    setLostOverrides(updLost);
    saveState(LOST_OVERRIDES_KEY, Array.from(updLost));
    showToast('Lead restaurado.', 'success');
  }

  function bulkDismiss(stageId: StageId, olderThanDays: number) {
    const now = Date.now();
    const updDismissed = { ...dismissed };
    let count = 0;
    for (const lead of leadsWithStage) {
      if (lead._stage !== stageId) continue;
      if (dismissed[lead.id]) continue;
      if (lead.statusNorm === 'Perdido' || lostOverrides.has(lead.id)) continue;
      if (!lead.dataEntrada) { updDismissed[lead.id] = `Sem data (limpeza em lote)`; count++; continue; }
      const d = new Date(lead.dataEntrada);
      if (isNaN(d.getTime())) { updDismissed[lead.id] = `Data inválida (limpeza em lote)`; count++; continue; }
      const dias = Math.floor((now - d.getTime()) / 86_400_000);
      if (dias >= olderThanDays) { updDismissed[lead.id] = `+${dias}d sem evolução (limpeza em lote)`; count++; }
    }
    setDismissed(updDismissed);
    saveState(DISMISSED_KEY, updDismissed);
    setConfirmBulk(null);
    showToast(`${count} leads descartados.`, 'success');
  }

  function clearAllDismissed() {
    setDismissed({});
    saveState(DISMISSED_KEY, {});
    showToast('Todos os leads restaurados.', 'success');
  }

  // ── Resolve estágio e filtros ────────────────────────────────────────────
  const leadsWithStage = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      _stage: stageOverrides[lead.id] || statusToStage(lead.statusNorm, lead.fechou),
    }));
  }, [leads, stageOverrides]);

  // Separar: ativos, perdidos (status original + overrides), descartados
  const { activeLeads, lostLeads, dismissedLeads } = useMemo(() => {
    const active: LeadWithStage[] = [];
    const lost: LeadWithStage[] = [];
    const disc: (LeadWithStage & { _motivo: string })[] = [];

    for (const lead of leadsWithStage) {
      if (dismissed[lead.id]) {
        disc.push({ ...lead, _motivo: dismissed[lead.id] });
      } else if (lead.statusNorm === 'Perdido' || lostOverrides.has(lead.id)) {
        lost.push(lead);
      } else {
        active.push(lead);
      }
    }
    return { activeLeads: active, lostLeads: lost, dismissedLeads: disc };
  }, [leadsWithStage, dismissed, lostOverrides]);

  // Filtro de período
  const periodoMinDate = useMemo(() => {
    if (filterPeriodo === 'todos') return null;
    const daysMap: Record<string, number> = { '7d': 7, '15d': 15, '30d': 30, '60d': 60, '90d': 90, '180d': 180, '1a': 365 };
    const days = daysMap[filterPeriodo];
    if (!days) return null;
    return new Date(Date.now() - days * 86_400_000);
  }, [filterPeriodo]);

  const filtered = useMemo(() => {
    return activeLeads.filter(lead => {
      const q = search.toLowerCase();
      const bySearch = !q || lead.nome.toLowerCase().includes(q) || lead.empresa.toLowerCase().includes(q) || lead.telefone.includes(q);
      const byOrigem = filterOrigem === 'todos' || lead.origemLabel === filterOrigem;
      const byResponsavel = filterResponsavel === 'todos' || lead.responsavel === filterResponsavel;
      const byPrioridade = filterPrioridade === 'todos' || lead.prioridade === filterPrioridade;
      let byPeriodo = true;
      if (periodoMinDate && lead.dataEntrada) {
        const d = new Date(lead.dataEntrada);
        byPeriodo = !isNaN(d.getTime()) && d >= periodoMinDate;
      }
      return bySearch && byOrigem && byResponsavel && byPrioridade && byPeriodo;
    });
  }, [activeLeads, search, filterOrigem, filterResponsavel, filterPrioridade, periodoMinDate]);

  const filteredLost = useMemo(() => {
    const q = search.toLowerCase();
    return lostLeads.filter(l => !q || l.nome.toLowerCase().includes(q) || l.empresa.toLowerCase().includes(q));
  }, [lostLeads, search]);

  const origens = useMemo(() => Array.from(new Set(leads.map(l => l.origemLabel))).filter(Boolean).sort(), [leads]);
  const responsaveis = useMemo(() => Array.from(new Set(leads.map(l => l.responsavel))).filter(Boolean).sort(), [leads]);

  // ── Drag & drop ──────────────────────────────────────────────────────────
  function onDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const nextStage = event.over?.id as StageId | undefined;
    if (!nextStage || !STAGE_IDS.includes(nextStage)) return;
    const updated = { ...stageOverrides, [leadId]: nextStage };
    setStageOverrides(updated);
    saveState(STAGE_OVERRIDES_KEY, updated);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AppShell title="Pipeline de Vendas">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar nome, empresa ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <select value={filterOrigem} onChange={(e) => setFilterOrigem(e.target.value)} style={inputStyle}>
          <option value="todos">Origem</option>
          {origens.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterResponsavel} onChange={(e) => setFilterResponsavel(e.target.value)} style={inputStyle}>
          <option value="todos">Responsável</option>
          {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterPrioridade} onChange={(e) => setFilterPrioridade(e.target.value)} style={inputStyle}>
          <option value="todos">Prioridade</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select value={filterPeriodo} onChange={(e) => setFilterPeriodo(e.target.value)} style={inputStyle}>
          <option value="7d">Últimos 7 dias</option>
          <option value="15d">Últimos 15 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="60d">Últimos 60 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="180d">Últimos 6 meses</option>
          <option value="1a">Último ano</option>
          <option value="todos">Todo o período</option>
        </select>
        <button onClick={fetchLeads} style={{ ...btnStyle, background: theme.soft, color: theme.text, border: `1px solid ${theme.border}` }} title="Atualizar">
          ↻
        </button>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {loading && <span style={{ fontSize: 12, color: theme.gold }}>● carregando...</span>}
        {error && <span style={{ fontSize: 12, color: theme.danger }}>{error}</span>}
        {!loading && !error && (
          <span style={{ fontSize: 12, color: theme.muted }}>
            {filtered.length} ativos · {lostLeads.length} perdidos · {dismissedLeads.length} descartados
          </span>
        )}
        <button
          onClick={() => setShowLost(!showLost)}
          style={{ ...tagBtn, color: showLost ? theme.danger : theme.muted, borderColor: showLost ? theme.danger + '66' : theme.border }}
        >
          {showLost ? '✕ Ocultar perdidos' : `☠ Perdidos (${lostLeads.length})`}
        </button>
        {dismissedLeads.length > 0 && (
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            style={{ ...tagBtn, color: showDismissed ? '#5B9BD5' : theme.muted, borderColor: showDismissed ? '#5B9BD566' : theme.border }}
          >
            {showDismissed ? '✕ Ocultar descartados' : `🗑 Descartados (${dismissedLeads.length})`}
          </button>
        )}
      </div>

      {/* Pipeline board */}
      <DndContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, minmax(170px, 1fr))`, gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l._stage === stage.id);
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                leads={stageLeads}
                canDrag={canDrag}
                canManage={canManage}
                onClickLead={setSelectedLead}
                onDismiss={(id) => dismissLead(id, 'Descartado manualmente')}
                onMarkLost={markAsLost}
                onBulkDismiss={(days) => setConfirmBulk({ stageId: stage.id, days })}
              />
            );
          })}
        </div>
      </DndContext>

      {/* Perdidos */}
      {showLost && filteredLost.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ color: theme.danger, margin: '0 0 8px', fontSize: 14 }}>Leads Perdidos ({filteredLost.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {filteredLost.map(lead => (
              <LostCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} onRestore={canManage ? () => restoreLead(lead.id) : undefined} />
            ))}
          </div>
        </div>
      )}

      {/* Descartados */}
      {showDismissed && dismissedLeads.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ color: '#5B9BD5', margin: 0, fontSize: 14 }}>Leads Descartados ({dismissedLeads.length})</h4>
            {canManage && (
              <button onClick={clearAllDismissed} style={{ ...tagBtn, color: theme.warning, borderColor: theme.warning + '66', fontSize: 11 }}>
                Restaurar todos
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {dismissedLeads.map(lead => (
              <DismissedCard key={lead.id} lead={lead} motivo={lead._motivo} onClick={() => setSelectedLead(lead)} onRestore={canManage ? () => restoreLead(lead.id) : undefined} />
            ))}
          </div>
        </div>
      )}

      {/* Confirm bulk dismiss modal */}
      {confirmBulk && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, width: 400, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', color: theme.warning, fontSize: 16 }}>Descartar leads antigos</h3>
            <p style={{ fontSize: 13, color: theme.muted, margin: '0 0 16px' }}>
              Descartar todos os leads desta coluna com mais de <strong style={{ color: theme.text }}>{confirmBulk.days} dias</strong> sem evolução?
              <br /><br />
              Eles irão para a aba "Descartados" e podem ser restaurados a qualquer momento.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => bulkDismiss(confirmBulk.stageId, confirmBulk.days)} style={{ ...btnStyle, background: theme.warning }}>
                Confirmar
              </button>
              <button onClick={() => setConfirmBulk(null)} style={{ ...btnStyle, background: theme.soft, color: theme.text, border: `1px solid ${theme.border}` }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          canManage={canManage}
          onDismiss={(motivo) => dismissLead(selectedLead.id, motivo)}
          onMarkLost={() => markAsLost(selectedLead.id)}
          onRestore={() => { restoreLead(selectedLead.id); setSelectedLead(null); }}
          isDismissed={!!dismissed[selectedLead.id]}
          isLost={selectedLead.statusNorm === 'Perdido' || lostOverrides.has(selectedLead.id)}
        />
      )}
    </AppShell>
  );
}

// ── Stage Column ────────────────────────────────────────────────────────────

function StageColumn({ stage, leads, canDrag, canManage, onClickLead, onDismiss, onMarkLost, onBulkDismiss }: {
  stage: typeof PIPELINE_STAGES[number];
  leads: LeadWithStage[];
  canDrag: boolean;
  canManage: boolean;
  onClickLead: (lead: CrmLead) => void;
  onDismiss: (id: string) => void;
  onMarkLost: (id: string) => void;
  onBulkDismiss: (days: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? '#1a1a10' : theme.panel,
        border: `1px solid ${isOver ? stage.color : theme.border}`,
        borderRadius: 12,
        padding: 10,
        minHeight: 200,
        transition: 'all 200ms ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: stage.color }} />
        <h4 style={{ margin: 0, fontSize: 13, color: theme.text, flex: 1 }}>{stage.label}</h4>
        <span style={{ background: stage.color + '22', color: stage.color, fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
          {leads.length}
        </span>
        {/* Menu de ações da coluna */}
        {canManage && leads.length > 3 && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'transparent', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>⋮</button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: 20, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 4, zIndex: 30, minWidth: 180, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                <button onClick={() => { onBulkDismiss(7); setShowMenu(false); }} style={menuItemStyle}>
                  Descartar +7 dias
                </button>
                <button onClick={() => { onBulkDismiss(15); setShowMenu(false); }} style={menuItemStyle}>
                  Descartar +15 dias
                </button>
                <button onClick={() => { onBulkDismiss(30); setShowMenu(false); }} style={menuItemStyle}>
                  Descartar +30 dias
                </button>
                <button onClick={() => setShowMenu(false)} style={{ ...menuItemStyle, color: theme.muted }}>Cancelar</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gap: 6 }}>
        {leads.map(lead => (
          <DraggableCard
            key={lead.id}
            lead={lead}
            onClick={() => onClickLead(lead)}
            disabled={!canDrag}
            stageColor={stage.color}
            canManage={canManage}
            onDismiss={() => onDismiss(lead.id)}
            onMarkLost={() => onMarkLost(lead.id)}
          />
        ))}
      </div>

      {leads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: theme.muted, fontSize: 12 }}>
          Nenhum lead
        </div>
      )}
    </div>
  );
}

// ── Draggable Card ──────────────────────────────────────────────────────────

function DraggableCard({ lead, onClick, disabled, stageColor, canManage, onDismiss, onMarkLost }: {
  lead: CrmLead;
  onClick: () => void;
  disabled?: boolean;
  stageColor: string;
  canManage: boolean;
  onDismiss: () => void;
  onMarkLost: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, disabled });
  const [hover, setHover] = useState(false);
  const dias = diasDesdeEntrada(lead.dataEntrada);
  const prio = prioridadeLabel(lead.prioridade);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: theme.soft,
        border: `1px solid ${theme.border}`,
        borderLeft: `3px solid ${stageColor}`,
        borderRadius: 8,
        padding: '8px 10px',
        cursor: disabled ? 'pointer' : 'grab',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
        transition: 'box-shadow 150ms ease, opacity 150ms ease',
        position: 'relative',
      }}
    >
      {/* Quick actions on hover */}
      {hover && canManage && !isDragging && (
        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 2, zIndex: 5 }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onMarkLost(); }}
            title="Marcar como perdido"
            style={quickActionBtn}
          >✕</button>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            title="Descartar"
            style={{ ...quickActionBtn, color: theme.muted }}
          >🗑</button>
        </div>
      )}

      {/* Nome + score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
        <strong style={{ fontSize: 12, lineHeight: '16px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.nome}
        </strong>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: scoreColor(lead.score) + '22', color: scoreColor(lead.score), fontSize: 9, fontWeight: 700, flexShrink: 0,
        }}>
          {lead.score}
        </div>
      </div>

      {lead.empresa && (
        <div style={{ fontSize: 11, color: theme.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{lead.empresa}</div>
      )}
      {lead.telefone && (
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{lead.telefone}</div>
      )}

      {/* Bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 4 }}>
        <span style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {origemIcon(lead.origem)} <span style={{ color: theme.muted }}>{lead.origemLabel || lead.origem}</span>
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: prio.color }}>{prio.text}</span>
          {dias > 0 && (
            <span style={{ fontSize: 9, color: dias > 7 ? theme.danger : dias > 3 ? theme.warning : theme.muted }}>
              {dias}d
            </span>
          )}
        </div>
      </div>

      {lead.responsavel && (
        <div style={{ fontSize: 10, color: theme.gold, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.responsavel}
        </div>
      )}
    </div>
  );
}

// ── Lost Card ───────────────────────────────────────────────────────────────

function LostCard({ lead, onClick, onRestore }: { lead: CrmLead; onClick: () => void; onRestore?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderLeft: '3px solid #FF4D4D', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', opacity: 0.7, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.nome}</strong>
          <span style={{ fontSize: 10, color: theme.danger, flexShrink: 0, marginLeft: 4 }}>{lead.motivoPerda || 'Perdido'}</span>
        </div>
        {lead.empresa && <div style={{ fontSize: 11, color: theme.muted }}>{lead.empresa}</div>}
        <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>
          {origemIcon(lead.origem)} {lead.origemLabel} · {lead.dataEntrada || '—'}
        </div>
      </div>
      {onRestore && (
        <button onClick={(e) => { e.stopPropagation(); onRestore(); }} title="Restaurar" style={{ ...quickActionBtn, marginLeft: 6, flexShrink: 0 }}>↩</button>
      )}
    </div>
  );
}

// ── Dismissed Card ──────────────────────────────────────────────────────────

function DismissedCard({ lead, motivo, onClick, onRestore }: { lead: CrmLead; motivo: string; onClick: () => void; onRestore?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderLeft: '3px solid #5B9BD5', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', opacity: 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: 12 }}>{lead.nome}</strong>
        {lead.empresa && <div style={{ fontSize: 11, color: theme.muted }}>{lead.empresa}</div>}
        <div style={{ fontSize: 10, color: '#5B9BD5', marginTop: 2 }}>{motivo}</div>
        <div style={{ fontSize: 10, color: theme.muted, marginTop: 1 }}>
          {origemIcon(lead.origem)} {lead.origemLabel} · {lead.dataEntrada || '—'}
        </div>
      </div>
      {onRestore && (
        <button onClick={(e) => { e.stopPropagation(); onRestore(); }} title="Restaurar" style={{ ...quickActionBtn, marginLeft: 6, flexShrink: 0 }}>↩</button>
      )}
    </div>
  );
}

// ── Lead Detail Panel ───────────────────────────────────────────────────────

function LeadDetailPanel({ lead, onClose, canManage, onDismiss, onMarkLost, onRestore, isDismissed, isLost }: {
  lead: CrmLead;
  onClose: () => void;
  canManage: boolean;
  onDismiss: (motivo: string) => void;
  onMarkLost: () => void;
  onRestore: () => void;
  isDismissed: boolean;
  isLost: boolean;
}) {
  const prio = prioridadeLabel(lead.prioridade);
  const dias = diasDesdeEntrada(lead.dataEntrada);
  const [dismissMotivo, setDismissMotivo] = useState('');
  const [showDismissForm, setShowDismissForm] = useState(false);

  const infoRows: [string, string][] = [
    ['Telefone', lead.telefone],
    ['E-mail', lead.email],
    ['Empresa', lead.empresa],
    ['Endereço', lead.endereco],
    ['Cidade', lead.cidade],
    ['Bairro', lead.bairro],
    ['Tipo do local', lead.tipoLocal],
    ['Produto de interesse', lead.produtoInteresse],
    ['Urgência', lead.urgencia],
    ['Valor pretendido', lead.valorPretendido],
    ['Objetivo', lead.objetivo],
    ['Valor orçamento', lead.valorOrcamento],
    ['Instagram', lead.instagramHandle],
    ['Responsável', lead.responsavel],
    ['Fontes', lead.fontes.join(', ')],
    ['Duplicatas', lead.duplicatas > 0 ? String(lead.duplicatas) : ''],
    ['Fechou?', lead.fechou],
    ['Motivo perda', lead.motivoPerda],
  ].filter(([, v]) => v && v !== '—') as [string, string][];

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, width: 440, maxWidth: '92vw', height: '100vh', background: theme.panel, borderLeft: `1px solid ${theme.border}`, padding: 16, overflowY: 'auto', zIndex: 40, boxShadow: '-4px 0 20px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{lead.nome}</h3>
          {lead.empresa && <div style={{ fontSize: 13, color: theme.muted }}>{lead.empresa}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      {/* Status badges */}
      {(isDismissed || isLost) && (
        <div style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 600, background: isDismissed ? '#5B9BD522' : '#FF4D4D22', color: isDismissed ? '#5B9BD5' : '#FF4D4D' }}>
          {isDismissed ? '🗑 Este lead foi descartado' : '☠ Este lead está marcado como perdido'}
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: scoreColor(lead.score) + '22', color: scoreColor(lead.score) }}>Score: {lead.score}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: prio.color + '22', color: prio.color }}>{prio.text}</span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#5B9BD522', color: '#5B9BD5' }}>{lead.statusNorm || lead.status || 'Novo'}</span>
        {dias > 0 && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: (dias > 7 ? theme.danger : theme.muted) + '22', color: dias > 7 ? theme.danger : theme.muted }}>{dias} dias</span>
        )}
      </div>

      {/* Origin */}
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
        {origemIcon(lead.origem)} {lead.origemLabel || lead.origem} · Entrada: {lead.dataEntrada || '—'} {lead.horaEntrada && `às ${lead.horaEntrada}`}
      </div>

      {/* Info rows */}
      <div style={{ display: 'grid', gap: 1 }}>
        {infoRows.map(([label, value]) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', padding: '5px 0', borderBottom: `1px solid ${theme.border}22` }}>
            <span style={{ fontSize: 12, color: theme.muted }}>{label}</span>
            <span style={{ fontSize: 12, color: theme.text, wordBreak: 'break-word' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Observações */}
      {lead.observacoes && (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ color: theme.gold, margin: '0 0 6px', fontSize: 13 }}>Observações</h4>
          <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'pre-wrap', background: theme.soft, borderRadius: 8, padding: 10 }}>{lead.observacoes}</div>
        </div>
      )}

      {/* Quick contact */}
      {lead.telefone && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <a href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            style={{ ...btnStyle, background: '#25D366', textDecoration: 'none', textAlign: 'center', flex: 1 }}>WhatsApp</a>
          <a href={`tel:${lead.telefone.replace(/\D/g, '')}`}
            style={{ ...btnStyle, background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, textDecoration: 'none', textAlign: 'center', flex: 1 }}>Ligar</a>
        </div>
      )}

      {/* Management actions */}
      {canManage && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>Ações</div>

          {(isDismissed || isLost) ? (
            <button onClick={onRestore} style={{ ...btnStyle, background: '#5B9BD5', width: '100%' }}>
              ↩ Restaurar lead
            </button>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {!showDismissForm ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={onMarkLost} style={{ ...btnStyle, background: '#FF4D4D', flex: 1 }}>
                    ✕ Marcar como perdido
                  </button>
                  <button onClick={() => setShowDismissForm(true)} style={{ ...btnStyle, background: theme.soft, color: theme.muted, border: `1px solid ${theme.border}`, flex: 1 }}>
                    🗑 Descartar
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  <select value={dismissMotivo} onChange={(e) => setDismissMotivo(e.target.value)} style={inputStyle}>
                    <option value="">Motivo do descarte</option>
                    <option value="Não respondeu">Não respondeu</option>
                    <option value="Sem interesse">Sem interesse</option>
                    <option value="Número errado">Número errado</option>
                    <option value="Duplicado">Lead duplicado</option>
                    <option value="Fora do perfil">Fora do perfil</option>
                    <option value="Já é cliente">Já é cliente</option>
                    <option value="Outro">Outro</option>
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { onDismiss(dismissMotivo || 'Descartado'); setShowDismissForm(false); }}
                      style={{ ...btnStyle, background: theme.warning, flex: 1 }}
                    >Confirmar descarte</button>
                    <button onClick={() => setShowDismissForm(false)} style={{ ...btnStyle, background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, flex: 1 }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={onClose} style={{ ...btnStyle, background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, width: '100%' }}>Fechar</button>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px' };
const btnStyle: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const tagBtn: React.CSSProperties = { fontSize: 11, background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.muted, padding: '2px 8px', cursor: 'pointer' };
const quickActionBtn: React.CSSProperties = { background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.danger, cursor: 'pointer', fontSize: 11, padding: '1px 5px', lineHeight: '16px' };
const menuItemStyle: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: theme.text, padding: '6px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 4 };
