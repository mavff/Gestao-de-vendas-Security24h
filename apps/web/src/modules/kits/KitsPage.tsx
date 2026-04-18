'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePollingRefresh } from '../../hooks/usePollingRefresh';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { PreOrcamentoApiDto, PreOrcamentoProdutoApiDto } from '../../lib/dataSource/types';
import { mockEquipments, mockKits } from '../../mocks/data';
import { loadLocalCache } from '../../services/localCache';
import { loadState, saveState } from '../../services/appState';
import { loadTiposEstoque, TipoEstoque } from '../../services/tiposEstoque';
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

type Tab = 'modelos' | 'kits' | 'custos';

/* ============================================================
   Main Page
   ============================================================ */

export function KitsPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canWrite = role === 'ADMIN';
  const canEditCost = role === 'ADMIN' || role === 'GESTOR';

  const [tab, setTab] = useState<Tab>('modelos');
  const [precosCusto, setPrecosCusto] = useState<Record<string, number>>({});
  const [custoSearch, setCustoSearch] = useState('');
  const [custoFilter, setCustoFilter] = useState<string>('todos');
  const [localCustos, setLocalCustos] = useState<Record<string, number>>({});

  // --- Modelos (PréOrçamento) state ---
  const [modelos, setModelos] = useState<PreOrcamentoApiDto[]>([]);
  const [modelosLoading, setModelosLoading] = useState(true);
  const [modelosErro, setModelosErro] = useState<string | null>(null);
  const [modeloSearch, setModeloSearch] = useState('');
  const [viewModelo, setViewModelo] = useState<PreOrcamentoApiDto | null>(null);
  const [modeloQtds, setModeloQtds] = useState<Record<number, number>>({});

  // --- Kits state ---
  // ERP kits têm ID numérico (codProduto). Custom usam prefixo "K" + timestamp.
  const [kitsErp, setKitsErp] = useState<Kit[]>([]);
  const [kitsCustom, setKitsCustom] = useState<Kit[]>([]);
  const kits = useMemo(() => [...kitsErp, ...kitsCustom], [kitsErp, kitsCustom]);
  const isCustomKitId = (id: string) => id.startsWith('K');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [kitsLoading, setKitsLoading] = useState(true);
  const [kitSearch, setKitSearch] = useState('');
  const [filterMarca, setFilterMarca] = useState<Marca | 'todas'>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewKit, setViewKit] = useState<Kit | null>(null);
  const [kitQtds, setKitQtds] = useState<Record<string, number>>({});

  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [tiposEstoque, setTiposEstoque] = useState<TipoEstoque[]>([]);

  /* ---- Reload do BD (chamado no mount, no foco e no botão Atualizar) ---- */
  const reloadFromBackend = useCallback(async () => {
    setRefreshing(true);
    const ds = createDataSource();
    const [modelosRes, kitsRes, eqRes] = await Promise.allSettled([
      ds.preOrcamentos.list({ pageSize: 200 }),
      ds.kits.list({ pageSize: 500 }),
      ds.equipment.list({ pageSize: 2000, apenasOrcamento: false }),
    ]);

    if (modelosRes.status === 'fulfilled') {
      setModelos(modelosRes.value.data);
      setModelosErro(null);
    } else {
      setModelosErro('Não foi possível carregar os modelos. Verifique a conexão.');
    }
    setModelosLoading(false);

    setKitsErp(kitsRes.status === 'fulfilled' ? kitsRes.value.data : loadLocalCache('mock_kits', mockKits));
    setEquipments(eqRes.status === 'fulfilled' ? eqRes.value.data : loadLocalCache('mock_equipments', mockEquipments));
    setKitsLoading(false);
    setLastRefresh(Date.now());
    setRefreshing(false);
  }, []);

  /* ---- Load inicial + config de custos ---- */
  useEffect(() => {
    reloadFromBackend();
    loadState<Record<string, number>>('config:precos_custo', {}).then((map) => {
      setPrecosCusto(map);
      setLocalCustos(map);
    });
    // Carrega kits custom do AppKv (SQLite) — compartilhado entre usuários
    loadState<Kit[]>('kits_custom', []).then(setKitsCustom);
    loadTiposEstoque().then(setTiposEstoque);
  }, [reloadFromBackend]);

  /* ---- Refetch ao voltar pra aba (preços do ERP podem ter mudado) ---- */
  useRefreshOnFocus(() => { reloadFromBackend(); });
  usePollingRefresh(() => { reloadFromBackend(); }, 120_000);

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

  async function handleSaveKit(kit: Kit) {
    if (editId && !isCustomKitId(editId)) {
      showToast('Kits do ERP não podem ser editados aqui. Ajuste direto no ERP.', 'warning');
      return;
    }
    let next: Kit[];
    if (editId) {
      next = kitsCustom.map((k) => k.id === editId ? kit : k);
      showToast('Kit atualizado.', 'success');
    } else {
      next = [...kitsCustom, kit];
      showToast('Kit criado.', 'success');
    }
    setKitsCustom(next);
    await saveState('kits_custom', next);
    setModalOpen(false);
    setEditId(null);
  }

  async function handleDeleteKit(id: string) {
    if (!isCustomKitId(id)) {
      showToast('Kits do ERP não podem ser excluídos daqui.', 'warning');
      return;
    }
    const next = kitsCustom.filter((k) => k.id !== id);
    setKitsCustom(next);
    await saveState('kits_custom', next);
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

  /* ---- Cost helpers ---- */
  // All unique equipments used across kits and modelos
  const allKitEquipments = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; preco: number; kits: string[] }>();
    for (const kit of kits) {
      for (const item of kit.items) {
        const eq = equipments.find((e) => e.id === item.equipmentId);
        const entry = map.get(item.equipmentId) ?? { id: item.equipmentId, nome: eq?.name ?? item.itemName ?? item.equipmentId, preco: eq?.price ?? item.unitPrice ?? 0, kits: [] };
        entry.kits.push(kit.name);
        map.set(item.equipmentId, entry);
      }
    }
    for (const m of modelos) {
      for (const p of m.produtos) {
        const eqId = String(p.produto?.codProduto ?? p.codProduto ?? 0);
        if (eqId === '0') continue;
        const entry = map.get(eqId) ?? { id: eqId, nome: p.produto?.descricao ?? p.descricao ?? `Produto ${eqId}`, preco: Number(p.produto?.preco) || 0, kits: [] };
        if (!entry.kits.includes(m.descricao)) entry.kits.push(m.descricao);
        map.set(eqId, entry);
      }
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [kits, modelos, equipments]);

  const filteredCustoItems = useMemo(() => {
    let list = allKitEquipments;
    if (custoSearch) list = list.filter((e) => e.nome.toLowerCase().includes(custoSearch.toLowerCase()));
    if (custoFilter !== 'todos') list = list.filter((e) => e.kits.includes(custoFilter));
    return list;
  }, [allKitEquipments, custoSearch, custoFilter]);

  const allKitModelNames = useMemo(() => {
    const names = new Set<string>();
    for (const e of allKitEquipments) for (const k of e.kits) names.add(k);
    return [...names].sort();
  }, [allKitEquipments]);

  const custosDirty = useMemo(() => {
    return allKitEquipments.some((e) => {
      const cur = localCustos[e.id];
      const saved = precosCusto[e.id];
      return (cur ?? '') !== (saved ?? '');
    });
  }, [allKitEquipments, localCustos, precosCusto]);

  function handleSaveCustos() {
    const merged = { ...precosCusto, ...localCustos };
    // Remove entries with 0 or empty
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(merged)) { if (v > 0) clean[k] = v; }
    setPrecosCusto(clean);
    setLocalCustos(clean);
    saveState('config:precos_custo', clean);
    showToast('Preços de custo salvos.', 'success');
  }

  // Custo stats
  const custoStats = useMemo(() => {
    const total = allKitEquipments.length;
    const comCusto = allKitEquipments.filter((e) => (localCustos[e.id] ?? precosCusto[e.id] ?? 0) > 0).length;
    const semCusto = total - comCusto;
    const margens = allKitEquipments.filter((e) => {
      const c = localCustos[e.id] ?? precosCusto[e.id] ?? 0;
      return c > 0 && e.preco > 0;
    }).map((e) => {
      const c = localCustos[e.id] ?? precosCusto[e.id] ?? 0;
      return ((e.preco - c) / e.preco) * 100;
    });
    const margemMedia = margens.length > 0 ? margens.reduce((s, v) => s + v, 0) / margens.length : 0;
    return { total, comCusto, semCusto, margemMedia };
  }, [allKitEquipments, localCustos, precosCusto]);

  /* ---- Render ---- */
  return (
    <AppShell title="Kits & Modelos">

      {/* Barra de atualização */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
        {lastRefresh > 0 && (
          <span style={{ fontSize: 11, color: theme.muted }}>
            Atualizado há {Math.max(1, Math.floor((Date.now() - lastRefresh) / 1000))}s
          </span>
        )}
        <button
          onClick={() => reloadFromBackend()}
          disabled={refreshing}
          style={{
            background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 8,
            color: refreshing ? theme.muted : theme.gold, padding: '6px 12px', fontSize: 12,
            cursor: refreshing ? 'wait' : 'pointer',
          }}
        >
          {refreshing ? 'Atualizando...' : '↻ Atualizar'}
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${theme.border}` }}>
        {([
          { key: 'modelos' as Tab, label: `Modelos do Sistema${modelos.length ? ` (${modelos.length})` : ''}` },
          { key: 'kits' as Tab,    label: `Kits Criados${kits.length ? ` (${kits.length})` : ''}` },
          ...(canEditCost ? [{ key: 'custos' as Tab, label: `Custos (${allKitEquipments.length})` }] : []),
        ]).map(({ key, label }) => (
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
              const totalCustoM = canEditCost ? m.produtos.reduce((s, p) => {
                const eqId = String(p.produto?.codProduto ?? p.codProduto ?? 0);
                const custo = localCustos[eqId] ?? precosCusto[eqId] ?? 0;
                return s + custo * (Number(p.quantidade) || 0);
              }, 0) : 0;
              const margemM = canEditCost && totalProd > 0 && totalCustoM > 0 ? ((totalProd - totalCustoM) / totalProd) * 100 : 0;
              const semCustoCount = canEditCost ? m.produtos.filter((p) => {
                const eqId = String(p.produto?.codProduto ?? p.codProduto ?? 0);
                return (localCustos[eqId] ?? precosCusto[eqId] ?? 0) === 0;
              }).length : 0;
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
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                      {m.ampliacao && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(200,169,81,0.15)', color: theme.gold, border: `1px solid ${theme.gold}44`, whiteSpace: 'nowrap' }}>Ampliação</span>}
                      {canEditCost && margemM > 0 && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: (margemM >= 30 ? '#43C17B' : margemM >= 15 ? theme.gold : '#E55B5B') + '22', color: margemM >= 30 ? '#43C17B' : margemM >= 15 ? theme.gold : '#E55B5B', border: `1px solid ${(margemM >= 30 ? '#43C17B' : margemM >= 15 ? theme.gold : '#E55B5B')}44`, whiteSpace: 'nowrap' }}>{margemM.toFixed(0)}%</span>}
                    </div>
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
                    {canEditCost && totalCustoM > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Custo</span><span style={{ fontWeight: 600, color: '#5B9BD5' }}>R$ {totalCustoM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                    {mensalVenda > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Mensalidade</span><span style={{ fontWeight: 700, color: theme.gold }}>R$ {mensalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span></div>}
                  </div>
                  {canEditCost && semCustoCount > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#E55B5B', background: 'rgba(229,91,91,0.08)', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                      {semCustoCount} {semCustoCount === 1 ? 'item' : 'itens'} sem custo
                    </div>
                  )}
                  <div style={{ marginTop: canEditCost && semCustoCount > 0 ? 6 : 10, fontSize: 11, color: theme.muted }}>Clique para simular quantidades</div>
                </div>
              );
            })}
          </div>

          {viewModelo && (
            <ModeloDetailModal
              modelo={viewModelo}
              localQtds={modeloQtds}
              setLocalQtds={setModeloQtds}
              precosCusto={localCustos}
              canEditCost={canEditCost}
              onUpdateCusto={(eqId, val) => setLocalCustos((prev) => ({ ...prev, [eqId]: val }))}
              onSaveCustos={handleSaveCustos}
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
              const totalCustoK = canEditCost ? kit.items.reduce((s, item) => {
                const custo = localCustos[item.equipmentId] ?? precosCusto[item.equipmentId] ?? 0;
                return s + custo * item.quantity;
              }, 0) : 0;
              const margemK = canEditCost && total > 0 && totalCustoK > 0 ? ((total - totalCustoK) / total) * 100 : 0;
              const semCustoK = canEditCost ? kit.items.filter((i) => (localCustos[i.equipmentId] ?? precosCusto[i.equipmentId] ?? 0) === 0).length : 0;
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
                      {canEditCost && margemK > 0 && <span style={{ marginLeft: 6, fontSize: 11, padding: '2px 7px', borderRadius: 999, background: (margemK >= 30 ? '#43C17B' : margemK >= 15 ? theme.gold : '#E55B5B') + '22', color: margemK >= 30 ? '#43C17B' : margemK >= 15 ? theme.gold : '#E55B5B', border: `1px solid ${(margemK >= 30 ? '#43C17B' : margemK >= 15 ? theme.gold : '#E55B5B')}44` }}>{margemK.toFixed(0)}%</span>}
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
                  {canEditCost && totalCustoK > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5B9BD5', marginBottom: 4 }}>
                      <span>Custo</span><span style={{ fontWeight: 600 }}>R$ {totalCustoK.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {canEditCost && semCustoK > 0 && (
                    <div style={{ fontSize: 11, color: '#E55B5B', background: 'rgba(229,91,91,0.08)', borderRadius: 6, padding: '3px 8px', display: 'inline-block', marginBottom: 4 }}>
                      {semCustoK} {semCustoK === 1 ? 'item' : 'itens'} sem custo
                    </div>
                  )}
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
              precosCusto={localCustos}
              canEditCost={canEditCost}
              onUpdateCusto={(eqId, val) => setLocalCustos((prev) => ({ ...prev, [eqId]: val }))}
              onSaveCustos={handleSaveCustos}
              onClose={() => setViewKit(null)}
            />
          )}

          {modalOpen && (
            <KitFormModal
              existing={editId ? kits.find((k) => k.id === editId) ?? null : null}
              equipments={equipments}
              tiposEstoque={tiposEstoque}
              onSave={handleSaveKit}
              onCancel={() => { setModalOpen(false); setEditId(null); }}
            />
          )}
        </>
      )}

      {/* ======================== TAB: CUSTOS ======================== */}
      {tab === 'custos' && canEditCost && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: theme.muted }}>Total Itens</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.text }}>{custoStats.total}</div>
            </div>
            <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: theme.muted }}>Com Custo</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#43C17B' }}>{custoStats.comCusto}</div>
            </div>
            <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: theme.muted }}>Sem Custo</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: custoStats.semCusto > 0 ? '#E55B5B' : theme.muted }}>{custoStats.semCusto}</div>
            </div>
            <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: theme.muted }}>Margem Média</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: custoStats.margemMedia >= 30 ? '#43C17B' : custoStats.margemMedia >= 15 ? theme.gold : '#E55B5B' }}>
                {custoStats.margemMedia.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={custoSearch}
              onChange={(e) => setCustoSearch(e.target.value)}
              placeholder="Buscar equipamento..."
              style={{ ...inputStyle, width: 240, marginBottom: 0 }}
            />
            <select
              value={custoFilter}
              onChange={(e) => setCustoFilter(e.target.value)}
              style={{ ...inputStyle, width: 220, marginBottom: 0 }}
            >
              <option value="todos">Todos os kits/modelos</option>
              {allKitModelNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            {custosDirty && (
              <button onClick={handleSaveCustos} style={btnGold}>Salvar Custos</button>
            )}
          </div>

          {/* Tabela */}
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Produto</th>
                  <th style={{ ...thStyle, textAlign: 'right', width: 120 }}>Preço Venda</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 140 }}>Preço Custo</th>
                  <th style={{ ...thStyle, textAlign: 'right', width: 80 }}>Margem</th>
                  <th style={{ ...thStyle, width: 180 }}>Usado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustoItems.map((item) => {
                  const custo = localCustos[item.id] ?? precosCusto[item.id] ?? 0;
                  const margem = custo > 0 && item.preco > 0 ? ((item.preco - custo) / item.preco) * 100 : 0;
                  const semCusto = custo === 0 || custo === undefined;
                  return (
                    <tr key={item.id} style={{ background: semCusto ? 'rgba(229,91,91,0.05)' : undefined }}>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.nome}</div>
                        <div style={{ fontSize: 11, color: theme.muted }}>#{item.id}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={custo || ''}
                          placeholder="0,00"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setLocalCustos((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          style={{
                            background: theme.soft, color: theme.text, border: `1px solid ${semCusto ? '#E55B5B66' : theme.border}`,
                            borderRadius: 6, padding: '5px 8px', width: 110, textAlign: 'right', fontSize: 13,
                          }}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: semCusto ? theme.muted : margem >= 30 ? '#43C17B' : margem >= 15 ? theme.gold : '#E55B5B' }}>
                        {semCusto ? '—' : `${margem.toFixed(1)}%`}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: theme.muted }}>
                        {item.kits.slice(0, 2).join(', ')}{item.kits.length > 2 ? ` +${item.kits.length - 2}` : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCustoItems.length === 0 && (
              <div style={{ textAlign: 'center', color: theme.muted, padding: 32 }}>
                Nenhum equipamento encontrado.
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}

/* ============================================================
   Modelo Detail Modal (PréOrçamento)
   ============================================================ */

function ModeloDetailModal({ modelo, localQtds, setLocalQtds, precosCusto, canEditCost, onUpdateCusto, onSaveCustos, onClose }: {
  modelo: PreOrcamentoApiDto;
  localQtds: Record<number, number>;
  setLocalQtds: (q: Record<number, number>) => void;
  precosCusto: Record<string, number>;
  canEditCost: boolean;
  onUpdateCusto: (eqId: string, val: number) => void;
  onSaveCustos: () => void;
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

  const totalCusto = canEditCost ? modelo.produtos.reduce((s, p) => {
    const qty = localQtds[p.codInterno] ?? Number(p.quantidade) ?? 1;
    const eqId = String(p.produto?.codProduto ?? p.codProduto ?? 0);
    const custo = precosCusto[eqId] ?? 0;
    return s + custo * qty;
  }, 0) : 0;

  const margemMedia = canEditCost && totalEquip > 0 && totalCusto > 0 ? ((totalEquip - totalCusto) / totalEquip) * 100 : 0;

  const mensalVenda = Number(modelo.valorMensalVenda) || 0;
  const mensalComodato = Number(modelo.valorMensalComodato) || 0;
  const valorCrea = Number(modelo.valorCrea) || 0;
  const hasChanges = modelo.produtos.some((p) => (localQtds[p.codInterno] ?? Number(p.quantidade)) !== Number(p.quantidade));

  function pName(p: PreOrcamentoProdutoApiDto) { return p.produto?.descricao ?? p.descricao ?? `Produto ${p.codProduto}`; }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: canEditCost ? 750 : 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{modelo.descricao}</h3>
            {modelo.observacoes && <p style={{ margin: '6px 0 0', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{modelo.observacoes}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, fontSize: 22, cursor: 'pointer', padding: '0 4px' }}>×</button>
        </div>
        <div style={{ background: 'rgba(200,169,81,0.08)', border: `1px solid ${theme.gold}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: theme.muted }}>
          Ajuste as quantidades para simular o preço final.{canEditCost ? ' Edite os custos para atualizar margem.' : ' Alterações são temporárias.'}
        </div>
        {modelo.produtos.length > 0 && (
          <>
            <h4 style={{ color: theme.gold, margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Equipamentos</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Produto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Venda</th>
                  {canEditCost && <th style={{ ...thStyle, textAlign: 'center' }}>Custo</th>}
                  <th style={{ ...thStyle, textAlign: 'center' }}>Qtd.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                  {canEditCost && <th style={{ ...thStyle, textAlign: 'right' }}>Margem</th>}
                </tr>
              </thead>
              <tbody>
                {modelo.produtos.map((p) => {
                  const qty = localQtds[p.codInterno] ?? Number(p.quantidade) ?? 1;
                  const unit = Number(p.produto?.preco) || 0;
                  const eqId = String(p.produto?.codProduto ?? p.codProduto ?? 0);
                  const custo = precosCusto[eqId] ?? 0;
                  const margem = custo > 0 && unit > 0 ? ((unit - custo) / unit) * 100 : 0;
                  const semCusto = custo === 0;
                  return (
                    <tr key={p.codInterno} style={{ opacity: qty === 0 ? 0.4 : 1 }}>
                      <td style={tdStyle}>{pName(p)}{p.grupoOrcamento && <div style={{ fontSize: 11, color: theme.muted }}>{p.grupoOrcamento}</div>}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: theme.muted, whiteSpace: 'nowrap' }}>{unit > 0 ? `R$ ${unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                      {canEditCost && (
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input
                            type="number" min={0} step={0.01}
                            value={custo || ''}
                            placeholder="0,00"
                            onChange={(e) => onUpdateCusto(eqId, parseFloat(e.target.value) || 0)}
                            style={{ background: theme.soft, color: theme.text, border: `1px solid ${semCusto ? '#E55B5B66' : theme.border}`, borderRadius: 6, padding: '4px 6px', width: 90, textAlign: 'right', fontSize: 12 }}
                          />
                        </td>
                      )}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button onClick={() => changeQty(p.codInterno, -1)} style={qtyBtn} disabled={qty === 0}>−</button>
                          <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                          <button onClick={() => changeQty(p.codInterno, +1)} style={qtyBtn}>+</button>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{unit > 0 ? `R$ ${(unit * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                      {canEditCost && (
                        <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12, fontWeight: 600, color: semCusto ? theme.muted : margem >= 30 ? '#43C17B' : margem >= 15 ? theme.gold : '#E55B5B' }}>
                          {semCusto ? '—' : `${margem.toFixed(0)}%`}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        <div style={{ background: theme.soft, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ margin: '0 0 4px', color: theme.gold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Resumo Financeiro</h4>
          {totalEquip > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Equipamentos (venda)</span><span style={{ fontWeight: 600 }}>R$ {totalEquip.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
          {canEditCost && totalCusto > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Equipamentos (custo)</span><span style={{ fontWeight: 600, color: '#5B9BD5' }}>R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
          {canEditCost && margemMedia > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: theme.muted }}>Margem média</span><span style={{ fontWeight: 600, color: margemMedia >= 30 ? '#43C17B' : margemMedia >= 15 ? theme.gold : '#E55B5B' }}>{margemMedia.toFixed(1)}%</span></div>}
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
          {canEditCost && <button onClick={onSaveCustos} style={{ ...btnSoft, borderColor: '#5B9BD5', color: '#5B9BD5' }}>Salvar Custos</button>}
          <button onClick={onClose} style={btnGold}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Kit Detail Modal (local kits)
   ============================================================ */

function KitDetailModal({ kit, localQtds, setLocalQtds, itemName, itemUnitPrice, precosCusto, canEditCost, onUpdateCusto, onSaveCustos, onClose }: {
  kit: Kit;
  localQtds: Record<string, number>;
  setLocalQtds: (q: Record<string, number>) => void;
  itemName: (item: Kit['items'][0]) => string;
  itemUnitPrice: (item: Kit['items'][0]) => number;
  precosCusto: Record<string, number>;
  canEditCost: boolean;
  onUpdateCusto: (eqId: string, val: number) => void;
  onSaveCustos: () => void;
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
  const totalCusto = canEditCost ? kit.items.reduce((s, item) => {
    const custo = precosCusto[item.equipmentId] ?? 0;
    return s + custo * (localQtds[item.equipmentId] ?? item.quantity);
  }, 0) : 0;
  const margemMedia = canEditCost && total > 0 && totalCusto > 0 ? ((total - totalCusto) / total) * 100 : 0;
  const hasChanges = kit.items.some((i) => (localQtds[i.equipmentId] ?? i.quantity) !== i.quantity);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: canEditCost ? 720 : 560, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{kit.name}</h3>
            {kit.descricao && <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>{kit.descricao}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        <div style={{ background: 'rgba(200,169,81,0.08)', border: `1px solid ${theme.gold}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: theme.muted }}>
          Ajuste as quantidades para simular o preço.{canEditCost ? ' Edite os custos para comodato.' : ''}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
          <thead>
            <tr>
              <th style={thStyle}>Produto</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Venda</th>
              {canEditCost && <th style={{ ...thStyle, textAlign: 'center' }}>Custo</th>}
              <th style={{ ...thStyle, textAlign: 'center' }}>Qtd.</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
              {canEditCost && <th style={{ ...thStyle, textAlign: 'right' }}>Margem</th>}
            </tr>
          </thead>
          <tbody>
            {kit.items.map((item) => {
              const qty = localQtds[item.equipmentId] ?? item.quantity;
              const unit = itemUnitPrice(item);
              const custo = precosCusto[item.equipmentId] ?? 0;
              const margem = custo > 0 && unit > 0 ? ((unit - custo) / unit) * 100 : 0;
              const semCusto = custo === 0;
              return (
                <tr key={item.equipmentId} style={{ opacity: qty === 0 ? 0.4 : 1 }}>
                  <td style={tdStyle}>{itemName(item)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: theme.muted, whiteSpace: 'nowrap' }}>R$ {unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  {canEditCost && (
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="number" min={0} step={0.01}
                        value={custo || ''}
                        placeholder="0,00"
                        onChange={(e) => onUpdateCusto(item.equipmentId, parseFloat(e.target.value) || 0)}
                        style={{ background: theme.soft, color: theme.text, border: `1px solid ${semCusto ? '#E55B5B66' : theme.border}`, borderRadius: 6, padding: '4px 6px', width: 90, textAlign: 'right', fontSize: 12 }}
                      />
                    </td>
                  )}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button onClick={() => changeQty(item.equipmentId, -1)} style={qtyBtn} disabled={qty === 0}>−</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{qty}</span>
                      <button onClick={() => changeQty(item.equipmentId, +1)} style={qtyBtn}>+</button>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>R$ {(unit * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  {canEditCost && (
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12, fontWeight: 600, color: semCusto ? theme.muted : margem >= 30 ? '#43C17B' : margem >= 15 ? theme.gold : '#E55B5B' }}>
                      {semCusto ? '—' : `${margem.toFixed(0)}%`}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `2px solid ${theme.gold}44`, marginTop: 8 }}>
          <div>
            <span style={{ fontSize: 14, color: theme.muted }}>Total venda</span>
            {hasChanges && <span style={{ marginLeft: 10, fontSize: 11, color: theme.gold, border: `1px solid ${theme.gold}44`, borderRadius: 6, padding: '2px 7px' }}>modificado</span>}
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: theme.gold }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        {canEditCost && totalCusto > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
            <span style={{ fontSize: 13, color: theme.muted }}>Total custo · Margem {margemMedia.toFixed(1)}%</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#5B9BD5' }}>R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {hasChanges && <button onClick={resetQtds} style={btnSoft}>Resetar qtds</button>}
          <div style={{ flex: 1 }} />
          {canEditCost && <button onClick={onSaveCustos} style={{ ...btnSoft, borderColor: '#5B9BD5', color: '#5B9BD5' }}>Salvar Custos</button>}
          <button onClick={onClose} style={btnGold}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Kit Form Modal (ADMIN — cria/edita kits locais)
   ============================================================ */

function KitFormModal({ existing, equipments, tiposEstoque, onSave, onCancel }: {
  existing: Kit | null;
  equipments: Equipment[];
  tiposEstoque: TipoEstoque[];
  onSave: (kit: Kit) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [marca, setMarca] = useState<Marca>(existing?.marca ?? 'Intelbras');
  const [categoria, setCategoria] = useState<KitCategoria>(existing?.categoria ?? 'alarme_residencial');
  const [descricao, setDescricao] = useState(existing?.descricao ?? '');
  const [items, setItems] = useState(existing?.items ?? []);

  // Busca de equipamentos: texto + categoria + toggle "só da marca selecionada" + tipo de estoque
  const [equipSearch, setEquipSearch] = useState('');
  const [equipCategory, setEquipCategory] = useState<'Todas' | 'Câmera' | 'Sensor' | 'Central' | 'Acessório'>('Todas');
  const [onlySelectedBrand, setOnlySelectedBrand] = useState(true);
  const [codEstoqueFilter, setCodEstoqueFilter] = useState<number | 'Todos'>('Todos');

  const tiposAtivos = useMemo(() => tiposEstoque.filter((t) => !t.inativo), [tiposEstoque]);
  const mostrarFiltroEstoque = tiposAtivos.length >= 2;

  const matchEquip = (e: Equipment): boolean => {
    if (onlySelectedBrand && e.marca !== marca && e.marca !== 'Genérico') return false;
    if (equipCategory !== 'Todas' && e.category !== equipCategory) return false;
    if (codEstoqueFilter !== 'Todos' && e.estoquePadrao !== codEstoqueFilter) return false;
    const q = equipSearch.trim().toLowerCase();
    if (q && !`${e.name} ${e.sku ?? ''} ${e.descricao ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  };

  const filteredEq = useMemo(() => {
    return equipments
      .filter(matchEquip)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .slice(0, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipments, equipSearch, equipCategory, onlySelectedBrand, marca, codEstoqueFilter]);

  const totalFilteredPool = useMemo(() => equipments.filter(matchEquip).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [equipments, equipSearch, equipCategory, onlySelectedBrand, marca, codEstoqueFilter],
  );

  const total = useMemo(() => items.reduce((s, i) => { const eq = equipments.find((e) => e.id === i.equipmentId); return s + (eq?.price ?? i.unitPrice ?? 0) * i.quantity; }, 0), [items, equipments]);

  function addEquipment(eqId: string) {
    const exists = items.find((i) => i.equipmentId === eqId);
    if (exists) { setItems((cur) => cur.map((i) => i.equipmentId === eqId ? { ...i, quantity: i.quantity + 1 } : i)); }
    else { setItems((cur) => [...cur, { equipmentId: eqId, quantity: 1 }]); }
  }

  function changeQty(eqId: string, delta: number) {
    setItems((cur) => cur
      .map((i) => i.equipmentId === eqId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
      .filter((i) => i.quantity > 0),
    );
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

        {/* Busca */}
        <input
          value={equipSearch}
          onChange={(e) => setEquipSearch(e.target.value)}
          placeholder="Buscar por nome, SKU ou descrição…"
          style={inputStyle}
        />

        {/* Categoria */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {(['Todas', 'Câmera', 'Sensor', 'Central', 'Acessório'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setEquipCategory(c)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                background: equipCategory === c ? 'rgba(200,169,81,0.12)' : theme.soft,
                border: `1px solid ${equipCategory === c ? theme.gold : theme.border}`,
                color: equipCategory === c ? theme.gold : theme.text,
                fontWeight: equipCategory === c ? 700 : 400,
              }}
            >{c}</button>
          ))}
        </div>

        {/* Tipo de Estoque */}
        {mostrarFiltroEstoque && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: theme.muted, marginRight: 4 }}>Estoque:</span>
            <button
              type="button"
              onClick={() => setCodEstoqueFilter('Todos')}
              style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: codEstoqueFilter === 'Todos' ? 'rgba(200,169,81,0.12)' : theme.soft,
                border: `1px solid ${codEstoqueFilter === 'Todos' ? theme.gold : theme.border}`,
                color: codEstoqueFilter === 'Todos' ? theme.gold : theme.text,
                fontWeight: codEstoqueFilter === 'Todos' ? 700 : 400,
              }}
            >Todos</button>
            {tiposAtivos.map((t) => {
              const active = codEstoqueFilter === t.codEstoque;
              return (
                <button
                  key={t.codEstoque}
                  type="button"
                  onClick={() => setCodEstoqueFilter(t.codEstoque)}
                  style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    background: active ? 'rgba(200,169,81,0.12)' : theme.soft,
                    border: `1px solid ${active ? theme.gold : theme.border}`,
                    color: active ? theme.gold : theme.text,
                    fontWeight: active ? 700 : 400,
                  }}
                >{t.tipoEstoque}</button>
              );
            })}
          </div>
        )}

        {/* Toggle marca + contador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.muted, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlySelectedBrand}
              onChange={(e) => setOnlySelectedBrand(e.target.checked)}
            />
            Só da marca {marca}
          </label>
          <span style={{ color: theme.muted }}>
            {totalFilteredPool === 0 ? 'Nenhum produto' :
              totalFilteredPool > filteredEq.length ? `Exibindo ${filteredEq.length} de ${totalFilteredPool} — refine a busca` :
              `${filteredEq.length} produto${filteredEq.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* Lista de resultados */}
        <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 10 }}>
          {filteredEq.length === 0
            ? <div style={{ padding: 12, textAlign: 'center', color: theme.muted, fontSize: 12 }}>Nenhum equipamento encontrado.</div>
            : filteredEq.map((eq) => (
              <div
                key={eq.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.name}</div>
                  <div style={{ color: theme.muted, fontSize: 11 }}>
                    {eq.sku} · {eq.marca} · {eq.category} · R$ {eq.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addEquipment(eq.id)}
                  style={{ ...btnGold, padding: '4px 10px', fontSize: 12 }}
                >+</button>
              </div>
            ))}
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
                      <td style={tdStyle}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <button type="button" onClick={() => changeQty(item.equipmentId, -1)} style={qtyBtnSmall}>−</button>
                          <span style={{ minWidth: 22, textAlign: 'center' }}>{item.quantity}</span>
                          <button type="button" onClick={() => changeQty(item.equipmentId, +1)} style={qtyBtnSmall}>+</button>
                        </div>
                      </td>
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
const qtyBtnSmall: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, width: 22, height: 22, cursor: 'pointer', fontSize: 12, lineHeight: 1 };
const qtyBtn: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 };
