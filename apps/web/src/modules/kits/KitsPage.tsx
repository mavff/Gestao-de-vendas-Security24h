'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockEquipments, mockKits } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Equipment, Kit } from '../../types';

export function KitsPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canWrite = role === 'ADMIN' || role === 'INFRA';

  const [kits, setKits] = useState<Kit[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    setKits(loadMock('mock_kits', mockKits));
    setEquipments(loadMock('mock_equipments', mockEquipments));
  }, []);
  useEffect(() => { if (kits.length) saveMock('mock_kits', kits); }, [kits]);

  function eqName(id: string) {
    return equipments.find((e) => e.id === id)?.name ?? id;
  }

  function eqPrice(id: string) {
    return equipments.find((e) => e.id === id)?.price ?? 0;
  }

  function kitTotal(kit: Kit) {
    return kit.items.reduce((s, i) => s + eqPrice(i.equipmentId) * i.quantity, 0);
  }

  function handleSave(kit: Kit) {
    if (editId) {
      setKits((cur) => cur.map((k) => k.id === editId ? kit : k));
      showToast('Kit atualizado.', 'success');
    } else {
      setKits((cur) => [...cur, kit]);
      showToast('Kit criado.', 'success');
    }
    setModalOpen(false);
    setEditId(null);
  }

  function handleDelete(id: string) {
    setKits((cur) => cur.filter((k) => k.id !== id));
    showToast('Kit excluído.', 'warning');
  }

  return (
    <AppShell title="Kits">
      {canWrite && (
        <button onClick={() => { setEditId(null); setModalOpen(true); }} style={btnGold}>+ Novo Kit</button>
      )}

      {kits.length === 0 && (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted, marginTop: 16 }}>
          Nenhum kit cadastrado.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {kits.map((kit) => (
          <div key={kit.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 15 }}>{kit.name}</strong>
              <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>R$ {kitTotal(kit).toLocaleString('pt-BR')}</span>
            </div>
            <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
              {kit.items.map((item) => (
                <div key={item.equipmentId} style={{ fontSize: 13, color: theme.text }}>
                  {item.quantity}x {eqName(item.equipmentId)}
                  <span style={{ color: theme.muted }}> — R$ {(eqPrice(item.equipmentId) * item.quantity).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
            {canWrite && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => { setEditId(kit.id); setModalOpen(true); }} style={btnSmall}>Editar</button>
                <button onClick={() => handleDelete(kit.id)} style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}>Excluir</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <KitFormModal
          existing={editId ? kits.find((k) => k.id === editId) ?? null : null}
          equipments={equipments}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditId(null); }}
        />
      )}
    </AppShell>
  );
}

/* ---- Kit form modal ---- */

function KitFormModal({ existing, equipments, onSave, onCancel }: {
  existing: Kit | null;
  equipments: Equipment[];
  onSave: (kit: Kit) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [items, setItems] = useState(existing?.items ?? []);
  const [selEquip, setSelEquip] = useState(equipments[0]?.id ?? '');
  const [selQtd, setSelQtd] = useState(1);

  const total = useMemo(() =>
    items.reduce((s, i) => {
      const eq = equipments.find((e) => e.id === i.equipmentId);
      return s + (eq?.price ?? 0) * i.quantity;
    }, 0),
  [items, equipments]);

  function addItem() {
    if (!selEquip || selQtd < 1) return;
    const exists = items.find((i) => i.equipmentId === selEquip);
    if (exists) {
      setItems((cur) => cur.map((i) => i.equipmentId === selEquip ? { ...i, quantity: i.quantity + selQtd } : i));
    } else {
      setItems((cur) => [...cur, { equipmentId: selEquip, quantity: selQtd }]);
    }
    setSelQtd(1);
  }

  function removeItem(eqId: string) {
    setItems((cur) => cur.filter((i) => i.equipmentId !== eqId));
  }

  function handleSave() {
    if (!name.trim() || items.length === 0) return;
    onSave({
      id: existing?.id ?? 'K' + Date.now(),
      name: name.trim(),
      items,
      linkedLeadId: existing?.linkedLeadId,
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'grid', placeItems: 'center', zIndex: 50 }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, width: 480, maxWidth: '90vw' }}>
        <h3 style={{ margin: '0 0 12px', color: theme.gold }}>{existing ? 'Editar Kit' : 'Novo Kit'}</h3>

        <label style={labelStyle}>Nome do Kit *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Ex: Kit Loja Pequena" />

        <h4 style={{ color: theme.gold, margin: '12px 0 8px', fontSize: 14 }}>Itens</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={selEquip} onChange={(e) => setSelEquip(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
            {equipments.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>)}
          </select>
          <input type="number" min={1} value={selQtd} onChange={(e) => setSelQtd(Number(e.target.value))} style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
          <button type="button" onClick={addItem} style={btnGold}>+</button>
        </div>

        {items.length === 0 ? (
          <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', padding: 12 }}>Adicione pelo menos 1 item.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={thStyle}>Equipamento</th>
                <th style={thStyle}>Qtd</th>
                <th style={thStyle}>Subtotal</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const eq = equipments.find((e) => e.id === item.equipmentId);
                return (
                  <tr key={item.equipmentId}>
                    <td style={tdStyle}>{eq?.name ?? item.equipmentId}</td>
                    <td style={tdStyle}>{item.quantity}</td>
                    <td style={tdStyle}>R$ {((eq?.price ?? 0) * item.quantity).toLocaleString('pt-BR')}</td>
                    <td style={tdStyle}><button onClick={() => removeItem(item.equipmentId)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>x</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${theme.border}` }}>
          <span style={{ fontSize: 13, color: theme.muted }}>Total do Kit</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: theme.gold }}>R$ {total.toLocaleString('pt-BR')}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={handleSave} disabled={!name.trim() || items.length === 0} style={{ ...btnGold, opacity: name.trim() && items.length > 0 ? 1 : 0.4 }}>Salvar</button>
          <button onClick={onCancel} style={btnSoft}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '3px 10px', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
