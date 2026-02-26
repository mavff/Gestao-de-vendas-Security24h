'use client';

import { useEffect, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { createDataSource, getDataSourceMode } from '../../lib/dataSource/factory';
import { FunnelStats, OrcamentoApiDto, OrcamentoDetalheApiDto } from '../../lib/dataSource/types';
import { mockEquipments, mockOrcamentos, mockPropostas, mockSolucoes } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import {
  BlocoCategoria, Equipment, FAIXAS_ZONA, FaixaZona, Marca,
  Orcamento, OrcamentoItem, Proposta, SolucaoTecnica,
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
  C: { label: 'Cancelado', color: theme.danger },
};

type StatusFilter = 'todas' | Orcamento['status'];
type ViewState = 'list' | 'local-detail' | 'db-detail';
type PeriodPreset = '7d' | '30d' | '90d' | 'ano' | 'custom';

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

  // Local (generated from SolucaoTecnica flow)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [solucoes, setSolucoes] = useState<SolucaoTecnica[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);

  // DB orçamentos
  const isRealData = getDataSourceMode() === 'api';
  const [dbOrcamentos, setDbOrcamentos] = useState<OrcamentoApiDto[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [view, setView] = useState<ViewState>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDbOrc, setSelectedDbOrc] = useState<OrcamentoDetalheApiDto | null>(null);
  const [dbDetailLoading, setDbDetailLoading] = useState(false);
  const [showSolucaoModal, setShowSolucaoModal] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('todas');

  // Load local data
  useEffect(() => {
    setOrcamentos(loadMock('mock_orcamentos', mockOrcamentos));
    setSolucoes(loadMock('mock_solucoes', mockSolucoes));
    setEquipments(loadMock('mock_equipments', mockEquipments));
    setPropostas(loadMock('mock_propostas', mockPropostas));

    // Auto-open from query param
    const params = new URLSearchParams(window.location.search);
    const solId = params.get('solucaoId');
    if (solId) {
      setTimeout(() => {
        const sols = loadMock('mock_solucoes', mockSolucoes);
        const eqs = loadMock('mock_equipments', mockEquipments);
        const sol = sols.find((s: SolucaoTecnica) => s.id === solId && s.status === 'pronta');
        if (sol) {
          const orc = gerarOrcamentoDeSolucao(sol, eqs);
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

  // Load DB orçamentos + funil (recarrega ao mudar período)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setDbLoading(true);
      if (isRealData) setFunnelLoading(true);
      try {
        const ds = createDataSource();
        const range = getDateRange(periodPreset, customStart, customEnd);
        const [result, funnel] = await Promise.all([
          ds.orcamentos.list({ page: 1, pageSize: 100, ...range }),
          isRealData ? ds.orcamentos.getFunnel(range) : Promise.resolve(null),
        ]);
        if (!cancelled) {
          setDbOrcamentos(result.data);
          setFunnelStats(funnel);
        }
      } catch {
        if (!cancelled) { setDbOrcamentos([]); setFunnelStats(null); }
      } finally {
        if (!cancelled) { setDbLoading(false); setFunnelLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodPreset, customStart, customEnd]);

  useEffect(() => { saveMock('mock_orcamentos', orcamentos); }, [orcamentos]);
  useEffect(() => { saveMock('mock_solucoes', solucoes); }, [solucoes]);
  useEffect(() => { saveMock('mock_propostas', propostas); }, [propostas]);

  function gerarOrcamentoDeSolucao(sol: SolucaoTecnica, eqs: Equipment[]): Orcamento {
    const itens: OrcamentoItem[] = [];
    for (const bloco of sol.blocos) {
      for (const item of bloco.itens) {
        const eq = eqs.find((e) => e.id === item.equipmentId);
        if (!eq) continue;
        itens.push({
          equipmentId: item.equipmentId,
          nome: eq.name,
          quantidade: item.quantidade,
          precoUnitario: eq.price,
          subtotal: eq.price * item.quantidade,
          bloco: bloco.categoria,
        });
      }
    }

    const subtotalEquip = itens.reduce((s, i) => s + i.subtotal, 0);
    const zonas = 4;
    const desconto = 0;
    const calc = calcularOrcamento(zonas, subtotalEquip, desconto);

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
      fatorZona: calc.fator,
      totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra,
      mensalidade: calc.mensalidade,
      desconto,
      totalFinal: calc.totalFinal,
      observacoes: '',
      status: 'rascunho',
      createdAt: new Date().toISOString().slice(0, 10),
    };
  }

  function handleGerarFromModal(sol: SolucaoTecnica) {
    const orc = gerarOrcamentoDeSolucao(sol, equipments);
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
          onPresetChange={setPeriodPreset}
          customStart={customStart}
          onCustomStartChange={setCustomStart}
          customEnd={customEnd}
          onCustomEndChange={setCustomEnd}
        />
      )}

      {/* Funil de Vendas */}
      {isRealData && (funnelLoading || funnelStats) && (
        <FunnelCard stats={funnelStats} loading={funnelLoading} />
      )}

      {/* DB orçamentos section */}
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

          {!dbLoading && dbOrcamentos.length === 0 && (
            <div style={{ fontSize: 13, color: theme.muted, padding: '8px 0' }}>Nenhum orçamento encontrado no banco.</div>
          )}

          {dbDetailLoading && (
            <div style={{ fontSize: 12, color: theme.gold, padding: '4px 0 8px' }}>Carregando detalhes…</div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {dbOrcamentos.map((orc) => {
              const total = (orc.totalProdutos ?? 0) + (orc.totalServicos ?? 0);
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
          solucoes={solucoes.filter((s) => s.status === 'pronta')}
          onSelect={handleGerarFromModal}
          onClose={() => setShowSolucaoModal(false)}
        />
      )}
    </AppShell>
  );
}

/* ---- Period Filter ---- */

function PeriodFilter({
  preset, onPresetChange, customStart, onCustomStartChange, customEnd, onCustomEndChange,
}: {
  preset: PeriodPreset;
  onPresetChange: (p: PeriodPreset) => void;
  customStart: string;
  onCustomStartChange: (v: string) => void;
  customEnd: string;
  onCustomEndChange: (v: string) => void;
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
          <span style={{ color: theme.success, fontWeight: 600 }}>{stats.avancados}</span> orçamentos avançaram (Liberados + Em Instalação) de {stats.totalOrcamentos} emitidos no período.
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

function OrcamentoDetail({ orcamento, onSave, onGerarProposta, onBack }: {
  orcamento: Orcamento;
  onSave: (orc: Orcamento) => void;
  onGerarProposta: (orc: Orcamento) => void;
  onBack: () => void;
}) {
  const [zonas, setZonas] = useState(orcamento.zonas);
  const [desconto, setDesconto] = useState(orcamento.desconto);
  const [observacoes, setObservacoes] = useState(orcamento.observacoes);

  const subtotalEquip = orcamento.subtotalEquipamentos;
  const calc = calcularOrcamento(zonas, subtotalEquip, desconto);
  const faixa = calc.faixa;

  const isProposta = orcamento.status === 'escolhido';

  function handleSalvar() {
    onSave({
      ...orcamento,
      zonas,
      desconto,
      observacoes,
      fatorZona: calc.fator,
      totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra,
      mensalidade: calc.mensalidade,
      totalFinal: calc.totalFinal,
      status: orcamento.status === 'rascunho' ? 'finalizado' : orcamento.status,
    });
  }

  function handleGerarProposta() {
    const orc: Orcamento = {
      ...orcamento,
      zonas,
      desconto,
      observacoes,
      fatorZona: calc.fator,
      totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra,
      mensalidade: calc.mensalidade,
      totalFinal: calc.totalFinal,
    };
    onGerarProposta(orc);
  }

  // Group items by bloco
  const blocoGroups: { bloco: BlocoCategoria; items: OrcamentoItem[] }[] = [];
  for (const item of orcamento.itens) {
    const existing = blocoGroups.find((g) => g.bloco === item.bloco);
    if (existing) {
      existing.items.push(item);
    } else {
      blocoGroups.push({ bloco: item.bloco, items: [item] });
    }
  }

  const markupEquip = subtotalEquip * (calc.fator - 1);
  const subtotalGeral = calc.totalEquip + calc.maoDeObra;
  const descontoValor = subtotalGeral * (desconto / 100);

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <strong style={{ fontSize: 16 }}>{orcamento.clienteNome}</strong>
        <MarcaBadge marca={orcamento.marca} />
        <OrcamentoStatusBadge status={orcamento.status} />
        <span style={{ fontSize: 12, color: theme.muted }}>Solução: {orcamento.solucaoId}</span>
      </div>

      {/* Zonas */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 4 }}>Número de Zonas</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min={1}
                max={50}
                value={zonas}
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
          Faixa {faixa.label} ({faixa.min}–{faixa.max === Infinity ? '∞' : faixa.max} zonas) — Fator {faixa.fator}x · Mão de obra R$ {formatCurrency(faixa.maoDeObra)} · Mensalidade R$ {formatCurrency(faixa.mensalidade)}
        </div>
      </div>

      {/* Equipment table */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, color: theme.gold }}>Equipamentos da Solução</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Bloco', 'Equipamento', 'Qtd', 'Unit.', 'Subtotal'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocoGroups.map((group) =>
              group.items.map((item, idx) => (
                <tr key={item.equipmentId}>
                  {idx === 0 && (
                    <td style={{ ...tdStyle, fontSize: 11, color: theme.muted }} rowSpan={group.items.length}>
                      {blocoLabels[group.bloco]}
                    </td>
                  )}
                  <td style={tdStyle}>{item.nome}</td>
                  <td style={tdStyle}>{item.quantidade}</td>
                  <td style={tdStyle}>R$ {formatCurrency(item.precoUnitario)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>R$ {formatCurrency(item.subtotal)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>Subtotal equipamentos</td>
              <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>R$ {formatCurrency(subtotalEquip)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Costs panel */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(200,169,81,0.08), rgba(200,169,81,0.02))',
        border: `2px solid ${theme.gold}44`,
        borderRadius: 12, padding: 16, marginBottom: 14,
      }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: theme.gold }}>Painel de Custos</h4>

        <CostLine label="Subtotal equipamentos" value={subtotalEquip} />
        <CostLine label={`Fator complexidade (${calc.fator}x)`} value={markupEquip} prefix="+" />
        <CostLine label={`Mão de obra (Faixa ${faixa.label})`} value={calc.maoDeObra} />

        <div style={{ borderTop: `1px solid ${theme.border}`, margin: '8px 0' }} />

        <CostLine label="Subtotal" value={subtotalGeral} bold />

        {desconto > 0 && (
          <CostLine label={`Desconto (${desconto}%)`} value={-descontoValor} prefix="" danger />
        )}

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

      {/* Discount */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 6 }}>Desconto (0–30%)</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="range"
            min={0}
            max={30}
            value={desconto}
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

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '4px 10px', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
