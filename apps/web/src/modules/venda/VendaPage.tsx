'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { getPresetsForMarca, KIT_CATEGORIA_LABELS } from '../../config/kitPresets';
import { useAuth } from '../../contexts/AuthContext';
import {
  mockEquipments, mockLeads, mockOportunidades, mockOrcamentos,
  mockOrdens, mockPropostas, mockSolucoes, mockUsers,
} from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import {
  BlocoCategoria, BlocoTecnico, Equipment, FAIXAS_ZONA, FaixaZona,
  ItemSolucao, Lead, Marca, Oportunidade, Orcamento, OrcamentoItem,
  OrdemDeServico, Proposta, SolucaoTecnica, User,
} from '../../types';

/* ================================================================
   Constants
   ================================================================ */

const marcas: Marca[] = ['Intelbras', 'Hikvision', 'DSC', 'Viaweb', 'Vetti'];

const allBlocos: BlocoCategoria[] = [
  'sensor_externo', 'sensor_interno', 'sensor_porta_janela',
  'camera_analogica', 'camera_ip', 'camera_ia',
  'dvr_nvr', 'central_alarme', 'modulo_comunicacao', 'acessorio',
];

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

type WizardStep = { label: string; blocos: BlocoCategoria[] };

const wizardSteps: WizardStep[] = [
  { label: 'Marca', blocos: [] },
  { label: 'Sensores', blocos: ['sensor_externo', 'sensor_interno', 'sensor_porta_janela'] },
  { label: 'Câmeras', blocos: ['camera_analogica', 'camera_ip', 'camera_ia'] },
  { label: 'Gravação / Central', blocos: ['dvr_nvr', 'central_alarme'] },
  { label: 'Comunicação', blocos: ['modulo_comunicacao'] },
  { label: 'Acessórios', blocos: ['acessorio'] },
  { label: 'Resumo', blocos: [] },
];

const TAB_LABELS = ['Cliente', 'Solução', 'Orçamento', 'Proposta'] as const;
type TabName = (typeof TAB_LABELS)[number];

function emptyBlocos(): BlocoTecnico[] {
  return allBlocos.map((cat) => ({ categoria: cat, itens: [] }));
}

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

function formatDate(iso: string): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

/* ================================================================
   VendaPage — Main
   ================================================================ */

export function VendaPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId as string;
  const { role } = useAuth();
  const { showToast } = useToast();

  /* --- all data --- */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [solucoes, setSolucoes] = useState<SolucaoTecnica[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  /* --- UI state --- */
  const [activeTab, setActiveTab] = useState<TabName>('Cliente');
  const [solDraft, setSolDraft] = useState<SolucaoTecnica | null>(null);
  const [wizStep, setWizStep] = useState(0);
  const [orcZonas, setOrcZonas] = useState(4);
  const [orcDesconto, setOrcDesconto] = useState(0);
  const [orcObs, setOrcObs] = useState('');

  /* --- load --- */
  useEffect(() => {
    setLeads(loadMock('mock_leads', mockLeads));
    setOportunidades(loadMock('mock_oportunidades', mockOportunidades));
    setSolucoes(loadMock('mock_solucoes', mockSolucoes));
    setEquipments(loadMock('mock_equipments', mockEquipments));
    setOrcamentos(loadMock('mock_orcamentos', mockOrcamentos));
    setPropostas(loadMock('mock_propostas', mockPropostas));
    setOrdens(loadMock('mock_ordens', mockOrdens));
    setUsers(loadMock('mock_users', mockUsers));
  }, []);

  /* --- persist --- */
  useEffect(() => { if (solucoes.length) saveMock('mock_solucoes', solucoes); }, [solucoes]);
  useEffect(() => { saveMock('mock_orcamentos', orcamentos); }, [orcamentos]);
  useEffect(() => { if (propostas.length) saveMock('mock_propostas', propostas); }, [propostas]);
  useEffect(() => { saveMock('mock_ordens', ordens); }, [ordens]);
  useEffect(() => { if (oportunidades.length) saveMock('mock_oportunidades', oportunidades); }, [oportunidades]);

  /* --- derived for this lead --- */
  const lead = leads.find((l) => l.id === leadId) ?? null;
  const oportunidade = oportunidades.find((o) => o.leadId === leadId && o.status !== 'perdida') ?? null;
  const solucao = solucoes.find((s) => s.leadId === leadId) ?? null;
  const orcamento = orcamentos.find((o) => o.leadId === leadId) ?? null;
  const proposta = propostas.find((p) => p.leadId === leadId) ?? null;

  /* --- init solução draft when entering the tab --- */
  useEffect(() => {
    if (activeTab !== 'Solução' || solDraft || !lead) return;

    if (solucao) {
      setSolDraft({ ...solucao });
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    const userId = users.find((u) => u.role === role)?.id ?? 'U1';

    let opId = oportunidade?.id ?? '';
    if (!opId) {
      opId = 'OP' + Date.now();
      const newOp: Oportunidade = {
        id: opId, leadId, valorEstimado: lead.value, probabilidade: 50,
        proximaAcao: 'Montando solução técnica', status: 'aberta',
        vendedorId: userId, createdAt: now,
      };
      setOportunidades((cur) => [...cur, newOp]);
    }

    setSolDraft({
      id: '', oportunidadeId: opId, leadId,
      clienteNome: `${lead.name} — ${lead.company}`,
      marca: 'Intelbras', blocos: emptyBlocos(), observacaoGeral: '',
      status: 'rascunho', criadoPor: userId, createdAt: now, updatedAt: now,
    });
    setWizStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, lead, solucao, solDraft]);

  /* --- init orçamento fields when entering the tab --- */
  useEffect(() => {
    if (activeTab === 'Orçamento' && orcamento) {
      setOrcZonas(orcamento.zonas);
      setOrcDesconto(orcamento.desconto);
      setOrcObs(orcamento.observacoes);
    }
  }, [activeTab, orcamento]);

  /* =============================================
     Actions
     ============================================= */

  function handleSaveSolucao() {
    if (!solDraft) return;
    const now = new Date().toISOString().slice(0, 10);
    if (solDraft.id) {
      const updated = { ...solDraft, updatedAt: now };
      setSolucoes((cur) => cur.map((s) => s.id === solDraft.id ? updated : s));
      setSolDraft(updated);
    } else {
      const withId = { ...solDraft, id: 'SOL' + Date.now(), updatedAt: now };
      setSolucoes((cur) => [...cur, withId]);
      setSolDraft(withId);
    }
    showToast('Solução salva.', 'success');
  }

  function handleAprovarSolucao() {
    if (!solDraft) return;
    const now = new Date().toISOString().slice(0, 10);
    const id = solDraft.id || 'SOL' + Date.now();
    const approved: SolucaoTecnica = { ...solDraft, id, status: 'aprovada', updatedAt: now };

    if (solDraft.id) {
      setSolucoes((cur) => cur.map((s) => s.id === id ? approved : s));
    } else {
      setSolucoes((cur) => [...cur, approved]);
    }
    setSolDraft(approved);

    // --- auto-generate orçamento ---
    const itens: OrcamentoItem[] = [];
    for (const bloco of approved.blocos) {
      for (const item of bloco.itens) {
        const eq = equipments.find((e) => e.id === item.equipmentId);
        if (!eq) continue;
        itens.push({
          equipmentId: item.equipmentId, nome: eq.name,
          quantidade: item.quantidade, precoUnitario: eq.price,
          subtotal: eq.price * item.quantidade, bloco: bloco.categoria,
        });
      }
    }
    const subtotalEquip = itens.reduce((s, i) => s + i.subtotal, 0);
    const zonas = 4;
    const calc = calcularOrcamento(zonas, subtotalEquip, 0);

    const newOrc: Orcamento = {
      id: 'ORC' + Date.now(), solucaoId: id,
      oportunidadeId: approved.oportunidadeId, leadId: approved.leadId,
      clienteNome: approved.clienteNome, marca: approved.marca,
      zonas, itens, subtotalEquipamentos: subtotalEquip,
      fatorZona: calc.fator, totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra, mensalidade: calc.mensalidade,
      desconto: 0, totalFinal: calc.totalFinal, observacoes: '',
      status: 'gerado', createdAt: now,
    };
    setOrcamentos((cur) => [...cur, newOrc]);
    setOrcZonas(4);
    setOrcDesconto(0);
    setOrcObs('');

    showToast('Solução aprovada e orçamento gerado!', 'success');
    setActiveTab('Orçamento');
  }

  function handleSaveOrcamento() {
    if (!orcamento) return;
    const calc = calcularOrcamento(orcZonas, orcamento.subtotalEquipamentos, orcDesconto);
    const updated: Orcamento = {
      ...orcamento, zonas: orcZonas, desconto: orcDesconto, observacoes: orcObs,
      fatorZona: calc.fator, totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra, mensalidade: calc.mensalidade,
      totalFinal: calc.totalFinal,
      status: orcamento.status === 'gerado' ? 'ajustado' : orcamento.status,
    };
    setOrcamentos((cur) => cur.map((o) => o.id === orcamento.id ? updated : o));
    showToast('Orçamento salvo.', 'success');
  }

  function handleGerarProposta() {
    if (!orcamento) return;
    const calc = calcularOrcamento(orcZonas, orcamento.subtotalEquipamentos, orcDesconto);

    const novaProposta: Proposta = {
      id: 'PR' + Date.now(), oportunidadeId: orcamento.oportunidadeId,
      leadId: orcamento.leadId, leadNome: orcamento.clienteNome,
      itens: orcamento.itens.map((i) => ({
        equipamentoId: i.equipmentId, nome: i.nome,
        quantidade: i.quantidade, precoUnitario: i.precoUnitario,
      })),
      servicos: [
        { descricao: 'Instalação + Configuração', valor: calc.maoDeObra, tipo: 'instalacao' },
        { descricao: 'Monitoramento 24h (mensal)', valor: calc.mensalidade, tipo: 'mensalidade' },
      ],
      total: calc.totalFinal + calc.mensalidade,
      observacoes: orcObs || 'Gerada automaticamente.',
      status: 'rascunho', createdAt: new Date().toISOString().slice(0, 10),
    };
    setPropostas((cur) => [...cur, novaProposta]);

    const updatedOrc: Orcamento = {
      ...orcamento, zonas: orcZonas, desconto: orcDesconto, observacoes: orcObs,
      fatorZona: calc.fator, totalEquipamentos: calc.totalEquip,
      maoDeObra: calc.maoDeObra, mensalidade: calc.mensalidade,
      totalFinal: calc.totalFinal, status: 'proposta_criada',
    };
    setOrcamentos((cur) => cur.map((o) => o.id === orcamento.id ? updatedOrc : o));

    if (solucao) {
      setSolucoes((cur) => cur.map((s) => s.id === solucao.id ? { ...s, status: 'orcamento_gerado' as const } : s));
    }

    showToast('Proposta gerada!', 'success');
    setActiveTab('Proposta');
  }

  function handleEnviarProposta() {
    if (!proposta) return;
    setPropostas((cur) => cur.map((p) => p.id === proposta.id ? { ...p, status: 'enviado' as const } : p));
    showToast('Proposta enviada ao cliente.', 'success');
  }

  function handleAprovarProposta() {
    if (!proposta) return;
    setPropostas((cur) => cur.map((p) => p.id === proposta.id ? { ...p, status: 'aprovado' as const } : p));

    if (oportunidade) {
      setOportunidades((cur) => cur.map((o) => o.id === oportunidade.id ? { ...o, status: 'ganha' as const } : o));
    }

    const newOS: OrdemDeServico = {
      id: 'OS' + Date.now(), propostaId: proposta.id,
      oportunidadeId: proposta.oportunidadeId, leadId: proposta.leadId,
      cliente: proposta.leadNome, dataAgendada: '', tecnicoId: '',
      checklist: proposta.itens.map((i, idx) => ({
        id: 'CK' + Date.now() + idx,
        text: `Instalar ${i.quantidade}x ${i.nome}`,
        done: false,
      })),
      pontos: [], observacoes: '', status: 'pendente',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setOrdens((cur) => [...cur, newOS]);
    showToast('Proposta aprovada! OS criada automaticamente.', 'success');
  }

  /* --- tab availability --- */
  const canAccessOrcamento = !!orcamento;
  const canAccessProposta = !!proposta;

  /* --- progress --- */
  const progress = proposta?.status === 'aprovado' ? 4
    : proposta ? 3
    : orcamento ? 2
    : solucao ? 1
    : 0;

  /* --- render --- */

  if (!lead) {
    return (
      <AppShell title="Venda">
        <div style={{ textAlign: 'center', padding: 40, color: theme.muted }}>
          Lead não encontrado (ID: {leadId}).
          <br />
          <button onClick={() => { window.location.href = '/kanban'; }} style={{ ...btnGold, marginTop: 16 }}>
            Voltar ao Pipeline
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Venda — ${lead.name}`}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
        {['Lead', 'Solução', 'Orçamento', 'Proposta', 'OS'].map((stepLabel, i) => (
          <div key={stepLabel} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: i <= progress ? theme.gold : theme.soft,
              color: i <= progress ? '#111' : theme.muted,
              border: `2px solid ${i <= progress ? theme.gold : theme.border}`,
            }}>
              {i < progress ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i <= progress ? theme.gold : theme.muted, whiteSpace: 'nowrap' }}>{stepLabel}</span>
            {i < 4 && <div style={{ width: 20, height: 2, background: i < progress ? theme.gold : theme.border }} />}
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `1px solid ${theme.border}`, overflowX: 'auto' }}>
        {TAB_LABELS.map((tab) => {
          const disabled = (tab === 'Orçamento' && !canAccessOrcamento) || (tab === 'Proposta' && !canAccessProposta);
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => !disabled && setActiveTab(tab)}
              disabled={disabled}
              style={{
                background: active ? theme.panel : 'transparent',
                border: `1px solid ${active ? theme.border : 'transparent'}`,
                borderBottom: active ? `2px solid ${theme.gold}` : '2px solid transparent',
                borderRadius: '8px 8px 0 0', padding: '10px 20px',
                color: disabled ? theme.muted + '66' : active ? theme.gold : theme.text,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: active ? 700 : 400, fontSize: 13,
                opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { window.location.href = '/kanban'; }}
          style={{ ...btnSoft, fontSize: 12, padding: '6px 12px', alignSelf: 'center', whiteSpace: 'nowrap' }}
        >
          ← Pipeline
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'Cliente' && <TabCliente lead={lead} />}

      {activeTab === 'Solução' && solDraft && (
        <TabSolucao
          draft={solDraft} setDraft={setSolDraft}
          step={wizStep} setStep={setWizStep}
          equipments={equipments}
          solucaoExistente={solucao}
          onSave={handleSaveSolucao}
          onAprovar={handleAprovarSolucao}
          canApprove={role === 'ADMIN'}
        />
      )}

      {activeTab === 'Orçamento' && orcamento && (
        <TabOrcamento
          orcamento={orcamento}
          zonas={orcZonas} setZonas={setOrcZonas}
          desconto={orcDesconto} setDesconto={setOrcDesconto}
          observacoes={orcObs} setObservacoes={setOrcObs}
          onSave={handleSaveOrcamento}
          onGerarProposta={handleGerarProposta}
        />
      )}

      {activeTab === 'Proposta' && proposta && (
        <TabProposta proposta={proposta} onEnviar={handleEnviarProposta} onAprovar={handleAprovarProposta} canApprove={role === 'ADMIN'} />
      )}
    </AppShell>
  );
}

/* ================================================================
   Tab: Cliente
   ================================================================ */

function TabCliente({ lead }: { lead: Lead }) {
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 12px', color: theme.gold, fontSize: 16 }}>{lead.name}</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <InfoRow label="Empresa" value={lead.company} />
          <InfoRow label="Origem" value={lead.origin} />
          <InfoRow label="Etapa" value={lead.stage} />
          <InfoRow label="Responsável" value={lead.responsible} />
          <InfoRow label="Valor" value={`R$ ${lead.value.toLocaleString('pt-BR')}`} />
          <InfoRow label="Semana" value={lead.week} />
          <InfoRow label="Status" value={lead.status} />
        </div>
      </div>

      {lead.timeline.length > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 12px', color: theme.gold, fontSize: 14 }}>Timeline</h4>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            {lead.timeline.map((item, i) => (
              <div key={item.id} style={{ position: 'relative', paddingBottom: i < lead.timeline.length - 1 ? 16 : 0 }}>
                <div style={{ position: 'absolute', left: -16, top: 4, width: 10, height: 10, borderRadius: '50%', background: theme.gold }} />
                {i < lead.timeline.length - 1 && (
                  <div style={{ position: 'absolute', left: -12, top: 16, bottom: 0, borderLeft: `2px solid ${theme.border}` }} />
                )}
                <div style={{ fontSize: 12, color: theme.muted }}>{formatDate(item.date)}</div>
                <div style={{ fontSize: 13 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lead.notes.length > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16 }}>
          <h4 style={{ margin: '0 0 8px', color: theme.gold, fontSize: 14 }}>Notas</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {lead.notes.map((note, i) => <li key={i} style={{ marginBottom: 4 }}>{note}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ fontSize: 12, color: theme.muted, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13, color: theme.text }}>{value}</span>
    </div>
  );
}

/* ================================================================
   Tab: Solução (kit + wizard)
   ================================================================ */

function TabSolucao({ draft, setDraft, step, setStep, equipments, solucaoExistente, onSave, onAprovar, canApprove }: {
  draft: SolucaoTecnica;
  setDraft: (d: SolucaoTecnica) => void;
  step: number;
  setStep: (s: number) => void;
  equipments: Equipment[];
  solucaoExistente: SolucaoTecnica | null;
  onSave: () => void;
  onAprovar: () => void;
  canApprove: boolean;
}) {
  const [kitMode, setKitMode] = useState(true);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

  const kitsForMarca = useMemo(() => getPresetsForMarca(draft.marca), [draft.marca]);
  const isApproved = solucaoExistente?.status === 'aprovada' || solucaoExistente?.status === 'orcamento_gerado';

  // Reset kit selection when brand changes
  useEffect(() => { setSelectedKitId(null); }, [draft.marca]);

  // Flatten all bloco items for the adjustment view
  const flatItems = useMemo(() => {
    const result: Array<{ equipmentId: string; nome: string; preco: number; quantidade: number; subtotal: number; blocoLabel: string }> = [];
    for (const bloco of draft.blocos) {
      for (const item of bloco.itens) {
        const eq = equipments.find((e) => e.id === item.equipmentId);
        if (!eq) continue;
        result.push({
          equipmentId: item.equipmentId, nome: eq.name, preco: eq.price,
          quantidade: item.quantidade, subtotal: eq.price * item.quantidade,
          blocoLabel: blocoLabels[bloco.categoria],
        });
      }
    }
    return result;
  }, [draft.blocos, equipments]);

  const totalEstimado = flatItems.reduce((s, i) => s + i.subtotal, 0);
  const hasItems = flatItems.length > 0;

  function applyKit(kit: { id: string; itens: { equipmentId: string; quantidade: number }[] }) {
    const blocos = emptyBlocos();
    for (const kitItem of kit.itens) {
      const eq = equipments.find((e) => e.id === kitItem.equipmentId);
      if (!eq) continue;
      const bloco = blocos.find((b) => b.categoria === eq.bloco);
      if (bloco) {
        bloco.itens.push({ equipmentId: kitItem.equipmentId, quantidade: kitItem.quantidade, observacao: '' });
      }
    }
    setDraft({ ...draft, blocos });
    setSelectedKitId(kit.id);
  }

  function updateItemQty(equipmentId: string, newQty: number) {
    setDraft({
      ...draft,
      blocos: draft.blocos.map((b) => ({
        ...b,
        itens: b.itens
          .map((i) => (i.equipmentId === equipmentId ? { ...i, quantidade: Math.max(0, newQty) } : i))
          .filter((i) => i.quantidade > 0),
      })),
    });
  }

  /* --- Approved: read-only --- */
  if (isApproved) {
    return (
      <div>
        <div style={{ background: theme.success + '15', border: `1px solid ${theme.success}44`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: theme.success }}>
          Solução aprovada. O orçamento já foi gerado na aba "Orçamento".
        </div>
        <StepResumo draft={draft} equipments={equipments} />
      </div>
    );
  }

  /* --- Advanced mode: full wizard --- */
  if (!kitMode) {
    const currentStep = wizardSteps[step];
    const isLast = step === wizardSteps.length - 1;
    const isFirst = step === 0;

    function updateBloco(categoria: BlocoCategoria, itens: ItemSolucao[]) {
      setDraft({ ...draft, blocos: draft.blocos.map((b) => b.categoria === categoria ? { ...b, itens } : b) });
    }

    function getBloco(cat: BlocoCategoria): BlocoTecnico {
      return draft.blocos.find((b) => b.categoria === cat) ?? { categoria: cat, itens: [] };
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button onClick={() => setKitMode(true)} style={{ ...btnSoft, fontSize: 12, padding: '5px 12px' }}>← Modo Kit</button>
        </div>

        {/* Wizard step indicators */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {wizardSteps.map((ws, i) => {
            const isCurrent = i === step;
            const hasBlocos = ws.blocos.length > 0;
            const hasStepItems = hasBlocos && ws.blocos.some((bc) => getBloco(bc).itens.length > 0);
            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isCurrent ? 'rgba(200,169,81,0.12)' : 'transparent',
                  border: `1px solid ${isCurrent ? theme.gold : theme.border}`,
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                  color: isCurrent ? theme.gold : theme.text,
                  fontWeight: isCurrent ? 700 : 400, fontSize: 12, whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  background: isCurrent ? theme.gold : hasStepItems ? theme.success + '33' : theme.soft,
                  color: isCurrent ? '#111' : hasStepItems ? theme.success : theme.muted,
                  border: `1px solid ${isCurrent ? theme.gold : hasStepItems ? theme.success + '66' : theme.border}`,
                }}>
                  {hasStepItems ? '✓' : i + 1}
                </span>
                {ws.label}
              </button>
            );
          })}
        </div>

        {step === 0 && <StepMarca draft={draft} setDraft={setDraft} />}

        {step >= 1 && step <= 5 && currentStep.blocos.map((cat) => (
          <BlockEditor
            key={cat} categoria={cat} label={blocoLabels[cat]}
            marca={draft.marca} equipments={equipments}
            items={getBloco(cat).itens}
            onChange={(itens) => updateBloco(cat, itens)}
          />
        ))}

        {step === 6 && (
          <>
            <StepResumo draft={draft} equipments={equipments} />
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Observação geral</label>
              <textarea
                value={draft.observacaoGeral}
                onChange={(e) => setDraft({ ...draft, observacaoGeral: e.target.value })}
                rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Notas livres sobre esta solução..."
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
          {!isFirst && <button onClick={() => setStep(step - 1)} style={btnSoft}>← Anterior</button>}
          <div style={{ flex: 1 }} />
          {!isLast ? (
            <button onClick={() => setStep(step + 1)} style={btnGold}>Próximo →</button>
          ) : (
            <>
              <button onClick={onSave} style={btnSoft}>Salvar rascunho</button>
              {canApprove && (
                <button onClick={onAprovar} style={{ ...btnGold, background: theme.success }}>
                  Aprovar e gerar orçamento →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  /* --- Kit mode --- */
  return (
    <div>
      {/* Header + mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Montar Solução</h3>
        <button onClick={() => { setKitMode(false); setStep(0); }} style={{ ...btnSoft, fontSize: 12, padding: '5px 12px' }}>
          Modo avançado →
        </button>
      </div>

      {/* Client info */}
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 10 }}>
        Cliente: <strong style={{ color: theme.text }}>{draft.clienteNome}</strong>
      </div>

      {/* Brand selector */}
      <label style={labelStyle}>Marca Principal</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {marcas.map((m) => (
          <button
            key={m}
            onClick={() => { if (m !== draft.marca) setDraft({ ...draft, marca: m, blocos: emptyBlocos() }); }}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: draft.marca === m ? theme.gold + '22' : theme.soft,
              border: `2px solid ${draft.marca === m ? theme.gold : theme.border}`,
              color: draft.marca === m ? theme.gold : theme.text,
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Kit cards */}
      {kitsForMarca.length > 0 ? (
        <>
          <label style={{ ...labelStyle, marginBottom: 10, fontSize: 13 }}>Escolha um kit pré-configurado</label>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', marginBottom: 20 }}>
            {kitsForMarca.map((kit) => {
              const kitPrice = kit.itens.reduce((s, i) => {
                const eq = equipments.find((e) => e.id === i.equipmentId);
                return s + (eq?.price ?? 0) * i.quantidade;
              }, 0);
              const itemCount = kit.itens.reduce((s, i) => s + i.quantidade, 0);
              const isSelected = selectedKitId === kit.id;

              return (
                <button
                  key={kit.id}
                  onClick={() => applyKit(kit)}
                  style={{
                    display: 'block', textAlign: 'left', cursor: 'pointer',
                    background: isSelected ? 'rgba(200,169,81,0.10)' : theme.panel,
                    border: `2px solid ${isSelected ? theme.gold : theme.border}`,
                    borderRadius: 12, padding: 14, color: theme.text,
                    transition: 'border-color 150ms, background 150ms',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: isSelected ? theme.gold : theme.text }}>{kit.nome}</strong>
                    {isSelected && (
                      <span style={{ fontSize: 9, color: theme.gold, fontWeight: 700, background: theme.gold + '22', padding: '2px 6px', borderRadius: 999, flexShrink: 0, marginLeft: 6 }}>
                        SELECIONADO
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>
                    {KIT_CATEGORIA_LABELS[kit.categoria]}
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>
                    {kit.descricao}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: theme.muted }}>{itemCount} itens</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.gold }}>
                      ~R$ {formatCurrency(kitPrice)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{
          border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 24, textAlign: 'center',
          color: theme.muted, fontSize: 13, marginBottom: 16,
        }}>
          Nenhum kit pré-configurado para <strong>{draft.marca}</strong>.
          <br />
          <button onClick={() => { setKitMode(false); setStep(0); }} style={{ ...btnGold, marginTop: 10, fontSize: 12 }}>
            Usar modo avançado
          </button>
        </div>
      )}

      {/* Quantity adjustment area */}
      {hasItems && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, color: theme.gold }}>Ajustar Quantidades</h4>
          <div style={{ display: 'grid', gap: 6 }}>
            {flatItems.map((item) => (
              <div key={item.equipmentId} style={{
                display: 'flex', alignItems: 'center', gap: 8, background: theme.soft,
                borderRadius: 8, padding: '8px 12px', border: `1px solid ${theme.border}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.nome}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted }}>
                    {item.blocoLabel} · R$ {formatCurrency(item.preco)}/un
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                  <button onClick={() => updateItemQty(item.equipmentId, item.quantidade - 1)} style={qtyBtnStyle}>−</button>
                  <span style={{ display: 'inline-block', width: 32, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
                    {item.quantidade}
                  </span>
                  <button onClick={() => updateItemQty(item.equipmentId, item.quantidade + 1)} style={qtyBtnStyle}>+</button>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.gold, minWidth: 80, textAlign: 'right' }}>
                  R$ {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}`,
          }}>
            <span style={{ fontSize: 14, color: theme.muted }}>Total estimado (equipamentos)</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: theme.gold }}>R$ {formatCurrency(totalEstimado)}</span>
          </div>
        </div>
      )}

      {/* Observations */}
      {hasItems && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Observação geral</label>
          <textarea
            value={draft.observacaoGeral}
            onChange={(e) => setDraft({ ...draft, observacaoGeral: e.target.value })}
            rows={3} style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Notas livres sobre esta solução..."
          />
        </div>
      )}

      {/* Actions */}
      {hasItems && (
        <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
          <button onClick={onSave} style={btnSoft}>Salvar rascunho</button>
          {canApprove && (
            <button onClick={onAprovar} style={{ ...btnGold, background: theme.success }}>
              Aprovar e gerar orçamento →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Step: Marca ---- */

function StepMarca({ draft, setDraft }: { draft: SolucaoTecnica; setDraft: (d: SolucaoTecnica) => void }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ color: theme.gold, margin: '0 0 6px', fontSize: 16 }}>Dados da Solução</h3>
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>
        Cliente: <strong style={{ color: theme.text }}>{draft.clienteNome}</strong>
      </div>

      <label style={labelStyle}>Marca Principal *</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {marcas.map((m) => (
          <button
            key={m}
            onClick={() => setDraft({ ...draft, marca: m })}
            style={{
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: draft.marca === m ? theme.gold + '22' : theme.soft,
              border: `2px solid ${draft.marca === m ? theme.gold : theme.border}`,
              color: draft.marca === m ? theme.gold : theme.text,
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ background: theme.soft, borderRadius: 10, padding: 12, border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>Configuração</div>
        <div style={{ fontSize: 14 }}>
          <strong>{draft.clienteNome}</strong>
          <span style={{ color: theme.muted }}> · Marca: </span>
          <MarcaBadge marca={draft.marca} />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Tab: Orçamento
   ================================================================ */

function TabOrcamento({ orcamento, zonas, setZonas, desconto, setDesconto, observacoes, setObservacoes, onSave, onGerarProposta }: {
  orcamento: Orcamento;
  zonas: number; setZonas: (z: number) => void;
  desconto: number; setDesconto: (d: number) => void;
  observacoes: string; setObservacoes: (o: string) => void;
  onSave: () => void;
  onGerarProposta: () => void;
}) {
  const subtotalEquip = orcamento.subtotalEquipamentos;
  const calc = calcularOrcamento(zonas, subtotalEquip, desconto);
  const faixa = calc.faixa;
  const isProposta = orcamento.status === 'proposta_criada';

  const markupEquip = subtotalEquip * (calc.fator - 1);
  const subtotalGeral = calc.totalEquip + calc.maoDeObra;
  const descontoValor = subtotalGeral * (desconto / 100);

  const blocoGroups: { bloco: BlocoCategoria; items: OrcamentoItem[] }[] = [];
  for (const item of orcamento.itens) {
    const g = blocoGroups.find((x) => x.bloco === item.bloco);
    if (g) g.items.push(item);
    else blocoGroups.push({ bloco: item.bloco, items: [item] });
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <MarcaBadge marca={orcamento.marca} />
        <OrcamentoStatusBadge status={orcamento.status} />
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
          Faixa {faixa.label} ({faixa.min}–{faixa.max === Infinity ? '∞' : faixa.max} zonas) — Fator {faixa.fator}x · Mão de obra R$ {formatCurrency(faixa.maoDeObra)} · Mensalidade R$ {formatCurrency(faixa.mensalidade)}
        </div>
      </div>

      {/* Equipment table */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, color: theme.gold }}>Equipamentos</h4>
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
              <td style={{ ...tdStyle, fontWeight: 700 }}>R$ {formatCurrency(subtotalEquip)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Costs panel */}
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
        {desconto > 0 && <CostLine label={`Desconto (${desconto}%)`} value={-descontoValor} prefix="" danger />}
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
          <input type="range" min={0} max={30} value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} disabled={isProposta} style={{ flex: 1 }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: desconto > 0 ? theme.gold : theme.muted, minWidth: 50, textAlign: 'right' }}>
            {desconto}%
          </span>
        </div>
      </div>

      {/* Observations */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: theme.muted, display: 'block', marginBottom: 4 }}>Observações</label>
        <textarea
          value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
          rows={3} disabled={isProposta}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: 0, width: '100%' }}
          placeholder="Notas sobre o orçamento..."
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isProposta && (
          <>
            <button onClick={onSave} style={btnSoft}>Salvar ajustes</button>
            <button onClick={onGerarProposta} style={{ ...btnGold, background: theme.success }}>Gerar Proposta →</button>
          </>
        )}
        {isProposta && (
          <span style={{ fontSize: 13, color: theme.success, alignSelf: 'center' }}>Proposta já gerada na aba "Proposta".</span>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Tab: Proposta
   ================================================================ */

function TabProposta({ proposta, onEnviar, onAprovar, canApprove }: {
  proposta: Proposta;
  onEnviar: () => void;
  onAprovar: () => void;
  canApprove: boolean;
}) {
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>{proposta.leadNome}</h3>
        <StatusBadge value={proposta.status} />
      </div>

      {/* Items */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, color: theme.gold }}>Equipamentos</h4>
        {proposta.itens.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span>{item.quantidade}x {item.nome}</span>
            <span style={{ color: theme.muted }}>R$ {formatCurrency(item.quantidade * item.precoUnitario)}</span>
          </div>
        ))}
      </div>

      {/* Services */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, color: theme.gold }}>Serviços</h4>
        {proposta.servicos.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span>
              {s.descricao}
              <span style={{ fontSize: 11, color: theme.muted, marginLeft: 6 }}>({s.tipo === 'mensalidade' ? 'mensal' : 'único'})</span>
            </span>
            <span style={{ color: theme.muted }}>R$ {formatCurrency(s.valor)}</span>
          </div>
        ))}
      </div>

      {proposta.observacoes && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 14, color: theme.gold }}>Observações</h4>
          <div style={{ fontSize: 13, color: theme.muted }}>{proposta.observacoes}</div>
        </div>
      )}

      {/* Total */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(200,169,81,0.08), rgba(200,169,81,0.02))',
        border: `2px solid ${theme.gold}44`, borderRadius: 12, padding: 16, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>Total da Proposta</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: theme.gold }}>R$ {formatCurrency(proposta.total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {proposta.status === 'rascunho' && (
          <button onClick={onEnviar} style={btnGold}>Enviar ao cliente</button>
        )}
        {proposta.status === 'enviado' && canApprove && (
          <button onClick={onAprovar} style={{ ...btnGold, background: theme.success }}>Aprovar Proposta</button>
        )}
        {proposta.status === 'aprovado' && (
          <div style={{
            background: theme.success + '15', border: `1px solid ${theme.success}44`,
            borderRadius: 10, padding: 12, fontSize: 13, color: theme.success,
          }}>
            Proposta aprovada! Ordem de Serviço criada automaticamente. Acesse "Ordens de Serviço" para acompanhar.
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Shared Components
   ================================================================ */

/* ---- BlockEditor ---- */

function BlockEditor({ categoria, label, marca, equipments, items, onChange }: {
  categoria: BlocoCategoria; label: string; marca: Marca;
  equipments: Equipment[]; items: ItemSolucao[];
  onChange: (items: ItemSolucao[]) => void;
}) {
  const [selEquip, setSelEquip] = useState('');
  const [selQtd, setSelQtd] = useState(1);
  const [selObs, setSelObs] = useState('');

  const filteredEquipments = useMemo(() =>
    equipments.filter((e) => e.bloco === categoria && (e.marca === marca || e.marca === 'Genérico')),
  [equipments, categoria, marca]);

  const allBlockEquipments = useMemo(() =>
    equipments.filter((e) => e.bloco === categoria),
  [equipments, categoria]);

  function addItem() {
    if (!selEquip || selQtd < 1) return;
    const existing = items.find((i) => i.equipmentId === selEquip);
    if (existing) {
      onChange(items.map((i) => i.equipmentId === selEquip ? { ...i, quantidade: i.quantidade + selQtd } : i));
    } else {
      onChange([...items, { equipmentId: selEquip, quantidade: selQtd, observacao: selObs }]);
    }
    setSelEquip(''); setSelQtd(1); setSelObs('');
  }

  function removeItem(eqId: string) { onChange(items.filter((i) => i.equipmentId !== eqId)); }

  function updateObs(eqId: string, obs: string) {
    onChange(items.map((i) => i.equipmentId === eqId ? { ...i, observacao: obs } : i));
  }

  const mixedBrandItems = items.filter((item) => {
    const eq = equipments.find((e) => e.id === item.equipmentId);
    return eq && eq.marca !== marca && eq.marca !== 'Genérico';
  });

  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: theme.gold }}>{label}</h4>
        {items.length > 0 && (
          <span style={{ fontSize: 12, color: theme.success, fontWeight: 600 }}>
            {items.reduce((s, i) => s + i.quantidade, 0)} item(ns)
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <select value={selEquip} onChange={(e) => setSelEquip(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200, marginBottom: 0 }}>
          <option value="">Selecionar produto...</option>
          <optgroup label={marca}>
            {filteredEquipments.filter((e) => e.marca === marca).map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>
            ))}
          </optgroup>
          {filteredEquipments.some((e) => e.marca === 'Genérico') && (
            <optgroup label="Genérico">
              {filteredEquipments.filter((e) => e.marca === 'Genérico').map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>
              ))}
            </optgroup>
          )}
          {allBlockEquipments.filter((e) => e.marca !== marca && e.marca !== 'Genérico').length > 0 && (
            <optgroup label="Outras marcas">
              {allBlockEquipments.filter((e) => e.marca !== marca && e.marca !== 'Genérico').map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.marca}) — R$ {eq.price}</option>
              ))}
            </optgroup>
          )}
        </select>
        <input type="number" min={1} value={selQtd} onChange={(e) => setSelQtd(Number(e.target.value))} style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
        <button onClick={addItem} disabled={!selEquip} style={{ ...btnGold, opacity: selEquip ? 1 : 0.4 }}>+</button>
      </div>

      {mixedBrandItems.length > 0 && (
        <div style={{ background: theme.warning + '15', border: `1px solid ${theme.warning}44`, borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: theme.warning }}>
          {mixedBrandItems.length} item(ns) de marca diferente ({marca}). Misturar marcas pode causar incompatibilidade.
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: 12 }}>Nenhum produto adicionado.</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {items.map((item) => {
            const eq = equipments.find((e) => e.id === item.equipmentId);
            const isMixed = eq && eq.marca !== marca && eq.marca !== 'Genérico';
            return (
              <div key={item.equipmentId} style={{
                background: theme.soft, borderRadius: 8, padding: '8px 10px',
                border: `1px solid ${isMixed ? theme.warning + '44' : theme.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.quantidade}x</span>
                    <span style={{ fontSize: 13, marginLeft: 6 }}>{eq?.name ?? item.equipmentId}</span>
                    {isMixed && <span style={{ fontSize: 11, color: theme.warning, marginLeft: 6 }}>({eq?.marca})</span>}
                    <span style={{ fontSize: 12, color: theme.muted, marginLeft: 8 }}>
                      R$ {((eq?.price ?? 0) * item.quantidade).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <button onClick={() => removeItem(item.equipmentId)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>x</button>
                </div>
                <input
                  placeholder="Observação técnica (ex: instalar a 3m, cobrir estacionamento)"
                  value={item.observacao}
                  onChange={(e) => updateObs(item.equipmentId, e.target.value)}
                  style={{ ...inputStyle, marginTop: 6, marginBottom: 0, fontSize: 12, padding: '4px 8px' }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- StepResumo ---- */

function StepResumo({ draft, equipments }: { draft: SolucaoTecnica; equipments: Equipment[] }) {
  const totalItens = draft.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0);
  const blocosPreenchidos = draft.blocos.filter((b) => b.itens.length > 0).length;
  const valorTotal = draft.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => {
    const eq = equipments.find((e) => e.id === i.equipmentId);
    return ss + (eq?.price ?? 0) * i.quantidade;
  }, 0), 0);

  const stepGroups = wizardSteps.slice(1, -1);

  return (
    <div>
      <h3 style={{ color: theme.gold, margin: '0 0 6px', fontSize: 16 }}>Resumo da Solução</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <strong>{draft.clienteNome}</strong>
        <MarcaBadge marca={draft.marca} />
        <span style={{ fontSize: 13, color: theme.muted }}>{totalItens} itens · {blocosPreenchidos}/{allBlocos.length} blocos</span>
      </div>

      {stepGroups.map((sg) => {
        const blocos = sg.blocos.map((bc) => draft.blocos.find((b) => b.categoria === bc)!);
        const groupItems = blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0);

        return (
          <div key={sg.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h4 style={{ margin: 0, fontSize: 13, color: groupItems > 0 ? theme.text : theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {sg.label}
              </h4>
              <span style={{ fontSize: 12, color: groupItems > 0 ? theme.success : theme.muted }}>
                {groupItems > 0 ? `${groupItems} itens` : 'vazio'}
              </span>
            </div>
            {blocos.map((bloco) => (
              <div key={bloco.categoria} style={{ paddingLeft: 12, borderLeft: `2px solid ${bloco.itens.length > 0 ? theme.gold + '44' : theme.border}`, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: theme.muted }}>{blocoLabels[bloco.categoria]}: </span>
                {bloco.itens.length === 0 ? (
                  <span style={{ fontSize: 12, color: theme.muted, fontStyle: 'italic' }}>(vazio)</span>
                ) : (
                  bloco.itens.map((item, idx) => {
                    const eq = equipments.find((e) => e.id === item.equipmentId);
                    return (
                      <span key={item.equipmentId} style={{ fontSize: 12 }}>
                        {idx > 0 && ', '}
                        <strong>{item.quantidade}x</strong> {eq?.name ?? item.equipmentId}
                        {item.observacao && <span style={{ color: theme.muted }}> ({item.observacao})</span>}
                      </span>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ marginTop: 16, padding: 12, background: theme.soft, borderRadius: 10, border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: theme.muted }}>Valor estimado (equipamentos)</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: theme.gold }}>R$ {valorTotal.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}

/* ---- Small helpers ---- */

function MarcaBadge({ marca }: { marca: Marca }) {
  const colorMap: Record<Marca, string> = {
    Intelbras: '#43C17B', Hikvision: '#E55B5B', DSC: '#5B9BD5',
    Viaweb: '#E3B341', Vetti: '#C077DB', 'Genérico': '#B5B5B5',
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
  const colorMap: Record<string, string> = { P: '#43C17B', M: '#5B9BD5', G: '#E3B341', GG: '#E5855B', E: '#E55B5B' };
  const color = colorMap[label] ?? theme.muted;
  return (
    <span style={{
      fontSize: large ? 14 : 11, fontWeight: 700, padding: large ? '4px 14px' : '2px 8px',
      borderRadius: 999, background: color + '22', color, border: `1px solid ${color}44`, letterSpacing: 0.5,
    }}>
      Faixa {label}
    </span>
  );
}

function OrcamentoStatusBadge({ status }: { status: Orcamento['status'] }) {
  const map: Record<Orcamento['status'], { label: string; color: string }> = {
    gerado: { label: 'Gerado', color: theme.muted },
    ajustado: { label: 'Ajustado', color: theme.warning },
    proposta_criada: { label: 'Proposta criada', color: theme.success },
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

function StatusBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    rascunho: theme.muted, enviado: theme.warning, aprovado: theme.success,
  };
  const color = colorMap[value] ?? theme.muted;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '3px 10px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {value}
    </span>
  );
}

function CostLine({ label, value, prefix, bold, danger }: {
  label: string; value: number; prefix?: string; bold?: boolean; danger?: boolean;
}) {
  const displayVal = value < 0 ? `-R$ ${formatCurrency(Math.abs(value))}` : `${prefix ?? ''}R$ ${formatCurrency(value)}`;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 13, color: theme.muted }}>{label}</span>
      <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 400, color: danger ? theme.danger : theme.text }}>
        {displayVal}
      </span>
    </div>
  );
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const qtyBtnStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: 6, background: theme.soft, border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
