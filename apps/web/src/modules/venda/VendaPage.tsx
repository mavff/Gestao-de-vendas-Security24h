'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { KIT_CATEGORIA_LABELS } from '../../config/kitPresets';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { ComissaoConfig, DEFAULT_COMISSAO_CONFIG } from '../../lib/dataSource/types';
import { compressImage } from '../../services/imageUtils';
import { photoSrc, uploadBase64Photo } from '../../services/photoService';
import { loadState, saveState } from '../../services/appState';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { openPropostaPDF } from '../../components/proposal/PropostaPDF';
import type {
  ActivityLog, ActivityLogType, AmbienteVistoria, BlocoCategoria, BlocoTecnico,
  Equipment, InstallationPoint, ItemSolucao, Kit, Marca,
  OrdemDeServico, SolucaoTecnica, VendaLocal, VendaLocalStatus, Vistoria,
} from '../../types';
import {
  marcas, BRAND_KEYWORDS_KIT, MARCA_CODE, inferKitMarca, preOrcToKit,
  allBlocos, blocoLabels, wizardSteps, STEP_LABELS, emptyBlocos,
  fmtCurrency, fmtDate, fmtDateTime,
} from './shared/constants';
import type { StepName, WizardStep } from './shared/constants';
import {
  MONIT_KEY, DEFAULT_MONIT_CONFIG, faixaIdxFromTipoLocal,
  MAO_DE_OBRA_KEY, DEFAULT_MAO_DE_OBRA_CONFIG, calcMaoDeObra,
} from './shared/configs';
import type { MonitoramentoConfig, FaixaMonitoramento, MaoDeObraConfig } from './shared/configs';
import { inputStyle, labelStyle, btnGold, btnSoft, qtyBtnStyle } from './shared/styles';
import { PhotoAnnotator } from './shared/PhotoAnnotator';

/* ================================================================
   VendaPage — Main (5 Steps: Cliente → Solução → Proposta → Vistoria → Resumo)
   ================================================================ */

export function VendaPage() {
  const params = useParams<{ leadId: string }>();
  const vendaId = params.leadId as string;
  const router = useRouter();
  const { role, user } = useAuth();
  const { showToast } = useToast();
  const username = user?.username ?? '';

  const canEdit = role === 'ADMIN' || role === 'VENDEDOR';
  const canApprove = role === 'ADMIN' || role === 'GESTOR';
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* --- state --- */
  const [venda, setVenda] = useState<VendaLocal | null>(null);
  const [vendas, setVendas] = useState<VendaLocal[]>([]);
  const [solucao, setSolucao] = useState<SolucaoTecnica | null>(null);
  const [allSolucoes, setAllSolucoes] = useState<SolucaoTecnica[]>([]);
  const [vistoria, setVistoria] = useState<Vistoria | null>(null);
  const [allVistorias, setAllVistorias] = useState<Vistoria[]>([]);
  const [ordem, setOrdem] = useState<OrdemDeServico | null>(null);
  const [allOrdens, setAllOrdens] = useState<OrdemDeServico[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  // Ref sempre atual dos logs — evita side-effect dentro de setLogs (que duplicaria em Strict Mode).
  const logsRef = useRef<ActivityLog[]>([]);
  useEffect(() => { logsRef.current = logs; }, [logs]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [activeStep, setActiveStep] = useState<StepName>('Cliente');
  const [solDraft, setSolDraft] = useState<SolucaoTecnica | null>(null);
  const [wizStep, setWizStep] = useState(0);
  const [monitConfig, setMonitConfig] = useState<MonitoramentoConfig>(DEFAULT_MONIT_CONFIG);
  const [comissaoConfig, setComissaoConfig] = useState<ComissaoConfig>(DEFAULT_COMISSAO_CONFIG);
  const [maoDeObraConfig, setMaoDeObraConfig] = useState<MaoDeObraConfig>(DEFAULT_MAO_DE_OBRA_CONFIG);
  // Guards contra corrida entre load inicial async e escritas locais do usuário.
  // Se o usuário clicar/editar antes do loadState resolver, não sobrescrevemos.
  const localEditsRef = useRef({ venda: false, solucao: false, vistoria: false, ordem: false });
  const localEntregaRef = useRef(false);

  /* --- load --- */
  useEffect(() => {
    // Reset das flags quando navega entre vendas (vendaId muda) —
    // permite que o loadState popule o state da nova venda.
    localEditsRef.current = { venda: false, solucao: false, vistoria: false, ordem: false };
    localEntregaRef.current = false;
    loadState<VendaLocal[]>('vendedor_vendas', []).then((all) => {
      if (localEditsRef.current.venda) return;
      setVendas(all);
      const found = all.find((v) => v.id === vendaId);
      setVenda(found ?? null);
      // Auto-navigate to the right step
      if (found) {
        if (found.status === 'rascunho') setActiveStep('Cliente');
        else if (found.status === 'solucao_pronta') setActiveStep('Proposta');
        else if (found.status === 'proposta_gerada') setActiveStep('Proposta');
        else if (found.status === 'cliente_aprovou' || found.status === 'vistoria') setActiveStep('1ª Visita');
        else if (found.status === 'em_instalacao' || found.status === 'entrega') setActiveStep('Entrega');
        else setActiveStep('Resumo');
      }
    });
    loadState<SolucaoTecnica[]>('solucoes', []).then((all) => {
      if (localEditsRef.current.solucao) return;
      setAllSolucoes(all);
      setSolucao(all.find((s) => s.leadId === vendaId) ?? null);
    });
    loadState<Vistoria[]>('vistorias', []).then((all) => {
      if (localEditsRef.current.vistoria) return;
      setAllVistorias(all);
      setVistoria(all.find((v) => v.leadId === vendaId) ?? null);
    });
    loadState<OrdemDeServico[]>('ordens_servico', []).then((all) => {
      if (localEditsRef.current.ordem) return;
      setAllOrdens(all);
      setOrdem(all.find((o) => o.leadId === vendaId) ?? null);
    });
    loadState<ActivityLog[]>('vendedor_logs', []).then(setLogs);
    loadState<MonitoramentoConfig>(MONIT_KEY, DEFAULT_MONIT_CONFIG).then(setMonitConfig);
    loadState<ComissaoConfig>('config:comissoes', DEFAULT_COMISSAO_CONFIG).then(setComissaoConfig);
    loadState<MaoDeObraConfig>(MAO_DE_OBRA_KEY, DEFAULT_MAO_DE_OBRA_CONFIG).then(setMaoDeObraConfig);

    loadRefDataFromBackend();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendaId]);

  // Refetch de kits/equipments/modelos do ERP (preços podem ter mudado).
  const loadRefDataFromBackend = useCallback(async () => {
    const ds = createDataSource();
    const [eqRes, kitsRes, modelosRes] = await Promise.allSettled([
      ds.equipment.list({ pageSize: 500 }),
      ds.kits.list({ pageSize: 200 }),
      ds.preOrcamentos.list({ pageSize: 200 }),
    ]);
    if (eqRes.status === 'fulfilled') setEquipments(eqRes.value.data);
    const dbKits = kitsRes.status === 'fulfilled' ? kitsRes.value.data : [];
    const modeloKits = modelosRes.status === 'fulfilled' ? modelosRes.value.data.map(preOrcToKit) : [];
    setKits([...modeloKits, ...dbKits]);
  }, []);

  useRefreshOnFocus(() => { loadRefDataFromBackend(); });

  // Merged equipments: include synthetic entries from kit items
  const mergedEquipments = useMemo<Equipment[]>(() => {
    const existingIds = new Set(equipments.map((e) => e.id));
    const synthetics: Equipment[] = [];
    for (const kit of kits) {
      for (const item of kit.items) {
        if (!existingIds.has(item.equipmentId)) {
          existingIds.add(item.equipmentId);
          synthetics.push({
            id: item.equipmentId, name: item.itemName ?? item.equipmentId,
            sku: item.equipmentId, category: 'Acessório', marca: kit.marca ?? 'Genérico',
            bloco: 'acessorio', price: item.unitPrice ?? 0, estoque: 0, descricao: item.itemName ?? '',
          });
        }
      }
    }
    return synthetics.length > 0 ? [...equipments, ...synthetics] : equipments;
  }, [equipments, kits]);

  /* --- logging helper --- */
  const addLog = useCallback((tipo: ActivityLogType, descricao: string, meta?: Record<string, string | number>) => {
    const log: ActivityLog = {
      id: 'LOG' + Date.now() + Math.random().toString(36).slice(2, 6),
      vendaId,
      tipo,
      descricao,
      criadoPor: username,
      createdAt: new Date().toISOString(),
      meta,
    };
    const updated = [log, ...logsRef.current];
    logsRef.current = updated;
    setLogs(updated);
    saveState('vendedor_logs', updated);
  }, [vendaId, username]);

  /* --- persist helpers (retornam Promise pra handlers aguardarem o save) --- */
  async function updateVenda(patch: Partial<VendaLocal>): Promise<void> {
    if (!venda) return;
    localEditsRef.current.venda = true;
    const updated = { ...venda, ...patch, updatedAt: new Date().toISOString() };
    const next = vendas.map((v) => v.id === vendaId ? updated : v);
    setVenda(updated);
    setVendas(next);
    await saveState('vendedor_vendas', next);
  }

  async function updateSolucao(sol: SolucaoTecnica): Promise<void> {
    localEditsRef.current.solucao = true;
    const exists = allSolucoes.some((s) => s.id === sol.id);
    const next = exists ? allSolucoes.map((s) => s.id === sol.id ? sol : s) : [...allSolucoes, sol];
    setSolucao(sol);
    setAllSolucoes(next);
    await saveState('solucoes', next);
  }

  async function updateVistoria(vis: Vistoria): Promise<void> {
    localEditsRef.current.vistoria = true;
    const exists = allVistorias.some((v) => v.id === vis.id);
    const next = exists ? allVistorias.map((v) => v.id === vis.id ? vis : v) : [...allVistorias, vis];
    setVistoria(vis);
    setAllVistorias(next);
    await saveState('vistorias', next);
  }

  async function updateOrdem(os: OrdemDeServico): Promise<void> {
    localEditsRef.current.ordem = true;
    const exists = allOrdens.some((o) => o.id === os.id);
    const next = exists ? allOrdens.map((o) => o.id === os.id ? os : o) : [...allOrdens, os];
    setOrdem(os);
    setAllOrdens(next);
    await saveState('ordens_servico', next);
  }

  /* --- delete venda --- */
  async function handleDeleteVenda() {
    const tasks: Promise<void>[] = [
      loadState<VendaLocal[]>('vendedor_vendas', []).then((all) =>
        saveState('vendedor_vendas', all.filter((v) => v.id !== vendaId)),
      ),
      loadState<ActivityLog[]>('vendedor_logs', []).then((all) =>
        saveState('vendedor_logs', all.filter((l) => l.vendaId !== vendaId)),
      ),
    ];
    if (solucao) {
      tasks.push(loadState<SolucaoTecnica[]>('solucoes', []).then((all) =>
        saveState('solucoes', all.filter((s) => s.id !== solucao.id)),
      ));
    }
    if (vistoria) {
      tasks.push(loadState<Vistoria[]>('vistorias', []).then((all) =>
        saveState('vistorias', all.filter((v) => v.id !== vistoria.id)),
      ));
    }
    if (entregaVistoria) {
      tasks.push(loadState<Vistoria[]>('entregas', []).then((all) =>
        saveState('entregas', all.filter((v) => v.id !== entregaVistoria.id)),
      ));
    }
    if (ordem) {
      tasks.push(loadState<OrdemDeServico[]>('ordens_servico', []).then((all) =>
        saveState('ordens_servico', all.filter((o) => o.id !== ordem.id)),
      ));
    }
    await Promise.all(tasks);
    showToast('Venda excluída.', 'success');
    router.push('/vendas');
  }

  /* --- init solução draft --- */
  useEffect(() => {
    if (!venda) return;
    if (solDraft) return;

    if (solucao) {
      setSolDraft({ ...solucao });
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    setSolDraft({
      id: '', leadId: vendaId,
      clienteNome: `${venda.clienteNome} — ${venda.clienteEmpresa}`,
      marca: 'Intelbras', blocos: emptyBlocos(), servicos: [], observacaoGeral: '',
      status: 'rascunho', criadoPor: username, createdAt: now, updatedAt: now,
    });
    setWizStep(0);
  }, [venda, solucao, solDraft, vendaId, username]);

  /* =============================================
     Step accessibility
     ============================================= */

  const visita1Concluida = venda?.visita1Concluida === true;
  const visita2Concluida = venda?.visita2Concluida === true;
  const hasSolucao = !!solucao;
  const clienteAprovado = venda?.clienteAprovado === true;

  const stepEnabled: Record<StepName, boolean> = {
    'Cliente': true,
    'Solução': true,
    'Proposta': hasSolucao,
    '1ª Visita': clienteAprovado,
    'Entrega': visita1Concluida,
    'Resumo': visita1Concluida,
  };

  const progressIndex = visita2Concluida ? 5
    : visita1Concluida ? 4
    : clienteAprovado ? 3
    : hasSolucao && (venda?.status === 'proposta_gerada' || venda?.status === 'solucao_pronta') ? 2
    : hasSolucao ? 1
    : 0;

  /* =============================================
     Actions — Step 1: Cliente
     ============================================= */

  function handleSaveCliente(data: Partial<VendaLocal>) {
    updateVenda(data);
    addLog('cliente_editado', 'Dados do cliente atualizados');
    showToast('Dados do cliente salvos.', 'success');
  }

  /* =============================================
     Actions — Step 2: Solução
     ============================================= */

  async function handleSaveSolucao() {
    if (!solDraft) return;
    const now = new Date().toISOString().slice(0, 10);
    const id = solDraft.id || 'SOL' + Date.now();
    const updated: SolucaoTecnica = { ...solDraft, id, updatedAt: now };
    setSolDraft(updated);
    await Promise.all([
      updateSolucao(updated),
      updateVenda({ solucaoId: id }),
    ]);
    addLog('solucao_salva', 'Solução técnica salva');
    showToast('Solução salva.', 'success');
  }

  async function handleSolucaoPronta() {
    if (!solDraft) return;
    const now = new Date().toISOString().slice(0, 10);
    const id = solDraft.id || 'SOL' + Date.now();
    const pronta: SolucaoTecnica = { ...solDraft, id, status: 'enviada', updatedAt: now };
    setSolDraft(pronta);
    await Promise.all([
      updateSolucao(pronta),
      updateVenda({ solucaoId: id, status: 'solucao_pronta' }),
    ]);
    addLog('solucao_enviada', 'Solução finalizada');
    showToast('Solução pronta! Avance para gerar a proposta.', 'success');
    setActiveStep('Proposta');
  }

  /* =============================================
     Actions — Step 3: Proposta / PDF
     ============================================= */

  function handleGerarPDF() {
    if (!venda || !solucao) return;
    const itens = solucao.blocos.flatMap((b) =>
      b.itens.map((item) => {
        const eq = mergedEquipments.find((e) => e.id === item.equipmentId);
        return { nome: eq?.name ?? item.equipmentId, quantidade: item.quantidade, precoUnitario: eq?.price ?? 0, bloco: b.categoria };
      }),
    );
    const subtotalEquip = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
    const maoDeObra = venda.maoDeObra ?? 0;
    const totalVenda = subtotalEquip + maoDeObra;
    const monitoramento = venda.monitoramentoMensal ?? 0;
    const prazo = venda.prazoComodato ?? 36;
    const subtotalCusto = subtotalEquip * 0.6;
    const mensalidadeComodato = (subtotalCusto / prazo) + monitoramento;
    const taxaAdesao = maoDeObra; // Taxa de adesão = mão de obra (paga na assinatura)
    const custoTotal = taxaAdesao + mensalidadeComodato * prazo;

    openPropostaPDF({
      clienteNome: venda.clienteNome,
      clienteTel: venda.clienteTelefone,
      clienteEndereco: venda.clienteEndereco,
      tipoLocal: venda.tipoLocal,
      marca: solucao.marca,
      itens,
      observacoes: solucao.observacaoGeral || venda.observacoes,
      vendedorNome: user?.name ?? username,
      subtotalEquipamentos: subtotalEquip,
      maoDeObra,
      acrescimoInstalacao: 0,
      valorCrea: 0,
      totalVenda,
      monitoramentoMensal: monitoramento,
      mensalidadeComodato,
      taxaAdesao,
      prazo,
      custoTotalComodato: custoTotal,
      modalidade: venda.modalidade ?? 'ambos',
    });

    if (venda.status !== 'proposta_gerada' && venda.status !== 'cliente_aprovou') {
      updateVenda({ status: 'proposta_gerada' });
      addLog('proposta_gerada', 'Proposta PDF gerada');
    }
  }

  async function handleClienteAprovou() {
    if (!venda) return;
    await updateVenda({ status: 'cliente_aprovou', clienteAprovado: true });
    addLog('solucao_aprovada', 'Cliente aprovou a proposta');
    showToast('Cliente aprovou! Faça a 1ª visita ao local.', 'success');
    setActiveStep('1ª Visita');
  }

  /* =============================================
     Actions — Step 3: Vistoria (Fotos/Pontos)
     ============================================= */

  function handleAddAmbiente(nome: string) {
    const now = new Date().toISOString().slice(0, 10);
    const newAmb: AmbienteVistoria = { id: 'AMB' + Date.now(), nome, pontos: [], status: 'pendente' };
    // Cria vistoria + ambiente em UMA chamada pra evitar race entre setStates
    const base: Vistoria = vistoria ?? {
      id: 'VIS' + Date.now(), leadId: vendaId, propostaId: '',
      ambientes: [], observacoes: '', status: 'pendente',
      criadoPor: username, createdAt: now, updatedAt: now,
    };
    const updated: Vistoria = {
      ...base,
      ambientes: [...base.ambientes, newAmb],
      status: 'em_andamento',
      updatedAt: now,
    };
    updateVistoria(updated);
    if (!vistoria) {
      updateVenda({ vistoriaId: updated.id, status: 'vistoria' });
      addLog('vistoria_iniciada', 'Vistoria do local iniciada');
    }
    addLog('ambiente_adicionado', `Ambiente "${nome}" adicionado`, { ambiente: nome });
  }

  function handleUpdateAmbiente(ambId: string, amb: AmbienteVistoria) {
    if (!vistoria) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated: Vistoria = { ...vistoria, ambientes: vistoria.ambientes.map((a) => a.id === ambId ? amb : a), updatedAt: now };
    updateVistoria(updated);
  }

  function handleRemoveAmbiente(ambId: string) {
    if (!vistoria) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated: Vistoria = { ...vistoria, ambientes: vistoria.ambientes.filter((a) => a.id !== ambId), updatedAt: now };
    updateVistoria(updated);
  }

  async function handleConcluirVistoria() {
    if (!vistoria) return;
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
    await updateVistoria(concluida);
    addLog('vistoria_concluida', `Vistoria concluída com ${vistoria.ambientes.length} ambientes`);

    // Auto-create OS
    let ordemIdFinal: string | undefined;
    if (solucao && !ordem) {
      const allPontos: InstallationPoint[] = vistoria.ambientes.flatMap((a) => a.pontos);
      let ckIdx = 0;
      const checklist = solucao.blocos.flatMap((bloco) =>
        bloco.itens.map((item) => {
          const eq = mergedEquipments.find((e) => e.id === item.equipmentId);
          return { id: 'CK' + Date.now() + (ckIdx++), text: `Instalar ${item.quantidade}x ${eq?.name ?? item.equipmentId}`, done: false };
        }),
      );
      const newOS: OrdemDeServico = {
        id: 'OS' + Date.now(), vistoriaId: vistoria.id, leadId: vendaId,
        cliente: venda?.clienteNome ?? '', dataAgendada: '', tecnicoId: '',
        checklist, pontos: allPontos, observacoes: '', status: 'pendente', createdAt: now,
      };
      await updateOrdem(newOS);
      ordemIdFinal = newOS.id;
      addLog('os_criada', 'Ordem de serviço criada automaticamente');
    }

    await updateVenda({
      visita1Concluida: true,
      status: 'em_instalacao',
      ...(ordemIdFinal ? { ordemId: ordemIdFinal } : {}),
    });
    showToast('1ª Visita concluída! OS criada.', 'success');
    setActiveStep('Entrega');
  }

  /* =============================================
     Actions — Step 5: Entrega (2ª Visita)
     ============================================= */

  // Second vistoria for delivery photos
  const [entregaVistoria, setEntregaVistoria] = useState<Vistoria | null>(null);
  const [allEntregas, setAllEntregas] = useState<Vistoria[]>([]);

  useEffect(() => {
    loadState<Vistoria[]>('entregas', []).then((all) => {
      if (localEntregaRef.current) return;
      setAllEntregas(all);
      setEntregaVistoria(all.find((v) => v.leadId === vendaId) ?? null);
    });
  }, [vendaId]);

  async function updateEntregaVistoria(vis: Vistoria): Promise<void> {
    localEntregaRef.current = true;
    const exists = allEntregas.some((v) => v.id === vis.id);
    const next = exists ? allEntregas.map((v) => v.id === vis.id ? vis : v) : [...allEntregas, vis];
    setEntregaVistoria(vis);
    setAllEntregas(next);
    await saveState('entregas', next);
  }

  function handleIniciarInstalacao() {
    updateVenda({ status: 'em_instalacao' });
    addLog('instalacao_iniciada', 'Instalação iniciada pela equipe técnica');
    showToast('Instalação marcada como iniciada.', 'success');
  }

  // Auto-sincroniza a estrutura (ambientes/pontos) da Entrega a partir da Vistoria.
  // Usuário NÃO adiciona ambientes na 2ª visita — só tira fotos de conferência
  // dos mesmos pontos marcados na 1ª visita.
  // Só roda quando o usuário de fato abre a aba Entrega, pra não criar registros órfãos.
  useEffect(() => {
    if (activeStep !== 'Entrega') return;
    if (!vistoria || vistoria.ambientes.length === 0) return;
    const now = new Date().toISOString().slice(0, 10);
    const base: Vistoria = entregaVistoria ?? {
      id: 'ENT' + Date.now(), leadId: vendaId, propostaId: '',
      ambientes: [], observacoes: '', status: 'pendente',
      criadoPor: username, createdAt: now, updatedAt: now,
    };
    const syncedAmbientes: AmbienteVistoria[] = vistoria.ambientes.map((va) => {
      const existAmb = base.ambientes.find((a) => a.id === va.id);
      const pontos: InstallationPoint[] = va.pontos.map((vp) => {
        const existPt = existAmb?.pontos.find((p) => p.id === vp.id);
        return existPt
          ? { ...existPt, environment: va.nome, type: vp.type, note: vp.note, equipmentId: vp.equipmentId, locationTag: vp.locationTag }
          : { id: vp.id, environment: va.nome, type: vp.type, note: vp.note, status: 'Pendente', photos: [], equipmentId: vp.equipmentId, locationTag: vp.locationTag };
      });
      return { id: va.id, nome: va.nome, pontos, status: (existAmb?.status ?? 'pendente') as 'pendente' | 'concluido' };
    });
    // Só persiste se a estrutura realmente mudou (evita loop infinito)
    const changed = JSON.stringify(syncedAmbientes.map((a) => ({ id: a.id, pontos: a.pontos.map((p) => p.id) })))
      !== JSON.stringify(base.ambientes.map((a) => ({ id: a.id, pontos: a.pontos.map((p) => p.id) })));
    if (changed || !entregaVistoria) {
      updateEntregaVistoria({ ...base, ambientes: syncedAmbientes, updatedAt: now });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, vistoria?.id, vistoria?.ambientes]);

  function handleUpdatePontoEntrega(ambId: string, pontoId: string, updated: InstallationPoint) {
    if (!entregaVistoria) return;
    const now = new Date().toISOString().slice(0, 10);
    const updatedVis: Vistoria = {
      ...entregaVistoria,
      ambientes: entregaVistoria.ambientes.map((a) =>
        a.id === ambId ? { ...a, pontos: a.pontos.map((p) => p.id === pontoId ? updated : p) } : a,
      ),
      updatedAt: now,
    };
    updateEntregaVistoria(updatedVis);
  }

  async function handleConcluirEntrega() {
    if (!entregaVistoria) return;
    const totalPontos = entregaVistoria.ambientes.reduce((s, a) => s + a.pontos.length, 0);
    const pontosComFoto = entregaVistoria.ambientes.reduce((s, a) => s + a.pontos.filter((p) => p.photos.length > 0).length, 0);
    if (totalPontos === 0) {
      showToast('Nenhum ponto da vistoria foi encontrado.', 'error');
      return;
    }
    if (pontosComFoto < totalPontos) {
      showToast(`Falta conferir ${totalPontos - pontosComFoto} ponto(s) com foto.`, 'error');
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    await Promise.all([
      updateEntregaVistoria({ ...entregaVistoria, status: 'concluida', updatedAt: now }),
      updateVenda({ visita2Concluida: true, status: 'concluida' }),
    ]);
    addLog('entrega_concluida', `Entrega concluída com ${entregaVistoria.ambientes.length} ambientes conferidos`);
    showToast('Entrega concluída! Venda finalizada.', 'success');
    setActiveStep('Resumo');
  }

  /* --- log for photos --- */
  function onPhotoAdded(ambienteNome: string) {
    addLog('foto_adicionada', `Foto adicionada em "${ambienteNome}"`, { ambiente: ambienteNome });
  }

  function onPontoAdded(ambienteNome: string, pontoTipo: string) {
    addLog('ponto_adicionado', `Ponto "${pontoTipo}" adicionado em "${ambienteNome}"`, { ambiente: ambienteNome, tipo: pontoTipo });
  }

  /* --- contextual alert --- */
  const alertMsg = useMemo(() => {
    if (visita2Concluida) return { text: 'Venda concluída! Serviço entregue ao cliente.', color: theme.success, icon: '✓' };
    if (venda?.status === 'entrega') return { text: 'Instalação feita. Faça a 2ª visita (entrega) e registre fotos.', color: '#43C17B', icon: '→' };
    if (venda?.status === 'em_instalacao') return { text: 'Equipe em instalação. Após conclusão, faça a entrega.', color: '#FF9800', icon: '→' };
    if (visita1Concluida) return { text: '1ª Visita concluída! OS criada. Aguardando instalação e entrega.', color: theme.gold, icon: '→' };
    if (vistoria && vistoria.ambientes.length > 0) {
      const totalPontos = vistoria.ambientes.reduce((s, a) => s + a.pontos.length, 0);
      const totalFotos = vistoria.ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0);
      return { text: `1ª Visita: ${vistoria.ambientes.length} amb. · ${totalPontos} pontos · ${totalFotos} fotos`, color: '#C077DB', icon: '◎' };
    }
    if (clienteAprovado) return { text: 'Cliente aprovou! Faça a 1ª visita (marcar pontos + fotos).', color: theme.gold, icon: '→' };
    if (venda?.status === 'proposta_gerada') return { text: 'Proposta gerada. Aguardando aprovação do cliente.', color: '#5B9BD5', icon: '◎' };
    if (hasSolucao && venda?.status === 'solucao_pronta') return { text: 'Solução pronta! Gere a proposta para o cliente.', color: theme.gold, icon: '→' };
    if (solucao) return { text: 'Solução em rascunho.', color: theme.muted, icon: '✎' };
    return { text: 'Comece preenchendo os dados do cliente e monte a solução.', color: theme.muted, icon: '1' };
  }, [solucao, hasSolucao, clienteAprovado, venda?.status, vistoria, visita1Concluida, visita2Concluida]);

  /* --- vendor logs for this venda --- */
  const vendaLogs = useMemo(() => logs.filter((l) => l.vendaId === vendaId), [logs, vendaId]);

  /* --- render --- */

  if (!venda) {
    return (
      <AppShell title="Venda">
        <div style={{ textAlign: 'center', padding: 40, color: theme.muted }}>
          Venda não encontrada (ID: {vendaId}).
          <br />
          <button onClick={() => router.push('/vendas')} style={{ ...btnGold, marginTop: 16 }}>Voltar para Minhas Vendas</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Venda — ${venda.clienteNome}`}>
      {/* Gestor banner */}
      {!canEdit && canApprove && (
        <div style={{ background: '#5B9BD515', border: '1px solid #5B9BD544', borderRadius: 10, padding: '8px 14px', marginBottom: 10, fontSize: 12, color: '#5B9BD5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Modo Gestor</span> — Visualização e aprovação.
        </div>
      )}

      {/* Alert bar */}
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

      {/* 6-Step progress bar — mobile-friendly */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {STEP_LABELS.map((stepLabel, i) => {
          const done = i < progressIndex;
          const current = i === progressIndex;
          const isActive = activeStep === stepLabel;
          const enabled = stepEnabled[stepLabel];
          return (
            <button
              key={stepLabel}
              onClick={() => enabled && setActiveStep(stepLabel)}
              disabled={!enabled}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: isActive ? (done ? theme.success : current ? theme.gold : theme.text) + '12' : 'transparent',
                border: `2px solid ${isActive ? (done ? theme.success : current ? theme.gold : theme.text) : 'transparent'}`,
                borderRadius: 10,
                cursor: enabled ? 'pointer' : 'not-allowed',
                opacity: enabled ? 1 : 0.35,
                padding: '8px 10px', minWidth: 56, flexShrink: 0,
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: done ? theme.success : current ? theme.gold : theme.soft,
                color: done || current ? '#111' : theme.muted,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 500,
                color: done ? theme.success : current ? theme.gold : isActive ? theme.text : theme.muted,
              }}>
                {stepLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action row — Voltar + Excluir */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }}>
        {canEdit && (
          <button onClick={() => setShowDeleteConfirm(true)}
            title="Excluir venda"
            style={{ ...btnSoft, fontSize: 12, padding: '8px 12px', color: theme.muted, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Excluir
          </button>
        )}
        <button onClick={() => router.push('/vendas')} style={{ ...btnSoft, fontSize: 12, padding: '8px 14px' }}>
          ← Minhas Vendas
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, maxWidth: 400, width: '100%' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: theme.danger, fontSize: 16 }}>Excluir venda?</h3>
            <p style={{ fontSize: 13, color: theme.muted, marginBottom: 6 }}>
              Tem certeza que deseja excluir a venda de <strong style={{ color: theme.text }}>{venda.clienteNome}</strong>?
            </p>
            <p style={{ fontSize: 12, color: theme.danger, marginBottom: 20 }}>
              Todos os dados, solução, fotos e logs serão removidos permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={btnSoft}>Cancelar</button>
              <button onClick={handleDeleteVenda}
                style={{ ...btnGold, background: theme.danger, color: '#fff' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      {activeStep === 'Cliente' && (
        <StepCliente venda={venda} onSave={handleSaveCliente} canEdit={canEdit} onNext={() => setActiveStep('Solução')} />
      )}

      {activeStep === 'Solução' && solDraft && (
        <TabSolucao
          draft={solDraft} setDraft={setSolDraft}
          step={wizStep} setStep={setWizStep}
          equipments={mergedEquipments} kits={kits}
          solucaoExistente={solucao}
          onSave={handleSaveSolucao}
          onSolucaoPronta={handleSolucaoPronta}
          canEdit={canEdit}
        />
      )}

      {activeStep === 'Proposta' && (
        <StepProposta
          venda={venda}
          solucao={solucao}
          equipments={mergedEquipments}
          monitConfig={monitConfig}
          comissaoConfig={comissaoConfig}
          maoDeObraConfig={maoDeObraConfig}
          onUpdateVenda={updateVenda}
          onGerarPDF={handleGerarPDF}
          onClienteAprovou={handleClienteAprovou}
          onMaoDeObraConfigChange={setMaoDeObraConfig}
          canEdit={canEdit}
        />
      )}

      {activeStep === '1ª Visita' && (
        <StepVistoria
          vistoria={vistoria}
          onAddAmbiente={handleAddAmbiente}
          onUpdateAmbiente={handleUpdateAmbiente}
          onRemoveAmbiente={handleRemoveAmbiente}
          onConcluir={handleConcluirVistoria}
          onPhotoAdded={onPhotoAdded}
          onPontoAdded={onPontoAdded}
          canEdit={canEdit}
          titulo="1ª Visita — Pré-instalação"
          descricao="Vá até o local do cliente, adicione os ambientes e pontos, tire a foto e toque no local exato onde o equipamento será instalado para marcar com um X. O técnico vai ver exatamente onde colocar cada item."
        />
      )}

      {activeStep === 'Entrega' && (
        <StepEntrega
          venda={venda}
          vistoria={vistoria}
          entregaVistoria={entregaVistoria}
          ordem={ordem}
          onIniciarInstalacao={handleIniciarInstalacao}
          onConcluirEntrega={handleConcluirEntrega}
          onUpdatePonto={handleUpdatePontoEntrega}
          onPhotoAdded={onPhotoAdded}
          canEdit={canEdit}
        />
      )}

      {activeStep === 'Resumo' && (
        <StepResumoFinal
          venda={venda}
          solucao={solucao}
          vistoria={vistoria}
          entregaVistoria={entregaVistoria}
          ordem={ordem}
          equipments={mergedEquipments}
          logs={vendaLogs}
        />
      )}
    </AppShell>
  );
}

/* ================================================================
   Step 1: Cliente
   ================================================================ */

function StepCliente({ venda, onSave, canEdit, onNext }: {
  venda: VendaLocal;
  onSave: (data: Partial<VendaLocal>) => void;
  canEdit: boolean;
  onNext: () => void;
}) {
  const [nome, setNome] = useState(venda.clienteNome);
  const [telefone, setTelefone] = useState(venda.clienteTelefone);
  const [email, setEmail] = useState(venda.clienteEmail);
  const [empresa, setEmpresa] = useState(venda.clienteEmpresa);
  const [endereco, setEndereco] = useState(venda.clienteEndereco);
  const [tipoLocal, setTipoLocal] = useState(venda.tipoLocal);
  const [obs, setObs] = useState(venda.observacoes);

  function save() {
    onSave({ clienteNome: nome, clienteTelefone: telefone, clienteEmail: email, clienteEmpresa: empresa, clienteEndereco: endereco, tipoLocal, observacoes: obs });
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ margin: '0 0 16px', color: theme.gold, fontSize: 16 }}>Dados do Cliente</h3>

      <label style={labelStyle}>Nome *</label>
      <input value={nome} onChange={(e) => setNome(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="Nome completo" autoComplete="name" />

      <label style={labelStyle}>Telefone</label>
      <input type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="(11) 99999-9999" autoComplete="tel" />

      <label style={labelStyle}>Email</label>
      <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="email@exemplo.com" autoComplete="email" />

      <label style={labelStyle}>Empresa / Condomínio</label>
      <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="Nome da empresa" />

      <label style={labelStyle}>Endereço</label>
      <input value={endereco} onChange={(e) => setEndereco(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="Rua, número, bairro, cidade" autoComplete="street-address" />

      <label style={labelStyle}>Tipo de local</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['Residencial', 'Comercial', 'Condomínio', 'Industrial'] as const).map((tipo) => (
          <button key={tipo} onClick={() => { if (canEdit) setTipoLocal(tipo); }}
            style={{
              padding: '10px 18px', borderRadius: 10, cursor: canEdit ? 'pointer' : 'default', fontSize: 14, fontWeight: 600,
              background: tipoLocal === tipo ? theme.gold + '22' : theme.soft,
              border: `2px solid ${tipoLocal === tipo ? theme.gold : theme.border}`,
              color: tipoLocal === tipo ? theme.gold : theme.text,
              flex: '1 1 auto', minWidth: 120,
            }}
          >
            {tipo}
          </button>
        ))}
      </div>

      <label style={labelStyle}>Observações iniciais</label>
      <textarea value={obs} onChange={(e) => setObs(e.target.value)} disabled={!canEdit} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notas sobre o cliente, urgência, preferências..." />

      {canEdit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
          <button onClick={() => { save(); onNext(); }} style={{ ...btnGold, padding: '14px 20px', fontSize: 15, fontWeight: 700, borderRadius: 12, width: '100%' }}>Salvar e montar Solução →</button>
          <button onClick={save} style={{ ...btnSoft, padding: '12px 16px', width: '100%' }}>Salvar dados</button>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Kit Grid (reusable)
   ================================================================ */

function KitGrid({ kits, equipments, selectedKitId, onApply }: {
  kits: Kit[];
  equipments: Equipment[];
  selectedKitId: string | null;
  onApply: (kit: Kit) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', marginBottom: 20 }}>
      {kits.map((kit) => {
        const kitPrice = kit.items.reduce((s, i) => { const eq = equipments.find((e) => e.id === i.equipmentId); return s + (eq?.price ?? 0) * i.quantity; }, 0);
        const itemCount = kit.items.reduce((s, i) => s + i.quantity, 0);
        const isSelected = selectedKitId === kit.id;
        return (
          <button key={kit.id} onClick={() => onApply(kit)} style={{
            display: 'block', textAlign: 'left', cursor: 'pointer',
            background: isSelected ? 'rgba(200,169,81,0.10)' : theme.panel,
            border: `2px solid ${isSelected ? theme.gold : theme.border}`,
            borderRadius: 12, padding: 14, color: theme.text,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <strong style={{ fontSize: 13, color: isSelected ? theme.gold : theme.text }}>{kit.name}</strong>
              {isSelected && <span style={{ fontSize: 9, color: theme.gold, fontWeight: 700, background: theme.gold + '22', padding: '2px 6px', borderRadius: 999 }}>SELECIONADO</span>}
            </div>
            {kit.marca && <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>{kit.marca}</div>}
            {kit.categoria && <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>{KIT_CATEGORIA_LABELS[kit.categoria]}</div>}
            {kit.descricao && <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>{kit.descricao}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: theme.muted }}>{itemCount} itens</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.gold }}>~R$ {fmtCurrency(kitPrice)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================
   Step 2: Solução (kit + wizard) — kept mostly the same
   ================================================================ */

function TabSolucao({ draft, setDraft, step, setStep, equipments, kits, solucaoExistente, onSave, onSolucaoPronta, canEdit: canEditProp }: {
  draft: SolucaoTecnica;
  setDraft: (d: SolucaoTecnica) => void;
  step: number;
  setStep: (s: number) => void;
  equipments: Equipment[];
  kits: Kit[];
  solucaoExistente: SolucaoTecnica | null;
  onSave: () => void;
  onSolucaoPronta: () => void;
  canEdit: boolean;
}) {
  const [kitMode, setKitMode] = useState(true);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

  const kitsForMarca = useMemo(() => kits.filter((k) => k.marca === draft.marca), [kits, draft.marca]);
  const kitsOutras = useMemo(() => kits.filter((k) => k.marca !== draft.marca), [kits, draft.marca]);

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
            <SolucaoResumo draft={draft} equipments={equipments} />
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Observação geral</label>
              <textarea value={draft.observacaoGeral} onChange={(e) => setDraft({ ...draft, observacaoGeral: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notas livres..." />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14, flexWrap: 'wrap' }}>
          {!isFirst && <button onClick={() => setStep(step - 1)} style={{ ...btnSoft, flex: '1 1 120px', minHeight: 44 }}>← Anterior</button>}
          {!isLast ? (
            <button onClick={() => setStep(step + 1)} style={{ ...btnGold, flex: '2 1 160px', minHeight: 44, fontWeight: 700 }}>Próximo →</button>
          ) : (
            <>
              <button onClick={onSave} style={{ ...btnSoft, flex: '1 1 140px', minHeight: 44 }}>Salvar rascunho</button>
              {canEditProp && <button onClick={onSolucaoPronta} style={{ ...btnGold, background: theme.success, flex: '2 1 180px', minHeight: 44, fontWeight: 700 }}>Concluir Solução →</button>}
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {marcas.map((m) => (
          <button key={m} onClick={() => { if (m !== draft.marca) setDraft({ ...draft, marca: m, blocos: emptyBlocos() }); }} style={{
            padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: draft.marca === m ? theme.gold + '22' : theme.soft,
            border: `2px solid ${draft.marca === m ? theme.gold : theme.border}`,
            color: draft.marca === m ? theme.gold : theme.text,
            minHeight: 44,
          }}>
            {m}
          </button>
        ))}
      </div>

      {kits.length > 0 ? (
        <>
          {kitsForMarca.length > 0 && (
            <>
              <label style={{ ...labelStyle, marginBottom: 10, fontSize: 13 }}>Kits {draft.marca}</label>
              <KitGrid kits={kitsForMarca} equipments={equipments} selectedKitId={selectedKitId} onApply={applyKit} />
            </>
          )}
          {kitsOutras.length > 0 && (
            <details open={kitsForMarca.length === 0} style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', color: theme.muted, fontSize: 13, marginBottom: 10, userSelect: 'none' }}>
                {kitsForMarca.length > 0 ? `Outros kits (${kitsOutras.length})` : `Todos os kits disponíveis (${kitsOutras.length})`}
              </summary>
              <KitGrid kits={kitsOutras} equipments={equipments} selectedKitId={selectedKitId} onApply={applyKit} />
            </details>
          )}
        </>
      ) : (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13, marginBottom: 16 }}>
          Nenhum kit disponível.
          <br /><button onClick={() => { setKitMode(false); setStep(0); }} style={{ ...btnGold, marginTop: 10, fontSize: 12 }}>Usar modo avançado</button>
        </div>
      )}

      {hasItems && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: theme.gold }}>Ajustar Quantidades</h4>
            {selectedKitId && <button onClick={() => { setSelectedKitId(null); setDraft({ ...draft, blocos: emptyBlocos() }); }} style={{ ...btnSoft, fontSize: 11, padding: '4px 10px' }}>Trocar Kit</button>}
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {flatItems.map((item) => (
              <div key={item.equipmentId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.soft, borderRadius: 8, padding: '8px 12px', border: `1px solid ${theme.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{item.blocoLabel} · R$ {fmtCurrency(item.preco)}/un</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                  <button onClick={() => updateItemQty(item.equipmentId, item.quantidade - 1)} style={qtyBtnStyle}>−</button>
                  <span style={{ display: 'inline-block', width: 32, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{item.quantidade}</span>
                  <button onClick={() => updateItemQty(item.equipmentId, item.quantidade + 1)} style={qtyBtnStyle}>+</button>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.gold, minWidth: 80, textAlign: 'right' }}>R$ {fmtCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 14, color: theme.muted }}>Total estimado (equipamentos)</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: theme.gold }}>R$ {fmtCurrency(totalEstimado)}</span>
          </div>
        </div>
      )}

      {hasItems && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Observação geral</label>
          <textarea value={draft.observacaoGeral} onChange={(e) => setDraft({ ...draft, observacaoGeral: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notas livres..." />
        </div>
      )}

      {hasItems && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
          {canEditProp && <button onClick={onSolucaoPronta} style={{ ...btnGold, background: theme.success, padding: '14px 20px', fontSize: 15, fontWeight: 700, borderRadius: 12, width: '100%' }}>Concluir Solução →</button>}
          <button onClick={onSave} style={{ ...btnSoft, padding: '12px 16px', width: '100%' }}>Salvar rascunho</button>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Step 3: Proposta / PDF
   ================================================================ */

function StepProposta({ venda, solucao, equipments, monitConfig, comissaoConfig, maoDeObraConfig, onUpdateVenda, onGerarPDF, onClienteAprovou, onMaoDeObraConfigChange, canEdit }: {
  venda: VendaLocal;
  solucao: SolucaoTecnica | null;
  equipments: Equipment[];
  monitConfig: MonitoramentoConfig;
  comissaoConfig: ComissaoConfig;
  maoDeObraConfig: MaoDeObraConfig;
  onUpdateVenda: (patch: Partial<VendaLocal>) => Promise<void>;
  onGerarPDF: () => void;
  onClienteAprovou: () => void;
  onMaoDeObraConfigChange: (cfg: MaoDeObraConfig) => void;
  canEdit: boolean;
}) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN' || role === 'GESTOR';

  const [modalidade, setModalidade] = useState<'venda' | 'comodato' | 'ambos'>(venda.modalidade ?? 'ambos');
  const [faixaIdx, setFaixaIdx] = useState(() => faixaIdxFromTipoLocal(venda.tipoLocal, monitConfig.faixas));
  const faixa = monitConfig.faixas[faixaIdx] ?? monitConfig.faixas[0] ?? DEFAULT_MONIT_CONFIG.faixas[0];
  const monitBase = faixa.base;
  const monitMin = faixa.minimo;
  const [monitAjuste, setMonitAjuste] = useState<number | null>(
    venda.monitoramentoMensal != null && venda.monitoramentoMensal !== faixa.base ? venda.monitoramentoMensal : null,
  );
  const monitValor = monitAjuste ?? monitBase;
  const [prazo, setPrazo] = useState<24 | 36 | 48>(venda.prazoComodato ?? 36);
  const [showEquipDetail, setShowEquipDetail] = useState(false);
  const [showMaoDeObraDetail, setShowMaoDeObraDetail] = useState(false);
  const [showMaoDeObraConfigModal, setShowMaoDeObraConfigModal] = useState(false);

  const approved = venda.clienteAprovado === true;

  if (!solucao) {
    return (
      <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 40, textAlign: 'center', color: theme.muted }}>
        Finalize a Solução primeiro para poder gerar a proposta.
      </div>
    );
  }

  const flatItems = solucao.blocos.flatMap((b) =>
    b.itens.map((item) => {
      const eq = equipments.find((e) => e.id === item.equipmentId);
      return { nome: eq?.name ?? item.equipmentId, quantidade: item.quantidade, preco: eq?.price ?? 0, bloco: b.categoria };
    }),
  );

  // Aggregate quantities per bloco for mão de obra calc
  const blocoQtds = solucao.blocos.map((b) => ({
    categoria: b.categoria,
    quantidade: b.itens.reduce((s, it) => s + it.quantidade, 0),
  }));
  const baseFaixa = monitConfig.maoDeObra[faixa.nome] ?? 250;
  const maoCalc = calcMaoDeObra(baseFaixa, faixa.nome, blocoQtds, maoDeObraConfig);
  const autoMaoDeObra = maoCalc.total;
  const [maoDeObraOverride, setMaoDeObraOverride] = useState<number | null>(
    venda.maoDeObra != null ? venda.maoDeObra : null,
  );
  const maoDeObra = maoDeObraOverride ?? autoMaoDeObra;
  const maoIsOverridden = maoDeObraOverride !== null && maoDeObraOverride !== autoMaoDeObra;

  const subtotalEquip = flatItems.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const totalVenda = subtotalEquip + maoDeObra;
  const subtotalCusto = subtotalEquip * 0.6;
  const parcelaEquip = subtotalCusto / prazo;
  const mensalidadeComodato = parcelaEquip + monitValor;
  // Taxa de adesão = 1ª mensalidade paga na assinatura do contrato (para pagar o técnico)
  // Após 30 dias, cliente paga mensalidade normal
  const taxaAdesao = maoDeObra;
  const custoTotalComodato = taxaAdesao + mensalidadeComodato * prazo;
  const custoTotalVenda = totalVenda + monitValor * prazo;
  const totalItens = flatItems.reduce((s, i) => s + i.quantidade, 0);
  const desconto = monitAjuste !== null && monitAjuste < monitBase ? ((1 - monitAjuste / monitBase) * 100) : 0;

  // Auto-save: sempre que o usuário mexe em modalidade/monitoramento/prazo/mão-de-obra,
  // persiste na venda (evita perda se fechar sem clicar Gerar PDF/Aprovar).
  // Skip on first mount — só dispara quando valores mudam.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    if (approved) return; // venda já aprovada — congela valores
    onUpdateVenda({
      modalidade,
      monitoramentoMensal: monitValor,
      maoDeObra,
      prazoComodato: prazo,
      acrescimoInstalacao: 0,
      valorCrea: 0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidade, monitValor, maoDeObra, prazo]);

  async function handleSaveAndGenerate() {
    await onUpdateVenda({ modalidade, monitoramentoMensal: monitValor, maoDeObra, prazoComodato: prazo, acrescimoInstalacao: 0, valorCrea: 0 });
    onGerarPDF();
  }

  async function handleApprove() {
    await onUpdateVenda({ modalidade, monitoramentoMensal: monitValor, maoDeObra, prazoComodato: prazo, acrescimoInstalacao: 0, valorCrea: 0 });
    onClienteAprovou();
  }

  /* Row helper — touch-friendly */
  const PRow = ({ label, value, color, bold, suffix, detail }: {
    label: string; value: number; color: string; bold?: boolean; suffix?: string; detail?: string;
  }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? 700 : 400, color: bold ? color : theme.muted }}>{label}</span>
        {detail && <div style={{ fontSize: 11, color: theme.muted }}>{detail}</div>}
      </div>
      <span style={{ fontSize: bold ? 20 : 15, fontWeight: bold ? 700 : 500, color, whiteSpace: 'nowrap', marginLeft: 8 }}>
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        {suffix && <span style={{ fontSize: 12, fontWeight: 400 }}>{suffix}</span>}
      </span>
    </div>
  );

  const PDivider = () => <div style={{ borderTop: `1px solid ${theme.border}`, margin: '8px 0' }} />;

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', color: theme.gold, fontSize: 18 }}>Valor da Proposta</h3>

      {/* Modal config mão de obra (ADMIN/GESTOR) */}
      {showMaoDeObraConfigModal && (
        <MaoDeObraConfigModal
          config={maoDeObraConfig}
          faixas={monitConfig.faixas}
          onSave={async (cfg) => {
            onMaoDeObraConfigChange(cfg);
            await saveState(MAO_DE_OBRA_KEY, cfg);
            setShowMaoDeObraConfigModal(false);
          }}
          onClose={() => setShowMaoDeObraConfigModal(false)}
        />
      )}

      {approved && (
        <div style={{ background: theme.success + '15', border: `1px solid ${theme.success}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: theme.success, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <span><strong>Cliente aprovou a proposta!</strong> Prossiga para a etapa de Vistoria/Fotos.</span>
        </div>
      )}

      {/* ──── Resumo da solução (colapsável) ──── */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowEquipDetail(!showEquipDetail)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h4 style={{ margin: 0, fontSize: 13, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Solução Selecionada</h4>
            <MarcaBadge marca={solucao.marca} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: theme.muted }}>{totalItens} itens</span>
            <span style={{ fontWeight: 700, color: theme.gold, fontSize: 14 }}>R$ {fmtCurrency(subtotalEquip)}</span>
            <span style={{ color: theme.muted, fontSize: 16, transition: 'transform 0.2s', transform: showEquipDetail ? 'rotate(180deg)' : 'none' }}>▾</span>
          </div>
        </div>
        {showEquipDetail && (
          <div style={{ display: 'grid', gap: 4, maxHeight: 200, overflowY: 'auto', marginTop: 12, paddingTop: 8, borderTop: `1px solid ${theme.border}` }}>
            {flatItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                <span style={{ color: theme.text }}>{item.quantidade}x {item.nome}</span>
                <span style={{ color: theme.muted }}>R$ {fmtCurrency(item.preco * item.quantidade)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──── Configuração de valores ──── */}
      {!approved && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 14px', fontSize: 13, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Configurar Proposta</h4>

          {/* Modalidade pills */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Modalidade</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([
                { key: 'venda' as const, label: 'Compra', color: theme.gold },
                { key: 'comodato' as const, label: 'Comodato', color: '#5B9BD5' },
                { key: 'ambos' as const, label: 'Comparativo', color: '#C077DB' },
              ]).map(({ key, label, color }) => (
                <button key={key} onClick={() => setModalidade(key)} style={{
                  padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  background: modalidade === key ? color + '18' : 'transparent',
                  border: `2px solid ${modalidade === key ? color : theme.border}`,
                  color: modalidade === key ? color : theme.muted,
                  flex: '1 1 auto', minWidth: 90, textAlign: 'center' as const,
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Monitoramento slider + faixas — stacked for mobile */}
          <div style={{ background: theme.soft, borderRadius: 10, padding: 14, marginBottom: 14, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Faixa de preço */}
            <div>
              <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>Porte do local</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {monitConfig.faixas.map((f, i) => (
                  <button key={f.nome} onClick={() => { setFaixaIdx(i); setMonitAjuste(null); }}
                    style={{
                      padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: faixaIdx === i ? theme.gold + '22' : 'transparent',
                      border: `1px solid ${faixaIdx === i ? theme.gold : theme.border}`,
                      color: faixaIdx === i ? theme.gold : theme.muted,
                    }}>
                    {f.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Monitoramento slider */}
            <div>
              <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>
                Monitoramento: <span style={{ color: theme.gold, fontSize: 18, fontWeight: 700 }}>R$ {monitValor}</span><span style={{ color: theme.muted }}>/mês</span>
                {desconto > 0 && (
                  <span style={{ color: theme.warning, marginLeft: 8, fontSize: 12, fontWeight: 700 }}>
                    -{desconto.toFixed(0)}% desconto
                  </span>
                )}
              </div>
              <input
                type="range"
                min={monitMin} max={monitBase} step={5}
                value={monitValor}
                onChange={(e) => setMonitAjuste(Number(e.target.value))}
                style={{ width: '100%', accentColor: theme.gold, cursor: 'pointer', height: 28 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.muted, marginTop: 2 }}>
                <span>Mín: R$ {monitMin}</span>
                <span>Base: R$ {monitBase}</span>
              </div>
            </div>

            {/* Prazo pills */}
            {(modalidade === 'comodato' || modalidade === 'ambos') && (
              <div>
                <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>Prazo do contrato</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([24, 36, 48] as const).map((p) => (
                    <button key={p} onClick={() => setPrazo(p)}
                      style={{
                        padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                        background: prazo === p ? '#5B9BD5' + '22' : 'transparent',
                        border: `2px solid ${prazo === p ? '#5B9BD5' : theme.border}`,
                        color: prazo === p ? '#5B9BD5' : theme.muted,
                        flex: 1, textAlign: 'center' as const,
                      }}>{p} meses</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ──── Mão de Obra (calculada automaticamente + breakdown) ──── */}
          <div style={{ background: theme.soft, borderRadius: 10, padding: 14, marginBottom: 14, border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>Mão de Obra (Instalação)</div>
                {isAdmin && (
                  <button onClick={() => setShowMaoDeObraConfigModal(true)}
                    style={{ background: 'none', border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: theme.gold }}>
                    Configurar
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: maoIsOverridden ? theme.warning : theme.gold }}>
                  R$ {maoDeObra.toLocaleString('pt-BR')}
                </span>
                {maoIsOverridden && (
                  <button onClick={() => setMaoDeObraOverride(null)}
                    style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, color: theme.muted, padding: '4px 8px' }}>
                    Restaurar
                  </button>
                )}
              </div>
            </div>

            {/* Breakdown visual — colapsável */}
            <div
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}
              onClick={() => setShowMaoDeObraDetail(!showMaoDeObraDetail)}
            >
              <span style={{ fontSize: 12, color: theme.muted }}>
                Base: R$ {baseFaixa}
                {maoCalc.acrescimo > 0 && <> + Acréscimo: R$ {maoCalc.acrescimo}</>}
                {maoCalc.markup > 0 && <> + Equip.: R$ {maoCalc.markup}</>}
              </span>
              <span style={{ color: theme.muted, fontSize: 14, transition: 'transform 0.2s', transform: showMaoDeObraDetail ? 'rotate(180deg)' : 'none' }}>▾</span>
            </div>

            {showMaoDeObraDetail && (
              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: theme.muted }}>
                  <span>Base ({faixa.nome})</span>
                  <span style={{ color: theme.text }}>R$ {baseFaixa}</span>
                </div>
                {maoCalc.acrescimo > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: theme.muted }}>
                    <span>Acréscimo instalação</span>
                    <span style={{ color: theme.text }}>+ R$ {maoCalc.acrescimo}</span>
                  </div>
                )}
                {maoCalc.detalhes.map((d) => (
                  <div key={d.bloco} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: theme.muted }}>
                    <span>{blocoLabels[d.bloco as BlocoCategoria] ?? d.bloco} ({d.qtd}x R${maoDeObraConfig.markupPorBloco[d.bloco] ?? 0})</span>
                    <span style={{ color: theme.text }}>+ R$ {d.valor}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                  <span style={{ color: theme.gold }}>Total calculado</span>
                  <span style={{ color: theme.gold }}>R$ {autoMaoDeObra}</span>
                </div>

                {/* Manual override input */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: theme.muted }}>Ajustar:</span>
                  <input
                    type="number"
                    value={maoDeObra}
                    onChange={(e) => setMaoDeObraOverride(Number(e.target.value))}
                    style={{ ...inputStyle, width: 130, marginBottom: 0, textAlign: 'right' as const, fontSize: 15, padding: '10px 12px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── Painéis de comparação ──── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {/* Panel: COMPRA */}
        {(modalidade === 'venda' || modalidade === 'ambos') && (
          <div style={{
            background: theme.soft, borderRadius: 12, padding: 16,
            border: `2px solid ${modalidade === 'venda' ? theme.gold : theme.border}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.gold, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Compra (à vista)
            </div>
            <PRow label="Equipamentos" value={subtotalEquip} color={theme.text} />
            <PRow label={`Mão de Obra (${faixa.nome})`} value={maoDeObra} color={theme.text} />
            {maoCalc.acrescimo > 0 && <PRow label="Acréscimo Instalação" value={maoCalc.acrescimo} color={theme.text} detail="Incluso na mão de obra" />}
            <PDivider />
            <PRow label="Investimento Total" value={totalVenda} color={theme.gold} bold />
            <div style={{ height: 8 }} />
            <PRow label="Monitoramento" value={monitValor} color={theme.muted} suffix="/mês" />
            {modalidade === 'ambos' && (
              <>
                <PDivider />
                <PRow label={`Custo total em ${prazo} meses`} value={custoTotalVenda} color={theme.warning} bold />
              </>
            )}
          </div>
        )}

        {/* Panel: COMODATO */}
        {(modalidade === 'comodato' || modalidade === 'ambos') && (
          <div style={{
            background: theme.soft, borderRadius: 12, padding: 16,
            border: `2px solid ${modalidade === 'comodato' ? '#5B9BD5' : '#5B9BD544'}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5B9BD5', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Comodato ({prazo} meses)
            </div>
            <PRow label="Parcela Equipamento" value={parcelaEquip} color={theme.text} suffix="/mês"
              detail={`R$ ${subtotalCusto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ÷ ${prazo}`} />
            <PRow label="Monitoramento" value={monitValor} color={theme.text} suffix="/mês" />
            <PDivider />
            <PRow label="Mensalidade Total" value={mensalidadeComodato} color="#5B9BD5" bold suffix="/mês" />
            <div style={{ height: 8 }} />
            <PRow label="Taxa de Adesão (na assinatura)" value={taxaAdesao} color={theme.gold} bold
              detail="Paga no início — cobre instalação do técnico" />
            <PRow label={`Mensalidades (${prazo}× após 30 dias)`} value={mensalidadeComodato} color={theme.muted} suffix="/mês" />
            <PDivider />
            <PRow label={`Custo total em ${prazo} meses`} value={custoTotalComodato} color={theme.warning} bold />

            {/* Economia badge */}
            {modalidade === 'ambos' && custoTotalVenda > custoTotalComodato ? (
              <div style={{ marginTop: 10, padding: '8px 12px', background: theme.success + '15', borderRadius: 8, fontSize: 12, color: theme.success, textAlign: 'center', fontWeight: 600 }}>
                Economia de R$ {(custoTotalVenda - custoTotalComodato).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} vs Compra
              </div>
            ) : modalidade === 'ambos' && custoTotalComodato > custoTotalVenda ? (
              <div style={{ marginTop: 10, padding: '8px 12px', background: theme.danger + '15', borderRadius: 8, fontSize: 12, color: theme.danger, textAlign: 'center', fontWeight: 600 }}>
                R$ {(custoTotalComodato - custoTotalVenda).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} a mais que Compra
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ──── Ações ──── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
        <button onClick={handleSaveAndGenerate} style={{ ...btnGold, padding: '14px 20px', fontSize: 15, fontWeight: 700, borderRadius: 12, width: '100%', textAlign: 'center' as const }}>
          Gerar PDF da Proposta
        </button>
        {!approved && canEdit && (
          <button onClick={handleApprove} style={{ ...btnGold, background: theme.success, padding: '14px 20px', fontSize: 15, fontWeight: 700, borderRadius: 12, width: '100%', textAlign: 'center' as const }}>
            Cliente Aprovou
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Modal: Configuração de Mão de Obra (ADMIN/GESTOR)
   ================================================================ */

function MaoDeObraConfigModal({ config, faixas, onSave, onClose }: {
  config: MaoDeObraConfig;
  faixas: FaixaMonitoramento[];
  onSave: (cfg: MaoDeObraConfig) => void | Promise<void>;
  onClose: () => void;
}) {
  const [markups, setMarkups] = useState<Record<string, number>>(() => ({ ...config.markupPorBloco }));
  const [acrescimos, setAcrescimos] = useState<Record<string, number>>(() => ({ ...config.acrescimoPorFaixa }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Configurar Mão de Obra</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16, lineHeight: 1.5 }}>
          O total da mão de obra é calculado: <strong style={{ color: theme.text }}>Base do porte + Acréscimo do porte + Markup por equipamento</strong>.
        </p>

        {/* Acréscimo fixo por porte */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Acréscimo de Instalação por Porte</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {faixas.map((f) => (
              <div key={f.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 13, color: theme.text }}>{f.nome}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: theme.muted }}>R$</span>
                  <input
                    type="number"
                    value={acrescimos[f.nome] ?? 0}
                    onChange={(e) => setAcrescimos((prev) => ({ ...prev, [f.nome]: Number(e.target.value) }))}
                    style={{ ...inputStyle, width: 90, marginBottom: 0, textAlign: 'right' as const }}
                    min={0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Markup por tipo de equipamento */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Markup por Equipamento (R$/unidade)</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {allBlocos.map((bloco) => (
              <div key={bloco} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 13, color: theme.text }}>{blocoLabels[bloco]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: theme.muted }}>R$</span>
                  <input
                    type="number"
                    value={markups[bloco] ?? 0}
                    onChange={(e) => setMarkups((prev) => ({ ...prev, [bloco]: Number(e.target.value) }))}
                    style={{ ...inputStyle, width: 80, marginBottom: 0, textAlign: 'right' as const }}
                    min={0}
                  />
                  <span style={{ fontSize: 11, color: theme.muted }}>/un.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.muted, cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
          <button onClick={() => onSave({ markupPorBloco: markups, acrescimoPorFaixa: acrescimos })} style={btnGold}>
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Step 4: Vistoria/Fotos — with camera capture
   ================================================================ */

function StepVistoria({ vistoria, onAddAmbiente, onUpdateAmbiente, onRemoveAmbiente, onConcluir, onPhotoAdded, onPontoAdded, canEdit, titulo, descricao, annotate = true }: {
  vistoria: Vistoria | null;
  onAddAmbiente: (nome: string) => void;
  onUpdateAmbiente: (ambId: string, amb: AmbienteVistoria) => void;
  onRemoveAmbiente: (ambId: string) => void;
  onConcluir: () => void;
  onPhotoAdded: (ambienteNome: string) => void;
  onPontoAdded: (ambienteNome: string, tipo: string) => void;
  canEdit: boolean;
  titulo?: string;
  descricao?: string;
  /** When true (default), photos go through PhotoAnnotator so the user can
   *  mark an "X" at the exact installation spot before saving. */
  annotate?: boolean;
}) {
  const [novoAmbiente, setNovoAmbiente] = useState('');
  const [expandedAmbId, setExpandedAmbId] = useState<string | null>(null);
  const [cameraAmbId, setCameraAmbId] = useState<string | null>(null);
  const [cameraPontoId, setCameraPontoId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; ambNome: string; pontoType: string } | null>(null);
  // Pending photo awaiting installation-point marking (opens PhotoAnnotator)
  const [pendingAnnotate, setPendingAnnotate] = useState<{ ambId: string; pontoId: string; src: string } | null>(null);

  const ambientes = vistoria?.ambientes ?? [];
  const isConcluida = vistoria?.status === 'concluida';
  const totalPhotos = ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0);
  const totalPontos = ambientes.reduce((s, a) => s + a.pontos.length, 0);

  // Suggested environment names
  const suggestedAmbientes = ['Fachada', 'Recepção', 'Estoque', 'Corredor', 'Garagem', 'Escritório', 'Área externa', 'Portaria'];

  function handleAddAmbiente() {
    if (!novoAmbiente.trim()) return;
    onAddAmbiente(novoAmbiente.trim());
    setNovoAmbiente('');
  }

  function handleAddPonto(ambId: string) {
    const amb = ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    const newPonto: InstallationPoint = {
      id: 'PT' + Date.now(), environment: amb.nome, type: '', note: '',
      status: 'Pendente', photos: [],
    };
    onUpdateAmbiente(ambId, { ...amb, pontos: [...amb.pontos, newPonto] });
  }

  function handleUpdatePonto(ambId: string, pontoId: string, updated: InstallationPoint) {
    const amb = ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    onUpdateAmbiente(ambId, { ...amb, pontos: amb.pontos.map((p) => p.id === pontoId ? updated : p) });
  }

  function handleRemovePonto(ambId: string, pontoId: string) {
    const amb = ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    onUpdateAmbiente(ambId, { ...amb, pontos: amb.pontos.filter((p) => p.id !== pontoId) });
  }

  async function handleAddPhotoFromFile(ambId: string, pontoId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Process each file sequentially through the annotator so the user can
    // mark the installation spot on every photo.
    if (annotate) {
      // Only the first file enters the annotator; additional files would need
      // a queue UI. For now we accept one-at-a-time when marking is required.
      const base64 = await compressImage(files[0]);
      setPendingAnnotate({ ambId, pontoId, src: base64 });
    } else {
      const amb = ambientes.find((a) => a.id === ambId);
      if (!amb) return;
      const ponto = amb.pontos.find((p) => p.id === pontoId);
      if (!ponto) return;
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await compressImage(files[i]);
        const token = vistoria
          ? await uploadBase64Photo(base64, { entityType: 'vistoria', entityId: vistoria.id, pontoId })
          : base64;
        newPhotos.push(token);
      }
      handleUpdatePonto(ambId, pontoId, { ...ponto, photos: [...ponto.photos, ...newPhotos] });
      onPhotoAdded(amb.nome);
    }
    e.target.value = '';
  }

  function handleRemovePhoto(ambId: string, pontoId: string, photoIndex: number) {
    const amb = ambientes.find((a) => a.id === ambId);
    if (!amb) return;
    const ponto = amb.pontos.find((p) => p.id === pontoId);
    if (!ponto) return;
    handleUpdatePonto(ambId, pontoId, { ...ponto, photos: ponto.photos.filter((_, i) => i !== photoIndex) });
  }

  function openCamera(ambId: string, pontoId: string) {
    setCameraAmbId(ambId);
    setCameraPontoId(pontoId);
  }

  async function handleCameraCapture(base64: string) {
    if (!cameraAmbId || !cameraPontoId) return;
    if (annotate) {
      // Close the camera and open the annotator for this photo
      setPendingAnnotate({ ambId: cameraAmbId, pontoId: cameraPontoId, src: base64 });
      setCameraAmbId(null);
      setCameraPontoId(null);
      return;
    }
    const amb = ambientes.find((a) => a.id === cameraAmbId);
    if (!amb) return;
    const ponto = amb.pontos.find((p) => p.id === cameraPontoId);
    if (!ponto) return;
    const token = vistoria
      ? await uploadBase64Photo(base64, { entityType: 'vistoria', entityId: vistoria.id, pontoId: cameraPontoId })
      : base64;
    handleUpdatePonto(cameraAmbId, cameraPontoId, { ...ponto, photos: [...ponto.photos, token] });
    onPhotoAdded(amb.nome);
    setCameraAmbId(null);
    setCameraPontoId(null);
  }

  async function handleAnnotatorSave(annotated: string) {
    if (!pendingAnnotate) return;
    const { ambId, pontoId } = pendingAnnotate;
    const amb = ambientes.find((a) => a.id === ambId);
    if (!amb) { setPendingAnnotate(null); return; }
    const ponto = amb.pontos.find((p) => p.id === pontoId);
    if (!ponto) { setPendingAnnotate(null); return; }
    const token = vistoria
      ? await uploadBase64Photo(annotated, { entityType: 'vistoria', entityId: vistoria.id, pontoId })
      : annotated;
    handleUpdatePonto(ambId, pontoId, { ...ponto, photos: [...ponto.photos, token] });
    onPhotoAdded(amb.nome);
    setPendingAnnotate(null);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Camera modal */}
      {cameraAmbId && cameraPontoId && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => { setCameraAmbId(null); setCameraPontoId(null); }}
        />
      )}

      {/* Photo annotator — place X on installation spot */}
      {pendingAnnotate && (
        <PhotoAnnotator
          src={pendingAnnotate.src}
          onSave={handleAnnotatorSave}
          onCancel={() => setPendingAnnotate(null)}
        />
      )}

      {/* Photo preview modal */}
      {photoPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setPhotoPreview(null)}>
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
            <img src={photoSrc(photoPreview.src)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12 }} />
            <div style={{ textAlign: 'center', marginTop: 8, color: theme.text, fontSize: 13 }}>
              {photoPreview.ambNome} — {photoPreview.pontoType || 'Ponto'}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>{titulo ?? 'Vistoria do Local'}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {vistoria && <StatusBadge value={vistoria.status} />}
          <span style={{ fontSize: 12, color: theme.muted }}>{ambientes.length} amb. · {totalPontos} pontos · {totalPhotos} fotos</span>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: '#C077DB15', border: '1px solid #C077DB33', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#C077DB', lineHeight: 1.6 }}>
        {descricao ?? (<><strong>Marcação de Pontos:</strong> Adicione ambientes do local, marque os pontos de instalação em cada um e tire fotos para facilitar o trabalho do técnico. Você pode usar a câmera do celular ou fazer upload de fotos.</>)}
      </div>

      {isConcluida && (
        <div style={{ background: theme.success + '15', border: `1px solid ${theme.success}44`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: theme.success }}>
          Vistoria concluída.
        </div>
      )}

      {/* Add ambiente */}
      {canEdit && !isConcluida && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input value={novoAmbiente} onChange={(e) => setNovoAmbiente(e.target.value)}
              placeholder="Nome do ambiente (ex: Fachada, Recepção...)"
              style={{ ...inputStyle, flex: '1 1 200px', marginBottom: 0 }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddAmbiente(); }}
            />
            <button onClick={handleAddAmbiente} style={{ ...btnGold, minHeight: 44, flex: '0 0 auto' }} disabled={!novoAmbiente.trim()}>+ Ambiente</button>
          </div>
          {/* Quick-add suggestions */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestedAmbientes
              .filter((s) => !ambientes.some((a) => a.nome === s))
              .map((sugg) => (
                <button key={sugg} onClick={() => onAddAmbiente(sugg)} style={{
                  background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8,
                  padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: theme.muted, minHeight: 36,
                }}>
                  + {sugg}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Ambientes list */}
      <div style={{ display: 'grid', gap: 10 }}>
        {ambientes.map((amb) => {
          const isExpanded = expandedAmbId === amb.id;
          const ambPhotos = amb.pontos.reduce((s, p) => s + p.photos.length, 0);

          return (
            <div key={amb.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Header */}
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

              {/* Expanded */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${theme.border}` }}>
                  {amb.pontos.map((ponto) => (
                    <div key={ponto.id} style={{ background: theme.soft, borderRadius: 8, padding: 10, marginTop: 10, border: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <input placeholder="Tipo (ex: Câmera Dome, Sensor PIR)" value={ponto.type}
                          onChange={(e) => {
                            handleUpdatePonto(amb.id, ponto.id, { ...ponto, type: e.target.value });
                            if (e.target.value && !ponto.type) onPontoAdded(amb.nome, e.target.value);
                          }}
                          disabled={isConcluida}
                          style={{ ...inputStyle, flex: 1, marginBottom: 0, fontSize: 12, minWidth: 180 }}
                        />
                        {canEdit && !isConcluida && (
                          <button onClick={() => handleRemovePonto(amb.id, ponto.id)}
                            style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>
                            x
                          </button>
                        )}
                      </div>
                      <input placeholder="Observação (ex: altura 3m, parede lateral)"
                        value={ponto.note}
                        onChange={(e) => handleUpdatePonto(amb.id, ponto.id, { ...ponto, note: e.target.value })}
                        disabled={isConcluida}
                        style={{ ...inputStyle, marginBottom: 6, fontSize: 12 }}
                      />

                      {/* Photos grid */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {ponto.photos.map((photo, pi) => (
                          <div key={pi} style={{ position: 'relative' }}>
                            <img src={photoSrc(photo)} width={80} height={60} alt={`Foto ${pi + 1}`}
                              style={{ borderRadius: 6, objectFit: 'cover', border: `1px solid ${theme.border}`, cursor: 'pointer' }}
                              onClick={() => setPhotoPreview({ src: photo, ambNome: amb.nome, pontoType: ponto.type })}
                            />
                            {canEdit && !isConcluida && (
                              <button onClick={() => handleRemovePhoto(amb.id, ponto.id, pi)}
                                style={{
                                  position: 'absolute', top: -4, right: -4, width: 18, height: 18,
                                  borderRadius: '50%', background: theme.danger, border: 'none',
                                  color: '#fff', fontSize: 10, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                x
                              </button>
                            )}
                            <div style={{ textAlign: 'center', fontSize: 9, color: theme.muted, marginTop: 2 }}>
                              #{pi + 1}
                            </div>
                          </div>
                        ))}
                        {canEdit && !isConcluida && (
                          <>
                            {/* Camera button */}
                            <button onClick={() => openCamera(amb.id, ponto.id)}
                              style={{
                                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                background: '#C077DB22', border: `1px solid #C077DB44`, borderRadius: 8,
                                padding: '8px 12px', cursor: 'pointer', color: '#C077DB', fontSize: 11, fontWeight: 600,
                              }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                              Câmera
                            </button>
                            {/* File upload */}
                            <label style={{
                              display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                              background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 8,
                              padding: '8px 12px', cursor: 'pointer', color: theme.muted, fontSize: 11, fontWeight: 600,
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              Upload
                              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                onChange={(e) => handleAddPhotoFromFile(amb.id, ponto.id, e)} />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {canEdit && !isConcluida && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <button onClick={() => handleAddPonto(amb.id)} style={{ ...btnGold, fontSize: 13, flex: '1 1 140px', minHeight: 44 }}>+ Ponto</button>
                      <button onClick={() => onRemoveAmbiente(amb.id)} style={{ ...btnSoft, fontSize: 13, color: theme.danger, borderColor: theme.danger, flex: '1 1 140px', minHeight: 44 }}>Remover ambiente</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Concluir */}
      {canEdit && !isConcluida && ambientes.length > 0 && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onConcluir} style={{ ...btnGold, background: theme.success, padding: '14px 20px', fontSize: 15, fontWeight: 700, borderRadius: 12, width: '100%' }}>Concluir Vistoria →</button>
          <span style={{ fontSize: 12, color: theme.muted, textAlign: 'center' }}>Requer pelo menos 1 ambiente com 1 foto</span>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Camera Modal — Native device camera via getUserMedia
   ================================================================ */

function CameraModal({ onCapture, onClose }: { onCapture: (base64: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      // Secure context check: getUserMedia only works on https:// or localhost
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setError(
          'Acesso à câmera requer HTTPS. Abra a página em https:// ou acesse pelo computador via localhost. Enquanto isso, use "Upload de arquivo" para enviar fotos da galeria.'
        );
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Seu navegador não suporta acesso direto à câmera. Use "Upload de arquivo" para enviar fotos.');
        return;
      }

      // Try back camera first (mobile), fallback to any camera (desktop/laptop webcam)
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false },
        { video: { width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false },
        { video: true, audio: false },
      ];

      let lastErr: unknown = null;
      for (const constraints of attempts) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (!active) { mediaStream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            try { await videoRef.current.play(); } catch { /* autoplay handled by attribute */ }
          }
          setReady(true);
          return;
        } catch (err) {
          lastErr = err;
        }
      }

      // All attempts failed — translate the real error
      if (!active) return;
      const e = lastErr as { name?: string; message?: string } | null;
      const name = e?.name ?? '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Permissão de câmera negada. Clique no ícone de cadeado na barra do navegador → Permissões → Câmera → Permitir, e recarregue a página.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo. Use "Upload de arquivo" para enviar fotos.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('A câmera está em uso por outro aplicativo (ex: Zoom, Meet, Teams). Feche-o e tente novamente.');
      } else if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
        setError('A câmera não suporta as configurações solicitadas. Use "Upload de arquivo" para enviar fotos.');
      } else if (name === 'SecurityError' || name === 'NotSupportedError') {
        setError('Acesso à câmera bloqueado por segurança. Certifique-se de estar em HTTPS ou localhost.');
      } else {
        setError(`Não foi possível acessar a câmera${name ? ` (${name})` : ''}. Use "Upload de arquivo" como alternativa.`);
      }
    }

    startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Compress
    let w = canvas.width;
    let h = canvas.height;
    if (w > 1200) { h = Math.round((h * 1200) / w); w = 1200; }
    const compCanvas = document.createElement('canvas');
    compCanvas.width = w;
    compCanvas.height = h;
    const compCtx = compCanvas.getContext('2d');
    if (compCtx) {
      compCtx.drawImage(canvas, 0, 0, w, h);
      setCaptured(compCanvas.toDataURL('image/jpeg', 0.75));
    }
  }

  function confirm() {
    if (captured) {
      onCapture(captured);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function retake() {
    setCaptured(null);
  }

  function handleClose() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Câmera</h3>
          <button onClick={handleClose} style={{ ...btnSoft, fontSize: 12, padding: '4px 12px' }}>Fechar</button>
        </div>

        {error ? (
          <div style={{ background: theme.danger + '15', border: `1px solid ${theme.danger}44`, borderRadius: 12, padding: 20, color: theme.danger, fontSize: 13, textAlign: 'center' }}>
            {error}
          </div>
        ) : captured ? (
          <div>
            <img src={captured} alt="Capturada" style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={retake} style={btnSoft}>Tirar outra</button>
              <button onClick={confirm} style={btnGold}>Usar esta foto</button>
            </div>
          </div>
        ) : (
          <div>
            {!ready && (
              <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', padding: 12 }}>
                Iniciando câmera...
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: '100%', borderRadius: 12, marginBottom: 12, background: '#000', display: ready ? 'block' : 'none' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {ready && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={takePhoto} style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: theme.gold, border: `4px solid ${theme.text}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: theme.gold, border: `2px solid #111` }} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Referência visual da 1ª Visita (read-only, usado na Entrega)
   ================================================================ */

function VistoriaReference({ vistoria }: { vistoria: Vistoria }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; ambiente: string; ponto: string } | null>(null);

  const totalPhotos = vistoria.ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0);
  const totalPontos = vistoria.ambientes.reduce((s, a) => s + a.pontos.length, 0);

  return (
    <>
      <div style={{ background: '#C077DB12', border: '1px solid #C077DB33', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C077DB' }}>Referência da 1ª Visita</div>
              <div style={{ fontSize: 11, color: theme.muted }}>{vistoria.ambientes.length} amb. · {totalPontos} pontos · {totalPhotos} fotos com marcação</div>
            </div>
          </div>
          <span style={{ color: theme.muted, fontSize: 16 }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {expanded && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #C077DB22' }}>
            <div style={{ fontSize: 11, color: theme.muted, padding: '8px 0 12px', lineHeight: 1.5 }}>
              Fotos da vistoria com os pontos marcados (X vermelho). Use como referência para verificar se a instalação foi feita nos locais corretos.
            </div>

            {vistoria.ambientes.map((amb) => {
              const ambPhotos = amb.pontos.reduce((s, p) => s + p.photos.length, 0);
              if (ambPhotos === 0) return null;

              return (
                <div key={amb.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {amb.nome}
                    <span style={{ fontSize: 11, color: theme.muted, fontWeight: 400 }}>{amb.pontos.length} pontos</span>
                  </div>

                  {amb.pontos.map((ponto) => {
                    if (ponto.photos.length === 0) return null;
                    return (
                      <div key={ponto.id} style={{ background: theme.soft, borderRadius: 8, padding: 10, marginBottom: 6, border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: 12, color: theme.text, marginBottom: 6 }}>
                          <strong>{ponto.type || 'Ponto'}</strong>
                          {ponto.note && <span style={{ color: theme.muted }}> — {ponto.note}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {ponto.photos.map((photo, pi) => (
                            <div key={pi} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedPhoto({ src: photo, ambiente: amb.nome, ponto: ponto.type || 'Ponto' })}>
                              <img src={photoSrc(photo)} width={90} height={68} alt={`1ª Visita - ${amb.nome} - ${pi + 1}`}
                                style={{ borderRadius: 6, objectFit: 'cover', border: '2px solid #C077DB44' }} />
                              <div style={{ position: 'absolute', top: 2, right: 2, background: '#C077DBcc', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: '#fff', fontWeight: 700 }}>1ª</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal fullscreen para ver foto ampliada */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 16, cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 13, color: '#C077DB', marginBottom: 8, fontWeight: 600 }}>
            1ª Visita — {selectedPhoto.ambiente} — {selectedPhoto.ponto}
          </div>
          <img src={photoSrc(selectedPhoto.src)} alt="Foto ampliada" style={{ maxWidth: '95vw', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }} />
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 10 }}>Toque para fechar</div>
        </div>
      )}
    </>
  );
}

/* ================================================================
   Step 5: Entrega (2ª Visita) — conferência lado a lado da vistoria
   ================================================================ */

function StepEntrega({ venda, vistoria, entregaVistoria, ordem, onIniciarInstalacao, onConcluirEntrega, onUpdatePonto, onPhotoAdded, canEdit }: {
  venda: VendaLocal;
  vistoria: Vistoria | null;
  entregaVistoria: Vistoria | null;
  ordem: OrdemDeServico | null;
  onIniciarInstalacao: () => void;
  onConcluirEntrega: () => void;
  onUpdatePonto: (ambId: string, pontoId: string, updated: InstallationPoint) => void;
  onPhotoAdded: (ambienteNome: string) => void;
  canEdit: boolean;
}) {
  const isInstalando = venda.status === 'em_instalacao' || venda.status === 'entrega';
  const entregaConcluida = venda.visita2Concluida === true;

  const [expandedAmbId, setExpandedAmbId] = useState<string | null>(null);

  // Estrutura (ambientes/pontos) vem SEMPRE da vistoria (1ª visita).
  // Fotos de conferência ficam no entregaVistoria espelho.
  const vistoriaAmbientes = vistoria?.ambientes ?? [];
  const totalPontos = vistoriaAmbientes.reduce((s, a) => s + a.pontos.length, 0);
  const entregaPontosComFoto = (entregaVistoria?.ambientes ?? []).reduce(
    (s, a) => s + a.pontos.filter((p) => p.photos.length > 0).length, 0,
  );

  function getEntregaPonto(ambId: string, pontoId: string): InstallationPoint | null {
    const amb = entregaVistoria?.ambientes.find((a) => a.id === ambId);
    return amb?.pontos.find((p) => p.id === pontoId) ?? null;
  }

  async function handleAddPhotoFromFile(ambId: string, pontoId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !entregaVistoria) return;
    const ponto = getEntregaPonto(ambId, pontoId);
    if (!ponto) return;
    const amb = entregaVistoria.ambientes.find((a) => a.id === ambId);
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const base64 = await compressImage(files[i]);
      const token = await uploadBase64Photo(base64, { entityType: 'entrega', entityId: entregaVistoria.id, pontoId });
      newPhotos.push(token);
    }
    onUpdatePonto(ambId, pontoId, { ...ponto, photos: [...ponto.photos, ...newPhotos] });
    if (amb) onPhotoAdded(amb.nome);
    e.target.value = '';
  }

  function handleRemovePhoto(ambId: string, pontoId: string, photoIdx: number) {
    const ponto = getEntregaPonto(ambId, pontoId);
    if (!ponto) return;
    onUpdatePonto(ambId, pontoId, { ...ponto, photos: ponto.photos.filter((_, i) => i !== photoIdx) });
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, color: theme.gold, fontSize: 16 }}>Entrega — 2ª Visita</h3>
        <span style={{ fontSize: 12, color: theme.muted }}>{entregaPontosComFoto}/{totalPontos} pontos conferidos</span>
      </div>

      {/* Timeline visual */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* 1ª Visita - done */}
        <div style={{ flex: '1 1 100px', minWidth: 100, background: theme.success + '15', border: `1px solid ${theme.success}44`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>✓</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.success }}>1ª Visita</div>
          <div style={{ fontSize: 10, color: theme.muted }}>Pontos marcados</div>
        </div>
        {/* Instalação */}
        <div style={{ flex: '1 1 100px', minWidth: 100, background: (isInstalando ? '#FF9800' : theme.muted) + '15', border: `1px solid ${(isInstalando ? '#FF9800' : theme.border)}44`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{isInstalando ? '⚡' : '○'}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: isInstalando ? '#FF9800' : theme.muted }}>Instalação</div>
          <div style={{ fontSize: 10, color: theme.muted }}>Equipe técnica</div>
        </div>
        {/* 2ª Visita */}
        <div style={{ flex: '1 1 100px', minWidth: 100, background: (entregaConcluida ? theme.success : '#43C17B') + '15', border: `1px solid ${(entregaConcluida ? theme.success : '#43C17B')}44`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{entregaConcluida ? '✓' : '◎'}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: entregaConcluida ? theme.success : '#43C17B' }}>2ª Visita</div>
          <div style={{ fontSize: 10, color: theme.muted }}>Entrega ao cliente</div>
        </div>
      </div>

      {/* OS info */}
      {ordem && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: theme.muted }}>Ordem de Serviço: <strong style={{ color: theme.text }}>{ordem.id}</strong></span>
            <StatusBadge value={ordem.status} />
          </div>
        </div>
      )}

      {entregaConcluida && (
        <div style={{ background: theme.success + '15', border: `1px solid ${theme.success}44`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: theme.success }}>
          Entrega concluída! Serviço finalizado.
        </div>
      )}

      {/* Entrega instructions */}
      {!entregaConcluida && (
        <div style={{ background: '#43C17B15', border: '1px solid #43C17B33', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#43C17B', lineHeight: 1.6 }}>
          <strong>Conferência da instalação:</strong> para cada ponto marcado na 1ª visita, tire uma foto comprovando
          que o equipamento foi instalado exatamente onde você indicou com o X vermelho. Os ambientes e pontos são os mesmos da vistoria.
        </div>
      )}

      {/* Aviso quando não há vistoria */}
      {(!vistoria || vistoriaAmbientes.length === 0) && (
        <div style={{ background: theme.warning + '15', border: `1px solid ${theme.warning}44`, borderRadius: 10, padding: 14, fontSize: 13, color: theme.warning, textAlign: 'center' }}>
          Faça a 1ª visita primeiro — a conferência se baseia nos pontos marcados lá.
        </div>
      )}

      {/* Lista de ambientes/pontos espelhando a vistoria, lado-a-lado */}
      <div style={{ display: 'grid', gap: 10 }}>
        {vistoriaAmbientes.map((vAmb) => {
          const isExpanded = expandedAmbId === vAmb.id;
          const entregaAmb = entregaVistoria?.ambientes.find((a) => a.id === vAmb.id);
          const pontosComFoto = (entregaAmb?.pontos ?? []).filter((p) => p.photos.length > 0).length;
          const totalAmb = vAmb.pontos.length;
          const allOk = totalAmb > 0 && pontosComFoto === totalAmb;

          return (
            <div key={vAmb.id} style={{ background: theme.panel, border: `1px solid ${allOk ? theme.success + '66' : theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div onClick={() => setExpandedAmbId(isExpanded ? null : vAmb.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{allOk ? '✓' : '◎'}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{vAmb.nome}</span>
                  <span style={{ fontSize: 12, color: allOk ? theme.success : theme.muted }}>
                    {pontosComFoto}/{totalAmb} pontos
                  </span>
                </div>
                <span style={{ color: theme.muted, fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
              </div>
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${theme.border}` }}>
                  {vAmb.pontos.length === 0 && (
                    <div style={{ fontSize: 12, color: theme.muted, padding: 12, textAlign: 'center' }}>
                      Nenhum ponto marcado na 1ª visita para este ambiente.
                    </div>
                  )}
                  {vAmb.pontos.map((vPonto) => {
                    const entregaPonto = getEntregaPonto(vAmb.id, vPonto.id);
                    const entregaPhotos = entregaPonto?.photos ?? [];
                    const hasConf = entregaPhotos.length > 0;
                    return (
                      <div key={vPonto.id} style={{ background: theme.soft, borderRadius: 8, padding: 10, marginTop: 10, border: `1px solid ${hasConf ? theme.success + '66' : theme.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{vPonto.type || 'Ponto'}</span>
                          {vPonto.note && <span style={{ fontSize: 11, color: theme.muted }}>· {vPonto.note}</span>}
                          <span style={{
                            marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 10,
                            background: hasConf ? theme.success + '22' : theme.warning + '22',
                            color: hasConf ? theme.success : theme.warning, fontWeight: 600,
                          }}>
                            {hasConf ? 'Conferido' : 'Pendente'}
                          </span>
                        </div>

                        {/* Side-by-side: vistoria (com X) vs entrega */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {/* Coluna 1ª Visita */}
                          <div>
                            <div style={{ fontSize: 10, color: '#C077DB', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>1ª Visita (marcação)</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {vPonto.photos.length === 0 && (
                                <span style={{ fontSize: 11, color: theme.muted, fontStyle: 'italic' }}>Sem foto na 1ª visita</span>
                              )}
                              {vPonto.photos.map((photo, pi) => (
                                <img key={pi} src={photoSrc(photo)} width={100} height={75} alt={`Marcação ${pi + 1}`}
                                  style={{ borderRadius: 6, objectFit: 'cover', border: '1px solid #C077DB66' }} />
                              ))}
                            </div>
                          </div>

                          {/* Coluna 2ª Visita */}
                          <div>
                            <div style={{ fontSize: 10, color: '#43C17B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>2ª Visita (conferência)</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                              {entregaPhotos.map((photo, pi) => (
                                <div key={pi} style={{ position: 'relative' }}>
                                  <img src={photoSrc(photo)} width={100} height={75} alt={`Conferência ${pi + 1}`}
                                    style={{ borderRadius: 6, objectFit: 'cover', border: '1px solid #43C17B66' }} />
                                  {canEdit && !entregaConcluida && (
                                    <button onClick={() => handleRemovePhoto(vAmb.id, vPonto.id, pi)}
                                      style={{
                                        position: 'absolute', top: -4, right: -4, width: 18, height: 18,
                                        borderRadius: '50%', background: theme.danger, border: 'none',
                                        color: '#fff', fontSize: 10, cursor: 'pointer',
                                      }}>x</button>
                                  )}
                                </div>
                              ))}
                              {canEdit && !entregaConcluida && (
                                <label style={{
                                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                  background: '#43C17B22', border: '1px solid #43C17B44', borderRadius: 8,
                                  padding: '8px 10px', cursor: 'pointer', color: '#43C17B', fontSize: 10, fontWeight: 600,
                                  minHeight: 75, justifyContent: 'center',
                                }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                  </svg>
                                  + Foto
                                  <input type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }}
                                    onChange={(e) => handleAddPhotoFromFile(vAmb.id, vPonto.id, e)} />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Concluir entrega */}
      {canEdit && !entregaConcluida && totalPontos > 0 && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onConcluirEntrega}
            disabled={entregaPontosComFoto < totalPontos}
            style={{ ...btnGold, background: theme.success, padding: '14px 20px', fontSize: 15, fontWeight: 700, borderRadius: 12, width: '100%', opacity: entregaPontosComFoto < totalPontos ? 0.5 : 1, cursor: entregaPontosComFoto < totalPontos ? 'not-allowed' : 'pointer' }}>
            Concluir Entrega — Finalizar Venda
          </button>
          <span style={{ fontSize: 12, color: theme.muted, textAlign: 'center' }}>
            {entregaPontosComFoto < totalPontos
              ? `Falta conferir ${totalPontos - entregaPontosComFoto} de ${totalPontos} pontos`
              : `Todos os ${totalPontos} pontos conferidos`}
          </span>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Step 6: Resumo Final — everything together + timeline
   ================================================================ */

function StepResumoFinal({ venda, solucao, vistoria, entregaVistoria, ordem, equipments, logs }: {
  venda: VendaLocal;
  solucao: SolucaoTecnica | null;
  vistoria: Vistoria | null;
  entregaVistoria: Vistoria | null;
  ordem: OrdemDeServico | null;
  equipments: Equipment[];
  logs: ActivityLog[];
}) {
  const totalPhotos = vistoria?.ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0) ?? 0;
  const totalEntregaPhotos = entregaVistoria?.ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0) ?? 0;
  const totalPontos = vistoria?.ambientes.reduce((s, a) => s + a.pontos.length, 0) ?? 0;
  const totalItens = solucao?.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0) ?? 0;
  const valorTotal = solucao?.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => { const eq = equipments.find((e) => e.id === i.equipmentId); return ss + (eq?.price ?? 0) * i.quantidade; }, 0), 0) ?? 0;

  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showEntregaPhotos, setShowEntregaPhotos] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Collect all vistoria photos
  const allPhotos = useMemo(() => {
    const photos: { src: string; ambiente: string; ponto: string }[] = [];
    for (const amb of vistoria?.ambientes ?? []) {
      for (const ponto of amb.pontos) {
        for (const photo of ponto.photos) {
          photos.push({ src: photo, ambiente: amb.nome, ponto: ponto.type || 'Ponto' });
        }
      }
    }
    return photos;
  }, [vistoria]);

  // Collect all entrega photos
  const allEntregaPhotos = useMemo(() => {
    const photos: { src: string; ambiente: string; ponto: string }[] = [];
    for (const amb of entregaVistoria?.ambientes ?? []) {
      for (const ponto of amb.pontos) {
        for (const photo of ponto.photos) {
          photos.push({ src: photo, ambiente: amb.nome, ponto: ponto.type || 'Ponto' });
        }
      }
    }
    return photos;
  }, [entregaVistoria]);

  return (
    <div style={{ maxWidth: 700 }}>
      <h3 style={{ margin: '0 0 16px', color: theme.gold, fontSize: 16 }}>Resumo da Venda</h3>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 16 }}>
        {([
          { label: 'Equipamentos', value: String(totalItens), color: theme.gold },
          { label: 'Valor est.', value: `R$ ${fmtCurrency(valorTotal)}`, color: theme.gold },
          { label: 'Ambientes', value: String(vistoria?.ambientes.length ?? 0), color: '#C077DB' },
          { label: 'Pontos', value: String(totalPontos), color: '#5B9BD5' },
          { label: 'Fotos 1ª', value: String(totalPhotos), color: '#C077DB' },
          { label: 'Fotos 2ª', value: String(totalEntregaPhotos), color: theme.success },
        ]).map((kpi) => (
          <div key={kpi.label} style={{
            background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10,
            padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: theme.muted }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Client info */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 13, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cliente</h4>
        <InfoRow label="Nome" value={venda.clienteNome} />
        {venda.clienteEmpresa && <InfoRow label="Empresa" value={venda.clienteEmpresa} />}
        {venda.clienteTelefone && <InfoRow label="Telefone" value={venda.clienteTelefone} />}
        {venda.clienteEndereco && <InfoRow label="Endereço" value={venda.clienteEndereco} />}
        <InfoRow label="Tipo" value={venda.tipoLocal} />
        <InfoRow label="Status" value={STATUS_LABEL[venda.status] ?? venda.status} />
      </div>

      {/* Solução summary */}
      {solucao && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Solução Técnica</h4>
          <InfoRow label="Marca" value={solucao.marca} />
          <InfoRow label="Itens" value={`${totalItens} equipamentos`} />
          <InfoRow label="Valor" value={`R$ ${fmtCurrency(valorTotal)}`} />
          <InfoRow label="Status" value={solucao.status} />
          {solucao.observacaoGeral && <InfoRow label="Obs." value={solucao.observacaoGeral} />}
        </div>
      )}

      {/* 1ª Visita — Fotos da vistoria */}
      {vistoria && vistoria.ambientes.length > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 13, color: '#C077DB', textTransform: 'uppercase', letterSpacing: 0.5 }}>1ª Visita — Vistoria</h4>
            {totalPhotos > 0 && (
              <button onClick={() => setShowAllPhotos(!showAllPhotos)} style={{ ...btnSoft, fontSize: 11, padding: '3px 10px' }}>
                {showAllPhotos ? 'Ocultar fotos' : `Ver todas (${totalPhotos})`}
              </button>
            )}
          </div>
          {vistoria.ambientes.map((amb) => (
            <div key={amb.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{amb.nome}
                <span style={{ fontSize: 11, color: theme.muted, fontWeight: 400, marginLeft: 6 }}>
                  {amb.pontos.length} pontos · {amb.pontos.reduce((s, p) => s + p.photos.length, 0)} fotos
                </span>
              </div>
              {amb.pontos.map((ponto) => (
                <div key={ponto.id} style={{ paddingLeft: 12, fontSize: 12, color: theme.muted, marginBottom: 2 }}>
                  {ponto.type || '(sem tipo)'} {ponto.note && `— ${ponto.note}`}
                  <span style={{ color: '#C077DB', marginLeft: 6 }}>{ponto.photos.length} foto(s)</span>
                </div>
              ))}
            </div>
          ))}

          {showAllPhotos && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
              {allPhotos.map((photo, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <img src={photoSrc(photo.src)} width={100} height={75} alt={`1ª Visita ${i + 1}`}
                    style={{ borderRadius: 6, objectFit: 'cover', border: '2px solid #C077DB44' }} />
                  <div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>{photo.ambiente}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2ª Visita — Fotos da entrega */}
      {entregaVistoria && entregaVistoria.ambientes.length > 0 && totalEntregaPhotos > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 13, color: theme.success, textTransform: 'uppercase', letterSpacing: 0.5 }}>2ª Visita — Instalação</h4>
            <button onClick={() => setShowEntregaPhotos(!showEntregaPhotos)} style={{ ...btnSoft, fontSize: 11, padding: '3px 10px' }}>
              {showEntregaPhotos ? 'Ocultar fotos' : `Ver todas (${totalEntregaPhotos})`}
            </button>
          </div>
          {entregaVistoria.ambientes.map((amb) => {
            const ambPhotos = amb.pontos.reduce((s, p) => s + p.photos.length, 0);
            if (ambPhotos === 0) return null;
            return (
              <div key={amb.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{amb.nome}
                  <span style={{ fontSize: 11, color: theme.muted, fontWeight: 400, marginLeft: 6 }}>
                    {amb.pontos.length} pontos · {ambPhotos} fotos
                  </span>
                </div>
                {amb.pontos.map((ponto) => (
                  <div key={ponto.id} style={{ paddingLeft: 12, fontSize: 12, color: theme.muted, marginBottom: 2 }}>
                    {ponto.type || '(sem tipo)'} {ponto.note && `— ${ponto.note}`}
                    <span style={{ color: theme.success, marginLeft: 6 }}>{ponto.photos.length} foto(s)</span>
                  </div>
                ))}
              </div>
            );
          })}

          {showEntregaPhotos && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
              {allEntregaPhotos.map((photo, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <img src={photoSrc(photo.src)} width={100} height={75} alt={`2ª Visita ${i + 1}`}
                    style={{ borderRadius: 6, objectFit: 'cover', border: '2px solid #43C17B44' }} />
                  <div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>{photo.ambiente}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OS info */}
      {ordem && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ordem de Serviço</h4>
          <InfoRow label="ID" value={ordem.id} />
          <InfoRow label="Status" value={ordem.status.replace('_', ' ')} />
          <InfoRow label="Checklist" value={`${ordem.checklist.filter((c) => c.done).length}/${ordem.checklist.length}`} />
          <InfoRow label="Técnico" value={ordem.tecnicoId || '(aguardando)'} />
        </div>
      )}

      {/* Timeline / Activity Log */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ margin: 0, fontSize: 13, color: theme.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Timeline de Atividades</h4>
          {logs.length > 5 && (
            <button onClick={() => setShowTimeline(!showTimeline)} style={{ ...btnSoft, fontSize: 11, padding: '3px 10px' }}>
              {showTimeline ? 'Mostrar menos' : `Ver todas (${logs.length})`}
            </button>
          )}
        </div>
        {logs.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: 12 }}>Nenhuma atividade registrada.</div>
        ) : (
          <div style={{ display: 'grid', gap: 0 }}>
            {(showTimeline ? logs : logs.slice(0, 5)).map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${theme.border}22` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: LOG_COLORS[log.tipo] ?? theme.muted, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: theme.text }}>{log.descricao}</div>
                  <div style={{ fontSize: 10, color: theme.muted }}>{fmtDateTime(log.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho', solucao_pronta: 'Solução Pronta',
  proposta_gerada: 'Proposta Gerada', cliente_aprovou: 'Cliente Aprovou',
  vistoria: '1ª Visita', em_instalacao: 'Em Instalação',
  entrega: 'Entrega', concluida: 'Concluída',
};

const LOG_COLORS: Record<string, string> = {
  venda_criada: theme.gold,
  cliente_editado: theme.muted,
  solucao_salva: '#5B9BD5',
  solucao_enviada: theme.warning,
  solucao_aprovada: theme.success,
  vistoria_iniciada: '#C077DB',
  ambiente_adicionado: '#C077DB',
  ponto_adicionado: '#C077DB',
  foto_adicionada: theme.success,
  vistoria_concluida: theme.success,
  os_criada: theme.gold,
  instalacao_iniciada: '#FF9800',
  entrega_concluida: theme.success,
  status_alterado: theme.muted,
  observacao: theme.muted,
};

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

function SolucaoResumo({ draft, equipments }: { draft: SolucaoTecnica; equipments: Equipment[] }) {
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
      <span style={{ fontSize: 12, color: theme.muted, minWidth: 100 }}>{label}</span>
      <span style={{ fontSize: 13, color: theme.text }}>{value}</span>
    </div>
  );
}

function MarcaBadge({ marca }: { marca: Marca }) {
  const colorMap: Record<Marca, string> = { Intelbras: '#43C17B', Hikvision: '#E55B5B', Hilook: '#FF7043', Ezviz: '#26C6DA', DSC: '#5B9BD5', JFL: '#AB47BC', PPA: '#FFA726', Viaweb: '#E3B341', 'Genérico': '#B5B5B5' };
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

/* Styles: see ./shared/styles */
