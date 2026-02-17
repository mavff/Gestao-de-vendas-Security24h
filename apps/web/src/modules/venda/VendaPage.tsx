'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { KIT_CATEGORIA_LABELS } from '../../config/kitPresets';
import { useAuth } from '../../contexts/AuthContext';
import {
  mockEquipments, mockKits, mockLeads,
  mockOrdens, mockSolucoes, mockUsers, mockVistorias,
} from '../../mocks/data';
import { compressImage } from '../../services/imageUtils';
import { loadMock, saveMock } from '../../services/mockStorage';
import {
  AmbienteVistoria, BlocoCategoria, BlocoTecnico, Equipment,
  InstallationPoint, ItemSolucao, Kit, Lead, Marca,
  OrdemDeServico, SolucaoTecnica, User, VendaStep, Vistoria,
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

const STEP_LABELS = ['Solução', 'Fotos/Pontos', 'OS'] as const;
type StepName = (typeof STEP_LABELS)[number];

function emptyBlocos(): BlocoTecnico[] {
  return allBlocos.map((cat) => ({ categoria: cat, itens: [] }));
}

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ================================================================
   VendaPage — Main
   ================================================================ */

export function VendaPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId as string;
  const { role } = useAuth();
  const { showToast } = useToast();

  const canEdit = role === 'ADMIN' || role === 'VENDEDOR';
  const canApprove = role === 'ADMIN' || role === 'GESTOR';

  /* --- all data --- */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [solucoes, setSolucoes] = useState<SolucaoTecnica[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);

  /* --- UI state --- */
  const [activeStep, setActiveStep] = useState<StepName>('Solução');
  const [solDraft, setSolDraft] = useState<SolucaoTecnica | null>(null);
  const [wizStep, setWizStep] = useState(0);

  /* --- load --- */
  useEffect(() => {
    setLeads(loadMock('mock_leads', mockLeads));
    setSolucoes(loadMock('mock_solucoes', mockSolucoes));
    setEquipments(loadMock('mock_equipments', mockEquipments));
    setOrdens(loadMock('mock_ordens', mockOrdens));
    setVistorias(loadMock('mock_vistorias', mockVistorias));
    setUsers(loadMock('mock_users', mockUsers));
    setKits(loadMock('mock_kits', mockKits));
  }, []);

  /* --- persist --- */
  useEffect(() => { if (leads.length) saveMock('mock_leads', leads); }, [leads]);
  useEffect(() => { if (solucoes.length) saveMock('mock_solucoes', solucoes); }, [solucoes]);
  useEffect(() => { saveMock('mock_ordens', ordens); }, [ordens]);
  useEffect(() => { saveMock('mock_vistorias', vistorias); }, [vistorias]);

  /* --- derived for this lead --- */
  const lead = leads.find((l) => l.id === leadId) ?? null;
  const solucao = solucoes.find((s) => s.leadId === leadId) ?? null;
  const vistoria = vistorias.find((v) => v.leadId === leadId) ?? null;
  const ordem = ordens.find((o) => o.leadId === leadId) ?? null;

  function updateLeadStep(step: VendaStep) {
    setLeads((cur) => cur.map((l) => l.id === leadId ? { ...l, vendaStep: step } : l));
  }

  /* --- init solução draft --- */
  useEffect(() => {
    if (activeStep !== 'Solução' || solDraft || !lead) return;

    if (solucao) {
      setSolDraft({ ...solucao });
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    const userId = users.find((u) => u.role === role)?.id ?? 'U1';

    setSolDraft({
      id: '', leadId,
      clienteNome: `${lead.name} — ${lead.company}`,
      marca: 'Intelbras', blocos: emptyBlocos(), observacaoGeral: '',
      status: 'rascunho', criadoPor: userId, createdAt: now, updatedAt: now,
    });
    setWizStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, lead, solucao, solDraft]);

  /* =============================================
     Step accessibility
     ============================================= */
  const solucaoPronta = solucao?.status === 'pronta' || solucao?.status === 'aprovada';
  const solucaoAprovada = solucao?.status === 'aprovada';
  const vistoriaConcluida = vistoria?.status === 'concluida';

  const stepEnabled: Record<StepName, boolean> = {
    'Solução': true,
    'Fotos/Pontos': solucaoAprovada,
    'OS': vistoriaConcluida,
  };

  const progressIndex = vistoriaConcluida ? 3
    : vistoria ? 2
    : solucaoAprovada ? 1
    : 0;

  /* =============================================
     Actions — Solução
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

  function handleMarcarPronta() {
    if (!solDraft) return;
    const now = new Date().toISOString().slice(0, 10);
    const id = solDraft.id || 'SOL' + Date.now();
    const pronta: SolucaoTecnica = { ...solDraft, id, status: 'pronta', updatedAt: now };

    if (solDraft.id) {
      setSolucoes((cur) => cur.map((s) => s.id === id ? pronta : s));
    } else {
      setSolucoes((cur) => [...cur, pronta]);
    }
    setSolDraft(pronta);
    showToast('Solução enviada para aprovação do Gestor.', 'success');
  }

  function handleAprovar() {
    if (!solDraft) return;
    const now = new Date().toISOString().slice(0, 10);
    const aprovada: SolucaoTecnica = { ...solDraft, status: 'aprovada', updatedAt: now };
    setSolucoes((cur) => cur.map((s) => s.id === solDraft.id ? aprovada : s));
    setSolDraft(aprovada);

    // Create vistoria if it doesn't exist yet
    if (!vistoria) {
      const userId = users.find((u) => u.role === role)?.id ?? 'U1';
      const newVis: Vistoria = {
        id: 'VIS' + Date.now(), leadId, propostaId: '',
        ambientes: [], observacoes: '', status: 'pendente',
        criadoPor: userId, createdAt: now, updatedAt: now,
      };
      setVistorias((cur) => [...cur, newVis]);
    }

    updateLeadStep('vistoria');
    showToast('Solução aprovada! Prossiga com Fotos/Pontos.', 'success');
    setActiveStep('Fotos/Pontos');
  }

  function handleVoltarRascunho() {
    if (!solDraft) return;
    const now = new Date().toISOString().slice(0, 10);
    const rascunho: SolucaoTecnica = { ...solDraft, status: 'rascunho', updatedAt: now };
    setSolucoes((cur) => cur.map((s) => s.id === solDraft.id ? rascunho : s));
    setSolDraft(rascunho);
    updateLeadStep('solucao');
    showToast('Solução voltou para rascunho.', 'warning');
  }

  /* =============================================
     Actions — Vistoria (Fotos/Pontos)
     ============================================= */

  function handleAddAmbiente(nome: string) {
    if (!vistoria) return;
    const now = new Date().toISOString().slice(0, 10);
    const newAmb: AmbienteVistoria = { id: 'AMB' + Date.now(), nome, pontos: [], status: 'pendente' };
    const updated: Vistoria = { ...vistoria, ambientes: [...vistoria.ambientes, newAmb], status: 'em_andamento', updatedAt: now };
    setVistorias((cur) => cur.map((v) => v.id === vistoria.id ? updated : v));
  }

  function handleUpdateAmbiente(ambId: string, amb: AmbienteVistoria) {
    if (!vistoria) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated: Vistoria = { ...vistoria, ambientes: vistoria.ambientes.map((a) => a.id === ambId ? amb : a), updatedAt: now };
    setVistorias((cur) => cur.map((v) => v.id === vistoria.id ? updated : v));
  }

  function handleRemoveAmbiente(ambId: string) {
    if (!vistoria) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated: Vistoria = { ...vistoria, ambientes: vistoria.ambientes.filter((a) => a.id !== ambId), updatedAt: now };
    setVistorias((cur) => cur.map((v) => v.id === vistoria.id ? updated : v));
  }

  function handleConcluirVistoria() {
    if (!vistoria || !solucao) return;
    const hasPhoto = vistoria.ambientes.some((a) => a.pontos.some((p) => p.photos.length > 0));
    if (vistoria.ambientes.length === 0) {
      showToast('Adicione pelo menos 1 ambiente.', 'error');
      return;
    }
    if (!hasPhoto) {
      showToast('Adicione pelo menos 1 foto em algum ambiente.', 'error');
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    const concluida: Vistoria = { ...vistoria, status: 'concluida', updatedAt: now };
    setVistorias((cur) => cur.map((v) => v.id === vistoria.id ? concluida : v));

    // Create OS with pontos from vistoria and checklist from solução
    const allPontos: InstallationPoint[] = vistoria.ambientes.flatMap((a) => a.pontos);
    let ckIdx = 0;
    const checklist = solucao.blocos.flatMap((bloco) =>
      bloco.itens.map((item) => {
        const eq = equipments.find((e) => e.id === item.equipmentId);
        return {
          id: 'CK' + Date.now() + (ckIdx++),
          text: `Instalar ${item.quantidade}x ${eq?.name ?? item.equipmentId}`,
          done: false,
        };
      }),
    );

    const clienteNome = lead ? `${lead.name} — ${lead.company}` : solucao.clienteNome;
    const newOS: OrdemDeServico = {
      id: 'OS' + Date.now(), vistoriaId: vistoria.id,
      leadId, cliente: clienteNome, dataAgendada: '', tecnicoId: '',
      checklist, pontos: allPontos, observacoes: '', status: 'pendente',
      createdAt: now,
    };
    setOrdens((cur) => [...cur, newOS]);
    updateLeadStep('os_criada');
    showToast('Vistoria concluída! OS liberada para agendamento.', 'success');
    setActiveStep('OS');
  }

  /* --- contextual alert --- */
  const alertMsg = useMemo(() => {
    if (ordem?.status === 'concluida') return { text: 'Instalação concluída com sucesso!', color: theme.success, icon: '✓' };
    if (ordem) return { text: 'OS criada. Acompanhe o andamento em Instalações.', color: theme.gold, icon: '→' };
    if (vistoria?.status === 'concluida') return { text: 'Fotos/Pontos concluídos! OS liberada.', color: theme.success, icon: '✓' };
    if (vistoria) {
      const totalPontos = vistoria.ambientes.reduce((s, a) => s + a.pontos.length, 0);
      return { text: `Fotos/Pontos em andamento — ${vistoria.ambientes.length} ambiente(s), ${totalPontos} ponto(s).`, color: '#5B9BD5', icon: '◎' };
    }
    if (solucaoAprovada) return { text: 'Solução aprovada! Registre as fotos e pontos do local.', color: theme.gold, icon: '→' };
    if (solucaoPronta) return { text: 'Solução enviada para aprovação. Aguardando Gestor/Admin.', color: '#5B9BD5', icon: '◎' };
    if (solucao) return { text: 'Solução em rascunho. Selecione um kit e marque como pronta.', color: theme.muted, icon: '✎' };
    return { text: 'Comece montando a Solução Técnica para este cliente.', color: theme.muted, icon: '1' };
  }, [solucao, solucaoPronta, solucaoAprovada, vistoria, ordem]);

  /* --- step sub-labels --- */
  const stepSublabel: Record<StepName, string> = useMemo(() => ({
    'Solução': solucao ? (solucao.status === 'aprovada' ? 'Aprovada' : solucao.status === 'pronta' ? 'Aguardando aprovação' : 'Rascunho') : 'Não iniciada',
    'Fotos/Pontos': vistoria ? (vistoria.status === 'concluida' ? 'Concluída' : `${vistoria.ambientes.length} amb.`) : 'Pendente',
    'OS': ordem ? (ordem.status === 'concluida' ? 'Concluída' : ordem.status.replace('_', ' ')) : 'Aguardando',
  }), [solucao, vistoria, ordem]);

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
      {/* GESTOR read-only banner */}
      {!canEdit && canApprove && (
        <div style={{ background: '#5B9BD5' + '15', border: `1px solid #5B9BD544`, borderRadius: 10, padding: '8px 14px', marginBottom: 10, fontSize: 12, color: '#5B9BD5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Modo Gestor</span> — Visualização e aprovação de soluções.
        </div>
      )}

      {/* Lead info bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', fontSize: 13, color: theme.muted }}>
        <strong style={{ color: theme.text, fontSize: 15 }}>{lead.name}</strong>
        <span>·</span>
        <span>{lead.company}</span>
        {lead.tipoLocal && <><span>·</span><span style={{ background: theme.soft, padding: '1px 8px', borderRadius: 6, fontSize: 11 }}>{lead.tipoLocal}</span></>}
        {lead.contato && <><span>·</span><span>{lead.contato}</span></>}
        {lead.endereco && <><span>·</span><span style={{ fontSize: 11 }}>{lead.endereco}</span></>}
        <span>·</span>
        <span style={{ color: theme.gold, fontWeight: 600 }}>R$ {lead.value.toLocaleString('pt-BR')}</span>
      </div>

      {/* Contextual alert bar */}
      <div style={{
        background: alertMsg.color + '10', border: `1px solid ${alertMsg.color}33`,
        borderRadius: 10, padding: '8px 14px', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
      }}>
        <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: alertMsg.color + '22', color: alertMsg.color, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {alertMsg.icon}
        </span>
        <span style={{ color: alertMsg.color }}>{alertMsg.text}</span>
      </div>

      {/* Progress bar with sub-labels */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
        {STEP_LABELS.map((stepLabel, i) => {
          const done = i < progressIndex;
          const current = i === progressIndex;
          const isActive = activeStep === stepLabel;
          return (
            <div key={stepLabel} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => stepEnabled[stepLabel] && setActiveStep(stepLabel)}
                disabled={!stepEnabled[stepLabel]}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent',
                  border: 'none', cursor: stepEnabled[stepLabel] ? 'pointer' : 'not-allowed',
                  opacity: stepEnabled[stepLabel] ? 1 : 0.35, padding: '0 2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: done ? theme.success : current ? theme.gold : theme.soft,
                    color: done || current ? '#111' : theme.muted,
                    border: `2px solid ${done ? theme.success : current ? theme.gold : isActive ? theme.text : theme.border}`,
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: 12, whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 400,
                    color: done ? theme.success : current ? theme.gold : isActive ? theme.text : theme.muted,
                  }}>
                    {stepLabel}
                  </span>
                </div>
                <span style={{ fontSize: 9, color: theme.muted, whiteSpace: 'nowrap' }}>
                  {stepSublabel[stepLabel]}
                </span>
              </button>
              {i < STEP_LABELS.length - 1 && <div style={{ width: 20, height: 2, background: done ? theme.success : theme.border, marginTop: -10 }} />}
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <button onClick={() => { window.location.href = '/kanban'; }} style={{ ...btnSoft, fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}>
          ← Pipeline
        </button>
      </div>

      {/* Step content */}
      {activeStep === 'Solução' && solDraft && (
        <TabSolucao
          draft={solDraft} setDraft={setSolDraft}
          step={wizStep} setStep={setWizStep}
          equipments={equipments}
          kits={kits}
          solucaoExistente={solucao}
          onSave={handleSaveSolucao}
          onMarcarPronta={handleMarcarPronta}
          onAprovar={handleAprovar}
          onVoltarRascunho={handleVoltarRascunho}
          canEdit={canEdit}
          canApprove={canApprove}
        />
      )}

      {activeStep === 'Fotos/Pontos' && vistoria && (
        <StepVistoria
          vistoria={vistoria}
          onAddAmbiente={handleAddAmbiente}
          onUpdateAmbiente={handleUpdateAmbiente}
          onRemoveAmbiente={handleRemoveAmbiente}
          onConcluir={handleConcluirVistoria}
          canEdit={canEdit}
        />
      )}

      {activeStep === 'OS' && ordem && (
        <StepOSResumo ordem={ordem} />
      )}
    </AppShell>
  );
}

/* ================================================================
   Step: Solução (kit + wizard) — mostly unchanged
   ================================================================ */

function TabSolucao({ draft, setDraft, step, setStep, equipments, kits, solucaoExistente, onSave, onMarcarPronta, onAprovar, onVoltarRascunho, canEdit: canEditProp, canApprove: canApproveProp }: {
  draft: SolucaoTecnica;
  setDraft: (d: SolucaoTecnica) => void;
  step: number;
  setStep: (s: number) => void;
  equipments: Equipment[];
  kits: Kit[];
  solucaoExistente: SolucaoTecnica | null;
  onSave: () => void;
  onMarcarPronta: () => void;
  onAprovar: () => void;
  onVoltarRascunho: () => void;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const [kitMode, setKitMode] = useState(true);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

  const kitsForMarca = useMemo(() => kits.filter((k) => k.marca === draft.marca), [kits, draft.marca]);
  const isPronta = solucaoExistente?.status === 'pronta';
  const isAprovada = solucaoExistente?.status === 'aprovada';
  const isReadOnly = isPronta || isAprovada;

  useEffect(() => { setSelectedKitId(null); }, [draft.marca]);

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

  function applyKit(kit: Kit) {
    const blocos = emptyBlocos();
    for (const kitItem of kit.items) {
      const eq = equipments.find((e) => e.id === kitItem.equipmentId);
      if (!eq) continue;
      const bloco = blocos.find((b) => b.categoria === eq.bloco);
      if (bloco) bloco.itens.push({ equipmentId: kitItem.equipmentId, quantidade: kitItem.quantity, observacao: '' });
    }
    setDraft({ ...draft, blocos });
    setSelectedKitId(kit.id);
  }

  function updateItemQty(equipmentId: string, newQty: number) {
    setDraft({
      ...draft,
      blocos: draft.blocos.map((b) => ({
        ...b,
        itens: b.itens.map((i) => (i.equipmentId === equipmentId ? { ...i, quantidade: Math.max(0, newQty) } : i)).filter((i) => i.quantidade > 0),
      })),
    });
  }

  /* Read-only states: pronta (awaiting approval) or aprovada */
  if (isReadOnly) {
    const bannerColor = isAprovada ? theme.success : '#5B9BD5';
    const bannerText = isAprovada
      ? 'Solução aprovada! Prossiga para Fotos/Pontos.'
      : 'Solução enviada para aprovação. Aguardando Gestor/Admin.';

    return (
      <div>
        <div style={{ background: bannerColor + '15', border: `1px solid ${bannerColor}44`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: bannerColor, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>{bannerText}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {isPronta && canApproveProp && (
              <button onClick={onAprovar} style={{ ...btnGold, background: theme.success, fontSize: 12, padding: '4px 12px' }}>Aprovar Solução</button>
            )}
            {(canEditProp || canApproveProp) && (
              <button onClick={onVoltarRascunho} style={{ ...btnSoft, fontSize: 12, padding: '4px 10px' }}>Voltar para rascunho</button>
            )}
          </div>
        </div>
        <StepResumo draft={draft} equipments={equipments} />
      </div>
    );
  }

  /* Wizard mode */
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
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {wizardSteps.map((ws, i) => {
            const isCurrent = i === step;
            const hasBlocos = ws.blocos.length > 0;
            const hasStepItems = hasBlocos && ws.blocos.some((bc) => getBloco(bc).itens.length > 0);
            return (
              <button key={i} onClick={() => setStep(i)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: isCurrent ? 'rgba(200,169,81,0.12)' : 'transparent',
                border: `1px solid ${isCurrent ? theme.gold : theme.border}`,
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                color: isCurrent ? theme.gold : theme.text, fontWeight: isCurrent ? 700 : 400, fontSize: 12, whiteSpace: 'nowrap',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
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
          <BlockEditor key={cat} categoria={cat} label={blocoLabels[cat]} marca={draft.marca} equipments={equipments} items={getBloco(cat).itens} onChange={(itens) => updateBloco(cat, itens)} />
        ))}
        {step === 6 && (
          <>
            <StepResumo draft={draft} equipments={equipments} />
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Observação geral</label>
              <textarea value={draft.observacaoGeral} onChange={(e) => setDraft({ ...draft, observacaoGeral: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notas livres sobre esta solução..." />
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
              {canEditProp && <button onClick={onMarcarPronta} style={{ ...btnGold, background: theme.success }}>Marcar como Pronta →</button>}
            </>
          )}
        </div>
      </div>
    );
  }

  /* Kit mode */
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Montar Solução</h3>
        <button onClick={() => { setKitMode(false); setStep(0); }} style={{ ...btnSoft, fontSize: 12, padding: '5px 12px' }}>Modo avançado →</button>
      </div>
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 10 }}>Cliente: <strong style={{ color: theme.text }}>{draft.clienteNome}</strong></div>

      <label style={labelStyle}>Marca Principal</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {marcas.map((m) => (
          <button key={m} onClick={() => { if (m !== draft.marca) setDraft({ ...draft, marca: m, blocos: emptyBlocos() }); }} style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: draft.marca === m ? theme.gold + '22' : theme.soft,
            border: `2px solid ${draft.marca === m ? theme.gold : theme.border}`,
            color: draft.marca === m ? theme.gold : theme.text,
          }}>
            {m}
          </button>
        ))}
      </div>

      {kitsForMarca.length > 0 ? (
        <>
          <label style={{ ...labelStyle, marginBottom: 10, fontSize: 13 }}>Escolha um kit pré-configurado</label>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', marginBottom: 20 }}>
            {kitsForMarca.map((kit) => {
              const kitPrice = kit.items.reduce((s, i) => { const eq = equipments.find((e) => e.id === i.equipmentId); return s + (eq?.price ?? 0) * i.quantity; }, 0);
              const itemCount = kit.items.reduce((s, i) => s + i.quantity, 0);
              const isSelected = selectedKitId === kit.id;
              return (
                <button key={kit.id} onClick={() => applyKit(kit)} style={{
                  display: 'block', textAlign: 'left', cursor: 'pointer',
                  background: isSelected ? 'rgba(200,169,81,0.10)' : theme.panel,
                  border: `2px solid ${isSelected ? theme.gold : theme.border}`,
                  borderRadius: 12, padding: 14, color: theme.text,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: isSelected ? theme.gold : theme.text }}>{kit.name}</strong>
                    {isSelected && <span style={{ fontSize: 9, color: theme.gold, fontWeight: 700, background: theme.gold + '22', padding: '2px 6px', borderRadius: 999 }}>SELECIONADO</span>}
                  </div>
                  {kit.categoria && <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>{KIT_CATEGORIA_LABELS[kit.categoria]}</div>}
                  {kit.descricao && <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>{kit.descricao}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: theme.muted }}>{itemCount} itens</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.gold }}>~R$ {formatCurrency(kitPrice)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13, marginBottom: 16 }}>
          Nenhum kit pré-configurado para <strong>{draft.marca}</strong>.
          <br /><button onClick={() => { setKitMode(false); setStep(0); }} style={{ ...btnGold, marginTop: 10, fontSize: 12 }}>Usar modo avançado</button>
        </div>
      )}

      {hasItems && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: theme.gold }}>Ajustar Quantidades</h4>
            {selectedKitId && (
              <button onClick={() => { setSelectedKitId(null); setDraft({ ...draft, blocos: emptyBlocos() }); }} style={{ ...btnSoft, fontSize: 11, padding: '4px 10px' }}>Trocar Kit</button>
            )}
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {flatItems.map((item) => (
              <div key={item.equipmentId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.soft, borderRadius: 8, padding: '8px 12px', border: `1px solid ${theme.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{item.blocoLabel} · R$ {formatCurrency(item.preco)}/un</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                  <button onClick={() => updateItemQty(item.equipmentId, item.quantidade - 1)} style={qtyBtnStyle}>−</button>
                  <span style={{ display: 'inline-block', width: 32, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{item.quantidade}</span>
                  <button onClick={() => updateItemQty(item.equipmentId, item.quantidade + 1)} style={qtyBtnStyle}>+</button>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.gold, minWidth: 80, textAlign: 'right' }}>R$ {formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 14, color: theme.muted }}>Total estimado (equipamentos)</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: theme.gold }}>R$ {formatCurrency(totalEstimado)}</span>
          </div>
        </div>
      )}

      {hasItems && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Observação geral</label>
          <textarea value={draft.observacaoGeral} onChange={(e) => setDraft({ ...draft, observacaoGeral: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notas livres sobre esta solução..." />
        </div>
      )}

      {hasItems && (
        <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
          <button onClick={onSave} style={btnSoft}>Salvar rascunho</button>
          {canEditProp && <button onClick={onMarcarPronta} style={{ ...btnGold, background: theme.success }}>Marcar como Pronta →</button>}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Step: Fotos/Pontos (Vistoria)
   ================================================================ */

function StepVistoria({ vistoria, onAddAmbiente, onUpdateAmbiente, onRemoveAmbiente, onConcluir, canEdit }: {
  vistoria: Vistoria;
  onAddAmbiente: (nome: string) => void;
  onUpdateAmbiente: (ambId: string, amb: AmbienteVistoria) => void;
  onRemoveAmbiente: (ambId: string) => void;
  onConcluir: () => void;
  canEdit: boolean;
}) {
  const [novoAmbiente, setNovoAmbiente] = useState('');
  const [expandedAmbId, setExpandedAmbId] = useState<string | null>(null);
  const isConcluida = vistoria.status === 'concluida';
  const totalPhotos = vistoria.ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0);
  const totalPontos = vistoria.ambientes.reduce((s, a) => s + a.pontos.length, 0);

  function handleAddAmbiente() {
    if (!novoAmbiente.trim()) return;
    onAddAmbiente(novoAmbiente.trim());
    setNovoAmbiente('');
  }

  function handleAddPonto(ambId: string) {
    const amb = vistoria.ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    const newPonto: InstallationPoint = {
      id: 'PT' + Date.now(), environment: amb.nome, type: '', note: '',
      status: 'Pendente', photos: [],
    };
    onUpdateAmbiente(ambId, { ...amb, pontos: [...amb.pontos, newPonto] });
  }

  function handleUpdatePonto(ambId: string, pontoId: string, updated: InstallationPoint) {
    const amb = vistoria.ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    onUpdateAmbiente(ambId, { ...amb, pontos: amb.pontos.map((p) => p.id === pontoId ? updated : p) });
  }

  function handleRemovePonto(ambId: string, pontoId: string) {
    const amb = vistoria.ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    onUpdateAmbiente(ambId, { ...amb, pontos: amb.pontos.filter((p) => p.id !== pontoId) });
  }

  async function handleAddPhoto(ambId: string, pontoId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    const amb = vistoria.ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    const ponto = amb.pontos.find((p) => p.id === pontoId);
    if (!ponto) return;
    handleUpdatePonto(ambId, pontoId, { ...ponto, photos: [...ponto.photos, base64] });
    e.target.value = '';
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Vistoria do Local</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge value={vistoria.status} />
          <span style={{ fontSize: 12, color: theme.muted }}>{vistoria.ambientes.length} ambientes · {totalPontos} pontos · {totalPhotos} fotos</span>
        </div>
      </div>

      {isConcluida && (
        <div style={{ background: theme.success + '15', border: `1px solid ${theme.success}44`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: theme.success }}>
          Vistoria concluída. OS liberada para agendamento.
        </div>
      )}

      {/* Add ambiente */}
      {canEdit && !isConcluida && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={novoAmbiente} onChange={(e) => setNovoAmbiente(e.target.value)} placeholder="Nome do ambiente (ex: Fachada, Recepção, Estoque...)" style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddAmbiente(); }}
          />
          <button onClick={handleAddAmbiente} style={btnGold}>+ Ambiente</button>
        </div>
      )}

      {/* Ambientes list */}
      <div style={{ display: 'grid', gap: 10 }}>
        {vistoria.ambientes.map((amb) => {
          const isExpanded = expandedAmbId === amb.id;
          const ambPhotos = amb.pontos.reduce((s, p) => s + p.photos.length, 0);

          return (
            <div key={amb.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Ambiente header */}
              <div
                onClick={() => setExpandedAmbId(isExpanded ? null : amb.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{amb.nome}</span>
                  <span style={{ fontSize: 12, color: theme.muted }}>{amb.pontos.length} pontos · {ambPhotos} fotos</span>
                </div>
                <span style={{ color: theme.muted, fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Expanded: pontos + photos */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${theme.border}` }}>
                  {amb.pontos.map((ponto) => (
                    <div key={ponto.id} style={{ background: theme.soft, borderRadius: 8, padding: 10, marginTop: 10, border: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <input placeholder="Tipo (ex: Câmera Dome, Sensor PIR)" value={ponto.type} onChange={(e) => handleUpdatePonto(amb.id, ponto.id, { ...ponto, type: e.target.value })} disabled={isConcluida} style={{ ...inputStyle, flex: 1, marginBottom: 0, fontSize: 12 }} />
                        {canEdit && !isConcluida && <button onClick={() => handleRemovePonto(amb.id, ponto.id)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>x</button>}
                      </div>
                      <input placeholder="Observação (ex: altura 3m, parede lateral)" value={ponto.note} onChange={(e) => handleUpdatePonto(amb.id, ponto.id, { ...ponto, note: e.target.value })} disabled={isConcluida} style={{ ...inputStyle, marginBottom: 6, fontSize: 12 }} />

                      {/* Photos */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {ponto.photos.map((photo, pi) => (
                          <img key={pi} src={photo} width={70} height={52} alt={`Foto ${pi + 1}`} style={{ borderRadius: 6, objectFit: 'cover', border: `1px solid ${theme.border}` }} />
                        ))}
                        {canEdit && !isConcluida && (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: theme.muted }}>
                            + Foto
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleAddPhoto(amb.id, ponto.id, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}

                  {canEdit && !isConcluida && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => handleAddPonto(amb.id)} style={{ ...btnSoft, fontSize: 12 }}>+ Ponto</button>
                      <button onClick={() => onRemoveAmbiente(amb.id)} style={{ ...btnSoft, fontSize: 12, color: theme.danger, borderColor: theme.danger }}>Remover ambiente</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Concluir */}
      {canEdit && !isConcluida && vistoria.ambientes.length > 0 && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
          <button onClick={onConcluir} style={{ ...btnGold, background: theme.success }}>Concluir Vistoria →</button>
          <span style={{ fontSize: 12, color: theme.muted, marginLeft: 12 }}>Requer pelo menos 1 ambiente com 1 foto</span>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Step: OS Resumo (read-only for vendedor)
   ================================================================ */

function StepOSResumo({ ordem }: { ordem: OrdemDeServico }) {
  const pontosFinalizados = ordem.pontos.filter((p) => p.status === 'Finalizado').length;
  const totalPontos = ordem.pontos.length;
  const checkDone = ordem.checklist.filter((c) => c.done).length;
  const progressPct = totalPontos > 0 ? Math.round((pontosFinalizados / totalPontos) * 100) : 0;

  const statusLabels: Record<string, string> = {
    bloqueada: 'Bloqueada', pendente: 'Pendente', agendada: 'Agendada',
    em_andamento: 'Em andamento', concluida: 'Concluída',
  };
  const statusColors: Record<string, string> = {
    bloqueada: theme.danger, pendente: theme.warning, agendada: '#5B9BD5',
    em_andamento: theme.gold, concluida: theme.success,
  };
  const statusColor = statusColors[ordem.status] ?? theme.muted;
  const statusLabel = statusLabels[ordem.status] ?? ordem.status;
  const isConcluida = ordem.status === 'concluida';

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Status banner */}
      <div style={{
        background: statusColor + '15', border: `1px solid ${statusColor}44`,
        borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{isConcluida ? '✓' : '⚙'}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: statusColor }}>
          OS {ordem.id} — {statusLabel}
        </div>
      </div>

      {/* Progress bar */}
      {totalPontos > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.muted, marginBottom: 6 }}>
            <span>Progresso da instalação</span>
            <span style={{ fontWeight: 600, color: progressPct === 100 ? theme.success : theme.gold }}>{pontosFinalizados}/{totalPontos} pontos · {progressPct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: theme.soft }}>
            <div style={{
              height: '100%', borderRadius: 4, width: `${progressPct}%`,
              background: progressPct === 100 ? theme.success : `linear-gradient(90deg, ${theme.gold}, ${theme.warning})`,
              transition: 'width 300ms ease',
            }} />
          </div>
        </div>
      )}

      {/* Info card */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16 }}>
        <InfoRow label="Cliente" value={ordem.cliente} />
        <InfoRow label="Pontos mapeados" value={String(totalPontos)} />
        {totalPontos > 0 && <InfoRow label="Pontos finalizados" value={`${pontosFinalizados}/${totalPontos}`} />}
        {ordem.checklist.length > 0 && <InfoRow label="Checklist" value={`${checkDone}/${ordem.checklist.length}`} />}
        <InfoRow label="Técnico" value={ordem.tecnicoId || '— (aguardando agendamento)'} />
        <InfoRow label="Data agendada" value={ordem.dataAgendada ? formatDate(ordem.dataAgendada) : '— (aguardando agendamento)'} />
        <InfoRow label="Status" value={statusLabel} />
        {ordem.observacoes && <InfoRow label="Observações" value={ordem.observacoes} />}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button onClick={() => { window.location.href = '/instalacoes'; }} style={btnGold}>Ver OS completa em Instalações →</button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

/* ================================================================
   Shared Components
   ================================================================ */

function BlockEditor({ categoria, label, marca, equipments, items, onChange }: {
  categoria: BlocoCategoria; label: string; marca: Marca;
  equipments: Equipment[]; items: ItemSolucao[];
  onChange: (items: ItemSolucao[]) => void;
}) {
  const [selEquip, setSelEquip] = useState('');
  const [selQtd, setSelQtd] = useState(1);
  const [selObs, setSelObs] = useState('');

  const filteredEquipments = useMemo(() => equipments.filter((e) => e.bloco === categoria && (e.marca === marca || e.marca === 'Genérico')), [equipments, categoria, marca]);
  const allBlockEquipments = useMemo(() => equipments.filter((e) => e.bloco === categoria), [equipments, categoria]);

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
  function updateObs(eqId: string, obs: string) { onChange(items.map((i) => i.equipmentId === eqId ? { ...i, observacao: obs } : i)); }

  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: theme.gold }}>{label}</h4>
        {items.length > 0 && <span style={{ fontSize: 12, color: theme.success, fontWeight: 600 }}>{items.reduce((s, i) => s + i.quantidade, 0)} item(ns)</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <select value={selEquip} onChange={(e) => setSelEquip(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200, marginBottom: 0 }}>
          <option value="">Selecionar produto...</option>
          <optgroup label={marca}>
            {filteredEquipments.filter((e) => e.marca === marca).map((eq) => <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>)}
          </optgroup>
          {filteredEquipments.some((e) => e.marca === 'Genérico') && (
            <optgroup label="Genérico">
              {filteredEquipments.filter((e) => e.marca === 'Genérico').map((eq) => <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>)}
            </optgroup>
          )}
          {allBlockEquipments.filter((e) => e.marca !== marca && e.marca !== 'Genérico').length > 0 && (
            <optgroup label="Outras marcas">
              {allBlockEquipments.filter((e) => e.marca !== marca && e.marca !== 'Genérico').map((eq) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.marca}) — R$ {eq.price}</option>)}
            </optgroup>
          )}
        </select>
        <input type="number" min={1} value={selQtd} onChange={(e) => setSelQtd(Number(e.target.value))} style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
        <button onClick={addItem} disabled={!selEquip} style={{ ...btnGold, opacity: selEquip ? 1 : 0.4 }}>+</button>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: 12 }}>Nenhum produto adicionado.</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {items.map((item) => {
            const eq = equipments.find((e) => e.id === item.equipmentId);
            return (
              <div key={item.equipmentId} style={{ background: theme.soft, borderRadius: 8, padding: '8px 10px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.quantidade}x</span>
                    <span style={{ fontSize: 13, marginLeft: 6 }}>{eq?.name ?? item.equipmentId}</span>
                    <span style={{ fontSize: 12, color: theme.muted, marginLeft: 8 }}>R$ {((eq?.price ?? 0) * item.quantidade).toLocaleString('pt-BR')}</span>
                  </div>
                  <button onClick={() => removeItem(item.equipmentId)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>x</button>
                </div>
                <input placeholder="Observação técnica" value={item.observacao} onChange={(e) => updateObs(item.equipmentId, e.target.value)} style={{ ...inputStyle, marginTop: 6, marginBottom: 0, fontSize: 12, padding: '4px 8px' }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepResumo({ draft, equipments }: { draft: SolucaoTecnica; equipments: Equipment[] }) {
  const totalItens = draft.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0);
  const blocosPreenchidos = draft.blocos.filter((b) => b.itens.length > 0).length;
  const valorTotal = draft.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => { const eq = equipments.find((e) => e.id === i.equipmentId); return ss + (eq?.price ?? 0) * i.quantidade; }, 0), 0);
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
              <h4 style={{ margin: 0, fontSize: 13, color: groupItems > 0 ? theme.text : theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{sg.label}</h4>
              <span style={{ fontSize: 12, color: groupItems > 0 ? theme.success : theme.muted }}>{groupItems > 0 ? `${groupItems} itens` : 'vazio'}</span>
            </div>
            {blocos.map((bloco) => (
              <div key={bloco.categoria} style={{ paddingLeft: 12, borderLeft: `2px solid ${bloco.itens.length > 0 ? theme.gold + '44' : theme.border}`, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: theme.muted }}>{blocoLabels[bloco.categoria]}: </span>
                {bloco.itens.length === 0 ? <span style={{ fontSize: 12, color: theme.muted, fontStyle: 'italic' }}>(vazio)</span> : bloco.itens.map((item, idx) => {
                  const eq = equipments.find((e) => e.id === item.equipmentId);
                  return <span key={item.equipmentId} style={{ fontSize: 12 }}>{idx > 0 && ', '}<strong>{item.quantidade}x</strong> {eq?.name ?? item.equipmentId}{item.observacao && <span style={{ color: theme.muted }}> ({item.observacao})</span>}</span>;
                })}
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

function StepMarca({ draft, setDraft }: { draft: SolucaoTecnica; setDraft: (d: SolucaoTecnica) => void }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ color: theme.gold, margin: '0 0 6px', fontSize: 16 }}>Dados da Solução</h3>
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>Cliente: <strong style={{ color: theme.text }}>{draft.clienteNome}</strong></div>
      <label style={labelStyle}>Marca Principal *</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {marcas.map((m) => (
          <button key={m} onClick={() => setDraft({ ...draft, marca: m })} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: draft.marca === m ? theme.gold + '22' : theme.soft,
            border: `2px solid ${draft.marca === m ? theme.gold : theme.border}`,
            color: draft.marca === m ? theme.gold : theme.text,
          }}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Small helpers ---- */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 12, color: theme.muted, minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 13, color: theme.text }}>{value}</span>
    </div>
  );
}

function MarcaBadge({ marca }: { marca: Marca }) {
  const colorMap: Record<Marca, string> = { Intelbras: '#43C17B', Hikvision: '#E55B5B', DSC: '#5B9BD5', Viaweb: '#E3B341', Vetti: '#C077DB', 'Genérico': '#B5B5B5' };
  const color = colorMap[marca];
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: color + '22', color, border: `1px solid ${color}44` }}>{marca}</span>;
}

function StatusBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    rascunho: theme.muted, gerada: theme.muted, enviada: theme.warning, aprovada: theme.success,
    pendente: theme.muted, em_andamento: theme.warning, concluida: theme.success,
    pronta: theme.success, escolhido: theme.gold, finalizado: theme.muted,
  };
  const color = colorMap[value] ?? theme.muted;
  return <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, padding: '3px 10px', borderRadius: 999, background: color + '22', color, border: `1px solid ${color}44` }}>{value.replace('_', ' ')}</span>;
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const qtyBtnStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: 6, background: theme.soft, border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
