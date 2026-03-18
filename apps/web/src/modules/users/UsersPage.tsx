'use client';

import { useEffect, useState, useCallback } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockUsers } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { User, UserRole } from '../../types';

const isApiMode = process.env.NEXT_PUBLIC_DATA_SOURCE === 'api';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

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

type AppUserDraft = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
};

const emptyDraft: AppUserDraft = { id: '', username: '', password: '', name: '', role: 'VENDEDOR', active: true };

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('sec24h_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiUser(u: any): User & { username: string } {
  return {
    id: String(u.id ?? ''),
    name: u.name || u.username || '',
    role: (u.role || 'VENDEDOR') as UserRole,
    status: u.active === false ? 'inativo' : 'ativo',
    username: u.username || '',
  };
}

export function UsersPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [users, setUsers] = useState<(User & { username?: string })[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<AppUserDraft>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!isApiMode) {
      setUsers(loadMock('mock_users', mockUsers));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/app-users`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar usuários');
      const data = await res.json();
      setUsers(data.map(mapApiUser));
    } catch {
      setUsers(loadMock('mock_users', mockUsers));
      showToast('Falha ao buscar usuários da API. Exibindo dados locais.', 'warning');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { if (!isApiMode && users.length) saveMock('mock_users', users); }, [users]);

  const filtered = users.filter((u) => {
    const byRole = filterRole === 'Todos' || u.role === filterRole;
    const q = search.toLowerCase();
    const bySearch = u.name.toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
    return byRole && bySearch;
  });

  function openNew() {
    setDraft(emptyDraft);
    setModalOpen(true);
  }

  function openEdit(u: User & { username?: string }) {
    setDraft({
      id: u.id,
      username: u.username || '',
      password: '', // Não preenche senha ao editar
      name: u.name,
      role: u.role,
      active: u.status === 'ativo',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!draft.name.trim() || !draft.username.trim()) return;

    if (isApiMode) {
      setSaving(true);
      try {
        if (draft.id) {
          // Editar
          const body: Record<string, unknown> = { username: draft.username, name: draft.name, role: draft.role, active: draft.active };
          if (draft.password) body.password = draft.password;
          const res = await fetch(`${API_BASE}/app-users/${draft.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
          if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Erro ao atualizar'); }
          showToast('Usuário atualizado.', 'success');
        } else {
          // Criar
          if (!draft.password) { showToast('Senha obrigatória para novo usuário.', 'warning'); setSaving(false); return; }
          const res = await fetch(`${API_BASE}/app-users`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ username: draft.username, password: draft.password, name: draft.name, role: draft.role }) });
          if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Erro ao criar'); }
          showToast('Usuário criado.', 'success');
        }
        setModalOpen(false);
        fetchUsers();
      } catch (err) {
        showToast((err as Error).message, 'error');
      } finally {
        setSaving(false);
      }
    } else {
      // Mock mode
      if (draft.id) {
        setUsers((cur) => cur.map((u) => u.id === draft.id ? { ...u, name: draft.name, role: draft.role, status: draft.active ? 'ativo' as const : 'inativo' as const } : u));
        showToast('Usuário atualizado.', 'success');
      } else {
        setUsers((cur) => [...cur, { id: 'U' + Date.now(), name: draft.name, role: draft.role, status: 'ativo' as const }]);
        showToast('Usuário criado.', 'success');
      }
      setModalOpen(false);
    }
  }

  async function handleDelete(id: string) {
    if (isApiMode) {
      try {
        const res = await fetch(`${API_BASE}/app-users/${id}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) throw new Error('Erro ao excluir');
        showToast('Usuário excluído.', 'warning');
        fetchUsers();
      } catch (err) {
        showToast((err as Error).message, 'error');
      }
    } else {
      setUsers((cur) => cur.filter((u) => u.id !== id));
      showToast('Usuário excluído.', 'warning');
    }
  }

  async function toggleStatus(u: User) {
    const newActive = u.status === 'ativo' ? false : true;
    if (isApiMode) {
      try {
        const res = await fetch(`${API_BASE}/app-users/${u.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ active: newActive }) });
        if (!res.ok) throw new Error('Erro ao atualizar status');
        showToast(`Usuário ${newActive ? 'ativado' : 'desativado'}.`, 'success');
        fetchUsers();
      } catch (err) {
        showToast((err as Error).message, 'error');
      }
    } else {
      const next: User = { ...u, status: newActive ? 'ativo' : 'inativo' };
      setUsers((cur) => cur.map((x) => x.id === u.id ? next : x));
      showToast(`Usuário ${newActive ? 'ativado' : 'desativado'}.`, 'success');
    }
  }

  return (
    <AppShell title="Usuários">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar por nome ou usuário"
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
      {loading ? (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          Carregando usuários...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nome', 'Usuário', 'Role', 'Status', ...(isAdmin ? ['Ações'] : [])].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}><strong>{u.name}</strong></td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: theme.muted }}>{u.username || '—'}</span></td>
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
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, width: 460, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', color: theme.gold }}>{draft.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>

            <label style={labelStyle}>Nome completo *</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} placeholder="Ex: João Silva" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Usuário (login) *</label>
                <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} style={inputStyle} placeholder="Ex: joao.silva" />
              </div>
              <div>
                <label style={labelStyle}>{draft.id ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}</label>
                <input type="password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} style={inputStyle} placeholder="••••••" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Role</label>
                <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })} style={inputStyle}>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={draft.active ? 'ativo' : 'inativo'} onChange={(e) => setDraft({ ...draft, active: e.target.value === 'ativo' })} style={inputStyle}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {/* Preview badge */}
            <div style={{ padding: '10px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: theme.muted }}>Preview:</span>
              <RoleBadge role={draft.role} />
              <StatusBadge status={draft.active ? 'ativo' : 'inativo'} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={handleSave} disabled={saving || !draft.name.trim() || !draft.username.trim()} style={{ ...btnGold, opacity: (draft.name.trim() && draft.username.trim() && !saving) ? 1 : 0.4 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
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
