'use client';

import { useEffect, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockUsers } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { User, UserRole } from '../../types';

const roles: UserRole[] = ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR', 'TECNICO', 'INFRA', 'MONITOR'];

const roleColors: Record<UserRole, string> = {
  ADMIN: '#E3B341',
  GESTOR: '#FF9800',
  SDR: '#5B9BD5',
  VENDEDOR: '#43C17B',
  TECNICO: '#C077DB',
  INFRA: '#E8875B',
  MONITOR: '#B5B5B5',
};

const emptyDraft: User = { id: '', name: '', role: 'VENDEDOR', status: 'ativo' };

export function UsersPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<User>(emptyDraft);

  useEffect(() => setUsers(loadMock('mock_users', mockUsers)), []);
  useEffect(() => { if (users.length) saveMock('mock_users', users); }, [users]);

  const filtered = users.filter((u) => {
    const byRole = filterRole === 'Todos' || u.role === filterRole;
    const bySearch = u.name.toLowerCase().includes(search.toLowerCase());
    return byRole && bySearch;
  });

  function openNew() {
    setDraft(emptyDraft);
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setDraft(u);
    setModalOpen(true);
  }

  function handleSave() {
    if (!draft.name.trim()) return;
    if (draft.id) {
      setUsers((cur) => cur.map((u) => u.id === draft.id ? draft : u));
      showToast('Usuário atualizado.', 'success');
    } else {
      setUsers((cur) => [...cur, { ...draft, id: 'U' + Date.now() }]);
      showToast('Usuário criado.', 'success');
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    setUsers((cur) => cur.filter((u) => u.id !== id));
    showToast('Usuário excluído.', 'warning');
  }

  function toggleStatus(u: User) {
    const next: User = { ...u, status: u.status === 'ativo' ? 'inativo' : 'ativo' };
    setUsers((cur) => cur.map((x) => x.id === u.id ? next : x));
    showToast(`Usuário ${next.status === 'ativo' ? 'ativado' : 'desativado'}.`, 'success');
  }

  return (
    <AppShell title="Usuários">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar por nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200, marginBottom: 0 }}
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: 'auto' }}>
          <option>Todos</option>
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
        {isAdmin && (
          <button onClick={openNew} style={btnGold}>+ Novo Usuário</button>
        )}
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 10 }}>
        {filtered.length} usuário(s)
        {filterRole !== 'Todos' && ` com role "${filterRole}"`}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nome', 'Role', 'Status', ...(isAdmin ? [''] : [])].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}><strong>{u.name}</strong></td>
                  <td style={tdStyle}><RoleBadge role={u.role} /></td>
                  <td style={tdStyle}><StatusBadge status={u.status} /></td>
                  {isAdmin && (
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(u)} style={btnSmall}>Editar</button>
                        <button onClick={() => toggleStatus(u)} style={{ ...btnSmall, borderColor: u.status === 'ativo' ? theme.warning : theme.success, color: u.status === 'ativo' ? theme.warning : theme.success }}>
                          {u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => handleDelete(u.id)} style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}>Excluir</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', color: theme.gold }}>{draft.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>

            <label style={labelStyle}>Nome *</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} placeholder="Ex: João Silva" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Role</label>
                <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })} style={inputStyle}>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as User['status'] })} style={inputStyle}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {/* Preview badge */}
            <div style={{ padding: '10px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: theme.muted }}>Preview:</span>
              <RoleBadge role={draft.role} />
              <StatusBadge status={draft.status} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={handleSave} disabled={!draft.name.trim()} style={{ ...btnGold, opacity: draft.name.trim() ? 1 : 0.4 }}>Salvar</button>
              <button onClick={() => setModalOpen(false)} style={btnSoft}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ---- Helpers ---- */

function RoleBadge({ role }: { role: UserRole }) {
  const color = roleColors[role];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: 'ativo' | 'inativo' }) {
  const color = status === 'ativo' ? theme.success : theme.muted;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {status === 'ativo' ? 'Ativo' : 'Inativo'}
    </span>
  );
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '3px 10px', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
