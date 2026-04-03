'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource, getDataSourceMode } from '../../lib/dataSource/factory';
import { FunnelStats, MateriaisVendidosResult, OrcamentoApiDto, OrcamentoDetalheApiDto } from '../../lib/dataSource/types';
import { mockEquipments, mockOrcamentos, mockPropostas, mockSolucoes } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { loadState, saveState } from '../../services/appState';
import {
  BlocoCategoria, ComodatoConfig, Equipment, FAIXAS_ZONA, FaixaZona,
  INCREMENTO_CAMERA, INCREMENTO_CENTRAL, Marca,
  Orcamento, OrcamentoItem, Proposta, SolucaoTecnica, TipoCentral,
} from '../../types';

/* ---- Helpers ---- */

const blocoLabels: Record<BlocoCategoria, string> = {
  sensor_externo: 'Sensores Externos',
  sensor_interno: 'Sensores Internos',
  sensor_porta_janela: 'Sensores Porta/Janela',
  camera_analogica: 'Câmeras Analógicas',
  camera_ip: 'Câmeras IP',
  camera_ia: 'Câmeras com IA',
  dvr_nvr: 'DVR / NVR',
  modulo_comunicacao: 'Módulo de Comunicação',
  central_alarme: 'Central de Alarme',
  acessorio: 'Acessórios',
};

function getFaixa(zonas: number): FaixaZona {
  return FAIXAS_ZONA.find((f) => zonas >= f.min && zonas <= f.max) ?? FAIXAS_ZONA[FAIXAS_ZONA.length - 1];
}

function calcularOrcamento(zonas: number, subtotalEquip: number, desconto: number) {
  const faixa = getFaixa(zonas);
  const markupEquip = subtotalEquip * (faixa.fator - 1);
  const totalEquip = subtotalEquip + markupEquip;
  const subtotal = totalEquip + faixa.maoDeObra;
  const descontoValor = subtotal * (desconto / 100);
  const totalFinal = subtotal - descontoValor;
  return { faixa, totalEquip, maoDeObra: faixa.maoDeObra, mensalidade: faixa.mensalidade, totalFinal, fator: faixa.fator };
}

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const part = iso.slice(0, 10);
  const [y, m, d] = part.split('-');
  return `${d}/${m}/${y}`;
}

const DB_STATUS_MAP: Record<string, { label: string; color: string }> = {
  A: { label: 'Aberto', color: theme.warning },
  P: { label: 'Aguard. Aprovação', color: '#5B9BD5' },
  L: { label: 'Liberado', color: theme.success },
  E: { label: 'Em Instalação', color: theme.gold },
  F: { label: 'Faturado', color: '#43C17B' },
  C: { label: 'Cancelado', color: theme.danger },
};

type StatusFilter = 'todas' | Orcamento['status'];
type ViewState = 'list' | 'local-detail' | 'db-detail';
type PeriodPreset = '7d' | '30d' | '90d' | 'ano' | 'custom';

type PriceRangeKey = 'todos' | '0-300' | '300-800' | '800-1200' | '1200-2500' | '2500-5000' | '5000+' | 'custom';

const PRICE_RANGES: { key: PriceRangeKey; label: string; min: number; max: number }[] = [
  { key: 'todos', label: 'Todos', min: 0, max: Infinity },
  { key: '0-300', label: 'R$ 0–300', min: 0, max: 300 },
  { key: '300-800', label: 'R$ 300–800', min: 300, max: 800 },
  { key: '800-1200', label: 'R$ 800–1.200', min: 800, max: 1200 },
  { key: '1200-2500', label: 'R$ 1.200–2.500', min: 1200, max: 2500 },
  { key: '2500-5000', label: 'R$ 2.500–5.000', min: 2500, max: 5000 },
  { key: '5000+', label: 'R$ 5.000+', min: 5000, max: Infinity },
  { key: 'custom', label: 'Personalizado', min: 0, max: Infinity },
];

function matchPriceRange(total: number, range: PriceRangeKey, customMin: string, customMax: string): boolean {
  if (range === 'todos') return true;
  if (range === 'custom') {
    const min = customMin ? Number(customMin) : 0;
    const max = customMax ? Number(customMax) : Infinity;
    return total >= min && total <= max;
  }
  const config = PRICE_RANGES.find((r) => r.key === range);
  if (!config) return true;
  return total >= config.min && total <= config.max;
}

function getDateRange(preset: PeriodPreset, start: string, end: string): { dataInicio?: string; dataFim?: string } {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  switch (preset) {
    case '7d':  { const d = new Date(today); d.setDate(d.getDate() - 7);  return { dataInicio: iso(d), dataFim: iso(today) }; }
    case '30d': { const d = new Date(today); d.setDate(d.getDate() - 30); return { dataInicio: iso(d), dataFim: iso(today) }; }
    case '90d': { const d = new Date(today); d.setDate(d.getDate() - 90); return { dataInicio: iso(d), dataFim: iso(today) }; }
    case 'ano': return { dataInicio: `${today.getFullYear()}-01-01`, dataFim: iso(today) };
    case 'custom': return { dataInicio: start || undefined, dataFim: end || undefined };
    default: return {};
  }
}

/* ---- Main Component ---- */

export function OrcamentosPage() {
  const { showToast } = useToast();
  const { role } = useAuth();

  // Local (generated from SolucaoTecnica flow)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [solucoes, setSolucoes] = useState<SolucaoTecnica[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [precosCusto, setPrecosCusto] = useState<Record<string, number>>({});

  // DB orçamentos
  const isRealData = getDataSourceMode() === 'api';
  const [dbOrcamentos, setDbOrcamentos] = useState<OrcamentoApiDto[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // searchTrigger: incrementa para disparar busca manualmente
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [materiaisVendidos, setMateriaisVendidos] = useState<MateriaisVendidosResult | null>(null);
  const [materiaisLoading, setMateriaisLoading] = useState(false);
  type DbStatusTab = 'todos' | 'F' | 'L' | 'P' | 'E' | 'A' | 'C';
  const [dbStatusTab, setDbStatusTab] = useState<DbStatusTab>('todos');

  // Filtro de faixa de preço
  type PriceRange = 'todos' | '0-300' | '300-800' | '800-1200' | '1200-2500' | '2500-5000' | '5000+' | 'custom';
  const [priceRange, setPriceRange] = useState<PriceRange>('todos');
  const [customPriceMin, setCustomPriceMin] = useState('');
  const [customPriceMax, setCustomPriceMax] = useState('');

  const [view, setView] = useState<ViewState>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDbOrc, setSelectedDbOrc] = useState<OrcamentoDetalheApiDto | null>(null);
  const [dbDetailLoading, setDbDetailLoading] = useState(false);
  const [showSolucaoModal, setShowSolucaoModal] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('todas');

  // Load local data + precos de custo
  useEffect(() => {
    setOrcamentos(loadMock('mock_orcamentos', mockOrcamentos));
    setSolucoes(loadMock('mock_solucoes', mockSolucoes));
    setEquipments(loadMock('mock_equipments', mockEquipments));
    setPropostas(loadMock('mock_propostas', mockPropostas));
    loadState<Record<string, number>>('config:precos_custo', {}).then(setPrecosCusto);

    // Auto-open from query param
    const params = new URLSearchParams(window.location.search);
    const solId = params.get('solucaoId');
    if (solId) {
      setTimeout(async () => {
        const sols = loadMock('mock_solucoes', mockSolucoes);
        const eqs = loadMock('mock_equipments', mockEquipments);
        const custoMap = await loadState<Record<string, number>>('config:precos_custo', {});
        const sol = sols.find((s: SolucaoTecnica) => s.id === solId && s.status === 'enviada');
        if (sol) {
          const orc = gerarOrcamentoDeSolucao(sol, eqs, custoMap);
          setOrcamentos((cur) => {
            const updated = [...cur, orc];
            saveMock('mock_orcamentos', updated);
            return updated;
          });
          setSelectedId(orc.id);
          setView('local-detail');
          window.history.replaceState({}, '', '/orcamentos');
        }
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dispara busca: presets disparam direto; custom só via botão Consultar
  function handlePresetChange(p: PeriodPreset) {
    setPeriodPreset(p);
    if (p !== 'custom') setSearchTrigger((n) => n + 1);
  }
  function handleConsultar() {
    setSearchTrigger((n) => n + 1);
  }

  // Load DB orçamentos + funil (recarrega ao mudar searchTrigger ou preset não-custom)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setDbLoading(true);
      if (isRealData) setFunnelLoading(true);
      try {
        const ds = createDataSource();
        const range = getDateRange(periodPreset, customStart, customEnd);
        const [result, funnel] = await Promise.all([
          ds.orcamentos.list({ page: 1, pageSize: 500, ...range }),
          isRealData ? ds.orcamentos.getFunnel(range) : Promise.resolve(null),
        ]);
        if (!cancelled) {
          setDbOrcamentos(result.data);
          setFunnelStats(funnel);
        }
      } catch (err) {
        console.error('[Orçamentos] Erro ao carregar:', err);
        if (!cancelled) { setDbOrcamentos([]); setFunnelStats(null); }
      } finally {
        if (!cancelled) { setDbLoading(false); setFunnelLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger]);

  // Load materiais vendidos separadamente (não bloqueia a listagem principal)
  useEffect(() => {
    if (!isRealData) return;
    let cancelled = false;
    async function loadMateriais() {
      setMateriaisLoading(true);
      try {
        const ds = createDataSource();
        const range = getDateRange(periodPreset, customStart, customEnd);
        const result = await ds.orcamentos.getMateriaisVendidos(range);
        if (!cancelled) setMateriaisVendidos(result);
      } catch (err) {
        console.error('[Orçamentos] Erro ao carregar materiais:', err);
        if (!cancelled) setMateriaisVendidos(null);
      } finally {
        if (!cancelled) setMateriaisLoading(false);
      }
    }
    loadMateriais();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger]);

  useEffect(() => { saveMock('mock_orcamentos', orcamentos); }, [orcamentos]);
  useEffect(() => { saveMock('mock_solucoes', solucoes); }, [solucoes]);
  useEffect(() => { saveMock('mock_propostas', propostas); }, [propostas]);

  function gerarOrcamentoDeSolucao(sol: SolucaoTecnica, eqs: Equipment[], custoMap: Record<string, number>): Orcamento {
    const itens: OrcamentoItem[] = [];
    for (const bloco of sol.blocos) {
      for (const item of bloco.itens) {
        const eq = eqs.find((e) => e.id === item.equipmentId);
        if (!eq) continue;
        const custo = custoMap[item.equipmentId] ?? 0;
        itens.push({
          equipmentId: item.equipmentId,
          nome: eq.name,
          quantidade: item.quantidade,
          precoUnitario: eq.price,
          precoCusto: custo,
          subtotal: eq.price * item.quantidade,
          subtotalCusto: custo * item.quantidade,
          bloco: bloco.categoria,
        });
      }
    }

    const subtotalEquip = itens.reduce((s, i) => s + i.subtotal, 0);
    const subtotalCusto = itens.reduce((s, i) => s + i.subtotalCusto, 0);
    const zonas = 4;
    const desconto = 0;
    const calc = calcularOrcamento(zonas, subtotalEquip, desconto);

    const numCameras = itens
      .filter((i) => ['camera_analogica', 'camera_ip', 'camera_ia'].includes(i.bloco))
      .reduce((s, i) => s + i.quantidade, 0);

    return {
      id: 'ORC' + Date.now(),
      numero: Date.now() % 10000,
      solucaoId: sol.id,
      leadId: sol.leadId,
      clienteNome: sol.clienteNome,
      marca: sol.marca,
      zonas,
      itens,
      subtotalEquipamentos: subtotalEquip,
      subtotalCusto,
      fatorZona: calc.fator,
      totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra,
      mensalidade: calc.mensalidade,
      desconto,
      totalFinal: calc.totalFinal,
      observacoes: '',
      status: 'rascunho',
      createdAt: new Date().toISOString().slice(0, 10),
      modalidade: 'venda',
      comodato: { prazo: 36, numCameras, tipoCentral: zonas <= 4 ? 'pequena' : zonas <= 12 ? 'media' : 'grande' },
    };
  }

  function handleGerarFromModal(sol: SolucaoTecnica) {
    const orc = gerarOrcamentoDeSolucao(sol, equipments, precosCusto);
    setOrcamentos((cur) => [...cur, orc]);
    setShowSolucaoModal(false);
    setSelectedId(orc.id);
    setView('local-detail');
    showToast('Orçamento gerado a partir da solução.', 'success');
  }

  function handleSaveOrcamento(orc: Orcamento) {
    setOrcamentos((cur) => cur.map((o) => o.id === orc.id ? orc : o));
    showToast('Orçamento salvo.', 'success');
  }

  async function handleOpenDbOrc(orc: OrcamentoApiDto) {
    setDbDetailLoading(true);
    try {
      const ds = createDataSource();
      const detalhe = await ds.orcamentos.getById(orc.codInterno);
      setSelectedDbOrc(detalhe ?? { ...orc, produtos: [], servicosAdicionais: [] });
    } catch {
      setSelectedDbOrc({ ...orc, produtos: [], servicosAdicionais: [] });
    } finally {
      setDbDetailLoading(false);
    }
    setView('db-detail');
  }

  function handleGerarProposta(orc: Orcamento) {
    const propostaItens = orc.itens.map((i) => ({
      equipamentoId: i.equipmentId,
      nome: i.nome,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
    }));

    const novaProposta: Proposta = {
      id: 'PR' + Date.now(),
      orcamentoId: orc.id,
      leadId: orc.leadId,
      leadNome: orc.clienteNome,
      itens: propostaItens,
      servicos: [
        { descricao: 'Instalação + Configuração', valor: orc.maoDeObra, tipo: 'instalacao' },
        { descricao: 'Monitoramento 24h (mensal)', valor: orc.mensalidade, tipo: 'mensalidade' },
      ],
      total: orc.totalFinal + orc.mensalidade,
      observacoes: orc.observacoes || 'Gerada automaticamente a partir do orçamento.',
      status: 'gerada',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setPropostas((cur) => [...cur, novaProposta]);

    const updatedOrc: Orcamento = { ...orc, status: 'escolhido' };
    setOrcamentos((cur) => cur.map((o) => o.id === orc.id ? updatedOrc : o));

    setSelectedId(updatedOrc.id);
    showToast('Proposta gerada! Acesse a aba Propostas.', 'success');
  }

  const filteredLocal = filter === 'todas' ? orcamentos : orcamentos.filter((o) => o.status === filter);
  const selectedLocal = orcamentos.find((o) => o.id === selectedId) ?? null;

  // Detail views
  if (view === 'local-detail' && selectedLocal) {
    return (
      <AppShell title="Detalhe do Orçamento">
        <OrcamentoDetail
          orcamento={selectedLocal}
          onSave={handleSaveOrcamento}
          onGerarProposta={handleGerarProposta}
          onBack={() => { setView('list'); setSelectedId(null); }}
          precosCusto={precosCusto}
          onSavePrecosCusto={(map) => { setPrecosCusto(map); saveState('config:precos_custo', map); }}
        />
      </AppShell>
    );
  }

  if (view === 'db-detail' && selectedDbOrc) {
    return (
      <AppShell title="Orçamento do Sistema">
        <OrcamentoDbDetail
          orc={selectedDbOrc}
          onBack={() => { setView('list'); setSelectedDbOrc(null); }}
        />
      </AppShell>
    );
  }

  const showDbSection = isRealData && (dbLoading || dbOrcamentos.length > 0);

  return (
    <AppShell title="Orçamentos">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setShowSolucaoModal(true)} style={btnGold}>+ Gerar a partir de Solução</button>
        <div style={{ flex: 1 }} />
        {(['todas', 'rascunho', 'finalizado', 'escolhido'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...btnSmall,
              borderColor: filter === f ? theme.gold : theme.border,
              color: filter === f ? theme.gold : theme.text,
              background: filter === f ? 'rgba(200,169,81,0.1)' : 'transparent',
            }}
          >
            {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Filtro de período (só dados reais) */}
      {isRealData && (
        <PeriodFilter
          preset={periodPreset}
          onPresetChange={handlePresetChange}
          customStart={customStart}
          onCustomStartChange={setCustomStart}
          customEnd={customEnd}
          onCustomEndChange={setCustomEnd}
          onConsultar={handleConsultar}
        />
      )}

      {/* Funil de Vendas */}
      {isRealData && (funnelLoading || funnelStats) && (
        <FunnelCard stats={funnelStats} loading={funnelLoading} />
      )}

      {/* DB orçamentos section — agrupados por status */}
      {showDbSection && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: theme.gold, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Do Sistema
            </span>
            {dbLoading ? (
              <span style={{ fontSize: 11, color: theme.muted }}>carregando...</span>
            ) : (
              <span style={{ fontSize: 11, color: theme.muted }}>{dbOrcamentos.length} registros</span>
            )}
          </div>

          {/* Status tabs */}
          {!dbLoading && dbOrcamentos.length > 0 && (
            <DbStatusTabs
              orcamentos={dbOrcamentos}
              activeTab={dbStatusTab}
              onTabChange={setDbStatusTab}
            />
          )}

          {!dbLoading && dbOrcamentos.length === 0 && (
            <div style={{ fontSize: 13, color: theme.muted, padding: '8px 0' }}>Nenhum orçamento encontrado no banco.</div>
          )}

          {/* Filtro de faixa de preço */}
          {!dbLoading && dbOrcamentos.length > 0 && (
            <PriceRangeFilter
              value={priceRange}
              onChange={setPriceRange}
              customMin={customPriceMin}
              onCustomMinChange={setCustomPriceMin}
              customMax={customPriceMax}
              onCustomMaxChange={setCustomPriceMax}
              orcamentos={dbOrcamentos.filter((o) => dbStatusTab === 'todos' || o.status === dbStatusTab)}
            />
          )}

          {dbDetailLoading && (
            <div style={{ fontSize: 12, color: theme.gold, padding: '4px 0 8px' }}>Carregando detalhes…</div>
          )}

          {/* Resumo de materiais — visível nas abas Faturados, Liberados ou Em Instalação */}
          {(dbStatusTab === 'F' || dbStatusTab === 'L' || dbStatusTab === 'E') && materiaisVendidos && !materiaisLoading && materiaisVendidos.produtos.length > 0 && (
            <TopProdutosRanking materiais={materiaisVendidos} />
          )}
          {(dbStatusTab === 'F' || dbStatusTab === 'L' || dbStatusTab === 'E') && materiaisLoading && (
            <div style={{ fontSize: 12, color: theme.muted, padding: '8px 0' }}>Carregando materiais…</div>
          )}

          {/* Filtered orc list */}
          {(() => {
            const filtered = dbOrcamentos
              .filter((orc) => dbStatusTab === 'todos' || orc.status === dbStatusTab)
              .filter((orc) => {
                const total = (Number(orc.totalProdutos) || 0) + (Number(orc.totalServicos) || 0);
                return matchPriceRange(total, priceRange, customPriceMin, customPriceMax);
              });
            const faixaLabel = priceRange !== 'todos'
              ? ` na faixa ${priceRange === 'custom' ? `R$ ${customPriceMin || '0'} – R$ ${customPriceMax || '∞'}` : `R$ ${priceRange.replace('-', ' – R$ ').replace('+', '+')}`}`
              : '';
            return (
              <>
                {filtered.length > 0 && (
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>
                    {filtered.length} orçamento{filtered.length !== 1 ? 's' : ''}{faixaLabel}
                  </div>
                )}
                <div style={{ display: 'grid', gap: 10 }}>
                  {filtered.map((orc) => {
                    const total = (Number(orc.totalProdutos) || 0) + (Number(orc.totalServicos) || 0);
                    const statusInfo = DB_STATUS_MAP[orc.status ?? ''] ?? { label: orc.status ?? '?', color: theme.muted };
                    return (
                      <div
                        key={orc.codInterno}
                        onClick={() => handleOpenDbOrc(orc)}
                        style={{
                          background: theme.panel,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 10,
                          padding: 14,
                          cursor: 'pointer',
                          transition: 'border-color 140ms',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: 15 }}>{orc.clienteNome || '—'}</strong>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                              background: 'rgba(200,169,81,0.15)', color: theme.gold, border: `1px solid ${theme.gold}44`,
                              letterSpacing: 0.5,
                            }}>BD</span>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 999,
                              background: statusInfo.color + '22', color: statusInfo.color,
                              border: `1px solid ${statusInfo.color}44`,
                            }}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                          {orc.numOrcamento && (
                            <span style={{ fontSize: 12, color: theme.muted }}>Nº {orc.numOrcamento}</span>
                          )}
                          {(orc.cidade || orc.uf) && (
                            <span style={{ fontSize: 12, color: theme.muted }}>
                              {[orc.cidade, orc.uf].filter(Boolean).join('/')}
                            </span>
                          )}
                          {orc.etapa && (
                            <span style={{ fontSize: 12, color: theme.muted }}>Etapa: {orc.etapa}</span>
                          )}
                          {orc.modalidade && (
                            <span style={{ fontSize: 12, color: theme.muted }}>{orc.modalidade}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: theme.gold }}>
                            R$ {formatCurrency(total)}
                          </span>
                          <span style={{ fontSize: 12, color: theme.muted }}>{formatDate(orc.emissao)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Empty state */}
                {filtered.length === 0 && !dbLoading && (
                  <div style={{ fontSize: 13, color: theme.muted, padding: '12px 0' }}>
                    Nenhum orçamento encontrado{dbStatusTab !== 'todos' ? ` com status "${DB_STATUS_MAP[dbStatusTab]?.label ?? dbStatusTab}"` : ''}{faixaLabel}.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Local orçamentos section */}
      {showDbSection && orcamentos.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Gerados Localmente
          </span>
        </div>
      )}

      {filteredLocal.length === 0 && !showDbSection && (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          Nenhum orçamento {filter !== 'todas' ? `com status "${filter}"` : 'criado'}. Gere um a partir de uma Solução Técnica aprovada.
        </div>
      )}

      {filteredLocal.length === 0 && showDbSection && filter !== 'todas' && (
        <div style={{ fontSize: 13, color: theme.muted, padding: '4px 0 12px' }}>
          Nenhum orçamento local com status "{filter}".
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {filteredLocal.map((orc) => {
          const faixa = getFaixa(orc.zonas);
          return (
            <div
              key={orc.id}
              onClick={() => { setSelectedId(orc.id); setView('local-detail'); }}
              style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'border-color 140ms' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>{orc.clienteNome}</strong>
                <OrcamentoStatusBadge status={orc.status} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <MarcaBadge marca={orc.marca} />
                <FaixaBadge label={faixa.label} />
                <span style={{ fontSize: 12, color: theme.muted }}>{orc.zonas} zona{orc.zonas !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: 12, color: theme.muted }}>{orc.itens.length} itens</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: theme.gold }}>R$ {formatCurrency(orc.totalFinal)}</span>
                <span style={{ fontSize: 12, color: theme.muted }}>{formatDate(orc.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Selecionar Solução */}
      {showSolucaoModal && (
        <SolucaoSelectorModal
          solucoes={solucoes.filter((s) => s.status === 'enviada')}
          onSelect={handleGerarFromModal}
          onClose={() => setShowSolucaoModal(false)}
        />
      )}
    </AppShell>
  );
}

/* ---- Period Filter ---- */

function PeriodFilter({
  preset, onPresetChange, customStart, onCustomStartChange, customEnd, onCustomEndChange, onConsultar,
}: {
  preset: PeriodPreset;
  onPresetChange: (p: PeriodPreset) => void;
  customStart: string;
  onCustomStartChange: (v: string) => void;
  customEnd: string;
  onCustomEndChange: (v: string) => void;
  onConsultar: () => void;
}) {
  const labels: Record<PeriodPreset, string> = {
    '7d': '7 dias', '30d': '30 dias', '90d': '90 dias', 'ano': 'Este ano', 'custom': 'Personalizado',
  };
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
      <span style={{ fontSize: 11, color: theme.muted, marginRight: 2 }}>Período:</span>
      {(['7d', '30d', '90d', 'ano', 'custom'] as PeriodPreset[]).map((p) => (
        <button
          key={p}
          onClick={() => onPresetChange(p)}
          style={{
            ...btnSmall,
            borderColor: preset === p ? theme.gold : theme.border,
            color: preset === p ? theme.gold : theme.text,
            background: preset === p ? 'rgba(200,169,81,0.1)' : 'transparent',
          }}
        >
          {labels[p]}
        </button>
      ))}
      {preset === 'custom' && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            style={{ background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12 }}
          />
          <span style={{ fontSize: 12, color: theme.muted }}>até</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            style={{ background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12 }}
          />
          <button
            onClick={onConsultar}
            disabled={!customStart || !customEnd}
            style={{
              background: theme.gold,
              border: 'none',
              borderRadius: 6,
              color: '#111',
              padding: '5px 14px',
              cursor: customStart && customEnd ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: 12,
              opacity: customStart && customEnd ? 1 : 0.5,
            }}
          >
            Consultar
          </button>
        </>
      )}
    </div>
  );
}

/* ---- Funnel Card ---- */

function KpiChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 10px' }}>
      <div style={{ fontSize: 10, color: theme.muted, marginBottom: 2, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{value}</div>
    </div>
  );
}

function FunnelCard({ stats, loading }: { stats: FunnelStats | null; loading: boolean }) {
  if (loading && !stats) {
    return (
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: theme.muted }}>Carregando funil de vendas…</div>
      </div>
    );
  }
  if (!stats) return null;

  const stages = [
    { label: 'Prospects cadastrados', count: stats.prospects, color: '#5B9BD5' },
    { label: 'Orçamentos emitidos', count: stats.totalOrcamentos, color: theme.gold },
    { label: 'Em negociação (Abertos)', count: stats.abertos, color: theme.warning },
    { label: 'Aguardando aprovação', count: stats.emAprovacao, color: '#7B9BD5' },
    { label: 'Liberados', count: stats.liberados, color: theme.success },
    { label: 'Em instalação', count: stats.emInstalacao, color: '#C8A951' },
    { label: 'Faturados', count: stats.faturados, color: '#43C17B' },
    { label: 'Cancelados', count: stats.cancelados, color: theme.danger },
  ];

  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: theme.gold, fontWeight: 600 }}>Funil de Vendas</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: theme.soft, borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
          <KpiChip label="Conversão" value={`${stats.taxaConversao}%`} />
          <div style={{ width: 1, background: theme.border, alignSelf: 'stretch' }} />
          <KpiChip label="Ticket Médio Equip." value={`R$ ${formatCurrency(stats.ticketMedioEquip)}`} />
          <div style={{ width: 1, background: theme.border, alignSelf: 'stretch' }} />
          <KpiChip label="Mensalidade Média" value={`R$ ${formatCurrency(stats.ticketMedioMensal)}`} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {stages.map((stage) => {
          const widthPct = Math.max(3, Math.round((stage.count / max) * 100));
          return (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 190, fontSize: 11, color: theme.muted, flexShrink: 0, textAlign: 'right', lineHeight: 1.3 }}>
                {stage.label}
              </div>
              <div style={{ flex: 1, background: theme.soft, borderRadius: 4, height: 24, overflow: 'hidden', minWidth: 0 }}>
                <div style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: stage.count === 0 ? 'rgba(255,255,255,0.04)' : stage.color + 'bb',
                  borderRadius: 4,
                  transition: 'width 500ms ease',
                }} />
              </div>
              <div style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 600, flexShrink: 0, color: stage.count > 0 ? stage.color : theme.muted }}>
                {stage.count}
              </div>
            </div>
          );
        })}
      </div>

      {stats.avancados > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted }}>
          <span style={{ color: theme.success, fontWeight: 600 }}>{stats.avancados}</span> orçamentos fechados (Faturados + Liberados + Em Instalação) de {stats.totalOrcamentos} emitidos no período.
        </div>
      )}
    </div>
  );
}

/* ---- DB Orçamento Detail (read-only, com itens) ---- */

function OrcamentoDbDetail({ orc, onBack }: { orc: OrcamentoDetalheApiDto; onBack: () => void }) {
  const totalEquip = orc.totalProdutos ?? 0;
  const totalServ = orc.totalServicos ?? 0;
  const totalGeral = totalEquip + totalServ;
  const mensalidade = orc.valorMonitoramento ?? 0;
  const statusInfo = DB_STATUS_MAP[orc.status ?? ''] ?? { label: orc.status ?? '—', color: theme.muted };

  const MODALIDADE_LABELS: Record<string, string> = { V: 'Venda', L: 'Locação/Comodato', R: 'Rastreamento' };

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={onBack} style={{ ...btnSoft, padding: '5px 10px', fontSize: 12 }}>← Voltar</button>
        <strong style={{ fontSize: 16 }}>{orc.clienteNome || '—'}</strong>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          background: 'rgba(200,169,81,0.15)', color: theme.gold, border: `1px solid ${theme.gold}44`,
          letterSpacing: 0.5,
        }}>BD</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
          background: statusInfo.color + '22', color: statusInfo.color,
          border: `1px solid ${statusInfo.color}44`, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {statusInfo.label}
        </span>
        <span style={{ fontSize: 12, color: theme.muted, marginLeft: 'auto' }}>
          Nº {orc.numOrcamento || orc.codInterno}
        </span>
      </div>

      {/* Info grid */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, color: theme.gold }}>Dados do Orçamento</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
          <InfoRow label="Cliente" value={orc.clienteNome} />
          <InfoRow label="CPF/CNPJ" value={orc.cgcCpf} />
          <InfoRow label="Cidade/UF" value={[orc.cidade, orc.uf].filter(Boolean).join(' — ')} />
          <InfoRow label="Modalidade" value={orc.modalidade ? (MODALIDADE_LABELS[orc.modalidade] ?? orc.modalidade) : null} />
          <InfoRow label="Etapa" value={orc.etapa} />
          <InfoRow label="Probabilidade" value={orc.probabilidade != null ? `${orc.probabilidade}%` : null} />
          <InfoRow label="Emissão" value={formatDate(orc.emissao)} />
          <InfoRow label="Validade" value={formatDate(orc.validade)} />
          {orc.fechamento && <InfoRow label="Fechamento" value={formatDate(orc.fechamento)} />}
          {orc.pontos != null && <InfoRow label="Pontos monitorados" value={String(orc.pontos)} />}
        </div>
      </div>

      {/* Tabela de produtos */}
      {orc.produtos.length > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, color: theme.gold }}>
            Produtos / Equipamentos ({orc.produtos.length} itens)
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
              <thead>
                <tr>
                  {['Descrição', 'Qtd', 'Unit.', 'Total'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orc.produtos.map((p) => {
                  const qtd = Number(p.quantidade ?? 0);
                  const unit = Number(p.liquido ?? p.unitario ?? 0); // liquido = com desconto
                  const tot = Number(p.total ?? 0);
                  return (
                    <tr key={p.codInterno}>
                      <td style={tdStyle}>{p.descricao || `Produto ${p.codProduto}`}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{qtd}</td>
                      <td style={tdStyle}>R$ {formatCurrency(unit)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>R$ {formatCurrency(tot || unit * qtd)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontSize: 12, color: theme.muted }}>
                    Subtotal produtos
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>
                    R$ {formatCurrency(totalEquip)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tabela de serviços (mão de obra, mensalidades etc.) */}
      {orc.servicosAdicionais.length > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, color: theme.gold }}>
            Serviços Adicionais ({orc.servicosAdicionais.length} itens)
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Serviço', 'Qtd', 'Valor Mensal'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orc.servicosAdicionais.map((s) => {
                const qtd = Number(s.quantidade ?? 1);
                const val = Number(s.valorServico ?? 0);
                return (
                  <tr key={s.codInterno}>
                    <td style={tdStyle}>{s.observacoes || `Serviço ${s.codServico ?? s.codInterno}`}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{qtd}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>R$ {formatCurrency(val * qtd)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontSize: 12, color: theme.muted }}>
                  Subtotal serviços
                </td>
                <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>
                  R$ {formatCurrency(totalServ)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Resumo financeiro final */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(200,169,81,0.08), rgba(200,169,81,0.02))',
        border: `2px solid ${theme.gold}44`,
        borderRadius: 12, padding: 16, marginBottom: 14,
      }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, color: theme.gold }}>Resumo Financeiro</h4>
        {totalEquip > 0 && <DbCostLine label="Equipamentos" value={totalEquip} />}
        {totalServ > 0 && <DbCostLine label="Serviços / Mão de obra" value={totalServ} />}
        <div style={{ borderTop: `2px solid ${theme.gold}`, margin: '10px 0 8px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>TOTAL GERAL</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: theme.gold }}>R$ {formatCurrency(totalGeral)}</span>
        </div>
        {mensalidade > 0 && (
          <>
            <div style={{ borderTop: `1px solid ${theme.border}`, margin: '4px 0 8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: theme.muted }}>Mensalidade de monitoramento</span>
              <span style={{ fontSize: 16, fontWeight: 600 }}>R$ {formatCurrency(mensalidade)}<span style={{ fontSize: 11, color: theme.muted }}>/mês</span></span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onBack} style={btnSoft}>Voltar</button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 11, color: theme.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function DbCostLine({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: theme.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>R$ {formatCurrency(value)}</span>
    </div>
  );
}

/* ---- Solução Selector Modal ---- */

function SolucaoSelectorModal({ solucoes, onSelect, onClose }: {
  solucoes: SolucaoTecnica[];
  onSelect: (sol: SolucaoTecnica) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14,
        padding: 20, zIndex: 51, width: '90%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Selecionar Solução Aprovada</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Fechar</button>
        </div>

        {solucoes.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.muted, padding: 24, fontSize: 13 }}>
            Nenhuma solução com status "aprovada" disponível.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {solucoes.map((sol) => {
              const totalItens = sol.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0);
              return (
                <div key={sol.id} style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 14 }}>{sol.clienteNome}</strong>
                    <MarcaBadge marca={sol.marca} />
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                    {totalItens} itens · ID: {sol.id} · {formatDate(sol.createdAt)}
                  </div>
                  <button onClick={() => onSelect(sol)} style={{ ...btnGold, marginTop: 8, fontSize: 12, padding: '6px 12px' }}>
                    Gerar Orçamento
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* ---- Orcamento Detail/Edit (local records) ---- */

function OrcamentoDetail({ orcamento, onSave, onGerarProposta, onBack, precosCusto, onSavePrecosCusto }: {
  orcamento: Orcamento;
  onSave: (orc: Orcamento) => void;
  onGerarProposta: (orc: Orcamento) => void;
  onBack: () => void;
  precosCusto: Record<string, number>;
  onSavePrecosCusto: (map: Record<string, number>) => void;
}) {
  const { role } = useAuth();
  const [zonas, setZonas] = useState(orcamento.zonas);
  const [desconto, setDesconto] = useState(orcamento.desconto);
  const [observacoes, setObservacoes] = useState(orcamento.observacoes);
  const [modalidade, setModalidade] = useState<'venda' | 'comodato'>(orcamento.modalidade ?? 'venda');
  const [prazo, setPrazo] = useState<24 | 36 | 48>(orcamento.comodato?.prazo ?? 36);
  const [numCameras, setNumCameras] = useState(orcamento.comodato?.numCameras ?? 0);
  const [tipoCentral, setTipoCentral] = useState<TipoCentral>(orcamento.comodato?.tipoCentral ?? 'pequena');
  const [showCustoEdit, setShowCustoEdit] = useState(false);
  const [localCustos, setLocalCustos] = useState<Record<string, number>>({ ...precosCusto });

  const subtotalEquip = orcamento.subtotalEquipamentos;
  const subtotalCusto = orcamento.itens.reduce((s, i) => s + (localCustos[i.equipmentId] ?? i.precoCusto ?? 0) * i.quantidade, 0);
  const calc = calcularOrcamento(zonas, subtotalEquip, desconto);
  const faixa = calc.faixa;

  const isProposta = orcamento.status === 'escolhido';
  const isAdmin = role === 'ADMIN';

  // Auto-count cameras on mount
  useMemo(() => {
    if (orcamento.comodato?.numCameras === undefined || orcamento.comodato?.numCameras === 0) {
      const count = orcamento.itens
        .filter((i) => ['camera_analogica', 'camera_ip', 'camera_ia'].includes(i.bloco))
        .reduce((s, i) => s + i.quantidade, 0);
      if (count > 0) setNumCameras(count);
    }
  }, [orcamento.itens, orcamento.comodato?.numCameras]);

  // Comodato calculations
  const parcelaEquip = subtotalCusto > 0 ? subtotalCusto / prazo : 0;
  const monitoramentoBase = faixa.mensalidade;
  const incrementoCam = Math.max(0, numCameras - 4) * INCREMENTO_CAMERA;
  const incrementoCen = INCREMENTO_CENTRAL[tipoCentral];
  const mensalidadeComodato = parcelaEquip + monitoramentoBase + incrementoCam + incrementoCen;

  // Compra: custo total no prazo = investimento único + mensalidade * prazo
  const custoCompraTotal = calc.totalFinal + (calc.mensalidade * prazo);
  const custoComodatoTotal = mensalidadeComodato * prazo;

  // Margem
  const margemPct = subtotalEquip > 0 ? ((subtotalEquip - subtotalCusto) / subtotalEquip) * 100 : 0;

  function buildOrc(): Orcamento {
    return {
      ...orcamento,
      zonas, desconto, observacoes,
      subtotalCusto,
      fatorZona: calc.fator,
      totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra,
      mensalidade: calc.mensalidade,
      totalFinal: calc.totalFinal,
      modalidade,
      comodato: { prazo, numCameras, tipoCentral },
    };
  }

  function handleSalvar() {
    onSave({ ...buildOrc(), status: orcamento.status === 'rascunho' ? 'finalizado' : orcamento.status });
  }

  function handleGerarProposta() {
    onGerarProposta(buildOrc());
  }

  function handleSaveCustos() {
    onSavePrecosCusto(localCustos);
    setShowCustoEdit(false);
  }

  // Group items by bloco
  const blocoGroups: { bloco: BlocoCategoria; items: OrcamentoItem[] }[] = [];
  for (const item of orcamento.itens) {
    const existing = blocoGroups.find((g) => g.bloco === item.bloco);
    if (existing) existing.items.push(item);
    else blocoGroups.push({ bloco: item.bloco, items: [item] });
  }

  const markupEquip = subtotalEquip * (calc.fator - 1);
  const subtotalGeral = calc.totalEquip + calc.maoDeObra;
  const descontoValor = subtotalGeral * (desconto / 100);

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <strong style={{ fontSize: 16 }}>{orcamento.clienteNome}</strong>
        <MarcaBadge marca={orcamento.marca} />
        <OrcamentoStatusBadge status={orcamento.status} />
        <span style={{ fontSize: 12, color: theme.muted }}>Solução: {orcamento.solucaoId}</span>
      </div>

      {/* Modalidade Toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        {(['venda', 'comodato'] as const).map((m) => (
          <button
            key={m}
            onClick={() => !isProposta && setModalidade(m)}
            disabled={isProposta}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: isProposta ? 'default' : 'pointer',
              fontWeight: 700, fontSize: 14,
              background: modalidade === m ? (m === 'venda' ? theme.gold : '#5B9BD5') : theme.soft,
              color: modalidade === m ? '#0B0B0B' : theme.text,
              transition: 'all 0.15s',
            }}
          >
            {m === 'venda' ? 'Compra' : 'Comodato'}
          </button>
        ))}

        {modalidade === 'comodato' && (
          <>
            <span style={{ fontSize: 12, color: theme.muted, marginLeft: 8 }}>Prazo:</span>
            {([24, 36, 48] as const).map((p) => (
              <button
                key={p}
                onClick={() => !isProposta && setPrazo(p)}
                disabled={isProposta}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: isProposta ? 'default' : 'pointer',
                  fontWeight: 600, fontSize: 13,
                  background: prazo === p ? '#5B9BD5' : theme.soft,
                  color: prazo === p ? '#0B0B0B' : theme.text,
                }}
              >
                {p}m
              </button>
            ))}
          </>
        )}
      </div>

      {/* Zonas */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 4 }}>Número de Zonas</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number" min={1} max={50} value={zonas}
                onChange={(e) => setZonas(Math.max(1, Math.min(50, Number(e.target.value))))}
                disabled={isProposta}
                style={{ ...inputStyle, width: 80, marginBottom: 0, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
              />
              <span style={{ fontSize: 13, color: theme.muted }}>ambientes monitorados</span>
            </div>
          </div>
          <FaixaBadge label={faixa.label} large />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: theme.muted }}>
          Faixa {faixa.label} ({faixa.min}–{faixa.max === Infinity ? '∞' : faixa.max} zonas) — Fator {faixa.fator}x · Mão de obra R$ {formatCurrency(faixa.maoDeObra)} · Monitoramento R$ {formatCurrency(faixa.mensalidade)}/mês
        </div>
      </div>

      {/* Comodato controls */}
      {modalidade === 'comodato' && (
        <div style={{ background: theme.panel, border: `1px solid #5B9BD533`, borderRadius: 10, padding: 14, marginBottom: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 4 }}>Nº de Câmeras</label>
            <input
              type="number" min={0} max={100} value={numCameras}
              onChange={(e) => setNumCameras(Math.max(0, Number(e.target.value)))}
              disabled={isProposta}
              style={{ ...inputStyle, width: 80, marginBottom: 0, textAlign: 'center', fontSize: 16, fontWeight: 700 }}
            />
            {numCameras > 4 && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#5B9BD5' }}>+{numCameras - 4} câm. × R${INCREMENTO_CAMERA} = R${formatCurrency(incrementoCam)}/mês</p>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 4 }}>Tipo de Central</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['pequena', 'media', 'grande'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => !isProposta && setTipoCentral(t)}
                  disabled={isProposta}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', cursor: isProposta ? 'default' : 'pointer',
                    fontWeight: 600, fontSize: 12,
                    background: tipoCentral === t ? '#5B9BD5' : theme.soft,
                    color: tipoCentral === t ? '#0B0B0B' : theme.text,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}{INCREMENTO_CENTRAL[t] > 0 ? ` +R$${INCREMENTO_CENTRAL[t]}` : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Equipment table with Custo + Venda */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 14, color: theme.gold }}>Equipamentos da Solução</h4>
          {isAdmin && (
            <button onClick={() => setShowCustoEdit(!showCustoEdit)} style={{
              padding: '4px 12px', borderRadius: 6, border: `1px solid ${theme.border}`,
              background: showCustoEdit ? theme.gold : 'transparent',
              color: showCustoEdit ? '#0B0B0B' : theme.gold,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              {showCustoEdit ? 'Salvar Custos' : 'Editar Custos'}
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Bloco', 'Equipamento', 'Qtd', 'Custo Un.', 'Venda Un.', 'Sub. Custo', 'Sub. Venda'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocoGroups.map((group) =>
                group.items.map((item, idx) => {
                  const custo = localCustos[item.equipmentId] ?? item.precoCusto ?? 0;
                  const subCusto = custo * item.quantidade;
                  return (
                    <tr key={item.equipmentId}>
                      {idx === 0 && (
                        <td style={{ ...tdStyle, fontSize: 11, color: theme.muted }} rowSpan={group.items.length}>
                          {blocoLabels[group.bloco]}
                        </td>
                      )}
                      <td style={tdStyle}>{item.nome}</td>
                      <td style={tdStyle}>{item.quantidade}</td>
                      <td style={tdStyle}>
                        {showCustoEdit ? (
                          <input
                            type="number" min={0} step={1}
                            value={custo || ''}
                            placeholder="0"
                            onChange={(e) => setLocalCustos((c) => ({ ...c, [item.equipmentId]: Number(e.target.value) || 0 }))}
                            style={{ ...inputStyle, width: 90, marginBottom: 0, padding: '4px 6px', fontSize: 12 }}
                          />
                        ) : (
                          <span style={{ color: custo > 0 ? '#E3B341' : theme.muted }}>
                            {custo > 0 ? `R$ ${formatCurrency(custo)}` : '—'}
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>R$ {formatCurrency(item.precoUnitario)}</td>
                      <td style={{ ...tdStyle, color: '#E3B341' }}>{subCusto > 0 ? `R$ ${formatCurrency(subCusto)}` : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>R$ {formatCurrency(item.subtotal)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>Subtotais</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#E3B341' }}>{subtotalCusto > 0 ? `R$ ${formatCurrency(subtotalCusto)}` : '—'}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>R$ {formatCurrency(subtotalEquip)}</td>
              </tr>
              {subtotalCusto > 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'right', fontSize: 12, color: theme.muted }}>Margem</td>
                  <td colSpan={2} style={{ ...tdStyle, fontWeight: 700, color: margemPct >= 30 ? '#43C17B' : margemPct >= 15 ? theme.gold : '#E55B5B' }}>
                    {margemPct.toFixed(1)}% (R$ {formatCurrency(subtotalEquip - subtotalCusto)})
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
        {showCustoEdit && (
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSaveCustos} style={{ ...btnGold, fontSize: 12, padding: '6px 16px' }}>Salvar Preços de Custo</button>
          </div>
        )}
      </div>

      {/* ── Comparativo Compra vs Comodato ── */}
      {modalidade === 'comodato' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Painel COMPRA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(200,169,81,0.08), rgba(200,169,81,0.02))',
            border: `2px solid ${theme.gold}44`, borderRadius: 12, padding: 16,
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: theme.gold }}>Compra (à vista)</h4>
            <CostLine label="Equipamentos (venda)" value={subtotalEquip} />
            <CostLine label={`Markup (${calc.fator}x)`} value={markupEquip} prefix="+" />
            <CostLine label={`Mão de obra (${faixa.label})`} value={calc.maoDeObra} />
            {desconto > 0 && <CostLine label={`Desconto (${desconto}%)`} value={-descontoValor} danger />}
            <div style={{ borderTop: `2px solid ${theme.gold}`, margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.gold }}>INVESTIMENTO</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: theme.gold }}>R$ {formatCurrency(calc.totalFinal)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${theme.border}`, margin: '8px 0' }} />
            <CostLine label="+ Monitoramento" value={calc.mensalidade} />
            <p style={{ fontSize: 11, color: theme.muted, margin: '4px 0 0' }}>/mês</p>
            <div style={{ borderTop: `1px dashed ${theme.border}`, margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: theme.muted }}>Custo em {prazo} meses:</span>
              <span style={{ color: theme.text, fontWeight: 700 }}>R$ {formatCurrency(custoCompraTotal)}</span>
            </div>
          </div>

          {/* Painel COMODATO */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(91,155,213,0.08), rgba(91,155,213,0.02))',
            border: `2px solid #5B9BD544`, borderRadius: 12, padding: 16,
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#5B9BD5' }}>Comodato ({prazo} meses)</h4>
            <CostLine label={`Parcela equipamento`} value={parcelaEquip} />
            <p style={{ fontSize: 10, color: theme.muted, margin: '-2px 0 4px', textAlign: 'right' }}>
              (custo R$ {formatCurrency(subtotalCusto)} ÷ {prazo})
            </p>
            <CostLine label="Monitoramento base" value={monitoramentoBase} />
            {incrementoCam > 0 && <CostLine label={`Câmeras (+${numCameras - 4} × R$${INCREMENTO_CAMERA})`} value={incrementoCam} />}
            {incrementoCen > 0 && <CostLine label={`Central ${tipoCentral}`} value={incrementoCen} />}
            <div style={{ borderTop: `2px solid #5B9BD5`, margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#5B9BD5' }}>MENSALIDADE</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#5B9BD5' }}>R$ {formatCurrency(mensalidadeComodato)}</span>
            </div>
            <p style={{ fontSize: 11, color: theme.muted, margin: '2px 0 0', textAlign: 'right' }}>/mês (tudo incluso)</p>
            <div style={{ borderTop: `1px dashed ${theme.border}`, margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: theme.muted }}>Custo em {prazo} meses:</span>
              <span style={{ color: theme.text, fontWeight: 700 }}>R$ {formatCurrency(custoComodatoTotal)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Painel de Custos (venda — original) */
        <div style={{
          background: 'linear-gradient(135deg, rgba(200,169,81,0.08), rgba(200,169,81,0.02))',
          border: `2px solid ${theme.gold}44`, borderRadius: 12, padding: 16, marginBottom: 14,
        }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, color: theme.gold }}>Painel de Custos</h4>
          <CostLine label="Subtotal equipamentos" value={subtotalEquip} />
          <CostLine label={`Fator complexidade (${calc.fator}x)`} value={markupEquip} prefix="+" />
          <CostLine label={`Mão de obra (Faixa ${faixa.label})`} value={calc.maoDeObra} />
          <div style={{ borderTop: `1px solid ${theme.border}`, margin: '8px 0' }} />
          <CostLine label="Subtotal" value={subtotalGeral} bold />
          {desconto > 0 && <CostLine label={`Desconto (${desconto}%)`} value={-descontoValor} danger />}
          <div style={{ borderTop: `2px solid ${theme.gold}`, margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>TOTAL FINAL</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: theme.gold }}>R$ {formatCurrency(calc.totalFinal)}</span>
          </div>
          <div style={{ borderTop: `1px solid ${theme.border}`, margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: theme.muted }}>Mensalidade mensal</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>R$ {formatCurrency(calc.mensalidade)}</span>
          </div>
        </div>
      )}

      {/* Discount */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 6 }}>Desconto (0–30%) {modalidade === 'comodato' ? '— aplicado na comparação de Compra' : ''}</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="range" min={0} max={30} value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value))}
            disabled={isProposta}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 18, fontWeight: 700, color: desconto > 0 ? theme.gold : theme.muted, minWidth: 50, textAlign: 'right' }}>
            {desconto}%
          </span>
        </div>
      </div>

      {/* Observations */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 4 }}>Observações</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          disabled={isProposta}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: 0, width: '100%' }}
          placeholder="Notas sobre o orçamento..."
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isProposta && (
          <>
            <button onClick={handleSalvar} style={btnSoft}>Salvar ajustes</button>
            <button onClick={handleGerarProposta} style={{ ...btnGold, background: theme.success }}>Gerar Proposta</button>
          </>
        )}
        {isProposta && (
          <span style={{ fontSize: 13, color: theme.success, alignSelf: 'center' }}>Orçamento escolhido para proposta.</span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onBack} style={btnSoft}>Voltar</button>
      </div>
    </div>
  );
}

/* ---- Small components ---- */

function CostLine({ label, value, prefix, bold, danger }: {
  label: string; value: number; prefix?: string; bold?: boolean; danger?: boolean;
}) {
  const displayVal = value < 0 ? `-R$ ${formatCurrency(Math.abs(value))}` : `${prefix ?? ''}R$ ${formatCurrency(value)}`;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 13, color: theme.muted }}>{label}</span>
      <span style={{
        fontSize: bold ? 15 : 13,
        fontWeight: bold ? 700 : 400,
        color: danger ? theme.danger : theme.text,
      }}>
        {displayVal}
      </span>
    </div>
  );
}

function MarcaBadge({ marca }: { marca: Marca }) {
  const colorMap: Record<Marca, string> = {
    Intelbras: '#43C17B', Hikvision: '#E55B5B', Hilook: '#FF7043', Ezviz: '#26C6DA',
    DSC: '#5B9BD5', JFL: '#AB47BC', PPA: '#FFA726', Viaweb: '#E3B341', 'Genérico': '#B5B5B5',
  };
  const color = colorMap[marca];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {marca}
    </span>
  );
}

function FaixaBadge({ label, large }: { label: string; large?: boolean }) {
  const colorMap: Record<string, string> = {
    P: '#43C17B', M: '#5B9BD5', G: '#E3B341', GG: '#E5855B', E: '#E55B5B',
  };
  const color = colorMap[label] ?? theme.muted;
  return (
    <span style={{
      fontSize: large ? 14 : 11, fontWeight: 700, padding: large ? '4px 14px' : '2px 8px',
      borderRadius: 999, background: color + '22', color, border: `1px solid ${color}44`,
      letterSpacing: 0.5,
    }}>
      Faixa {label}
    </span>
  );
}

function OrcamentoStatusBadge({ status }: { status: Orcamento['status'] }) {
  const map: Record<Orcamento['status'], { label: string; color: string }> = {
    rascunho: { label: 'Rascunho', color: theme.muted },
    finalizado: { label: 'Finalizado', color: theme.warning },
    escolhido: { label: 'Escolhido', color: theme.success },
  };
  const { label, color } = map[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {label}
    </span>
  );
}

/* ---- Price Range Filter ---- */

function PriceRangeFilter({
  value, onChange, customMin, onCustomMinChange, customMax, onCustomMaxChange, orcamentos,
}: {
  value: PriceRangeKey;
  onChange: (v: PriceRangeKey) => void;
  customMin: string;
  onCustomMinChange: (v: string) => void;
  customMax: string;
  onCustomMaxChange: (v: string) => void;
  orcamentos: OrcamentoApiDto[];
}) {
  // Conta orçamentos por faixa
  const counts: Record<string, number> = {};
  for (const orc of orcamentos) {
    const total = (Number(orc.totalProdutos) || 0) + (Number(orc.totalServicos) || 0);
    for (const r of PRICE_RANGES) {
      if (r.key === 'todos' || r.key === 'custom') continue;
      if (total >= r.min && total <= r.max) {
        counts[r.key] = (counts[r.key] || 0) + 1;
      }
    }
  }

  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: theme.muted, marginRight: 2 }}>Faixa de preço:</span>
      {PRICE_RANGES.map((r) => {
        const count = r.key === 'todos' ? orcamentos.length : (counts[r.key] ?? 0);
        const showCount = r.key !== 'custom';
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            style={{
              ...btnSmall,
              padding: '3px 8px',
              fontSize: 11,
              borderColor: value === r.key ? '#5B9BD5' : theme.border,
              color: value === r.key ? '#5B9BD5' : theme.muted,
              background: value === r.key ? 'rgba(91,155,213,0.1)' : 'transparent',
              display: 'flex', gap: 4, alignItems: 'center',
            }}
          >
            {r.label}
            {showCount && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '0px 5px', borderRadius: 999,
                background: value === r.key ? 'rgba(91,155,213,0.2)' : theme.soft,
                color: value === r.key ? '#5B9BD5' : theme.muted,
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
      {value === 'custom' && (
        <>
          <span style={{ fontSize: 11, color: theme.muted }}>R$</span>
          <input
            type="number"
            placeholder="Mín"
            value={customMin}
            onChange={(e) => onCustomMinChange(e.target.value)}
            style={{
              background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`,
              borderRadius: 6, padding: '3px 6px', fontSize: 12, width: 70,
            }}
          />
          <span style={{ fontSize: 11, color: theme.muted }}>até R$</span>
          <input
            type="number"
            placeholder="Máx"
            value={customMax}
            onChange={(e) => onCustomMaxChange(e.target.value)}
            style={{
              background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`,
              borderRadius: 6, padding: '3px 6px', fontSize: 12, width: 70,
            }}
          />
        </>
      )}
    </div>
  );
}

/* ---- Top Produtos Ranking (barras visuais) ---- */

function TopProdutosRanking({ materiais }: { materiais: MateriaisVendidosResult }) {
  const top = materiais.produtos.slice(0, 10);
  if (top.length === 0) return null;
  const maxQtd = Math.max(...top.map((p) => p.quantidadeTotal), 1);

  return (
    <div style={{
      background: theme.panel,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: theme.gold, fontWeight: 600 }}>
          Top {top.length} Produtos Mais Vendidos
        </h4>
        <div style={{ fontSize: 11, color: theme.muted }}>
          {materiais.resumo.totalOrcamentosVendidos} orçamentos aprovados · {materiais.resumo.totalPecas} peças
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {top.map((p, i) => {
          const widthPct = Math.max(5, Math.round((p.quantidadeTotal / maxQtd) * 100));
          const barColor = i < 3 ? theme.gold : theme.success;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: i < 3 ? theme.gold + '22' : theme.soft,
                color: i < 3 ? theme.gold : theme.muted,
                border: `1px solid ${i < 3 ? theme.gold + '44' : theme.border}`,
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    fontSize: 12, fontWeight: i < 3 ? 600 : 400,
                    color: i < 3 ? theme.text : theme.muted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.descricao}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: barColor, flexShrink: 0 }}>
                    {p.quantidadeTotal} un
                  </span>
                </div>
                <div style={{ background: theme.soft, borderRadius: 3, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${widthPct}%`, height: '100%',
                    background: `linear-gradient(90deg, ${barColor}bb, ${barColor}66)`,
                    borderRadius: 3, transition: 'width 500ms ease',
                  }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: theme.muted, flexShrink: 0, width: 70, textAlign: 'right' }}>
                R$ {formatCurrency(p.valorTotal)}
              </span>
            </div>
          );
        })}
      </div>

      {materiais.produtos.length > 10 && (
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 8, textAlign: 'right' }}>
          + {materiais.produtos.length - 10} outros produtos
        </div>
      )}
    </div>
  );
}

/* ---- DB Status Tabs ---- */

type DbStatusTabKey = 'todos' | 'F' | 'L' | 'P' | 'E' | 'A' | 'C';

const DB_TAB_CONFIG: { key: DbStatusTabKey; label: string; color: string }[] = [
  { key: 'todos', label: 'Todos', color: theme.text },
  { key: 'F', label: 'Faturados', color: '#43C17B' },
  { key: 'L', label: 'Liberados', color: theme.success },
  { key: 'E', label: 'Em Instalação', color: '#C8A951' },
  { key: 'P', label: 'Aguard. Aprovação', color: '#5B9BD5' },
  { key: 'A', label: 'Abertos', color: theme.warning },
  { key: 'C', label: 'Cancelados', color: theme.danger },
];

function DbStatusTabs({
  orcamentos, activeTab, onTabChange,
}: {
  orcamentos: OrcamentoApiDto[];
  activeTab: DbStatusTabKey;
  onTabChange: (tab: DbStatusTabKey) => void;
}) {
  const counts: Record<string, number> = {};
  for (const o of orcamentos) {
    const s = o.status ?? '?';
    counts[s] = (counts[s] ?? 0) + 1;
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      {DB_TAB_CONFIG.map((tab) => {
        const count = tab.key === 'todos' ? orcamentos.length : (counts[tab.key] ?? 0);
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              background: isActive ? tab.color + '18' : 'transparent',
              border: `1px solid ${isActive ? tab.color : theme.border}`,
              borderRadius: 8,
              color: isActive ? tab.color : theme.muted,
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              display: 'flex',
              gap: 5,
              alignItems: 'center',
              transition: 'all 140ms',
            }}
          >
            {tab.label}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
              background: isActive ? tab.color + '30' : theme.soft,
              color: isActive ? tab.color : theme.muted,
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}


/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '4px 10px', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
