'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { ComissaoConfig, DEFAULT_COMISSAO_CONFIG, PreOrcamentoApiDto } from '../../lib/dataSource/types';
import { prospectToLead } from '../../lib/dataSource/adapters/prospectAdapter';
import { mockEquipments, mockKits, mockLeads, mockOrdens, mockSolucoes, mockUsers } from '../../mocks/data';
import { loadMock } from '../../services/mockStorage';
import { loadState, saveState } from '../../services/appState';
import {
  BlocoCategoria, Equipment, Kit, Lead, Marca, OrdemDeServico,
  SolucaoTecnica, User,
} from '../../types';
import { openPropostaPDF } from '../../components/proposal/PropostaPDF';

/* ---- Monitoramento Config ---- */

type FaixaMonitoramento = {
  nome: string;
  base: number;
  minimo: number;
};

type MonitoramentoConfig = {
  faixas: FaixaMonitoramento[];
  maoDeObra: Record<string, number>;
};

const MONIT_KEY = 'config:monitoramento';

const DEFAULT_MONIT_CONFIG: MonitoramentoConfig = {
  faixas: [
    { nome: 'Residencial', base: 170, minimo: 150 },
    { nome: 'Comercial Pequeno', base: 200, minimo: 180 },
    { nome: 'Comercial Médio', base: 250, minimo: 220 },
    { nome: 'Comercial Grande', base: 300, minimo: 270 },
    { nome: 'Condomínio / Industrial', base: 400, minimo: 350 },
  ],
  maoDeObra: {
    'Residencial': 250,
    'Comercial Pequeno': 400,
    'Comercial Médio': 600,
    'Comercial Grande': 900,
    'Condomínio / Industrial': 1500,
  },
};

/* ---- Constants ---- */

const marcas: Marca[] = ['Intelbras', 'Hikvision', 'Hilook', 'Ezviz', 'DSC', 'JFL', 'PPA', 'Viaweb', 'Genérico'];

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

type PropostaItem = {
  equipmentId: string;
  quantidade: number;
  observacao: string;
};

type PropostaLocal = {
  id: string;
  clienteNome: string;
  clienteTel: string;
  clienteEndereco: string;
  tipoLocal: 'Residencial' | 'Comercial' | 'Condomínio' | 'Industrial';
  marca: Marca;
  itens: PropostaItem[];
  observacoes: string;
  status: 'rascunho' | 'enviada' | 'aprovada';
  kitBaseId?: string;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
};

type KitOption = {
  id: string;
  name: string;
  source: 'db' | 'local';
  items: { equipmentId: string; quantidade: number; nome: string; preco: number }[];
  total: number;
  valorMensalVenda?: number;
  valorMensalComodato?: number;
  limitePontos?: number;
  valorPontoAdicional?: number;
  valorCrea?: number;
};

function modeloToKitOption(m: PreOrcamentoApiDto): KitOption {
  const items = m.produtos.map((p) => ({
    equipmentId: String(p.produto?.codProduto ?? p.codProduto ?? 0),
    quantidade: Number(p.quantidade) || 1,
    nome: p.produto?.descricao ?? p.descricao ?? '?',
    preco: Number(p.produto?.preco ?? 0),
  }));
  return {
    id: `modelo_${m.codInterno}`,
    name: m.descricao,
    source: 'db',
    items,
    total: items.reduce((s, i) => s + i.preco * i.quantidade, 0),
    valorMensalVenda: m.valorMensalVenda != null ? Number(m.valorMensalVenda) : undefined,
    valorMensalComodato: m.valorMensalComodato != null ? Number(m.valorMensalComodato) : undefined,
    limitePontos: m.limitePontos ?? undefined,
    valorPontoAdicional: m.valorPontoAdicional != null ? Number(m.valorPontoAdicional) : undefined,
    valorCrea: m.valorCrea != null ? Number(m.valorCrea) : undefined,
  };
}

function kitToKitOption(kit: Kit, equipments: Equipment[]): KitOption {
  const items = kit.items.map((i) => {
    const eq = equipments.find((e) => e.id === i.equipmentId);
    return {
      equipmentId: i.equipmentId,
      quantidade: i.quantity,
      nome: i.itemName ?? eq?.name ?? i.equipmentId,
      preco: i.unitPrice ?? eq?.price ?? 0,
    };
  });
  return {
    id: `kit_${kit.id}`,
    name: kit.name,
    source: 'local',
    items,
    total: items.reduce((s, i) => s + i.preco * i.quantidade, 0),
  };
}

function emptyProposta(): PropostaLocal {
  return {
    id: '', clienteNome: '', clienteTel: '', clienteEndereco: '',
    tipoLocal: 'Residencial', marca: 'Intelbras', itens: [], observacoes: '',
    status: 'rascunho', criadoPor: '', createdAt: '', updatedAt: '',
  };
}

/* ============================================================
   Main Page
   ============================================================ */

export function SolucoesPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const canWrite = role === 'ADMIN' || role === 'VENDEDOR' || role === 'TECNICO';
  const canApprove = role === 'ADMIN' || role === 'GESTOR';

  const [propostas, setPropostas] = useState<PropostaLocal[]>([]);
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [modelos, setModelos] = useState<PreOrcamentoApiDto[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [precosCusto, setPrecosCusto] = useState<Record<string, number>>({});
  const [monitConfig, setMonitConfig] = useState<MonitoramentoConfig>(DEFAULT_MONIT_CONFIG);
  const [comissaoConfig, setComissaoConfig] = useState<ComissaoConfig>(DEFAULT_COMISSAO_CONFIG);
  const [showMonitModal, setShowMonitModal] = useState(false);
  const [autoFillDone, setAutoFillDone] = useState(false);

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [draft, setDraft] = useState<PropostaLocal>(emptyProposta);
  const [search, setSearch] = useState('');

  // Load data
  useEffect(() => {
    // Load propostas from SQLite (AppKv)
    loadState<PropostaLocal[]>('propostas', []).then((saved) => {
      // Migrate from old localStorage if AppKv is empty
      if (!saved.length) {
        const oldLocal = loadMock<PropostaLocal[]>('mock_propostas_v2', []);
        if (oldLocal.length) {
          setPropostas(oldLocal);
          saveState('propostas', oldLocal); // migrate to SQLite
          return;
        }
        const oldSol = loadMock<SolucaoTecnica[]>('mock_solucoes', mockSolucoes);
        if (oldSol.length) {
          const migrated: PropostaLocal[] = oldSol.map((s) => ({
            id: s.id, clienteNome: s.clienteNome, clienteTel: '', clienteEndereco: '',
            tipoLocal: 'Residencial' as const, marca: s.marca,
            itens: s.blocos.flatMap((b) => b.itens.map((i) => ({ equipmentId: i.equipmentId, quantidade: i.quantidade, observacao: i.observacao }))),
            observacoes: s.observacaoGeral, status: s.status, criadoPor: s.criadoPor,
            createdAt: s.createdAt, updatedAt: s.updatedAt,
          }));
          setPropostas(migrated);
          saveState('propostas', migrated); // migrate to SQLite
        }
      } else {
        setPropostas(saved);
      }
    });

    // Load ordens from SQLite (AppKv)
    loadState<OrdemDeServico[]>('ordens_servico', []).then((saved) => {
      if (!saved.length) {
        const oldLocal = loadMock<OrdemDeServico[]>('mock_ordens', mockOrdens);
        if (oldLocal.length) {
          setOrdens(oldLocal);
          saveState('ordens_servico', oldLocal); // migrate to SQLite
          return;
        }
      }
      setOrdens(saved);
    });

    setUsers(loadMock('mock_users', mockUsers));

    // Load from API
    let cancelled = false;
    async function load() {
      const ds = createDataSource();
      const [eqRes, prospRes, kitsRes, modelosRes] = await Promise.allSettled([
        ds.equipment.list({ pageSize: 500 }),
        ds.prospects.list({ pageSize: 200 }),
        ds.kits.list({ pageSize: 500 }),
        ds.preOrcamentos.list({ pageSize: 200 }),
      ]);
      if (cancelled) return;
      setEquipments(eqRes.status === 'fulfilled' ? eqRes.value.data : loadMock('mock_equipments', mockEquipments));
      setLeads(prospRes.status === 'fulfilled'
        ? prospRes.value.data.map((p) => prospectToLead(p))
        : loadMock('mock_leads', mockLeads));
      setKits(kitsRes.status === 'fulfilled' ? kitsRes.value.data : loadMock('mock_kits', mockKits));
      if (modelosRes.status === 'fulfilled') setModelos(modelosRes.value.data);
    }
    load();

    // Load configs
    loadState<Record<string, number>>('config:precos_custo', {}).then(setPrecosCusto);
    loadState<MonitoramentoConfig>(MONIT_KEY, DEFAULT_MONIT_CONFIG).then(setMonitConfig);
    loadState<ComissaoConfig>('config:comissoes', DEFAULT_COMISSAO_CONFIG).then(setComissaoConfig);

    return () => { cancelled = true; };
  }, []);

  // Auto-fill from pipeline (query params: ?leadId=&nome=&tel=&endereco=&empresa=&tipoLocal=)
  useEffect(() => {
    if (autoFillDone) return;
    const nome = searchParams.get('nome');
    if (!nome) return;
    setAutoFillDone(true);
    const now = new Date().toISOString().slice(0, 10);
    const empresa = searchParams.get('empresa') ?? '';
    const clienteNome = empresa ? `${nome} — ${empresa}` : nome;
    const tipoLocal = searchParams.get('tipoLocal') as PropostaLocal['tipoLocal'] | null;
    setDraft({
      ...emptyProposta(),
      clienteNome,
      clienteTel: searchParams.get('tel') ?? '',
      clienteEndereco: searchParams.get('endereco') ?? '',
      tipoLocal: tipoLocal && ['Residencial', 'Comercial', 'Condomínio', 'Industrial'].includes(tipoLocal) ? tipoLocal : 'Residencial',
      criadoPor: users.find((u) => u.role === role)?.id ?? 'U1',
      createdAt: now, updatedAt: now,
    });
    setView('editor');
  }, [searchParams, autoFillDone, users, role]);

  // Persist to SQLite (AppKv)
  useEffect(() => { if (propostas.length) saveState('propostas', propostas); }, [propostas]);
  useEffect(() => { if (ordens.length) saveState('ordens_servico', ordens); }, [ordens]);

  // Unified kit options: DB models + local kits
  const kitOptions = useMemo<KitOption[]>(() => {
    const fromModelos = modelos.map(modeloToKitOption);
    const fromKits = kits.map((k) => kitToKitOption(k, equipments));
    return [...fromModelos, ...fromKits];
  }, [modelos, kits, equipments]);

  // Merged equipment list: includes synthetic entries for kit products not in the main list
  // This fixes the issue where kit products with empty grupoOrcamento are filtered out by /products
  const mergedEquipments = useMemo<Equipment[]>(() => {
    const existingIds = new Set(equipments.map((e) => e.id));
    const synthetics: Equipment[] = [];
    for (const opt of kitOptions) {
      for (const item of opt.items) {
        if (!existingIds.has(item.equipmentId) && item.equipmentId !== '0') {
          existingIds.add(item.equipmentId);
          synthetics.push({
            id: item.equipmentId,
            name: item.nome,
            sku: item.equipmentId,
            category: 'Acessório',
            marca: 'Genérico',
            bloco: 'acessorio',
            price: item.preco,
            estoque: 0,
            descricao: item.nome,
          });
        }
      }
    }
    return synthetics.length > 0 ? [...equipments, ...synthetics] : equipments;
  }, [equipments, kitOptions]);

  function userName(id: string) { return users.find((u) => u.id === id)?.name ?? id; }

  function openNew() {
    const now = new Date().toISOString().slice(0, 10);
    setDraft({ ...emptyProposta(), criadoPor: users.find((u) => u.role === role)?.id ?? 'U1', createdAt: now, updatedAt: now });
    setView('editor');
  }

  function openNewFromKit(opt: KitOption) {
    const now = new Date().toISOString().slice(0, 10);
    setDraft({
      ...emptyProposta(),
      kitBaseId: opt.id,
      itens: opt.items.map((i) => ({ equipmentId: i.equipmentId, quantidade: i.quantidade, observacao: '' })),
      criadoPor: users.find((u) => u.role === role)?.id ?? 'U1',
      createdAt: now, updatedAt: now,
    });
    setView('editor');
  }

  function openEdit(p: PropostaLocal) {
    setDraft({ ...p });
    setView('editor');
  }

  function handleSave(p: PropostaLocal) {
    const now = new Date().toISOString().slice(0, 10);
    const updated = { ...p, updatedAt: now };
    let newList: PropostaLocal[];
    if (p.id) {
      newList = propostas.map((x) => x.id === p.id ? updated : x);
      showToast('Proposta atualizada.', 'success');
    } else {
      newList = [...propostas, { ...updated, id: 'PROP' + Date.now() }];
      showToast('Proposta criada.', 'success');
    }
    setPropostas(newList);
    setView('list');
  }

  function handleDelete(id: string) {
    setPropostas((cur) => cur.filter((x) => x.id !== id));
    showToast('Proposta excluída.', 'warning');
  }

  function handleGerarPDF(p: PropostaLocal) {
    const faixa0 = monitConfig.faixas[0] ?? DEFAULT_MONIT_CONFIG.faixas[0];
    const maoDeObraVal = monitConfig.maoDeObra[faixa0.nome] ?? 250;
    const sub = p.itens.reduce((s, i) => {
      const eq = mergedEquipments.find((e) => e.id === i.equipmentId);
      return s + (eq?.price ?? 0) * i.quantidade;
    }, 0);
    const subCusto = p.itens.reduce((s, i) => {
      const eq = mergedEquipments.find((e) => e.id === i.equipmentId);
      const custo = precosCusto[i.equipmentId] ?? eq?.price ?? 0;
      return s + custo * i.quantidade;
    }, 0);
    const acrescInst = p.itens.reduce((s, i) => {
      const eq = mergedEquipments.find((e) => e.id === i.equipmentId);
      return s + (eq?.acrescimoInstalacao ?? 0) * i.quantidade;
    }, 0);
    const kitOpt = kitOptions.find((k) => k.id === p.kitBaseId);
    const valorCrea = kitOpt?.valorCrea ?? 0;
    const totalV = sub + maoDeObraVal + acrescInst + valorCrea;
    const monitValor = kitOpt?.valorMensalVenda ?? faixa0.base;
    const monitComodato = kitOpt?.valorMensalComodato ?? (subCusto / 36 + monitValor);
    const taxaAdesao = monitComodato * comissaoConfig.multiplicadorAdesao;

    openPropostaPDF({
      clienteNome: p.clienteNome,
      clienteTel: p.clienteTel,
      clienteEndereco: p.clienteEndereco,
      tipoLocal: p.tipoLocal,
      marca: p.marca,
      itens: p.itens.map((i) => {
        const eq = mergedEquipments.find((e) => e.id === i.equipmentId);
        return { nome: eq?.name ?? i.equipmentId, quantidade: i.quantidade, precoUnitario: eq?.price ?? 0, bloco: eq?.bloco ?? 'acessorio' };
      }),
      observacoes: p.observacoes,
      vendedorNome: userName(p.criadoPor),
      subtotalEquipamentos: sub,
      maoDeObra: maoDeObraVal,
      acrescimoInstalacao: acrescInst,
      valorCrea,
      totalVenda: totalV,
      monitoramentoMensal: monitValor,
      mensalidadeComodato: monitComodato,
      taxaAdesao,
      prazo: 36,
      custoTotalComodato: taxaAdesao + monitComodato * 35,
      modalidade: 'ambos',
    });
  }

  function handleEnviar(id: string) {
    setPropostas((cur) => cur.map((x) =>
      x.id === id ? { ...x, status: 'enviada' as const, updatedAt: new Date().toISOString().slice(0, 10) } : x
    ));
    showToast('Proposta enviada ao cliente.', 'success');
  }

  function handleAprovar(p: PropostaLocal) {
    const now = new Date().toISOString().slice(0, 10);
    setPropostas((cur) => cur.map((x) =>
      x.id === p.id ? { ...x, status: 'aprovada' as const, updatedAt: now } : x
    ));

    // Auto-create OS
    const checklistItems = p.itens.map((item, idx) => {
      const eq = equipments.find((e) => e.id === item.equipmentId);
      return {
        id: 'CK' + Date.now() + idx,
        text: `Instalar ${item.quantidade}x ${eq?.name ?? item.equipmentId}${item.observacao ? ` — ${item.observacao}` : ''}`,
        done: false,
      };
    });

    const newOS: OrdemDeServico = {
      id: 'OS' + Date.now(), propostaId: p.id, leadId: '', cliente: p.clienteNome,
      dataAgendada: '', tecnicoId: '', checklist: checklistItems, pontos: [],
      observacoes: p.observacoes, status: 'bloqueada', createdAt: now,
    };
    setOrdens((cur) => [...cur, newOS]);
    showToast('Proposta aprovada! OS criada automaticamente.', 'success');
  }

  function handleCancelarAprovacao(p: PropostaLocal) {
    const now = new Date().toISOString().slice(0, 10);
    setPropostas((cur) => cur.map((x) =>
      x.id === p.id ? { ...x, status: 'enviada' as const, updatedAt: now } : x
    ));
    // Remove OS vinculada
    setOrdens((cur) => cur.filter((os) => os.propostaId !== p.id));
    showToast('Aprovação cancelada. OS removida.', 'warning');
  }

  const filteredPropostas = useMemo(() => {
    if (!search) return propostas;
    const q = search.toLowerCase();
    return propostas.filter((p) =>
      p.clienteNome.toLowerCase().includes(q) || p.clienteTel.includes(q)
    );
  }, [propostas, search]);

  // Editor view
  if (view === 'editor') {
    return (
      <AppShell title={draft.id ? 'Editar Proposta' : 'Nova Proposta'}>
        <PropostaEditor
          draft={draft}
          setDraft={setDraft}
          equipments={mergedEquipments}
          kitOptions={kitOptions}
          leads={leads}
          precosCusto={precosCusto}
          monitConfig={monitConfig}
          comissaoConfig={comissaoConfig}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      </AppShell>
    );
  }

  // List view
  return (
    <AppShell title="Propostas">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {canWrite && (
          <button onClick={openNew} style={btnGold}>+ Nova Proposta</button>
        )}
        {role === 'ADMIN' && (
          <button onClick={() => setShowMonitModal(true)} style={{ ...btnSmall, borderColor: theme.gold, color: theme.gold }}>
            Preços Fallback (Manual)
          </button>
        )}
        <input
          placeholder="Buscar por cliente ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 180, marginBottom: 0 }}
        />
      </div>

      {/* Admin config modal */}
      {showMonitModal && (
        <MonitoramentoConfigModal
          config={monitConfig}
          onSave={(cfg) => { setMonitConfig(cfg); saveState(MONIT_KEY, cfg); setShowMonitModal(false); }}
          onClose={() => setShowMonitModal(false)}
        />
      )}

      {/* Quick start from kits */}
      {canWrite && kitOptions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Início rápido — escolha um kit para criar proposta
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {kitOptions.slice(0, 8).map((opt) => (
              <button
                key={opt.id}
                onClick={() => openNewFromKit(opt)}
                style={{
                  background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10,
                  padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = theme.gold; t.style.background = theme.soft; }}
                onMouseLeave={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = theme.border; t.style.background = theme.panel; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 6, lineHeight: 1.3 }}>{opt.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                    background: opt.source === 'db' ? '#5B9BD522' : theme.gold + '22',
                    color: opt.source === 'db' ? '#5B9BD5' : theme.gold,
                  }}>{opt.source === 'db' ? 'Sistema' : 'Local'}</span>
                  <span style={{ fontSize: 11, color: theme.muted }}>{opt.items.length} itens</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.gold }}>
                  R$ {opt.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
                {opt.valorMensalComodato != null && opt.valorMensalComodato > 0 && (
                  <div style={{ fontSize: 11, color: '#5B9BD5', marginTop: 4 }}>Comodato: R$ {opt.valorMensalComodato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List of propostas */}
      {filteredPropostas.length === 0 && (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          {search ? 'Nenhuma proposta encontrada.' : 'Nenhuma proposta criada ainda. Use um kit acima ou clique em "+ Nova Proposta".'}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {filteredPropostas.map((p) => {
          const totalItens = p.itens.reduce((s, i) => s + i.quantidade, 0);
          const valorTotal = p.itens.reduce((s, i) => {
            const eq = equipments.find((e) => e.id === i.equipmentId);
            return s + (eq?.price ?? 0) * i.quantidade;
          }, 0);

          return (
            <div key={p.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 15 }}>{p.clienteNome || '(sem nome)'}</strong>
                  {p.clienteTel && <span style={{ fontSize: 12, color: theme.muted, marginLeft: 8 }}>{p.clienteTel}</span>}
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <MarcaBadge marca={p.marca} />
                <span style={{ fontSize: 12, color: theme.muted }}>{totalItens} equipamentos</span>
                <span style={{ fontSize: 12, color: theme.muted }}>{p.tipoLocal}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.gold }}>
                  R$ {valorTotal.toLocaleString('pt-BR')}
                </span>
              </div>

              <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                {formatDate(p.createdAt)} por {userName(p.criadoPor)}
                {p.clienteEndereco && <span> · {p.clienteEndereco}</span>}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={() => openEdit(p)} style={btnSmall}>
                  {p.status === 'rascunho' && canWrite ? 'Editar' : 'Visualizar'}
                </button>
                {totalItens > 0 && (
                  <button onClick={() => handleGerarPDF(p)} style={{ ...btnSmall, borderColor: '#5B9BD5', color: '#5B9BD5' }}>
                    Gerar PDF
                  </button>
                )}
                {p.status === 'rascunho' && canWrite && (
                  <>
                    <button
                      onClick={() => handleEnviar(p.id)}
                      disabled={totalItens === 0}
                      style={{ ...btnSmall, borderColor: theme.gold, color: theme.gold, opacity: totalItens === 0 ? 0.4 : 1 }}
                    >
                      Enviar ao Cliente
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}>
                      Excluir
                    </button>
                  </>
                )}
                {p.status === 'enviada' && canApprove && (
                  <button
                    onClick={() => handleAprovar(p)}
                    style={{ ...btnSmall, borderColor: theme.success, color: theme.success }}
                  >
                    Aprovar e Gerar OS
                  </button>
                )}
                {p.status === 'aprovada' && (
                  <>
                    <span style={{ fontSize: 12, color: theme.success }}>OS gerada</span>
                    {canApprove && (
                      <button
                        onClick={() => handleCancelarAprovacao(p)}
                        style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}
                      >
                        Cancelar Aprovação
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ordens de serviço */}
      {ordens.length > 0 && (
        <>
          <h3 style={{ marginTop: 32, color: theme.gold, fontSize: 14, fontWeight: 700, letterSpacing: 0.3 }}>
            Ordens de Serviço geradas
          </h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {ordens.map((os) => (
              <div key={os.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 14 }}>{os.cliente}</strong>
                  <OSStatusBadge status={os.status} />
                </div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                  OS {os.id} &middot; {formatDate(os.createdAt)}
                </div>
                {os.checklist.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: theme.text }}>
                    {os.checklist.slice(0, 3).map((item, i) => <li key={i}>{item.text}</li>)}
                    {os.checklist.length > 3 && <li style={{ color: theme.muted }}>+ {os.checklist.length - 3} itens…</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}

/* ============================================================
   Proposta Editor — Single-page flow
   ============================================================ */

function PropostaEditor({ draft, setDraft, equipments, kitOptions, leads, precosCusto, monitConfig, comissaoConfig, onSave, onCancel }: {
  draft: PropostaLocal;
  setDraft: (d: PropostaLocal) => void;
  equipments: Equipment[];
  kitOptions: KitOption[];
  leads: Lead[];
  precosCusto: Record<string, number>;
  monitConfig: MonitoramentoConfig;
  comissaoConfig: ComissaoConfig;
  onSave: (p: PropostaLocal) => void;
  onCancel: () => void;
}) {
  const { showToast } = useToast();
  const { role } = useAuth();

  // Modalidade state
  const [modalidade, setModalidade] = useState<'venda' | 'comodato'>('venda');
  const [prazo, setPrazo] = useState<24 | 36 | 48>(36);
  const [faixaIdx, setFaixaIdx] = useState(0);
  const [monitAjuste, setMonitAjuste] = useState<number | null>(null); // vendedor override

  // Equipment add state
  const [addEquipId, setAddEquipId] = useState('');
  const [addQtd, setAddQtd] = useState(1);
  const [filterBloco, setFilterBloco] = useState<BlocoCategoria | 'todos'>('todos');

  // Existing lead selection
  const [useExistingLead, setUseExistingLead] = useState(false);

  function fillFromLead(leadId: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setDraft({
      ...draft,
      clienteNome: lead.name + (lead.company ? ` — ${lead.company}` : ''),
      clienteTel: lead.contato ?? '',
      clienteEndereco: lead.endereco ?? '',
      tipoLocal: lead.tipoLocal ?? 'Residencial',
    });
  }

  function loadKit(opt: KitOption) {
    const newItens = opt.items.map((i) => ({ equipmentId: i.equipmentId, quantidade: i.quantidade, observacao: '' }));
    setDraft({ ...draft, itens: newItens, kitBaseId: opt.id });
    setMonitAjuste(null); // reset slider ao trocar kit
    showToast(`"${opt.name}" carregado com ${opt.items.length} itens.`, 'success');
  }

  function addItem() {
    if (!addEquipId || addQtd < 1) return;
    const existing = draft.itens.find((i) => i.equipmentId === addEquipId);
    if (existing) {
      setDraft({ ...draft, itens: draft.itens.map((i) => i.equipmentId === addEquipId ? { ...i, quantidade: i.quantidade + addQtd } : i) });
    } else {
      setDraft({ ...draft, itens: [...draft.itens, { equipmentId: addEquipId, quantidade: addQtd, observacao: '' }] });
    }
    setAddEquipId('');
    setAddQtd(1);
  }

  function removeItem(eqId: string) {
    setDraft({ ...draft, itens: draft.itens.filter((i) => i.equipmentId !== eqId) });
  }

  function updateQty(eqId: string, delta: number) {
    const updated = draft.itens
      .map((i) => (i.equipmentId === eqId ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i))
      .filter((i) => i.quantidade > 0);
    setDraft({ ...draft, itens: updated });
  }

  function updateObs(eqId: string, obs: string) {
    setDraft({ ...draft, itens: draft.itens.map((i) => i.equipmentId === eqId ? { ...i, observacao: obs } : i) });
  }

  // ── Kit ativo e pricing do BD ──
  const activeKit = kitOptions.find((k) => k.id === draft.kitBaseId);

  // Calculations
  const totalItens = draft.itens.reduce((s, i) => s + i.quantidade, 0);

  const subtotalVenda = draft.itens.reduce((s, i) => {
    const eq = equipments.find((e) => e.id === i.equipmentId);
    return s + (eq?.price ?? 0) * i.quantidade;
  }, 0);

  // Custo: usa preço manual se cadastrado, senão usa preço do produto do banco
  const subtotalCusto = draft.itens.reduce((s, i) => {
    const eq = equipments.find((e) => e.id === i.equipmentId);
    const custo = precosCusto[i.equipmentId] ?? eq?.price ?? 0;
    return s + custo * i.quantidade;
  }, 0);

  // ── Pontos (alarme) ──
  const totalPontos = draft.itens.reduce((s, i) => {
    const eq = equipments.find((e) => e.id === i.equipmentId);
    return s + (eq?.pontos ?? 0) * i.quantidade;
  }, 0);
  const limitePontos = activeKit?.limitePontos ?? 0;
  const pontosExcedentes = limitePontos > 0 ? Math.max(0, totalPontos - limitePontos) : 0;
  const valorPontoAdicional = activeKit?.valorPontoAdicional ?? 0;
  const surchargeExtraPontos = pontosExcedentes * valorPontoAdicional;

  // ── Acréscimo mensal de produtos adicionados além do kit base ──
  const acrescimoMensalTotal = useMemo(() => {
    if (!activeKit) return 0;
    const baseQty: Record<string, number> = {};
    for (const item of activeKit.items) {
      baseQty[item.equipmentId] = (baseQty[item.equipmentId] ?? 0) + item.quantidade;
    }
    let total = 0;
    for (const item of draft.itens) {
      const eq = equipments.find((e) => e.id === item.equipmentId);
      const extra = Math.max(0, item.quantidade - (baseQty[item.equipmentId] ?? 0));
      total += extra * (eq?.acrescimoMensal ?? 0);
    }
    return total;
  }, [draft.itens, activeKit, equipments]);

  // ── Acréscimo de instalação ──
  const acrescimoInstalacaoTotal = draft.itens.reduce((s, i) => {
    const eq = equipments.find((e) => e.id === i.equipmentId);
    return s + (eq?.acrescimoInstalacao ?? 0) * i.quantidade;
  }, 0);

  // ── Monitoramento: BD ou fallback manual ──
  const hasDbPricing = activeKit?.source === 'db' && (
    (modalidade === 'venda' && (activeKit.valorMensalVenda ?? 0) > 0) ||
    (modalidade === 'comodato' && (activeKit.valorMensalComodato ?? 0) > 0)
  );

  const faixa = monitConfig.faixas[faixaIdx] ?? monitConfig.faixas[0] ?? DEFAULT_MONIT_CONFIG.faixas[0];

  const monitBaseFromDb = modalidade === 'comodato'
    ? (activeKit?.valorMensalComodato ?? 0)
    : (activeKit?.valorMensalVenda ?? 0);
  const monitBase = hasDbPricing
    ? monitBaseFromDb + acrescimoMensalTotal + surchargeExtraPontos
    : faixa.base;
  const monitMin = hasDbPricing ? Math.floor(monitBaseFromDb * 0.85) : faixa.minimo;
  const monitValor = monitAjuste != null ? Math.max(monitMin, Math.min(monitAjuste, monitBase)) : monitBase;
  const maoDeObra = monitConfig.maoDeObra[faixa.nome] ?? 250;

  // ── Venda ──
  const valorCrea = activeKit?.valorCrea ?? 0;
  const totalVenda = subtotalVenda + maoDeObra + acrescimoInstalacaoTotal + valorCrea;

  // ── Comodato ──
  const parcelaEquip = prazo > 0 && subtotalCusto > 0 ? subtotalCusto / prazo : 0;
  const mensalidadeComodato = hasDbPricing
    ? monitValor  // BD: valorMensalComodato já inclui amortização
    : parcelaEquip + monitValor;  // fallback: custo/prazo + monitoramento

  // ── Taxa de Adesão (1ª mensalidade majorada) ──
  const taxaAdesao = mensalidadeComodato * comissaoConfig.multiplicadorAdesao;

  // Total cost comparison over term
  const custoTotalVenda = totalVenda + (monitValor * prazo);
  const custoTotalComodato = taxaAdesao + (mensalidadeComodato * (prazo - 1));

  const margem = subtotalVenda > 0 ? ((subtotalVenda - subtotalCusto) / subtotalVenda * 100) : 0;

  // Filtered equipments for adding
  const filteredEquipForAdd = useMemo(() => {
    let list = equipments;
    if (draft.marca && draft.marca !== 'Genérico') {
      list = list.filter((e) => e.marca === draft.marca || e.marca === 'Genérico');
    }
    if (filterBloco !== 'todos') {
      list = list.filter((e) => e.bloco === filterBloco);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [equipments, draft.marca, filterBloco]);

  // Group items by bloco
  const itensByBloco = useMemo(() => {
    const groups: Record<string, { eq: Equipment; item: PropostaItem }[]> = {};
    for (const item of draft.itens) {
      const eq = equipments.find((e) => e.id === item.equipmentId);
      if (!eq) continue;
      const key = eq.bloco;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ eq, item });
    }
    return groups;
  }, [draft.itens, equipments]);

  const readOnly = draft.status !== 'rascunho' || !(role === 'ADMIN' || role === 'VENDEDOR' || role === 'TECNICO');

  return (
    <div style={{ maxWidth: 900 }}>
      {/* ──── Section 1: Cliente ──── */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle num={1} label="Cliente" />
          {!readOnly && leads.length > 0 && (
            <button
              onClick={() => setUseExistingLead(!useExistingLead)}
              style={{ ...btnSmall, fontSize: 11, color: theme.gold, borderColor: theme.gold }}
            >
              {useExistingLead ? 'Digitar manualmente' : 'Usar lead existente'}
            </button>
          )}
        </div>

        {useExistingLead ? (
          <select
            onChange={(e) => { if (e.target.value) fillFromLead(e.target.value); }}
            style={{ ...inputStyle, marginBottom: 0 }}
          >
            <option value="">Selecione um lead...</option>
            {leads.filter((l) => l.status === 'ativo').map((l) => (
              <option key={l.id} value={l.id}>{l.name} — {l.company}</option>
            ))}
          </select>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: useExistingLead ? 8 : 0 }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input
              value={draft.clienteNome} readOnly={readOnly}
              onChange={(e) => setDraft({ ...draft, clienteNome: e.target.value })}
              placeholder="Nome do cliente"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input
              value={draft.clienteTel} readOnly={readOnly}
              onChange={(e) => setDraft({ ...draft, clienteTel: e.target.value })}
              placeholder="(11) 99999-9999"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Endereço</label>
            <input
              value={draft.clienteEndereco} readOnly={readOnly}
              onChange={(e) => setDraft({ ...draft, clienteEndereco: e.target.value })}
              placeholder="Rua, número, bairro"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Tipo do Local</label>
            <select
              value={draft.tipoLocal} disabled={readOnly}
              onChange={(e) => setDraft({ ...draft, tipoLocal: e.target.value as PropostaLocal['tipoLocal'] })}
              style={inputStyle}
            >
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Condomínio">Condomínio</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
        </div>
      </div>

      {/* ──── Section 2: Marca & Kit ──── */}
      {!readOnly && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <SectionTitle num={2} label="Marca & Kit Base" />

          {/* Marca selector — large pill buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {marcas.map((m) => {
              const isActive = draft.marca === m;
              const kitsForMarca = kitOptions.filter((k) => {
                const name = k.name.toUpperCase();
                const ml = m.toUpperCase();
                if (m === 'Intelbras') return name.includes('INTELBRAS') || name.includes('AMT') || name.includes('MIBO') || (!name.includes('HIKVISION') && !name.includes('HILOOK') && !name.includes('EZVIZ') && k.source === 'db');
                if (m === 'Hikvision') return name.includes('HIKVISION') || name.includes('HIK');
                if (m === 'Hilook') return name.includes('HILOOK');
                return name.includes(ml);
              });
              const hasKits = kitsForMarca.length > 0;
              return (
                <button
                  key={m} type="button"
                  onClick={() => setDraft({ ...draft, marca: m })}
                  style={{
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: isActive ? theme.gold + '22' : theme.soft,
                    border: `2px solid ${isActive ? theme.gold : theme.border}`,
                    color: isActive ? theme.gold : theme.muted,
                    position: 'relative',
                  }}
                >
                  {m}
                  {hasKits && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, marginLeft: 6,
                      background: isActive ? theme.gold : theme.muted,
                      color: '#111', borderRadius: 10, padding: '1px 5px',
                    }}>{kitsForMarca.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Kit cards for selected marca */}
          {(() => {
            const kitsForMarca = kitOptions.filter((k) => {
              const name = k.name.toUpperCase();
              const m = draft.marca.toUpperCase();
              if (draft.marca === 'Intelbras') return name.includes('INTELBRAS') || name.includes('AMT') || name.includes('MIBO') || (!name.includes('HIKVISION') && !name.includes('HILOOK') && !name.includes('EZVIZ') && k.source === 'db');
              if (draft.marca === 'Hikvision') return name.includes('HIKVISION') || name.includes('HIK');
              if (draft.marca === 'Hilook') return name.includes('HILOOK');
              return name.includes(m);
            });
            const otherKits = kitOptions.filter((k) => !kitsForMarca.includes(k));

            return (
              <>
                {kitsForMarca.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: otherKits.length > 0 ? 12 : 0 }}>
                    {kitsForMarca.map((opt) => (
                      <button key={opt.id} type="button" onClick={() => loadKit(opt)}
                        style={{
                          background: draft.kitBaseId === opt.id ? theme.gold + '15' : theme.soft,
                          border: `2px solid ${draft.kitBaseId === opt.id ? theme.gold : theme.border}`,
                          borderRadius: 10, padding: 14, cursor: 'pointer', textAlign: 'left',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={(e) => { if (draft.kitBaseId !== opt.id) (e.currentTarget as HTMLButtonElement).style.borderColor = theme.gold + '66'; }}
                        onMouseLeave={(e) => { if (draft.kitBaseId !== opt.id) (e.currentTarget as HTMLButtonElement).style.borderColor = theme.border; }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: draft.kitBaseId === opt.id ? theme.gold : theme.text, marginBottom: 6, lineHeight: 1.3 }}>{opt.name}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            background: opt.source === 'db' ? '#5B9BD522' : theme.gold + '22',
                            color: opt.source === 'db' ? '#5B9BD5' : theme.gold,
                          }}>{opt.source === 'db' ? 'Sistema' : 'Local'}</span>
                          <span style={{ fontSize: 11, color: theme.muted }}>{opt.items.length} itens</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>
                          R$ {opt.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </div>
                        {opt.valorMensalComodato != null && opt.valorMensalComodato > 0 && (
                          <div style={{ fontSize: 11, color: '#5B9BD5', marginTop: 4 }}>Comodato: R$ {opt.valorMensalComodato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: theme.muted, fontSize: 13, padding: '16px 0', background: theme.soft, borderRadius: 10, marginBottom: otherKits.length > 0 ? 12 : 0 }}>
                    Nenhum kit pré-configurado para <strong style={{ color: theme.text }}>{draft.marca}</strong>. Adicione equipamentos manualmente abaixo.
                  </div>
                )}

                {/* Collapsible: other kits from other marcas */}
                {otherKits.length > 0 && (
                  <details style={{ cursor: 'pointer' }}>
                    <summary style={{ fontSize: 12, color: theme.muted, marginBottom: 8, userSelect: 'none' }}>
                      Outros kits de outras marcas ({otherKits.length})
                    </summary>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                      {otherKits.map((opt) => (
                        <button key={opt.id} type="button" onClick={() => { loadKit(opt); }}
                          style={{
                            background: draft.kitBaseId === opt.id ? theme.gold + '15' : theme.soft,
                            border: `1px solid ${draft.kitBaseId === opt.id ? theme.gold : theme.border}`,
                            borderRadius: 8, padding: 10, cursor: 'pointer', textAlign: 'left', opacity: 0.8,
                          }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{opt.name}</div>
                          <div style={{ fontSize: 11, color: theme.muted }}>{opt.items.length} itens · R$ {opt.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ──── Section 3: Equipamentos ──── */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle num={3} label="Equipamentos" />
          <span style={{ fontSize: 12, color: theme.muted }}>{totalItens} itens</span>
        </div>

        {/* Add equipment bar */}
        {!readOnly && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <select
              value={filterBloco}
              onChange={(e) => setFilterBloco(e.target.value as BlocoCategoria | 'todos')}
              style={{ ...inputStyle, width: 150, marginBottom: 0 }}
            >
              <option value="todos">Todos os blocos</option>
              {Object.entries(blocoLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={addEquipId}
              onChange={(e) => setAddEquipId(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 200, marginBottom: 0 }}
            >
              <option value="">Selecionar equipamento...</option>
              {filteredEquipForAdd.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} — R$ {eq.price.toLocaleString('pt-BR')} ({blocoLabels[eq.bloco]})
                </option>
              ))}
            </select>
            <input
              type="number" min={1} value={addQtd}
              onChange={(e) => setAddQtd(Number(e.target.value))}
              style={{ ...inputStyle, width: 60, marginBottom: 0 }}
            />
            <button type="button" onClick={addItem} disabled={!addEquipId}
              style={{ ...btnGold, opacity: addEquipId ? 1 : 0.4 }}>+</button>
          </div>
        )}

        {/* Items grouped by bloco */}
        {draft.itens.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.muted, fontSize: 13, padding: 20 }}>
            Nenhum equipamento adicionado. Escolha um kit acima ou adicione manualmente.
          </div>
        ) : (
          Object.entries(itensByBloco).map(([bloco, items]) => (
            <div key={bloco} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.gold, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {blocoLabels[bloco as BlocoCategoria] ?? bloco}
              </div>
              {items.map(({ eq, item }) => {
                const custoManual = precosCusto[eq.id];
                const temCustoManual = custoManual != null && custoManual !== eq.price;
                return (
                  <div key={item.equipmentId} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    background: theme.soft, borderRadius: 8, marginBottom: 4,
                    border: `1px solid ${theme.border}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{eq.name}</div>
                      <div style={{ fontSize: 11, color: theme.muted }}>
                        R$ {eq.price.toLocaleString('pt-BR')} un.
                        {temCustoManual && <span> · Custo: R$ {custoManual.toLocaleString('pt-BR')}</span>}
                        {temCustoManual && <span style={{ color: theme.success }}> · Margem: {((eq.price - custoManual) / eq.price * 100).toFixed(0)}%</span>}
                        {eq.acrescimoMensal != null && eq.acrescimoMensal > 0 && (
                          <span style={{ color: '#5B9BD5' }}> · +R$ {eq.acrescimoMensal.toLocaleString('pt-BR')}/mês</span>
                        )}
                        {eq.pontos != null && eq.pontos > 0 && (
                          <span style={{ color: theme.muted }}> · {eq.pontos}pt{eq.pontos > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      {!readOnly && (
                        <input
                          placeholder="Obs técnica (ex: instalar a 3m)"
                          value={item.observacao}
                          onChange={(e) => updateObs(item.equipmentId, e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: theme.muted, fontSize: 11, padding: '2px 0', width: '100%', outline: 'none' }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      {!readOnly && <button type="button" onClick={() => updateQty(item.equipmentId, -1)} style={qtyBtn}>−</button>}
                      <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{item.quantidade}</span>
                      {!readOnly && <button type="button" onClick={() => updateQty(item.equipmentId, 1)} style={qtyBtn}>+</button>}
                    </div>
                    <div style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 600, color: theme.gold, flexShrink: 0 }}>
                      R$ {(eq.price * item.quantidade).toLocaleString('pt-BR')}
                    </div>
                    {!readOnly && (
                      <button type="button" onClick={() => removeItem(item.equipmentId)}
                        style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
                        x
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* ──── Section 4: Modalidade (Venda vs Comodato) ──── */}
      {draft.itens.length > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <SectionTitle num={4} label="Modalidade" />

          {/* Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setModalidade('venda')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, textAlign: 'center',
                background: modalidade === 'venda' ? theme.gold + '20' : theme.soft,
                border: `2px solid ${modalidade === 'venda' ? theme.gold : theme.border}`,
                color: modalidade === 'venda' ? theme.gold : theme.muted,
              }}>Compra (à vista)</button>
            <button onClick={() => setModalidade('comodato')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, textAlign: 'center',
                background: modalidade === 'comodato' ? '#5B9BD5' + '20' : theme.soft,
                border: `2px solid ${modalidade === 'comodato' ? '#5B9BD5' : theme.border}`,
                color: modalidade === 'comodato' ? '#5B9BD5' : theme.muted,
              }}>Comodato (aluguel)</button>
          </div>

          {/* Badge: origem do preço */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {hasDbPricing ? (
              <div style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: '#5B9BD522', borderRadius: 6, border: '1px solid #5B9BD544', color: '#5B9BD5' }}>
                Preços do sistema (BD)
              </div>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: theme.warning + '22', borderRadius: 6, border: `1px solid ${theme.warning}44`, color: theme.warning }}>
                Preços manuais (config local)
              </div>
            )}
            {activeKit?.limitePontos != null && activeKit.limitePontos > 0 && (
              <div style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: theme.soft, borderRadius: 6, border: `1px solid ${theme.border}`, color: theme.muted }}>
                Pontos: <span style={{ color: totalPontos > limitePontos ? theme.danger : theme.success, fontWeight: 700 }}>{totalPontos}</span> / {limitePontos}
                {pontosExcedentes > 0 && (
                  <span style={{ color: theme.warning, marginLeft: 6 }}>+{pontosExcedentes} = R$ {surchargeExtraPontos.toLocaleString('pt-BR')}/mês</span>
                )}
              </div>
            )}
          </div>

          {/* Faixa de monitoramento + controles */}
          <div style={{ background: theme.soft, borderRadius: 10, padding: 14, marginBottom: 16, border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Tamanho do local (só mostra quando sem pricing BD) */}
              {!hasDbPricing && <div>
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>Tamanho do local</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {monitConfig.faixas.map((f, i) => (
                    <button key={f.nome} onClick={() => { setFaixaIdx(i); setMonitAjuste(null); }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: faixaIdx === i ? theme.gold + '22' : 'transparent',
                        border: `1px solid ${faixaIdx === i ? theme.gold : theme.border}`,
                        color: faixaIdx === i ? theme.gold : theme.muted,
                      }}>
                      {f.nome}
                    </button>
                  ))}
                </div>
              </div>}

              {/* Monitoramento valor */}
              <div style={{ minWidth: 200 }}>
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>
                  Monitoramento: R$ {monitValor}/mês
                  {monitAjuste !== null && monitAjuste < monitBase && (
                    <span style={{ color: theme.warning, marginLeft: 4 }}>
                      (desconto de {((1 - monitAjuste / monitBase) * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
                <input
                  type="range"
                  min={monitMin} max={monitBase} step={5}
                  value={monitValor}
                  onChange={(e) => setMonitAjuste(Number(e.target.value))}
                  disabled={readOnly}
                  style={{ width: '100%', accentColor: theme.gold }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.muted }}>
                  <span>Mín: R${monitMin}</span>
                  <span>Base: R${monitBase}</span>
                </div>
              </div>

              {/* Prazo (comodato) */}
              {modalidade === 'comodato' && (
                <div>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>Prazo do contrato</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {([24, 36, 48] as const).map((p) => (
                      <button key={p} onClick={() => setPrazo(p)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                          background: prazo === p ? '#5B9BD5' + '22' : 'transparent',
                          border: `1px solid ${prazo === p ? '#5B9BD5' : theme.border}`,
                          color: prazo === p ? '#5B9BD5' : theme.muted,
                        }}>{p} meses</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ──── Comparison panels ──── */}
          <div style={{ display: 'grid', gridTemplateColumns: modalidade === 'comodato' ? '1fr 1fr' : '1fr', gap: 12 }}>
            {/* Panel: COMPRA */}
            <div style={{
              background: theme.soft, borderRadius: 10, padding: 16,
              border: `2px solid ${modalidade === 'venda' ? theme.gold : theme.border}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.gold, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Compra (à vista)
              </div>
              <Row label="Equipamentos" value={subtotalVenda} color={theme.text} />
              <Row label={`Mão de Obra (${faixa.nome})`} value={maoDeObra} color={theme.text} />
              {acrescimoInstalacaoTotal > 0 && (
                <Row label="Acréscimo Instalação" value={acrescimoInstalacaoTotal} color={theme.text} />
              )}
              {valorCrea > 0 && (
                <Row label="CREA" value={valorCrea} color={theme.text} />
              )}
              <Divider />
              <Row label="Investimento Total" value={totalVenda} color={theme.gold} bold />
              <div style={{ height: 8 }} />
              <Row label="Monitoramento" value={monitValor} color={theme.muted} suffix="/mês" />
              {modalidade === 'comodato' && (
                <>
                  <Divider />
                  <Row label={`Custo total em ${prazo} meses`} value={custoTotalVenda} color={theme.warning} bold />
                </>
              )}
            </div>

            {/* Panel: COMODATO */}
            {modalidade === 'comodato' && (
              <div style={{
                background: theme.soft, borderRadius: 10, padding: 16,
                border: '2px solid #5B9BD5',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#5B9BD5', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Comodato ({prazo} meses)
                </div>
                {hasDbPricing ? (
                  <>
                    <Row label="Base mensal (BD)" value={monitBaseFromDb} color={theme.text} suffix="/mês" />
                    {acrescimoMensalTotal > 0 && (
                      <Row label="Acréscimo Produtos" value={acrescimoMensalTotal} color={theme.text} suffix="/mês" />
                    )}
                    {surchargeExtraPontos > 0 && (
                      <Row label="Pontos Adicionais" value={surchargeExtraPontos} color={theme.text} suffix="/mês" />
                    )}
                  </>
                ) : (
                  <>
                    <Row label="Parcela Equipamento" value={parcelaEquip} color={theme.text} suffix="/mês"
                      detail={`R$ ${subtotalCusto.toLocaleString('pt-BR')} ÷ ${prazo}`} />
                    <Row label="Monitoramento" value={monitValor} color={theme.text} suffix="/mês" />
                  </>
                )}
                <Divider />
                <Row label="Mensalidade Total" value={mensalidadeComodato} color="#5B9BD5" bold suffix="/mês" />
                <div style={{ height: 8 }} />
                <Row label={`Taxa de Adesão (1ª mensalidade × ${comissaoConfig.multiplicadorAdesao})`} value={taxaAdesao} color={theme.gold} bold />
                <Row label={`Demais mensalidades (${prazo - 1}×)`} value={mensalidadeComodato} color={theme.muted} suffix="/mês" />
                <Divider />
                <Row label={`Custo total em ${prazo} meses`} value={custoTotalComodato} color={theme.warning} bold />

                {custoTotalVenda > custoTotalComodato ? (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: theme.success + '15', borderRadius: 6, fontSize: 12, color: theme.success, textAlign: 'center', fontWeight: 600 }}>
                    Economia de R$ {(custoTotalVenda - custoTotalComodato).toLocaleString('pt-BR')} vs Compra
                  </div>
                ) : custoTotalComodato > custoTotalVenda ? (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: theme.danger + '15', borderRadius: 6, fontSize: 12, color: theme.danger, textAlign: 'center', fontWeight: 600 }}>
                    R$ {(custoTotalComodato - custoTotalVenda).toLocaleString('pt-BR')} a mais que Compra
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Margin info (admin/gestor only) */}
          {(role === 'ADMIN' || role === 'GESTOR') && subtotalVenda > 0 && (
            <div style={{ marginTop: 12, padding: '8px 14px', background: theme.soft, borderRadius: 8, border: `1px solid ${theme.border}`, display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ color: theme.muted }}>Custo: <strong style={{ color: theme.text }}>R$ {subtotalCusto.toLocaleString('pt-BR')}</strong></span>
              <span style={{ color: theme.muted }}>Venda: <strong style={{ color: theme.gold }}>R$ {subtotalVenda.toLocaleString('pt-BR')}</strong></span>
              <span style={{ color: theme.muted }}>Margem: <strong style={{ color: margem > 30 ? theme.success : margem > 15 ? theme.warning : theme.danger }}>{margem.toFixed(1)}%</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ──── Observações ──── */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <label style={{ ...labelStyle, fontWeight: 600 }}>Observações</label>
        <textarea
          value={draft.observacoes} readOnly={readOnly}
          onChange={(e) => setDraft({ ...draft, observacoes: e.target.value })}
          rows={3} style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Notas sobre a proposta..."
        />
      </div>

      {/* ──── Actions ──── */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnSoft}>Voltar</button>
        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              if (!draft.clienteNome.trim()) { showToast('Preencha o nome do cliente.', 'warning'); return; }
              if (draft.itens.length === 0) { showToast('Adicione ao menos um equipamento.', 'warning'); return; }
              onSave(draft);
            }}
            style={btnGold}
          >
            {draft.id ? 'Salvar Alterações' : 'Criar Proposta'}
          </button>
        )}
        {draft.itens.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const faixa0 = monitConfig.faixas[faixaIdx] ?? monitConfig.faixas[0];
              openPropostaPDF({
                clienteNome: draft.clienteNome || '(sem nome)',
                clienteTel: draft.clienteTel,
                clienteEndereco: draft.clienteEndereco,
                tipoLocal: draft.tipoLocal,
                marca: draft.marca,
                itens: draft.itens.map((i) => {
                  const eq = equipments.find((e) => e.id === i.equipmentId);
                  return { nome: eq?.name ?? i.equipmentId, quantidade: i.quantidade, precoUnitario: eq?.price ?? 0, bloco: eq?.bloco ?? 'acessorio' };
                }),
                observacoes: draft.observacoes,
                vendedorNome: '',
                subtotalEquipamentos: subtotalVenda,
                maoDeObra,
                acrescimoInstalacao: acrescimoInstalacaoTotal,
                valorCrea,
                totalVenda,
                monitoramentoMensal: monitValor,
                mensalidadeComodato,
                taxaAdesao,
                prazo,
                custoTotalComodato,
                modalidade: modalidade === 'comodato' ? 'ambos' : 'venda',
              });
            }}
            style={{ ...btnSoft, borderColor: '#5B9BD5', color: '#5B9BD5' }}
          >
            Gerar PDF
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Small components
   ============================================================ */

function SectionTitle({ num, label }: { num: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{
        width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
        background: theme.gold, color: '#111',
      }}>
        {num}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>{label}</span>
    </div>
  );
}

function Row({ label, value, color, bold, suffix, detail }: {
  label: string; value: number; color: string; bold?: boolean; suffix?: string; detail?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0' }}>
      <div>
        <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 700 : 400, color: bold ? color : theme.muted }}>{label}</span>
        {detail && <div style={{ fontSize: 10, color: theme.muted }}>{detail}</div>}
      </div>
      <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 700 : 500, color }}>
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        {suffix && <span style={{ fontSize: 11, fontWeight: 400 }}>{suffix}</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid ${theme.border}`, margin: '8px 0' }} />;
}

function MarcaBadge({ marca }: { marca: Marca }) {
  const colorMap: Record<Marca, string> = {
    Intelbras: '#43C17B', Hikvision: '#E55B5B', Hilook: '#FF7043', Ezviz: '#26C6DA',
    DSC: '#5B9BD5', JFL: '#AB47BC', PPA: '#FFA726', Viaweb: '#E3B341', 'Genérico': '#B5B5B5',
  };
  const c = colorMap[marca];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: c + '22', color: c, border: `1px solid ${c}44`,
    }}>
      {marca}
    </span>
  );
}

function StatusBadge({ status }: { status: PropostaLocal['status'] }) {
  const map: Record<string, { label: string; color: string }> = {
    rascunho: { label: 'Rascunho', color: theme.muted },
    enviada: { label: 'Aguardando aprovação', color: '#5B9BD5' },
    aprovada: { label: 'Aprovada', color: theme.success },
  };
  const { label, color } = map[status] ?? { label: status, color: theme.muted };
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

function OSStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    bloqueada: theme.danger, pendente: theme.warning,
    agendada: '#5B9BD5', em_andamento: theme.gold, concluida: theme.success,
  };
  const c = colorMap[status] ?? theme.muted;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '3px 10px', borderRadius: 999,
      background: c + '22', color: c, border: `1px solid ${c}44`,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/* ============================================================
   MonitoramentoConfigModal — Admin edits monitoring price tiers
   ============================================================ */

function MonitoramentoConfigModal({ config, onSave, onClose }: {
  config: MonitoramentoConfig;
  onSave: (cfg: MonitoramentoConfig) => void;
  onClose: () => void;
}) {
  const [faixas, setFaixas] = useState<FaixaMonitoramento[]>(() => config.faixas.map((f) => ({ ...f })));
  const [maoDeObra, setMaoDeObra] = useState<Record<string, number>>(() => ({ ...config.maoDeObra }));
  const [novaFaixa, setNovaFaixa] = useState('');

  const updateFaixa = (idx: number, field: 'base' | 'minimo', val: number) => {
    setFaixas((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f)));
  };

  const removeFaixa = (idx: number) => {
    const nome = faixas[idx].nome;
    setFaixas((prev) => prev.filter((_, i) => i !== idx));
    setMaoDeObra((prev) => { const copy = { ...prev }; delete copy[nome]; return copy; });
  };

  const addFaixa = () => {
    const nome = novaFaixa.trim();
    if (!nome || faixas.some((f) => f.nome === nome)) return;
    setFaixas((prev) => [...prev, { nome, base: 200, minimo: 150 }]);
    setMaoDeObra((prev) => ({ ...prev, [nome]: 400 }));
    setNovaFaixa('');
  };

  const handleSave = () => {
    onSave({ faixas, maoDeObra });
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modal: React.CSSProperties = {
    background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12,
    padding: 24, width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto',
  };
  const inputSm: React.CSSProperties = {
    background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`,
    borderRadius: 6, padding: '6px 8px', width: 90, textAlign: 'right' as const, colorScheme: 'dark',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>Configurar Preços de Monitoramento</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
          Defina o preço <strong>base</strong> (sugerido) e o <strong>mínimo</strong> (piso) que o vendedor pode aplicar para cada tamanho de local. A mão de obra é o valor cobrado pela instalação.
        </p>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 36px', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>Tamanho do Local</span>
          <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600, textAlign: 'right' }}>Base (R$)</span>
          <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600, textAlign: 'right' }}>Mínimo (R$)</span>
          <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600, textAlign: 'right' }}>Mão de Obra</span>
          <span />
        </div>

        {/* Rows */}
        {faixas.map((f, i) => (
          <div key={f.nome} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 36px', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: theme.text }}>{f.nome}</span>
            <input
              type="number"
              value={f.base}
              onChange={(e) => updateFaixa(i, 'base', Number(e.target.value))}
              style={inputSm}
            />
            <input
              type="number"
              value={f.minimo}
              onChange={(e) => updateFaixa(i, 'minimo', Number(e.target.value))}
              style={inputSm}
            />
            <input
              type="number"
              value={maoDeObra[f.nome] ?? 0}
              onChange={(e) => setMaoDeObra((prev) => ({ ...prev, [f.nome]: Number(e.target.value) }))}
              style={inputSm}
            />
            <button
              onClick={() => removeFaixa(i)}
              title="Remover faixa"
              style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add new */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 20 }}>
          <input
            placeholder="Nome da nova faixa..."
            value={novaFaixa}
            onChange={(e) => setNovaFaixa(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFaixa()}
            style={{ ...inputSm, width: 'auto', flex: 1, textAlign: 'left' as const }}
          />
          <button onClick={addFaixa} style={{ background: theme.gold, border: 'none', borderRadius: 6, color: '#111', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
            + Adicionar
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{ background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%', colorScheme: 'dark' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 16px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '3px 10px', cursor: 'pointer', fontSize: 12 };
const qtyBtn: React.CSSProperties = { width: 24, height: 24, borderRadius: 6, background: theme.soft, border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
