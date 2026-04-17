'use client';

import { useState } from 'react';
import { theme } from '../common/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';

type Props = {
  open: boolean;
  forced?: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ open, forced, onClose }: Props) {
  const { changePassword, logout } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function reset() {
    setCurrent(''); setNew(''); setConfirm('');
  }

  async function handleSave() {
    if (newPassword.length < 4) {
      showToast('A nova senha deve ter ao menos 4 caracteres.', 'warning');
      return;
    }
    if (newPassword !== confirm) {
      showToast('Confirmação não confere.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Senha alterada com sucesso.', 'success');
      reset();
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000c', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 22, width: 420, maxWidth: '92vw' }}>
        <h3 style={{ margin: '0 0 4px', color: theme.gold }}>
          {forced ? 'Defina uma nova senha' : 'Alterar senha'}
        </h3>
        {forced && (
          <p style={{ margin: '0 0 12px', fontSize: 12, color: theme.muted }}>
            Um administrador resetou sua senha. Defina uma nova para continuar.
          </p>
        )}

        <label style={labelStyle}>Senha atual *</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} autoFocus />

        <label style={labelStyle}>Nova senha *</label>
        <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Confirmar nova senha *</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />

        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          {forced ? (
            <button onClick={() => { reset(); logout(); }} style={btnSoft}>Sair</button>
          ) : (
            <button onClick={() => { reset(); onClose(); }} style={btnSoft}>Cancelar</button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !currentPassword || !newPassword || !confirm}
            style={{ ...btnGold, opacity: (!saving && currentPassword && newPassword && confirm) ? 1 : 0.5 }}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '9px 11px', marginBottom: 8, width: '100%', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 6 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '9px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '9px 16px', cursor: 'pointer', fontSize: 13 };
