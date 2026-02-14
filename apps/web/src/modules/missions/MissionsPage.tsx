'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockMissions, mockUsers } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Mission, MissionPriority, User } from '../../types';

const statuses: Mission['status'][] = ['Pendente', 'Em andamento', 'Concluída'];
const priorities: MissionPriority[] = ['Alta', 'Média', 'Baixa'];

const priorityColors: Record<MissionPriority, string> = {
  Alta: theme.danger,
  Média: theme.warning,
  Baixa: theme.success,
};

const statusColors: Record<Mission['status'], string> = {
  Pendente: theme.muted,
  'Em andamento': '#5B9BD5',
  Concluída: theme.success,
};

const emptyDraft: Mission = { id: '', title: '', description: '', assignedTo: '', status: 'Pendente', priority: 'Média', dueDate: '', createdAt: '' };

export function MissionsPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'GESTOR' || role === 'INFRA';

  const [missions, setMissions] = useState<Mission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Mission>(emptyDraft);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setMissions(loadMock('mock_missions', mockMissions));
    setUsers(loadMock('mock_users', mockUsers));
  }, []);
  useEffect(() => { if (missions.length) saveMock('mock_missions', missions); }, [missions]);

  const activeUsers = useMemo(() => users.filter((u) => u.status === 'ativo'), [users]);

  function userName(id: string) {
    return users.find((u) => u.id === id)?.name ?? id;
  }

  function openNew() {
    setDraft({ ...emptyDraft, createdAt: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  }

  function openEdit(m: Mission) {
    setDraft(m);
    setModalOpen(true);
  }

  function handleSave() {
    if (!draft.title.trim()) return;
    if (draft.id) {
      setMissions((cur) => cur.map((m) => m.id === draft.id ? draft : m));
      showToast('Missão atualizada.', 'success');
    } else {
      setMissions((cur) => [...cur, { ...draft, id: 'M' + Date.now() }]);
      showToast('Missão criada.', 'success');
    }
    setModalOpen(false);
    setDetailId(null);
  }

  function handleDelete(id: string) {
    setMissions((cur) => cur.filter((m) => m.id !== id));
    showToast('Missão excluída.', 'warning');
    setDetailId(null);
  }

  function changeStatus(id: string, status: Mission['status']) {
    setMissions((cur) => cur.map((m) => m.id === id ? { ...m, status } : m));
    showToast(`Status alterado para "${status}".`, 'success');
  }

  const detail = detailId ? missions.find((m) => m.id === detailId) ?? null : null;

  return (
    <AppShell title="Missões">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: theme.soft, borderRadius: 8, padding: 2 }}>
          <button onClick={() => setView('board')} style={{ ...viewBtn, ...(view === 'board' ? viewBtnActive : {}) }}>Board</button>
          <button onClick={() => setView('list')} style={{ ...viewBtn, ...(view === 'list' ? viewBtnActive : {}) }}>Lista</button>
        </div>
        <div style={{ flex: 1 }} />
        {canManage && (
          <button onClick={openNew} style={btnGold}>+ Nova Missão</button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {statuses.map((s) => {
          const count = missions.filter((m) => m.status === s).length;
          const color = statusColors[s];
          return (
            <div key={s} style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 13, color: theme.text }}>{s}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? 'minmax(0, 1fr) 340px' : '1fr', gap: 16 }}>
        {/* Main area */}
        <div>
          {view === 'board' ? (
            <BoardView missions={missions} userName={userName} onSelect={setDetailId} selectedId={detailId} onStatusChange={changeStatus} />
          ) : (
            <ListView missions={missions} userName={userName} onSelect={setDetailId} selectedId={detailId} />
          )}
        </div>

        {/* Detail panel */}
        {detail && (
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: theme.gold }}>{detail.title}</h3>
              <button onClick={() => setDetailId(null)} style={{ background: 'transparent', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: 18 }}>x</button>
            </div>

            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <div>
                <span style={{ color: theme.muted }}>Responsável: </span>
                <strong>{userName(detail.assignedTo)}</strong>
              </div>
              <div>
                <span style={{ color: theme.muted }}>Prioridade: </span>
                <PriorityBadge priority={detail.priority} />
              </div>
              <div>
                <span style={{ color: theme.muted }}>Status: </span>
                <StatusBadge status={detail.status} />
              </div>
              <div>
                <span style={{ color: theme.muted }}>Prazo: </span>
                <span style={{ color: isOverdue(detail) ? theme.danger : theme.text, fontWeight: isOverdue(detail) ? 600 : 400 }}>
                  {formatDate(detail.dueDate)}
                  {isOverdue(detail) && ' (atrasada)'}
                </span>
              </div>
              {detail.description && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: theme.muted, display: 'block', marginBottom: 4 }}>Descrição:</span>
                  <div style={{ background: theme.soft, borderRadius: 8, padding: 10, fontSize: 13, lineHeight: 1.5 }}>
                    {detail.description}
                  </div>
                </div>
              )}
              <div>
                <span style={{ color: theme.muted }}>Criada em: </span>
                <span>{formatDate(detail.createdAt)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
              {canManage && <button onClick={() => openEdit(detail)} style={btnSmall}>Editar</button>}
              {detail.status !== 'Concluída' && (
                <button
                  onClick={() => changeStatus(detail.id, detail.status === 'Pendente' ? 'Em andamento' : 'Concluída')}
                  style={{ ...btnSmall, borderColor: theme.success, color: theme.success }}
                >
                  {detail.status === 'Pendente' ? 'Iniciar' : 'Concluir'}
                </button>
              )}
              {canManage && <button onClick={() => handleDelete(detail.id)} style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}>Excluir</button>}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, width: 460, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', color: theme.gold }}>{draft.id ? 'Editar Missão' : 'Nova Missão'}</h3>

            <label style={labelStyle}>Título *</label>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={inputStyle} placeholder="Ex: Follow-up leads quentes" />

            <label style={labelStyle}>Descrição</label>
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Detalhe a tarefa..." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Responsável</label>
                <select value={draft.assignedTo} onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value })} style={inputStyle}>
                  <option value="">Selecionar...</option>
                  {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Prioridade</label>
                <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as MissionPriority })} style={inputStyle}>
                  {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Prazo</label>
                <input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Mission['status'] })} style={inputStyle}>
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={handleSave} disabled={!draft.title.trim()} style={{ ...btnGold, opacity: draft.title.trim() ? 1 : 0.4 }}>Salvar</button>
              <button onClick={() => setModalOpen(false)} style={btnSoft}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ---- Board View ---- */

function BoardView({ missions, userName, onSelect, selectedId, onStatusChange }: {
  missions: Mission[];
  userName: (id: string) => string;
  onSelect: (id: string) => void;
  selectedId: string | null;
  onStatusChange?: (id: string, status: Mission['status']) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
      {statuses.map((status) => {
        const items = missions.filter((m) => m.status === status);
        const color = statusColors[status];
        return (
          <div key={status} style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12, minHeight: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <strong style={{ fontSize: 13 }}>{status}</strong>
              </div>
              <span style={{ fontSize: 12, color: theme.muted, background: theme.panel, borderRadius: 6, padding: '1px 7px' }}>{items.length}</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {items.map((m) => (
                <MissionCard key={m.id} mission={m} userName={userName} onClick={() => onSelect(m.id)} selected={m.id === selectedId} />
              ))}
              {items.length === 0 && (
                <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: 16 }}>Nenhuma missão</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- List View ---- */

function ListView({ missions, userName, onSelect, selectedId }: {
  missions: Mission[];
  userName: (id: string) => string;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (missions.length === 0) {
    return (
      <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
        Nenhuma missão cadastrada.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Título', 'Responsável', 'Prioridade', 'Status', 'Prazo'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => (
            <tr
              key={m.id}
              onClick={() => onSelect(m.id)}
              style={{ cursor: 'pointer', background: m.id === selectedId ? theme.soft : 'transparent' }}
            >
              <td style={tdStyle}><strong>{m.title}</strong></td>
              <td style={tdStyle}>{userName(m.assignedTo)}</td>
              <td style={tdStyle}><PriorityBadge priority={m.priority} /></td>
              <td style={tdStyle}><StatusBadge status={m.status} /></td>
              <td style={tdStyle}>
                <span style={{ color: isOverdue(m) ? theme.danger : theme.text, fontWeight: isOverdue(m) ? 600 : 400, fontSize: 13 }}>
                  {formatDate(m.dueDate)}
                  {isOverdue(m) && ' !'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Mission Card ---- */

function MissionCard({ mission, userName, onClick, selected }: {
  mission: Mission;
  userName: (id: string) => string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: theme.panel,
        border: `1px solid ${selected ? theme.gold : theme.border}`,
        borderRadius: 8,
        padding: 10,
        cursor: 'pointer',
        transition: 'border-color 150ms',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{mission.title}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <PriorityBadge priority={mission.priority} />
        <span style={{ fontSize: 11, color: theme.muted }}>{userName(mission.assignedTo)}</span>
      </div>
      <div style={{ fontSize: 11, color: isOverdue(mission) ? theme.danger : theme.muted, marginTop: 4 }}>
        {formatDate(mission.dueDate)}
        {isOverdue(mission) && ' (atrasada)'}
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function PriorityBadge({ priority }: { priority: MissionPriority }) {
  const color = priorityColors[priority];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: Mission['status'] }) {
  const color = statusColors[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function isOverdue(m: Mission): boolean {
  if (m.status === 'Concluída' || !m.dueDate) return false;
  return new Date(m.dueDate) < new Date(new Date().toISOString().slice(0, 10));
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '3px 10px', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
const viewBtn: React.CSSProperties = { background: 'transparent', border: 'none', borderRadius: 6, color: theme.muted, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const viewBtnActive: React.CSSProperties = { background: theme.panel, color: theme.gold };
