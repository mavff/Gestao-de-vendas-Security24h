'use client';

import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockLeads } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Lead, LeadStage } from '../../types';

const stages: LeadStage[] = ['Novo', 'Contato', 'Proposta', 'Negociação', 'Fechado'];
const origins: Lead['origin'][] = ['Site', 'Indicação', 'Campanha', 'WhatsApp'];

export function KanbanPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [responsible, setResponsible] = useState('todos');
  const [origin, setOrigin] = useState('todos');
  const [showInlineForm, setShowInlineForm] = useState(false);
  const canCreateProposta = role === 'ADMIN' || role === 'GESTOR' || role === 'VENDEDOR';
  const canDrag = role !== 'INFRA' && role !== 'MONITOR';

  useEffect(() => {
    setLeads(loadMock('mock_leads', mockLeads));
  }, []);

  useEffect(() => {
    if (leads.length) saveMock('mock_leads', leads);
  }, [leads]);

  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
        const bySearch = `${lead.name} ${lead.company}`.toLowerCase().includes(search.toLowerCase());
        const byResponsible = responsible === 'todos' || lead.responsible === responsible;
        const byOrigin = origin === 'todos' || lead.origin === origin;
        return bySearch && byResponsible && byOrigin;
      }),
    [leads, search, responsible, origin],
  );

  function onDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const nextStage = event.over?.id as LeadStage | undefined;
    if (!nextStage || !stages.includes(nextStage)) return;
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, stage: nextStage } : lead)));
  }

  function updateLead(updated: Lead) {
    setLeads((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedLead(updated);
  }

  function createLead(newLead: Lead) {
    setLeads((current) => [...current, newLead]);
    setShowInlineForm(false);
    showToast('Lead criado com sucesso.', 'success');
  }

  return (
    <AppShell title="Pipeline">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Buscar cliente/empresa" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
        <select value={responsible} onChange={(e) => setResponsible(e.target.value)} style={inputStyle}><option value="todos">Responsável</option>{Array.from(new Set(leads.map((l) => l.responsible))).map((r) => <option key={r} value={r}>{r}</option>)}</select>
        <select value={origin} onChange={(e) => setOrigin(e.target.value)} style={inputStyle}><option value="todos">Origem</option>{Array.from(new Set(leads.map((l) => l.origin))).map((o) => <option key={o} value={o}>{o}</option>)}</select>
      </div>
      <DndContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {stages.map((stage) => {
            const stageLeads = filtered.filter((lead) => lead.stage === stage);
            const total = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
            return (
              <DropColumn key={stage} stage={stage}>
                <h4 style={{ margin: 0, color: theme.gold }}>{stage}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ background: theme.soft, borderRadius: 6, padding: '2px 8px', fontSize: 12, color: theme.muted }}>{stageLeads.length} leads</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>R$ {total.toLocaleString('pt-BR')}</span>
                </div>
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {stageLeads.map((lead) => (
                    <DraggableLead key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} disabled={!canDrag} />
                  ))}
                </div>
                {stage === 'Novo' && !showInlineForm && (
                  <button
                    onClick={() => setShowInlineForm(true)}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '8px 0',
                      background: 'transparent',
                      border: `2px dashed ${theme.gold}`,
                      borderRadius: 8,
                      color: theme.gold,
                      fontSize: 18,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                )}
                {stage === 'Novo' && showInlineForm && (
                  <InlineLeadForm onCreate={createLead} onCancel={() => setShowInlineForm(false)} />
                )}
              </DropColumn>
            );
          })}
        </div>
      </DndContext>
      {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onSave={updateLead} onGerarProposta={canCreateProposta ? (id) => router.push(`/venda/${id}`) : undefined} />}
    </AppShell>
  );
}


function DropColumn({ stage, children }: { stage: LeadStage; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? '#1a1a10' : theme.panel,
        border: `1px solid ${isOver ? theme.gold : theme.border}`,
        borderRadius: 12,
        padding: 10,
        boxShadow: isOver ? 'inset 0 0 12px rgba(200,169,81,0.15)' : 'none',
        transition: 'all 200ms ease',
      }}
    >
      {children}
    </div>
  );
}

function DraggableLead({ lead, onClick, disabled }: { lead: Lead; onClick: () => void; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, disabled });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{
        background: theme.soft,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: 10,
        cursor: disabled ? 'pointer' : 'grab',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
        transition: 'box-shadow 150ms ease, opacity 150ms ease',
      }}
    >
      <strong>{lead.name}</strong>
      <div style={{ fontSize: 13, color: theme.muted }}>{lead.company}</div>
      <div style={{ fontSize: 13 }}>R$ {lead.value.toLocaleString('pt-BR')}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <span style={{ fontSize: 12, color: theme.gold }}>{lead.responsible} · {lead.origin}</span>
        {lead.vendaStep && (
          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: theme.gold + '22', color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            {lead.vendaStep === 'solucao' ? 'Sol.' : lead.vendaStep === 'vistoria' ? 'Vist.' : 'OS'}
          </span>
        )}
      </div>
    </div>
  );
}

function InlineLeadForm({ onCreate, onCancel }: { onCreate: (lead: Lead) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState(0);
  const [leadOrigin, setLeadOrigin] = useState<Lead['origin']>('Site');

  function handleSubmit() {
    if (!name.trim()) return;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newLead: Lead = {
      id: 'L' + Date.now(),
      name: name.trim(),
      company,
      value,
      stage: 'Novo',
      responsible: 'Paula',
      origin: leadOrigin,
      week: 'Sem 1',
      status: 'ativo',
      notes: [],
      timeline: [{ id: 't' + Date.now(), date: dateStr, text: 'Lead cadastrado' }],
      attachments: [],
    };
    onCreate(newLead);
  }

  return (
    <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
      <input placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      <input placeholder="Empresa" value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
      <input placeholder="Valor" type="number" value={value || ''} onChange={(e) => setValue(Number(e.target.value))} style={inputStyle} />
      <select value={leadOrigin} onChange={(e) => setLeadOrigin(e.target.value as Lead['origin'])} style={inputStyle}>
        {origins.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleSubmit} style={btnStyle}>Criar</button>
        <button onClick={onCancel} style={{ ...btnStyle, background: theme.soft, color: theme.text }}>Cancelar</button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

function LeadDetail({ lead, onClose, onSave, onGerarProposta }: { lead: Lead; onClose: () => void; onSave: (lead: Lead) => void; onGerarProposta?: (leadId: string) => void }) {
  const [draft, setDraft] = useState(lead);

  useEffect(() => setDraft(lead), [lead]);

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, width: 420, maxWidth: '90vw', height: '100vh', background: theme.panel, borderLeft: `1px solid ${theme.border}`, padding: 16, overflowY: 'auto', zIndex: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{lead.name}</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: 18 }}>x</button>
      </div>
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 12 }}>{lead.company} &middot; {lead.origin} &middot; {lead.week}</div>

      <label style={labelStyle}>Responsável</label>
      <input style={inputStyle} value={draft.responsible} onChange={(e) => setDraft({ ...draft, responsible: e.target.value })} />
      <label style={labelStyle}>Valor (R$)</label>
      <input style={inputStyle} type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} />
      <label style={labelStyle}>Etapa</label>
      <select style={inputStyle} value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as LeadStage })}>{stages.map((s) => <option key={s}>{s}</option>)}</select>

      <h4 style={{ color: theme.gold, margin: '14px 0 8px', fontSize: 14 }}>Timeline</h4>
      <div style={{ position: 'relative', paddingLeft: 20 }}>
        {draft.timeline.map((item, i) => (
          <div key={item.id} style={{ position: 'relative', paddingBottom: i < draft.timeline.length - 1 ? 16 : 0 }}>
            <div style={{
              position: 'absolute',
              left: -16,
              top: 4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: theme.gold,
            }} />
            {i < draft.timeline.length - 1 && (
              <div style={{
                position: 'absolute',
                left: -12,
                top: 16,
                bottom: 0,
                borderLeft: `2px solid ${theme.border}`,
              }} />
            )}
            <div style={{ fontSize: 12, color: theme.muted }}>{formatDate(item.date)}</div>
            <div style={{ fontSize: 13 }}>{item.text}</div>
          </div>
        ))}
      </div>

      <h4 style={{ color: theme.gold, margin: '14px 0 8px', fontSize: 14 }}>Notas</h4>
      {draft.notes.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.muted }}>Nenhuma nota.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{draft.notes.map((note) => <li key={note} style={{ marginBottom: 4 }}>{note}</li>)}</ul>
      )}

      <h4 style={{ color: theme.gold, margin: '14px 0 8px', fontSize: 14 }}>Anexos</h4>
      <label style={{ display: 'inline-block', background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: theme.muted }}>
        + Arquivo
        <input type="file" style={{ display: 'none' }} onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          setDraft((current) => ({ ...current, attachments: [...current.attachments, { id: crypto.randomUUID(), name: file.name, url }] }));
        }} />
      </label>
      {draft.attachments.length > 0 && (
        <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
          {draft.attachments.map((a) => (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: theme.gold, textDecoration: 'underline' }}>{a.name}</a>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
        <button onClick={() => onSave(draft)} style={btnStyle}>Salvar</button>
        {onGerarProposta && (
          <button onClick={() => onGerarProposta(lead.id)} style={{ ...btnStyle, background: theme.gold }}>Abrir Venda</button>
        )}
        <button onClick={onClose} style={{ ...btnStyle, background: theme.soft, color: theme.text }}>Fechar</button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 8 };
const btnStyle: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
