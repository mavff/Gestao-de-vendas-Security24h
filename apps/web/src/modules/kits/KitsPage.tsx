'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { mockEquipments, mockKits } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Equipment, Kit, KitCategoria, Marca } from '../../types';

const marcas: Marca[] = ['Intelbras', 'Hikvision', 'Hilook', 'Ezviz', 'DSC', 'JFL', 'PPA', 'Viaweb', 'Genérico'];

const KIT_CATEGORIA_LABELS: Record<KitCategoria, string> = {
  alarme_residencial: 'Alarme Residencial',
  alarme_comercial: 'Alarme Comercial',
  alarme_cftv: 'Alarme + CFTV',
  cftv_analogico: 'CFTV Analógico',
  cftv_ip: 'CFTV IP',
  cftv_inteligente: 'CFTV Inteligente',
};

const marcaColors: Record<Marca, string> = {
  Intelbras: '#43C17B', Hikvision: '#E55B5B', Hilook: '#FF7043', Ezviz: '#26C6DA',
  DSC: '#5B9BD5', JFL: '#AB47BC', PPA: '#FFA726', Viaweb: '#E3B341', 'Genérico': '#B5B5B5',
};

export function KitsPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canWrite = role === 'ADMIN';

  const [kits, setKits] = useState<Kit[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterMarca, setFilterMarca] = useState<Marca | 'todas'>('todas');

  // Detail view state
  const [viewKit, setViewKit] = useState<Kit | null>(null);
  const [localQtds, setLocalQtds] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const ds = createDataSource();
      const [kitsRes, eqRes] = await Promise.allSettled([
        ds.kits.list({ pageSize: 500 }),
        ds.equipment.list({ pageSize: 500 }),
      ]);
      if (cancelled) return;
      setKits(kitsRes.status === 'fulfilled' ? kitsRes.value.data : loadMock('mock_kits', mockKits));
      setEquipments(eqRes.status === 'fulfilled' ? eqRes.value.data : loadMock('mock_equipments', mockEquipments));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (kits.length) saveMock('mock_kits', kits); }, [kits]);

  function eqName(id: string) {
    return equipments.find((e) => e.id === id)?.name ?? id;
  }

  function itemName(item: Kit['items'][0]) {
    return item.itemName || eqName(item.equipmentId);
  }

  function itemUnitPrice(item: Kit['items'][0]) {
    if (item.unitPrice != null) return item.unitPrice;
    return equipments.find((e) => e.id === item.equipmentId)?.price ?? 0;
  }

  function kitTotal(kit: Kit) {
    return kit.items.reduce((s, i) => s + itemUnitPrice(i) * i.quantity, 0);
  }

  function openDetail(kit: Kit) {
    setViewKit(kit);
    const qtds: Record<string, number> = {};
    kit.items.forEach((i) => { qtds[i.equipmentId] = i.quantity; });
    setLocalQtds(qtds);
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

  const filtered = useMemo(() => {
    if (filterMarca === 'todas') return kits;
    return kits.filter((k) => k.marca === filterMarca);
  }, [kits, filterMarca]);

  return (
    <AppShell title={canWrite ? 'Kits' : 'Catálogo de Kits'}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setFilterMarca('todas')} style={{ ...filterBtnStyle, ...(filterMarca === 'todas' ? filterBtnActive : {}) }}>Todas</button>
        {marcas.map((m) => (
          <button key={m} onClick={() => setFilterMarca(m)} style={{ ...filterBtnStyle, ...(filterMarca === m ? { background: marcaColors[m] + '22', borderColor: marcaColors[m], color: marcaColors[m], fontWeight: 700 } : {}) }}>
            {m}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {canWrite && (
          <button onClick={() => { setEditId(null); setModalOpen(true); }} style={btnGold}>+ Novo Kit</button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: theme.muted, padding: 40 }}>Carregando kits...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          Nenhum kit {filterMarca !== 'todas' ? `para ${filterMarca}` : 'cadastrado'}.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {filtered.map((kit) => {
          const mColor = kit.marca ? marcaColors[kit.marca] : theme.gold;
          const total = kitTotal(kit);
          return (
            <div
              key={kit.id}
              onClick={() => openDetail(kit)}
              style={{
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.gold + '66')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 15 }}>{kit.name}</strong>
                  {kit.marca && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: mColor + '22', color: mColor, border: `1px solid ${mColor}44` }}>{kit.marca}</span>
                  )}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold, whiteSpace: 'nowrap', marginLeft: 8 }}>
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {kit.categoria && (
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>{KIT_CATEGORIA_LABELS[kit.categoria]}</div>
              )}
              {kit.descricao && (
                <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>{kit.descricao}</div>
              )}
              <div style={{ display: 'grid', gap: 3, marginBottom: 8 }}>
                {kit.items.slice(0, 5).map((item) => (
                  <div key={item.equipmentId} style={{ fontSize: 12, color: theme.muted, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}× {itemName(item)}</span>
                    <span>R$ {(itemUnitPrice(item) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                {kit.items.length > 5 && (
                  <div style={{ fontSize: 11, color: theme.muted }}>+ {kit.items.length - 5} itens...</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                <span style={{ flex: 1, fontSize: 11, color: theme.muted }}>Clique para simular quantidades</span>
                {canWrite && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditId(kit.id); setModalOpen(true); }}
                      style={btnSmall}
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(kit.id); }}
                      style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail / Simulation Modal */}
      {viewKit && (
        <KitDetailModal
          kit={viewKit}
          localQtds={localQtds}
          setLocalQtds={setLocalQtds}
          itemName={itemName}
          itemUnitPrice={itemUnitPrice}
          onClose={() => setViewKit(null)}
        />
      )}

      {/* Edit form modal (ADMIN only) */}
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

/* ---- Kit Detail / Simulation Modal ---- */

function KitDetailModal({
  kit,
  localQtds,
  setLocalQtds,
  itemName,
  itemUnitPrice,
  onClose,
}: {
  kit: Kit;
  localQtds: Record<string, number>;
  setLocalQtds: (q: Record<string, number>) => void;
  itemName: (item: Kit['items'][0]) => string;
  itemUnitPrice: (item: Kit['items'][0]) => number;
  onClose: () => void;
}) {
  function changeQty(equipmentId: string, delta: number) {
    const current = localQtds[equipmentId] ?? 1;
    const next = Math.max(0, current + delta);
    setLocalQtds({ ...localQtds, [equipmentId]: next });
  }

  function resetQtds() {
    const qtds: Record<string, number> = {};
    kit.items.forEach((i) => { qtds[i.equipmentId] = i.quantity; });
    setLocalQtds(qtds);
  }

  const total = kit.items.reduce((s, item) => {
    const qty = localQtds[item.equipmentId] ?? item.quantity;
    return s + itemUnitPrice(item) * qty;
  }, 0);

  const hasChanges = kit.items.some((i) => (localQtds[i.equipmentId] ?? i.quantity) !== i.quantity);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 50 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: 560, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{kit.name}</h3>
            {kit.descricao && <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>{kit.descricao}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* Hint */}
        <div style={{ background: 'rgba(200,169,81,0.08)', border: `1px solid ${theme.gold}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: theme.muted }}>
          Ajuste as quantidades abaixo para simular o preço para o cliente. As alterações são temporárias.
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
          <thead>
            <tr>
              <th style={thStyle}>Produto</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Unit.</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Qtd.</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {kit.items.map((item) => {
              const qty = localQtds[item.equipmentId] ?? item.quantity;
              const unit = itemUnitPrice(item);
              const sub = unit * qty;
              const name = itemName(item);
              const isZero = qty === 0;
              return (
                <tr key={item.equipmentId} style={{ opacity: isZero ? 0.4 : 1 }}>
                  <td style={tdStyle}>{name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: theme.muted, whiteSpace: 'nowrap' }}>
                    R$ {unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        onClick={() => changeQty(item.equipmentId, -1)}
                        style={qtyBtn}
                        disabled={qty === 0}
                      >−</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{qty}</span>
                      <button
                        onClick={() => changeQty(item.equipmentId, +1)}
                        style={qtyBtn}
                      >+</button>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    R$ {sub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `2px solid ${theme.gold}44`, marginTop: 8 }}>
          <div>
            <span style={{ fontSize: 14, color: theme.muted }}>Total estimado</span>
            {hasChanges && (
              <span style={{ marginLeft: 10, fontSize: 11, color: theme.gold, border: `1px solid ${theme.gold}44`, borderRadius: 6, padding: '2px 7px' }}>modificado</span>
            )}
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: theme.gold }}>
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {hasChanges && (
            <button onClick={resetQtds} style={btnSoft}>Resetar qtds</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnGold}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Kit form modal (ADMIN) ---- */

function KitFormModal({ existing, equipments, onSave, onCancel }: {
  existing: Kit | null;
  equipments: Equipment[];
  onSave: (kit: Kit) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [marca, setMarca] = useState<Marca>(existing?.marca ?? 'Intelbras');
  const [categoria, setCategoria] = useState<KitCategoria>(existing?.categoria ?? 'alarme_residencial');
  const [descricao, setDescricao] = useState(existing?.descricao ?? '');
  const [items, setItems] = useState(existing?.items ?? []);
  const [selEquip, setSelEquip] = useState('');
  const [selQtd, setSelQtd] = useState(1);

  const filteredEquipments = useMemo(() =>
    equipments.filter((e) => e.marca === marca || e.marca === 'Genérico'),
  [equipments, marca]);

  const total = useMemo(() =>
    items.reduce((s, i) => {
      const eq = equipments.find((e) => e.id === i.equipmentId);
      return s + (eq?.price ?? i.unitPrice ?? 0) * i.quantity;
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
      marca,
      categoria,
      descricao: descricao.trim(),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'grid', placeItems: 'center', zIndex: 50 }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, width: 520, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 12px', color: theme.gold }}>{existing ? 'Editar Kit' : 'Novo Kit'}</h3>

        <label style={labelStyle}>Nome do Kit *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Ex: Kit Loja Pequena" />

        <label style={labelStyle}>Marca *</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {marcas.map((m) => (
            <button key={m} onClick={() => setMarca(m)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: marca === m ? marcaColors[m] + '22' : theme.soft,
              border: `1px solid ${marca === m ? marcaColors[m] : theme.border}`,
              color: marca === m ? marcaColors[m] : theme.text, fontWeight: marca === m ? 700 : 400,
            }}>
              {m}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Categoria *</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value as KitCategoria)} style={inputStyle}>
          {(Object.keys(KIT_CATEGORIA_LABELS) as KitCategoria[]).map((k) => (
            <option key={k} value={k}>{KIT_CATEGORIA_LABELS[k]}</option>
          ))}
        </select>

        <label style={labelStyle}>Descrição</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Breve descrição do kit..." />

        <h4 style={{ color: theme.gold, margin: '12px 0 8px', fontSize: 14 }}>Itens</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={selEquip} onChange={(e) => setSelEquip(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
            <option value="">Selecionar equipamento...</option>
            {filteredEquipments.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>)}
          </select>
          <input type="number" min={1} value={selQtd} onChange={(e) => setSelQtd(Number(e.target.value))} style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
          <button type="button" onClick={addItem} disabled={!selEquip} style={{ ...btnGold, opacity: selEquip ? 1 : 0.4 }}>+</button>
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
                const price = eq?.price ?? item.unitPrice ?? 0;
                return (
                  <tr key={item.equipmentId}>
                    <td style={tdStyle}>{eq?.name ?? item.itemName ?? item.equipmentId}</td>
                    <td style={tdStyle}>{item.quantity}</td>
                    <td style={tdStyle}>R$ {(price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={tdStyle}>
                      <button onClick={() => removeItem(item.equipmentId)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>x</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${theme.border}` }}>
          <span style={{ fontSize: 13, color: theme.muted }}>Total do Kit</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: theme.gold }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
const filterBtnStyle: React.CSSProperties = { padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: theme.soft, border: `1px solid ${theme.border}`, color: theme.text };
const filterBtnActive: React.CSSProperties = { background: 'rgba(200,169,81,0.12)', borderColor: theme.gold, color: theme.gold, fontWeight: 700 };
const qtyBtn: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 };
