'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { prospectToLead } from '../../lib/dataSource/adapters/prospectAdapter';
import { mockEquipments, mockLeads, mockOrdens, mockSolucoes, mockUsers } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import {
  BlocoCategoria, BlocoTecnico, Equipment, ItemSolucao, Lead, Marca,
  OrdemDeServico, PropostaServico, SolucaoTecnica, User,
} from '../../types';

/* ---- Constants ---- */

const marcas: Marca[] = ['Intelbras', 'Hikvision', 'Hilook', 'Ezviz', 'DSC', 'JFL', 'PPA', 'Viaweb', 'Genérico'];

const allBlocos: BlocoCategoria[] = [
  'sensor_externo', 'sensor_interno', 'sensor_porta_janela',
  'camera_analogica', 'camera_ip', 'camera_ia',
  'dvr_nvr', 'central_alarme',
  'modulo_comunicacao',
  'acessorio',
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

type WizardStep = {
  label: string;
  blocos: BlocoCategoria[];
};

const wizardSteps: WizardStep[] = [
  { label: 'Dados Gerais', blocos: [] },
  { label: 'Fase 1 — Alarme', blocos: ['sensor_externo', 'sensor_interno', 'sensor_porta_janela', 'central_alarme'] },
  { label: 'Fase 2 — CFTV', blocos: ['camera_analogica', 'camera_ip', 'camera_ia', 'dvr_nvr'] },
  { label: 'Fase 3 — Infra', blocos: ['modulo_comunicacao', 'acessorio'] },
  { label: 'Resumo & Serviços', blocos: [] },
];

const faseDescricoes: Record<number, string> = {
  1: 'Sensores de intrusão e central de alarme para detecção e alerta.',
  2: 'Câmeras de vídeo e gravadores para monitoramento visual.',
  3: 'Módulos de comunicação e acessórios de infraestrutura.',
};

function emptyBlocos(): BlocoTecnico[] {
  return allBlocos.map((cat) => ({ categoria: cat, itens: [] }));
}

function emptySolucao(): SolucaoTecnica {
  return {
    id: '', leadId: '', clienteNome: '',
    marca: 'Intelbras', blocos: emptyBlocos(), servicos: [], observacaoGeral: '',
    status: 'rascunho', criadoPor: '', createdAt: '', updatedAt: '',
  };
}

/* ---- Main Component ---- */

export function SolucoesPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canWrite  = role === 'ADMIN' || role === 'VENDEDOR' || role === 'TECNICO';
  const canApprove = role === 'ADMIN' || role === 'GESTOR';

  const [solucoes, setSolucoes] = useState<SolucaoTecnica[]>([]);
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [draft, setDraft] = useState<SolucaoTecnica>(emptySolucao);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setSolucoes(loadMock('mock_solucoes', mockSolucoes).map((s) => ({ ...s, servicos: s.servicos ?? [] })));
    setOrdens(loadMock('mock_ordens', mockOrdens));
    setUsers(loadMock('mock_users', mockUsers));
    const rascunho = loadMock<SolucaoTecnica | null>('mock_solucao_draft', null);
    if (rascunho) { setDraft({ ...rascunho, servicos: rascunho.servicos ?? [] }); setView('wizard'); }

    let cancelled = false;
    async function load() {
      const ds = createDataSource();
      const [eqRes, prospRes] = await Promise.allSettled([
        ds.equipment.list({ pageSize: 500 }),
        ds.prospects.list({ pageSize: 200 }),
      ]);
      if (cancelled) return;
      setEquipments(eqRes.status === 'fulfilled' ? eqRes.value.data : loadMock('mock_equipments', mockEquipments));
      setLeads(prospRes.status === 'fulfilled'
        ? prospRes.value.data.map((p) => prospectToLead(p))
        : loadMock('mock_leads', mockLeads));
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { saveMock('mock_ordens', ordens); }, [ordens]);

  function userName(id: string) { return users.find((u) => u.id === id)?.name ?? id; }

  function openNew() {
    const now = new Date().toISOString().slice(0, 10);
    setDraft({ ...emptySolucao(), criadoPor: users.find((u) => u.role === role)?.id ?? 'U1', createdAt: now, updatedAt: now });
    setStep(0);
    setView('wizard');
  }

  function openEdit(sol: SolucaoTecnica) {
    const copy = { ...sol, servicos: sol.servicos ?? [], blocos: [...sol.blocos] };
    const existing = new Set(copy.blocos.map((b) => b.categoria));
    for (const cat of allBlocos) {
      if (!existing.has(cat)) copy.blocos.push({ categoria: cat, itens: [] });
    }
    setDraft(copy);
    setStep(0);
    setView('wizard');
  }

  useEffect(() => {
    if (view === 'wizard') saveMock('mock_solucao_draft', draft);
  }, [draft, view]);

  function handleSave(sol: SolucaoTecnica) {
    const now = new Date().toISOString().slice(0, 10);
    const updated = { ...sol, updatedAt: now };
    let newList: SolucaoTecnica[];
    if (sol.id) {
      newList = solucoes.map((s) => s.id === sol.id ? updated : s);
      showToast('Solução atualizada.', 'success');
    } else {
      newList = [...solucoes, { ...updated, id: 'SOL' + Date.now() }];
      showToast('Solução criada.', 'success');
    }
    saveMock('mock_solucoes', newList);
    saveMock('mock_solucao_draft', null);
    setSolucoes(newList);
    setView('list');
  }

  function handleDelete(id: string) {
    const newList = solucoes.filter((s) => s.id !== id);
    saveMock('mock_solucoes', newList);
    setSolucoes(newList);
    showToast('Solução excluída.', 'warning');
  }

  function handleEnviar(id: string) {
    const newList = solucoes.map((s) =>
      s.id === id ? { ...s, status: 'enviada' as const, updatedAt: new Date().toISOString().slice(0, 10) } : s
    );
    saveMock('mock_solucoes', newList);
    setSolucoes(newList);
    showToast('Proposta enviada ao cliente.', 'success');
  }

  function handleAprovar(sol: SolucaoTecnica) {
    const now = new Date().toISOString().slice(0, 10);
    const newList = solucoes.map((s) =>
      s.id === sol.id ? { ...s, status: 'aprovada' as const, updatedAt: now } : s
    );
    saveMock('mock_solucoes', newList);
    setSolucoes(newList);

    // Criar OS automaticamente com checklist dos equipamentos
    const allItems = sol.blocos.flatMap((b) => b.itens.map((item, idx) => {
      const eq = equipments.find((e) => e.id === item.equipmentId);
      const label = blocoLabels[b.categoria];
      return {
        id: 'CK' + Date.now() + b.categoria + idx,
        text: `Instalar ${item.quantidade}x ${eq?.name ?? item.equipmentId} (${label})${item.observacao ? ` — ${item.observacao}` : ''}`,
        done: false,
      };
    }));

    const newOS: OrdemDeServico = {
      id: 'OS' + Date.now(),
      propostaId: sol.id,
      vistoriaId: '',
      leadId: sol.leadId,
      cliente: sol.clienteNome,
      dataAgendada: '',
      tecnicoId: '',
      checklist: allItems,
      pontos: [],
      observacoes: sol.observacaoGeral,
      status: 'bloqueada',
      createdAt: now,
    };
    setOrdens((cur) => [...cur, newOS]);
    showToast('Proposta aprovada! OS criada automaticamente.', 'success');
  }

  function handleCancel() {
    saveMock('mock_solucao_draft', null);
    setView('list');
  }

  if (view === 'wizard') {
    return (
      <AppShell title={draft.id ? 'Editar Proposta' : 'Nova Proposta Técnica'}>
        <SolucaoWizard
          draft={draft}
          setDraft={setDraft}
          step={step}
          setStep={setStep}
          equipments={equipments}
          leads={leads}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Propostas">
      {canWrite && <button onClick={openNew} style={btnGold}>+ Nova Proposta</button>}

      {solucoes.length === 0 && (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted, marginTop: 16 }}>
          Nenhuma proposta criada ainda. Clique em "+ Nova Proposta" para começar.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {solucoes.map((sol) => {
          const totalItens = sol.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0);
          const valorEquip = sol.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => {
            const eq = equipments.find((e) => e.id === i.equipmentId);
            return ss + (eq?.price ?? 0) * i.quantidade;
          }, 0), 0);
          const valorServicos = (sol.servicos ?? []).reduce((s, sv) => s + sv.valor, 0);
          const valorTotal = valorEquip + valorServicos;

          return (
            <div key={sol.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>{sol.clienteNome}</strong>
                <SolucaoStatusBadge status={sol.status} />
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <MarcaBadge marca={sol.marca} />
                <span style={{ fontSize: 12, color: theme.muted }}>{totalItens} equipamentos</span>
                {(sol.servicos ?? []).length > 0 && (
                  <span style={{ fontSize: 12, color: theme.muted }}>{sol.servicos.length} serviço(s)</span>
                )}
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.gold }}>
                  R$ {valorTotal.toLocaleString('pt-BR')}
                </span>
              </div>

              <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                Criada em {formatDate(sol.createdAt)} por {userName(sol.criadoPor)}
              </div>

              {sol.status === 'rascunho' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {canWrite && <button onClick={() => openEdit(sol)} style={btnSmall}>Editar</button>}
                  {canWrite && (
                    <button
                      onClick={() => handleEnviar(sol.id)}
                      disabled={totalItens === 0}
                      style={{ ...btnSmall, borderColor: theme.gold, color: theme.gold, opacity: totalItens === 0 ? 0.4 : 1 }}
                    >
                      Enviar ao Cliente
                    </button>
                  )}
                  {canWrite && (
                    <button onClick={() => handleDelete(sol.id)} style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}>
                      Excluir
                    </button>
                  )}
                </div>
              )}

              {sol.status === 'enviada' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => openEdit(sol)} style={btnSmall}>Visualizar</button>
                  {canApprove && (
                    <button
                      onClick={() => handleAprovar(sol)}
                      style={{ ...btnSmall, borderColor: theme.success, color: theme.success }}
                    >
                      Aprovar e Gerar OS
                    </button>
                  )}
                </div>
              )}

              {sol.status === 'aprovada' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
                  <button onClick={() => openEdit(sol)} style={btnSmall}>Visualizar</button>
                  <span style={{ fontSize: 12, color: theme.success }}>OS gerada automaticamente</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
                  OS {os.id} &middot; Criada em {formatDate(os.createdAt)}
                </div>
                {os.checklist.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: theme.text }}>
                    {os.checklist.slice(0, 4).map((item, i) => <li key={i}>{item.text}</li>)}
                    {os.checklist.length > 4 && (
                      <li style={{ color: theme.muted }}>+ {os.checklist.length - 4} itens…</li>
                    )}
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

/* ---- Wizard ---- */

function SolucaoWizard({ draft, setDraft, step, setStep, equipments, leads, onSave, onCancel }: {
  draft: SolucaoTecnica;
  setDraft: (d: SolucaoTecnica) => void;
  step: number;
  setStep: (s: number) => void;
  equipments: Equipment[];
  leads: Lead[];
  onSave: (s: SolucaoTecnica) => void;
  onCancel: () => void;
}) {
  const { showToast } = useToast();
  const currentStep = wizardSteps[step];
  const isLast = step === wizardSteps.length - 1;
  const isFirst = step === 0;
  const totalItems = draft.blocos.reduce((s, b) => s + b.itens.length, 0);

  function updateBloco(categoria: BlocoCategoria, itens: ItemSolucao[]) {
    const exists = draft.blocos.some((b) => b.categoria === categoria);
    const newBlocos = exists
      ? draft.blocos.map((b) => (b.categoria === categoria ? { ...b, itens } : b))
      : [...draft.blocos, { categoria, itens }];
    setDraft({ ...draft, blocos: newBlocos });
  }

  function getBloco(categoria: BlocoCategoria): BlocoTecnico {
    return draft.blocos.find((b) => b.categoria === categoria) ?? { categoria, itens: [] };
  }

  return (
    <div>
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {wizardSteps.map((ws, i) => {
          const isCurrent = i === step;
          const isDone = i < step;
          const hasBlocos = ws.blocos.length > 0;
          const hasItems = hasBlocos && ws.blocos.some((bc) => getBloco(bc).itens.length > 0);

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
                background: isCurrent ? theme.gold : isDone && hasItems ? theme.success + '33' : hasBlocos && hasItems ? theme.success + '33' : theme.soft,
                color: isCurrent ? '#111' : isDone && hasItems ? theme.success : theme.muted,
                border: `1px solid ${isCurrent ? theme.gold : hasItems ? theme.success + '66' : theme.border}`,
              }}>
                {hasItems ? '✓' : i + 1}
              </span>
              {ws.label}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepDadosGerais draft={draft} setDraft={setDraft} leads={leads} />
      )}

      {step >= 1 && step <= 3 && (
        <>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ color: theme.gold, margin: '0 0 4px', fontSize: 16 }}>{currentStep.label}</h3>
            <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>{faseDescricoes[step]}</p>
          </div>
          {currentStep.blocos.map((cat) => (
            <BlockEditor
              key={cat}
              categoria={cat}
              label={blocoLabels[cat]}
              marca={draft.marca}
              equipments={equipments}
              items={getBloco(cat).itens}
              onChange={(itens) => updateBloco(cat, itens)}
            />
          ))}
        </>
      )}

      {step === 4 && (
        <StepResumoServicos draft={draft} setDraft={setDraft} equipments={equipments} />
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
        {!isFirst && (
          <button type="button" onClick={() => setStep(step - 1)} style={btnSoft}>← Anterior</button>
        )}
        <div style={{ flex: 1 }} />
        {!isLast ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && !draft.leadId}
            style={{ ...btnGold, opacity: step === 0 && !draft.leadId ? 0.4 : 1 }}
          >
            Próximo →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (totalItems === 0) {
                showToast('Adicione ao menos um equipamento antes de salvar.', 'warning');
                return;
              }
              onSave(draft);
            }}
            style={{ ...btnGold, background: theme.success, opacity: totalItems === 0 ? 0.5 : 1 }}
          >
            Salvar Proposta
          </button>
        )}
        <button type="button" onClick={onCancel} style={btnSoft}>Cancelar</button>
      </div>
    </div>
  );
}

/* ---- Step: Dados Gerais ---- */

function StepDadosGerais({ draft, setDraft, leads }: {
  draft: SolucaoTecnica;
  setDraft: (d: SolucaoTecnica) => void;
  leads: Lead[];
}) {
  function handleLeadChange(leadId: string) {
    const lead = leads.find((l) => l.id === leadId);
    setDraft({
      ...draft,
      leadId,
      clienteNome: lead ? `${lead.name} — ${lead.company}` : '',
    });
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ color: theme.gold, margin: '0 0 16px', fontSize: 16 }}>Dados Gerais</h3>

      <label style={labelStyle}>Lead / Cliente *</label>
      <select value={draft.leadId} onChange={(e) => handleLeadChange(e.target.value)} style={inputStyle}>
        <option value="">Selecione um lead</option>
        {leads.filter((l) => l.status === 'ativo').map((lead) => (
          <option key={lead.id} value={lead.id}>
            {lead.name} — {lead.company} (R$ {lead.value.toLocaleString('pt-BR')})
          </option>
        ))}
      </select>

      {draft.clienteNome && (
        <div style={{ fontSize: 13, color: theme.muted, marginBottom: 12, marginTop: -4 }}>
          Cliente: <strong style={{ color: theme.text }}>{draft.clienteNome}</strong>
        </div>
      )}

      <label style={labelStyle}>Marca Principal *</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {marcas.map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => {
              if (m !== draft.marca) setDraft({ ...draft, marca: m, blocos: emptyBlocos() });
            }}
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

      {draft.leadId && (
        <div style={{ background: theme.soft, borderRadius: 10, padding: 12, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>Resumo</div>
          <div style={{ fontSize: 14 }}>
            <strong>{draft.clienteNome}</strong>
            <span style={{ color: theme.muted }}> · Marca: </span>
            <MarcaBadge marca={draft.marca} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Block Editor (reusable) ---- */

function BlockEditor({ categoria, label, marca, equipments, items, onChange }: {
  categoria: BlocoCategoria;
  label: string;
  marca: Marca;
  equipments: Equipment[];
  items: ItemSolucao[];
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
    if (!selEquip || !selQtd || selQtd < 1 || isNaN(selQtd)) return;
    const existing = items.find((i) => i.equipmentId === selEquip);
    if (existing) {
      onChange(items.map((i) => i.equipmentId === selEquip ? { ...i, quantidade: i.quantidade + selQtd } : i));
    } else {
      onChange([...items, { equipmentId: selEquip, quantidade: selQtd, observacao: selObs }]);
    }
    setSelEquip('');
    setSelQtd(1);
    setSelObs('');
  }

  function removeItem(eqId: string) {
    onChange(items.filter((i) => i.equipmentId !== eqId));
  }

  function updateObs(eqId: string, obs: string) {
    onChange(items.map((i) => i.equipmentId === eqId ? { ...i, observacao: obs } : i));
  }

  function updateQty(eqId: string, delta: number) {
    const updated = items
      .map((i) => (i.equipmentId === eqId ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i))
      .filter((i) => i.quantidade > 0);
    onChange(updated);
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
            <optgroup label="⚠ Outras marcas">
              {allBlockEquipments.filter((e) => e.marca !== marca && e.marca !== 'Genérico').map((eq) => (
                <option key={eq.id} value={eq.id}>⚠ {eq.name} ({eq.marca}) — R$ {eq.price}</option>
              ))}
            </optgroup>
          )}
        </select>
        <input type="number" min={1} value={selQtd} onChange={(e) => setSelQtd(Number(e.target.value))} style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
        <button type="button" onClick={addItem} disabled={!selEquip} style={{ ...btnGold, opacity: selEquip ? 1 : 0.4 }}>+</button>
      </div>

      {mixedBrandItems.length > 0 && (
        <div style={{ background: theme.warning + '15', border: `1px solid ${theme.warning}44`, borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: theme.warning }}>
          ⚠ {mixedBrandItems.length} item(ns) de marca diferente ({marca}). Misturar marcas pode causar incompatibilidade.
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: 12 }}>
          Nenhum produto adicionado.
        </div>
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13 }}>{eq?.name ?? item.equipmentId}</span>
                    {isMixed && <span style={{ fontSize: 11, color: theme.warning, marginLeft: 4 }}>({eq?.marca})</span>}
                    <span style={{ fontSize: 12, color: theme.muted, marginLeft: 6 }}>
                      R$ {((eq?.price ?? 0) * item.quantidade).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <button type="button" onClick={() => updateQty(item.equipmentId, -1)} style={qtyBtnSmall}>−</button>
                    <span style={{ display: 'inline-block', width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.quantidade}</span>
                    <button type="button" onClick={() => updateQty(item.equipmentId, 1)} style={qtyBtnSmall}>+</button>
                    <button type="button" onClick={() => removeItem(item.equipmentId)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 11, marginLeft: 4 }}>x</button>
                  </div>
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

/* ---- Step: Resumo + Serviços ---- */

function StepResumoServicos({ draft, setDraft, equipments }: {
  draft: SolucaoTecnica;
  setDraft: (d: SolucaoTecnica) => void;
  equipments: Equipment[];
}) {
  const [svcDesc, setSvcDesc] = useState('');
  const [svcValor, setSvcValor] = useState(0);
  const [svcTipo, setSvcTipo] = useState<'instalacao' | 'mensalidade'>('instalacao');

  const servicos: PropostaServico[] = draft.servicos ?? [];

  const totalItens = draft.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0);
  const valorEquip = draft.blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => {
    const eq = equipments.find((e) => e.id === i.equipmentId);
    return ss + (eq?.price ?? 0) * i.quantidade;
  }, 0), 0);
  const valorServicos = servicos.reduce((s, sv) => s + sv.valor, 0);
  const valorTotal = valorEquip + valorServicos;

  const stepGroups = wizardSteps.slice(1, -1);

  function addServico() {
    if (!svcDesc.trim() || svcValor <= 0) return;
    setDraft({ ...draft, servicos: [...servicos, { descricao: svcDesc.trim(), valor: svcValor, tipo: svcTipo }] });
    setSvcDesc('');
    setSvcValor(0);
  }

  function removeServico(idx: number) {
    setDraft({ ...draft, servicos: servicos.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <h3 style={{ color: theme.gold, margin: '0 0 6px', fontSize: 16 }}>Resumo da Proposta</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <strong>{draft.clienteNome}</strong>
        <MarcaBadge marca={draft.marca} />
        <span style={{ fontSize: 13, color: theme.muted }}>{totalItens} equipamentos</span>
      </div>

      {/* Equipment blocks by phase */}
      {stepGroups.map((sg) => {
        const blocos = sg.blocos.map((bc) => draft.blocos.find((b) => b.categoria === bc)!);
        const groupItems = blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => ss + i.quantidade, 0), 0);
        const groupValue = blocos.reduce((s, b) => s + b.itens.reduce((ss, i) => {
          const eq = equipments.find((e) => e.id === i.equipmentId);
          return ss + (eq?.price ?? 0) * i.quantidade;
        }, 0), 0);

        return (
          <div key={sg.label} style={{ marginBottom: 12, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, opacity: groupItems > 0 ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14, color: groupItems > 0 ? theme.gold : theme.muted }}>{sg.label}</h4>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: groupItems > 0 ? theme.success : theme.muted }}>
                  {groupItems > 0 ? `${groupItems} itens` : 'vazio'}
                </span>
                {groupValue > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme.gold }}>
                    R$ {groupValue.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
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

      {/* Services section */}
      <div style={{ marginTop: 8, marginBottom: 12, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: theme.gold }}>Serviços</h4>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Descrição do serviço"
            value={svcDesc}
            onChange={(e) => setSvcDesc(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 160, marginBottom: 0 }}
          />
          <input
            type="number" min={0} placeholder="Valor"
            value={svcValor || ''}
            onChange={(e) => setSvcValor(Number(e.target.value))}
            style={{ ...inputStyle, width: 100, marginBottom: 0 }}
          />
          <select
            value={svcTipo}
            onChange={(e) => setSvcTipo(e.target.value as 'instalacao' | 'mensalidade')}
            style={{ ...inputStyle, width: 130, marginBottom: 0 }}
          >
            <option value="instalacao">Instalação</option>
            <option value="mensalidade">Mensalidade</option>
          </select>
          <button type="button" onClick={addServico} disabled={!svcDesc.trim() || svcValor <= 0} style={{ ...btnGold, opacity: svcDesc.trim() && svcValor > 0 ? 1 : 0.4 }}>
            +
          </button>
        </div>

        {servicos.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: '8px 0' }}>
            Nenhum serviço adicionado (instalação, mensalidade, etc.)
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 4 }}>
            {servicos.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.soft, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                <div>
                  <span>{s.descricao}</span>
                  <span style={{ fontSize: 11, color: theme.muted, marginLeft: 6 }}>
                    {s.tipo === 'mensalidade' ? '(mensal)' : '(instalação)'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: theme.gold }}>R$ {s.valor.toLocaleString('pt-BR')}</span>
                  <button type="button" onClick={() => removeServico(i)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '1px 7px', cursor: 'pointer', fontSize: 11 }}>x</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observation */}
      <label style={labelStyle}>Observação geral</label>
      <textarea
        value={draft.observacaoGeral}
        onChange={(e) => setDraft({ ...draft, observacaoGeral: e.target.value })}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
        placeholder="Notas livres sobre esta solução..."
      />

      {/* Total */}
      <div style={{ marginTop: 8, padding: 14, background: theme.soft, borderRadius: 10, border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: valorServicos > 0 ? 8 : 0 }}>
          <span style={{ fontSize: 13, color: theme.muted }}>Equipamentos ({totalItens} itens)</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.gold }}>R$ {valorEquip.toLocaleString('pt-BR')}</span>
        </div>
        {valorServicos > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: theme.muted }}>Serviços ({servicos.length})</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.gold }}>R$ {valorServicos.toLocaleString('pt-BR')}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: valorServicos > 0 ? `1px solid ${theme.border}` : 'none', paddingTop: valorServicos > 0 ? 8 : 0 }}>
          <span style={{ fontSize: 14, color: theme.muted, fontWeight: 600 }}>Total da Proposta</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: theme.gold }}>R$ {valorTotal.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

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

function SolucaoStatusBadge({ status }: { status: SolucaoTecnica['status'] }) {
  const map: Record<SolucaoTecnica['status'], { label: string; color: string }> = {
    rascunho: { label: 'Rascunho', color: theme.muted },
    enviada:  { label: 'Aguardando aprovação', color: '#5B9BD5' },
    aprovada: { label: 'Aprovada', color: theme.success },
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

function OSStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    bloqueada: theme.danger, pendente: theme.warning,
    agendada: '#5B9BD5', em_andamento: theme.gold, concluida: theme.success,
  };
  const color = colorMap[status] ?? theme.muted;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '3px 10px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
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

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%', colorScheme: 'dark' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '3px 10px', cursor: 'pointer', fontSize: 12 };
const qtyBtnSmall: React.CSSProperties = { width: 24, height: 24, borderRadius: 6, background: theme.soft, border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
