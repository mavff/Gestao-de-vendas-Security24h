'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { PreOrcamentoApiDto, PreOrcamentoProdutoApiDto } from '../../lib/dataSource/types';
import { mockEquipments, mockKits } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Equipment, Kit, KitCategoria, Marca } from '../../types';

/* ---- Constants ---- */

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

type Tab = 'modelos' | 'kits';

/* ============================================================
   Main Page
   ============================================================ */

export function KitsPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canWrite = role === 'ADMIN';

  const [tab, setTab] = useState<Tab>('modelos');

  // --- Modelos (PréOrçamento) state ---
  const [modelos, setModelos] = useState<PreOrcamentoApiDto[]>([]);
  const [modelosLoading, setModelosLoading] = useState(true);
  const [modelosErro, setModelosErro] = useState<string | null>(null);
  const [modeloSearch, setModeloSearch] = useState('');
  const [viewModelo, setViewModelo] = useState<PreOrcamentoApiDto | null>(null);
  const [modeloQtds, setModeloQtds] = useState<Record<number, number>>({});

  // --- Kits (local) state ---
  const [kits, setKits] = useState<Kit[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [kitsLoading, setKitsLoading] = useState(true);
  const [kitSearch, setKitSearch] = useState('');
  const [filterMarca, setFilterMarca] = useState<Marca | 'todas'>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewKit, setViewKit] = useState<Kit | null>(null);
  const [kitQtds, setKitQtds] = useState<Record<string, number>>({});

  /* ---- Load modelos ---- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setModelosLoading(true);
      setModelosErro(null);
      try {
        const ds = createDataSource();
        const res = await ds.preOrcamentos.list({ pageSize: 200 });
        if (!cancelled) setModelos(res.data);
      } catch {
        if (!cancelled) setModelosErro('Não foi possível carregar os modelos. Verifique a conexão.');
      } finally {
        if (!cancelled) setModelosLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ---- Load kits + equipments ---- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setKitsLoading(true);
      const ds = createDataSource();
      const [kitsRes, eqRes] = await Promise.allSettled([
        ds.kits.list({ pageSize: 500 }),
        ds.equipment.list({ pageSize: 500 }),
      ]);
      if (cancelled) return;
      setKits(kitsRes.status === 'fulfilled' ? kitsRes.value.data : loadMock('mock_kits', mockKits));
      setEquipments(eqRes.status === 'fulfilled' ? eqRes.value.data : loadMock('mock_equipments', mockEquipments));
      setKitsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (kits.length) saveMock('mock_kits', kits); }, [kits]);

  /* ---- Kit helpers ---- */
  function eqName(id: string) { return equipments.find((e) => e.id === id)?.name ?? id; }
  function itemName(item: Kit['items'][0]) { return item.itemName || eqName(item.equipmentId); }
  function itemUnitPrice(item: Kit['items'][0]) {
    if (item.unitPrice != null) return item.unitPrice;
    return equipments.find((e) => e.id === item.equipmentId)?.price ?? 0;
  }
  function kitTotal(kit: Kit) { return kit.items.reduce((s, i) => s + itemUnitPrice(i) * i.quantity, 0); }

  function openKit(kit: Kit) {
    setViewKit(kit);
    const qtds: Record<string, number> = {};
    kit.items.forEach((i) => { qtds[i.equipmentId] = i.quantity; });
    setKitQtds(qtds);
  }

  function openModelo(m: PreOrcamentoApiDto) {
    setViewModelo(m);
    const qtds: Record<number, number> = {};
    m.produtos.forEach((p) => { qtds[p.codInterno] = Number(p.quantidade) || 1; });
    setModeloQtds(qtds);
  }

  function handleSaveKit(kit: Kit) {
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

  function handleDeleteKit(id: string) {
    setKits((cur) => cur.filter((k) => k.id !== id));
    showToast('Kit excluído.', 'warning');
  }

  /* ---- Filtered lists ---- */
  const filteredModelos = useMemo(() =>
    !modeloSearch ? modelos : modelos.filter((m) => m.descricao.toLowerCase().includes(modeloSearch.toLowerCase())),
  [modelos, modeloSearch]);

  const filteredKits = useMemo(() => {
    let list = kits;
    if (filterMarca !== 'todas') list = list.filter((k) => k.marca === filterMarca);
    if (kitSearch) list = list.filter((k) => k.name.toLowerCase().includes(kitSearch.toLowerCase()));
    return list;
  }, [kits, filterMarca, kitSearch]);

  /* ---- Render ---- */
  return (
    <AppShell title="Kits & Modelos">

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${theme.border}` }}>
        {([
          { key: 'modelos', label: `Modelos do Sistema${modelos.length ? ` (${modelos.length})` : ''}` },
          { key: 'kits',    label: `Kits Criados${kits.length ? ` (${kits.length})` : ''}` },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: tab === key ? 700 : 400,
              background: 'transparent', border: 'none',
              borderBottom: tab === key ? `2px solid ${theme.gold}` : '2px solid transparent',
              color: tab === key ? theme.gold : theme.muted,
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ======================== TAB: MODELOS ======================== */}
      {tab === 'modelos' && (
        <>
          <input
            value={modeloSearch}
            onChange={(e) => setModeloSearch(e.target.value)}
            placeholder="Buscar modelo..."
            style={{ ...inputStyle, maxWidth: 360, marginBottom: 16 }}
          />

          {modelosLoading && <div style={{ textAlign: 'center', color: theme.muted, padding: 40 }}>Carregando modelos...</div>}

          {!modelosLoading && modelosErro && (
            <div style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: 10, padding: 20, color: '#e57373', textAlign: 'center' }}>
              {modelosErro}
            </div>
          )}

          {!modelosLoading && !modelosErro && filteredModelos.length === 0 && (
            <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
              {modeloSearch ? `Nenhum modelo encontrado para "${modeloSearch}".` : 'Nenhum modelo cadastrado no banco de dados.'}
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredModelos.map((m) => {
              const totalProd = m.produtos.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.produto?.preco) || 0), 0);
              const mensalVenda = Number(m.valorMensalVenda) || 0;
              return (
                <div
                  key={m.codInterno}
                  onClick={() => openModelo(m)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.gold + '66')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
                  style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <strong style={{ fontSize: 14 }}>{m.descricao}</strong>
                    {m.ampliacao && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(200,169,81,0.15)', color: theme.gold, border: `1px solid ${theme.gold}44`, whiteSpace: 'nowrap', marginLeft: 8 }}>Ampliação</span>}
                  </div>
                  {m.observacoes && <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>{m.observacoes.length > 80 ? m.observacoes.slice(0, 80) + '...' : m.observacoes}</div>}
                  <div style={{ display: 'grid', gap: 3, marginBottom: 10 }}>
                    {m.produtos.slice(0, 4).map((p) => (
                      <div key={p.codInterno} style={{ fontSize: 12, color: theme.muted, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{Number(p.quantidade) || 1}× {p.produto?.descricao ?? p.descricao ?? `Produto ${p.codProduto}`}</span>
                        {p.produto?.preco != null && <span>R$ {(Number(p.produto.preco) * (Number(p.quantidade) || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      </div>
                    ))}
                    {m.produtos.length > 4 && <div style={{ fontSize: 11, color: theme.muted }}>+ {m.produtos.length - 4} itens...</div>}
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {totalProd > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Equipamentos</span><span style={{ fontWeight: 600 }}>R$ {totalProd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                    {mensalVenda > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Mensalidade</span><span style={{ fontWeight: 700, color: theme.gold }}>R$ {mensalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span></div>}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: theme.muted }}>Clique para simular quantidades</div>
                </div>
              );
            })}
          </div>

          {viewModelo && (
            <ModeloDetailModal
              modelo={viewModelo}
              localQtds={modeloQtds}
              setLocalQtds={setModeloQtds}
              onClose={() => setViewModelo(null)}
            />
          )}
        </>
      )}

      {/* ======================== TAB: KITS ======================== */}
      {tab === 'kits' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={kitSearch}
              onChange={(e) => setKitSearch(e.target.value)}
              placeholder="Buscar kit..."
              style={{ ...inputStyle, width: 200, marginBottom: 0 }}
            />
            <button onClick={() => setFilterMarca('todas')} style={{ ...filterBtnStyle, ...(filterMarca === 'todas' ? filterBtnActive : {}) }}>Todas</button>
            {marcas.map((m) => (
              <button key={m} onClick={() => setFilterMarca(m)} style={{ ...filterBtnStyle, ...(filterMarca === m ? { background: marcaColors[m] + '22', borderColor: marcaColors[m], color: marcaColors[m], fontWeight: 700 } : {}) }}>{m}</button>
            ))}
            <div style={{ flex: 1 }} />
            {canWrite && (
              <button onClick={() => { setEditId(null); setModalOpen(true); }} style={btnGold}>+ Novo Kit</button>
            )}
          </div>

          {kitsLoading && <div style={{ textAlign: 'center', color: theme.muted, padding: 40 }}>Carregando kits...</div>}

          {!kitsLoading && filteredKits.length === 0 && (
            <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
              {canWrite
                ? 'Nenhum kit criado ainda. Clique em "+ Novo Kit" para começar.'
                : 'Nenhum kit cadastrado.'}
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filteredKits.map((kit) => {
              const mColor = kit.marca ? marcaColors[kit.marca] : theme.gold;
              const total = kitTotal(kit);
              return (
                <div
                  key={kit.id}
                  onClick={() => openKit(kit)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.gold + '66')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
                  style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 15 }}>{kit.name}</strong>
                      {kit.marca && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: mColor + '22', color: mColor, border: `1px solid ${mColor}44` }}>{kit.marca}</span>}
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold, whiteSpace: 'nowrap', marginLeft: 8 }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {kit.categoria && <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>{KIT_CATEGORIA_LABELS[kit.categoria]}</div>}
                  {kit.descricao && <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>{kit.descricao}</div>}
                  <div style={{ display: 'grid', gap: 3, marginBottom: 8 }}>
                    {kit.items.slice(0, 5).map((item) => (
                      <div key={item.equipmentId} style={{ fontSize: 12, color: theme.muted, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.quantity}× {itemName(item)}</span>
                        <span>R$ {(itemUnitPrice(item) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    {kit.items.length > 5 && <div style={{ fontSize: 11, color: theme.muted }}>+ {kit.items.length - 5} itens...</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 11, color: theme.muted }}>Clique para simular quantidades</span>
                    {canWrite && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setEditId(kit.id); setModalOpen(true); }} style={btnSmall}>Editar</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteKit(kit.id); }} style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}>Excluir</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {viewKit && (
            <KitDetailModal
              kit={viewKit}
              localQtds={kitQtds}
              setLocalQtds={setKitQtds}
              itemName={itemName}
              itemUnitPrice={itemUnitPrice}
              onClose={() => setViewKit(null)}
            />
          )}

          {modalOpen && (
            <KitFormModal
              existing={editId ? kits.find((k) => k.id === editId) ?? null : null}
              equipments={equipments}
              onSave={handleSaveKit}
              onCancel={() => { setModalOpen(false); setEditId(null); }}
            />
          )}
        </>
      )}
    </AppShell>
  );
}

/* ============================================================
   Modelo Detail Modal (PréOrçamento)
   ============================================================ */

function ModeloDetailModal({ modelo, localQtds, setLocalQtds, onClose }: {
  modelo: PreOrcamentoApiDto;
  localQtds: Record<number, number>;
  setLocalQtds: (q: Record<number, number>) => void;
  onClose: () => void;
}) {
  function changeQty(id: number, delta: number) {
    setLocalQtds({ ...localQtds, [id]: Math.max(0, (localQtds[id] ?? 1) + delta) });
  }
  function resetQtds() {
    const qtds: Record<number, number> = {};
    modelo.produtos.forEach((p) => { qtds[p.codInterno] = Number(p.quantidade) || 1; });
    setLocalQtds(qtds);
  }

  const totalEquip = modelo.produtos.reduce((s, p) => {
    const qty = localQtds[p.codInterno] ?? Number(p.quantidade) ?? 1;
    return s + (Number(p.produto?.preco) || 0) * qty;
  }, 0);

  const mensalVenda = Number(modelo.valorMensalVenda) || 0;
  const mensalComodato = Number(modelo.valorMensalComodato) || 0;
  const valorCrea = Number(modelo.valorCrea) || 0;
  const hasChanges = modelo.produtos.some((p) => (localQtds[p.codInterno] ?? Number(p.quantidade)) !== Number(p.quantidade));

  function pName(p: PreOrcamentoProdutoApiDto) { return p.produto?.descricao ?? p.descricao ?? `Produto ${p.codProduto}`; }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{modelo.descricao}</h3>
            {modelo.observacoes && <p style={{ margin: '6px 0 0', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{modelo.observacoes}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, fontSize: 22, cursor: 'pointer', padding: '0 4px' }}>×</button>
        </div>
        <div style={{ background: 'rgba(200,169,81,0.08)', border: `1px solid ${theme.gold}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: theme.muted }}>
          Ajuste as quantidades para simular o preço final. Alterações são temporárias.
        </div>
        {modelo.produtos.length > 0 && (
          <>
            <h4 style={{ color: theme.gold, margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Equipamentos</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Produto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Unit.</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Qtd.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {modelo.produtos.map((p) => {
                  const qty = localQtds[p.codInterno] ?? Number(p.quantidade) ?? 1;
                  const unit = Number(p.produto?.preco) || 0;
                  return (
                    <tr key={p.codInterno} style={{ opacity: qty === 0 ? 0.4 : 1 }}>
                      <td style={tdStyle}>{pName(p)}{p.grupoOrcamento && <div style={{ fontSize: 11, color: theme.muted }}>{p.grupoOrcamento}</div>}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: theme.muted, whiteSpace: 'nowrap' }}>{unit > 0 ? `R$ ${unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button onClick={() => changeQty(p.codInterno, -1)} style={qtyBtn} disabled={qty === 0}>−</button>
                          <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                          <button onClick={() => changeQty(p.codInterno, +1)} style={qtyBtn}>+</button>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{unit > 0 ? `R$ ${(unit * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        <div style={{ background: theme.soft, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ margin: '0 0 4px', color: theme.gold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Resumo Financeiro</h4>
          {totalEquip > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Equipamentos</span><span style={{ fontWeight: 600 }}>R$ {totalEquip.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
          {valorCrea > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>CREA</span><span>R$ {valorCrea.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
          {modelo.limitePontos != null && modelo.limitePontos > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Limite de pontos</span><span>{modelo.limitePontos} pts</span></div>}
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mensalVenda > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: theme.muted }}>Mensalidade (venda)</span><span style={{ fontWeight: 700, color: theme.gold }}>R$ {mensalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span></div>}
            {mensalComodato > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: theme.muted }}>Mensalidade (comodato)</span><span style={{ fontWeight: 700, color: theme.gold }}>R$ {mensalComodato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span></div>}
          </div>
          {totalEquip > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, paddingTop: 6, borderTop: `2px solid ${theme.gold}44` }}><span style={{ fontWeight: 700 }}>Total equipamentos</span><span style={{ fontWeight: 700, color: theme.gold }}>R$ {totalEquip.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          {hasChanges && <button onClick={resetQtds} style={btnSoft}>Resetar qtds</button>}
          {hasChanges && <span style={{ fontSize: 11, color: theme.gold, border: `1px solid ${theme.gold}44`, borderRadius: 6, padding: '2px 8px' }}>modificado</span>}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnGold}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Kit Detail Modal (local kits)
   ============================================================ */

function KitDetailModal({ kit, localQtds, setLocalQtds, itemName, itemUnitPrice, onClose }: {
  kit: Kit;
  localQtds: Record<string, number>;
  setLocalQtds: (q: Record<string, number>) => void;
  itemName: (item: Kit['items'][0]) => string;
  itemUnitPrice: (item: Kit['items'][0]) => number;
  onClose: () => void;
}) {
  function changeQty(equipmentId: string, delta: number) {
    setLocalQtds({ ...localQtds, [equipmentId]: Math.max(0, (localQtds[equipmentId] ?? 1) + delta) });
  }
  function resetQtds() {
    const qtds: Record<string, number> = {};
    kit.items.forEach((i) => { qtds[i.equipmentId] = i.quantity; });
    setLocalQtds(qtds);
  }

  const total = kit.items.reduce((s, item) => s + itemUnitPrice(item) * (localQtds[item.equipmentId] ?? item.quantity), 0);
  const hasChanges = kit.items.some((i) => (localQtds[i.equipmentId] ?? i.quantity) !== i.quantity);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: 560, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{kit.name}</h3>
            {kit.descricao && <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>{kit.descricao}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        <div style={{ background: 'rgba(200,169,81,0.08)', border: `1px solid ${theme.gold}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: theme.muted }}>
          Ajuste as quantidades abaixo para simular o preço para o cliente. As alterações são temporárias.
        </div>
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
              return (
                <tr key={item.equipmentId} style={{ opacity: qty === 0 ? 0.4 : 1 }}>
                  <td style={tdStyle}>{itemName(item)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: theme.muted, whiteSpace: 'nowrap' }}>R$ {unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button onClick={() => changeQty(item.equipmentId, -1)} style={qtyBtn} disabled={qty === 0}>−</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{qty}</span>
                      <button onClick={() => changeQty(item.equipmentId, +1)} style={qtyBtn}>+</button>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>R$ {(unit * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `2px solid ${theme.gold}44`, marginTop: 8 }}>
          <div>
            <span style={{ fontSize: 14, color: theme.muted }}>Total estimado</span>
            {hasChanges && <span style={{ marginLeft: 10, fontSize: 11, color: theme.gold, border: `1px solid ${theme.gold}44`, borderRadius: 6, padding: '2px 7px' }}>modificado</span>}
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: theme.gold }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {hasChanges && <button onClick={resetQtds} style={btnSoft}>Resetar qtds</button>}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnGold}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Kit Form Modal (ADMIN — cria/edita kits locais)
   ============================================================ */

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

  const filteredEq = useMemo(() => equipments.filter((e) => e.marca === marca || e.marca === 'Genérico'), [equipments, marca]);
  const total = useMemo(() => items.reduce((s, i) => { const eq = equipments.find((e) => e.id === i.equipmentId); return s + (eq?.price ?? i.unitPrice ?? 0) * i.quantity; }, 0), [items, equipments]);

  function addItem() {
    if (!selEquip || selQtd < 1) return;
    const exists = items.find((i) => i.equipmentId === selEquip);
    if (exists) { setItems((cur) => cur.map((i) => i.equipmentId === selEquip ? { ...i, quantity: i.quantity + selQtd } : i)); }
    else { setItems((cur) => [...cur, { equipmentId: selEquip, quantity: selQtd }]); }
    setSelQtd(1);
  }

  function handleSave() {
    if (!name.trim() || items.length === 0) return;
    onSave({ id: existing?.id ?? 'K' + Date.now(), name: name.trim(), items, marca, categoria, descricao: descricao.trim() });
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
            <button key={m} onClick={() => setMarca(m)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: marca === m ? marcaColors[m] + '22' : theme.soft, border: `1px solid ${marca === m ? marcaColors[m] : theme.border}`, color: marca === m ? marcaColors[m] : theme.text, fontWeight: marca === m ? 700 : 400 }}>{m}</button>
          ))}
        </div>

        <label style={labelStyle}>Categoria *</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value as KitCategoria)} style={inputStyle}>
          {(Object.keys(KIT_CATEGORIA_LABELS) as KitCategoria[]).map((k) => <option key={k} value={k}>{KIT_CATEGORIA_LABELS[k]}</option>)}
        </select>

        <label style={labelStyle}>Descrição</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Breve descrição do kit..." />

        <h4 style={{ color: theme.gold, margin: '12px 0 8px', fontSize: 14 }}>Itens</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={selEquip} onChange={(e) => setSelEquip(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
            <option value="">Selecionar equipamento...</option>
            {filteredEq.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>)}
          </select>
          <input type="number" min={1} value={selQtd} onChange={(e) => setSelQtd(Number(e.target.value))} style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
          <button type="button" onClick={addItem} disabled={!selEquip} style={{ ...btnGold, opacity: selEquip ? 1 : 0.4 }}>+</button>
        </div>

        {items.length === 0
          ? <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', padding: 12 }}>Adicione pelo menos 1 item.</div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead><tr><th style={thStyle}>Equipamento</th><th style={thStyle}>Qtd</th><th style={thStyle}>Subtotal</th><th style={thStyle}></th></tr></thead>
              <tbody>
                {items.map((item) => {
                  const eq = equipments.find((e) => e.id === item.equipmentId);
                  const price = eq?.price ?? item.unitPrice ?? 0;
                  return (
                    <tr key={item.equipmentId}>
                      <td style={tdStyle}>{eq?.name ?? item.itemName ?? item.equipmentId}</td>
                      <td style={tdStyle}>{item.quantity}</td>
                      <td style={tdStyle}>R$ {(price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={tdStyle}><button onClick={() => setItems((cur) => cur.filter((i) => i.equipmentId !== item.equipmentId))} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>x</button></td>
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
const tdStyle: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, verticalAlign: 'middle' };
const filterBtnStyle: React.CSSProperties = { padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: theme.soft, border: `1px solid ${theme.border}`, color: theme.text };
const filterBtnActive: React.CSSProperties = { background: 'rgba(200,169,81,0.12)', borderColor: theme.gold, color: theme.gold, fontWeight: 700 };
const qtyBtn: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 };
