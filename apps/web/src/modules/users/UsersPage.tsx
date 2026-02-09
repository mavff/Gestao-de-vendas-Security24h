'use client';
import { useEffect, useState } from 'react';
import { theme } from '../../components/common/theme';
import { AppShell } from '../../components/layout/AppShell';
import { mockUsers } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { User } from '../../types';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<User>({ id: '', name: '', role: 'VENDEDOR', status: 'ativo' });

  useEffect(() => setUsers(loadMock('mock_users', mockUsers)), []);
  useEffect(() => saveMock('mock_users', users), [users]);

  function save() {
    setUsers((cur) => (draft.id ? cur.map((u) => (u.id === draft.id ? draft : u)) : [...cur, { ...draft, id: crypto.randomUUID() }]));
    setModalOpen(false);
  }

  return (
    <AppShell title="Usuários">
      <button onClick={() => { setDraft({ id: '', name: '', role: 'VENDEDOR', status: 'ativo' }); setModalOpen(true); }}>Novo usuário</button>
      <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}><thead><tr><th>Nome</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>
        {users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.role}</td><td>{user.status}</td><td><button onClick={() => { setDraft(user); setModalOpen(true); }}>Editar</button><button onClick={() => setUsers((cur) => cur.filter((u) => u.id !== user.id))}>Excluir</button></td></tr>)}
      </tbody></table>
      {modalOpen && <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'grid', placeItems: 'center' }}><div style={{ background: theme.panel, padding: 16, borderRadius: 12, width: 360 }}>
        <h3>Usuário</h3>
        <input style={inputStyle} placeholder="Nome" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <select style={inputStyle} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as User['role'] })}><option>ADMIN</option><option>SDR</option><option>VENDEDOR</option><option>TECNICO</option><option>INFRA</option><option>MONITOR</option></select>
        <select style={inputStyle} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as User['status'] })}><option>ativo</option><option>inativo</option></select>
        <button onClick={save}>Salvar</button> <button onClick={() => setModalOpen(false)}>Cancelar</button>
      </div></div>}
    </AppShell>
  );
}
const inputStyle: React.CSSProperties = { width: '100%', marginBottom: 8, background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 8 };
