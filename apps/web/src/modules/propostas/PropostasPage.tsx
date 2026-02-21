'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { createDataSource } from '../../lib/dataSource/factory';
import { prospectToLead } from '../../lib/dataSource/adapters/prospectAdapter';
import { mockEquipments, mockLeads, mockOrdens, mockPropostas } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Equipment, Lead, OrdemDeServico, Proposta, PropostaItem, PropostaServico } from '../../types';

type View = 'list' | 'form';

export function PropostasPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canCreate = role === 'ADMIN' || role === 'VENDEDOR';
  const canApprove = role === 'ADMIN' || role === 'GESTOR';
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [view, setView] = useState<View>('list');
  const [editId, setEditId] = useState<string | null>(null);

  // Check for prefilled leadId from query string
  const [prefilledLeadId, setPrefilledLeadId] = useState<string | null>(null);

  useEffect(() => {
    // Itens sem API: sempre do localStorage
    setPropostas(loadMock('mock_propostas', mockPropostas));
    setOrdens(loadMock('mock_ordens', mockOrdens));

    const params = new URLSearchParams(window.location.search);
    const lid = params.get('leadId');
    if (lid) { setPrefilledLeadId(lid); setView('form'); }

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

  useEffect(() => { if (propostas.length) saveMock('mock_propostas', propostas); }, [propostas]);
  useEffect(() => { saveMock('mock_ordens', ordens); }, [ordens]);

  function handleSave(proposta: Proposta) {
    setPropostas((cur) => {
      const exists = cur.find((p) => p.id === proposta.id);
      return exists ? cur.map((p) => p.id === proposta.id ? proposta : p) : [...cur, proposta];
    });
    setView('list');
    setEditId(null);
    setPrefilledLeadId(null);
    showToast('Proposta salva com sucesso!', 'success');
  }

  function handleAprovar(proposta: Proposta) {
    const updated: Proposta = { ...proposta, status: 'aprovada' };
    setPropostas((cur) => cur.map((p) => p.id === proposta.id ? updated : p));

    // Create OS automatically
    const lead = leads.find((l) => l.id === proposta.leadId);
    const newOS: OrdemDeServico = {
      id: 'OS' + Date.now(),
      propostaId: proposta.id,
      vistoriaId: '',
      leadId: proposta.leadId,
      cliente: lead ? `${lead.name} — ${lead.company}` : proposta.leadNome,
      dataAgendada: '',
      tecnicoId: '',
      checklist: proposta.itens.map((i, idx) => ({ id: 'CK' + Date.now() + idx, text: `Instalar ${i.quantidade}x ${i.nome}`, done: false })),
      pontos: [],
      observacoes: '',
      status: 'bloqueada',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setOrdens((cur) => [...cur, newOS]);
    showToast('Proposta aprovada! OS criada automaticamente.', 'success');
  }

  function handleEdit(id: string) {
    setEditId(id);
    setView('form');
  }

  function handleEnviar(proposta: Proposta) {
    const updated: Proposta = { ...proposta, status: 'enviada' };
    setPropostas((cur) => cur.map((p) => p.id === proposta.id ? updated : p));
    showToast('Proposta marcada como enviada.', 'success');
  }

  if (view === 'form') {
    return (
      <AppShell title={editId ? 'Editar Proposta' : 'Nova Proposta'}>
        <PropostaForm
          leads={leads}
          equipments={equipments}
          existing={editId ? propostas.find((p) => p.id === editId) ?? null : null}
          prefilledLeadId={prefilledLeadId}
          onSave={handleSave}
          onCancel={() => { setView('list'); setEditId(null); setPrefilledLeadId(null); }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Propostas">
      {canCreate && <button onClick={() => setView('form')} style={btnGold}>+ Nova Proposta</button>}

      {propostas.length === 0 && (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted, marginTop: 16 }}>
          Nenhuma proposta criada ainda. Crie uma a partir do Pipeline ou clique em "+ Nova Proposta".
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {propostas.map((p) => (
          <PropostaCard key={p.id} proposta={p} onEdit={handleEdit} onAprovar={handleAprovar} onEnviar={handleEnviar} canApprove={canApprove} canCreate={canCreate} />
        ))}
      </div>

      {ordens.length > 0 && (
        <>
          <h3 style={{ marginTop: 32, color: theme.gold }}>Ordens de Serviço geradas</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {ordens.map((os) => (
              <div key={os.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{os.cliente}</strong>
                  <StatusBadge value={os.status} />
                </div>
                <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
                  OS {os.id} &middot; Criada em {formatDate(os.createdAt)}
                </div>
                {os.checklist.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, color: theme.text }}>
                    {os.checklist.map((item, i) => <li key={i}>{item.text}</li>)}
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

/* ---- Card de proposta na lista ---- */

function PropostaCard({ proposta, onEdit, onAprovar, onEnviar, canApprove, canCreate }: {
  proposta: Proposta;
  onEdit: (id: string) => void;
  onAprovar: (p: Proposta) => void;
  onEnviar: (p: Proposta) => void;
  canApprove: boolean;
  canCreate: boolean;
}) {
  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 15 }}>{proposta.leadNome}</strong>
        <StatusBadge value={proposta.status} />
      </div>
      <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
        {proposta.itens.length} ite{proposta.itens.length === 1 ? 'm' : 'ns'} &middot; {proposta.servicos.length} serviço(s) &middot; Criada em {formatDate(proposta.createdAt)}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: theme.gold, marginTop: 6 }}>
        R$ {proposta.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </div>
      {proposta.observacoes && <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>{proposta.observacoes}</div>}

      {/* Items summary */}
      <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
        {proposta.itens.map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: theme.text }}>
            {item.quantidade}x {item.nome} — R$ {(item.quantidade * item.precoUnitario).toLocaleString('pt-BR')}
          </div>
        ))}
        {proposta.servicos.map((s, i) => (
          <div key={'s' + i} style={{ fontSize: 12, color: theme.muted }}>
            {s.tipo === 'mensalidade' ? '(mensal)' : '(serv.)'} {s.descricao} — R$ {s.valor.toLocaleString('pt-BR')}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {proposta.status === 'gerada' && (
          <>
            {canCreate && <button onClick={() => onEdit(proposta.id)} style={btnSoft}>Editar</button>}
            {canCreate && <button onClick={() => onEnviar(proposta)} style={btnGold}>Enviar</button>}
          </>
        )}
        {proposta.status === 'enviada' && (
          <>
            {canApprove && <button onClick={() => onAprovar(proposta)} style={{ ...btnGold, background: theme.success }}>Aprovar</button>}
          </>
        )}
        {proposta.status === 'aprovada' && (
          <span style={{ fontSize: 12, color: theme.success }}>OS gerada automaticamente</span>
        )}
      </div>
    </div>
  );
}

/* ---- Formulário de proposta ---- */

function PropostaForm({ leads, equipments, existing, prefilledLeadId, onSave, onCancel }: {
  leads: Lead[];
  equipments: Equipment[];
  existing: Proposta | null;
  prefilledLeadId: string | null;
  onSave: (p: Proposta) => void;
  onCancel: () => void;
}) {
  const defaultLeadId = existing?.leadId ?? prefilledLeadId ?? '';

  const [leadId, setLeadId] = useState(defaultLeadId);
  const [itens, setItens] = useState<PropostaItem[]>(existing?.itens ?? []);
  const [servicos, setServicos] = useState<PropostaServico[]>(existing?.servicos ?? []);
  const [observacoes, setObservacoes] = useState(existing?.observacoes ?? '');

  // Add item form
  const [selEquip, setSelEquip] = useState(equipments[0]?.id ?? '');
  const [selQtd, setSelQtd] = useState(1);

  // Add servico form
  const [svcDesc, setSvcDesc] = useState('');
  const [svcValor, setSvcValor] = useState(0);
  const [svcTipo, setSvcTipo] = useState<'instalacao' | 'mensalidade'>('instalacao');

  const total = useMemo(() => {
    const itensTotal = itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
    const svcTotal = servicos.reduce((s, sv) => s + sv.valor, 0);
    return itensTotal + svcTotal;
  }, [itens, servicos]);

  const selectedLead = leads.find((l) => l.id === leadId);

  function addItem() {
    const eq = equipments.find((e) => e.id === selEquip);
    if (!eq || selQtd < 1) return;
    const existingItem = itens.find((i) => i.equipamentoId === eq.id);
    if (existingItem) {
      setItens((cur) => cur.map((i) => i.equipamentoId === eq.id ? { ...i, quantidade: i.quantidade + selQtd } : i));
    } else {
      setItens((cur) => [...cur, { equipamentoId: eq.id, nome: eq.name, quantidade: selQtd, precoUnitario: eq.price }]);
    }
    setSelQtd(1);
  }

  function removeItem(eqId: string) {
    setItens((cur) => cur.filter((i) => i.equipamentoId !== eqId));
  }

  function addServico() {
    if (!svcDesc.trim() || svcValor <= 0) return;
    setServicos((cur) => [...cur, { descricao: svcDesc.trim(), valor: svcValor, tipo: svcTipo }]);
    setSvcDesc('');
    setSvcValor(0);
  }

  function removeServico(idx: number) {
    setServicos((cur) => cur.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    const proposta: Proposta = {
      id: existing?.id ?? 'PR' + Date.now(),
      orcamentoId: existing?.orcamentoId ?? '',
      leadId,
      leadNome: lead ? `${lead.name} — ${lead.company}` : leadId,
      itens,
      servicos,
      total,
      observacoes,
      status: existing?.status ?? 'gerada',
      createdAt: existing?.createdAt ?? new Date().toISOString().split('T')[0],
    };
    onSave(proposta);
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Lead selector */}
      <label style={labelStyle}>Lead / Cliente</label>
      <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={inputStyle}>
        <option value="">Selecione um lead</option>
        {leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}
      </select>
      {selectedLead && (
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8 }}>
          Etapa: {selectedLead.stage} &middot; Resp.: {selectedLead.responsible} &middot; Valor lead: R$ {selectedLead.value.toLocaleString('pt-BR')}
        </div>
      )}

      {/* Items */}
      <h4 style={{ color: theme.gold, marginBottom: 8 }}>Equipamentos</h4>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <select value={selEquip} onChange={(e) => setSelEquip(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 180 }}>
          {equipments.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} — R$ {eq.price}</option>)}
        </select>
        <input type="number" min={1} value={selQtd} onChange={(e) => setSelQtd(Number(e.target.value))} style={{ ...inputStyle, width: 70 }} />
        <button type="button" onClick={addItem} style={btnGold}>Adicionar</button>
      </div>
      {itens.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>{['Equipamento', 'Qtd', 'Unit.', 'Subtotal', ''].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.equipamentoId}>
                <td style={tdStyle}>{item.nome}</td>
                <td style={tdStyle}>{item.quantidade}</td>
                <td style={tdStyle}>R$ {item.precoUnitario.toLocaleString('pt-BR')}</td>
                <td style={tdStyle}>R$ {(item.quantidade * item.precoUnitario).toLocaleString('pt-BR')}</td>
                <td style={tdStyle}><button onClick={() => removeItem(item.equipamentoId)} style={btnDanger}>x</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Services */}
      <h4 style={{ color: theme.gold, marginBottom: 8 }}>Serviços</h4>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input placeholder="Descrição" value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
        <input type="number" min={0} placeholder="Valor" value={svcValor || ''} onChange={(e) => setSvcValor(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
        <select value={svcTipo} onChange={(e) => setSvcTipo(e.target.value as 'instalacao' | 'mensalidade')} style={{ ...inputStyle, width: 130 }}>
          <option value="instalacao">Instalação</option>
          <option value="mensalidade">Mensalidade</option>
        </select>
        <button type="button" onClick={addServico} style={btnGold}>Adicionar</button>
      </div>
      {servicos.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>{['Serviço', 'Tipo', 'Valor', ''].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {servicos.map((s, i) => (
              <tr key={i}>
                <td style={tdStyle}>{s.descricao}</td>
                <td style={tdStyle}>{s.tipo === 'mensalidade' ? 'Mensalidade' : 'Instalação'}</td>
                <td style={tdStyle}>R$ {s.valor.toLocaleString('pt-BR')}</td>
                <td style={tdStyle}><button onClick={() => removeServico(i)} style={btnDanger}>x</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Observations */}
      <label style={labelStyle}>Observações</label>
      <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />

      {/* Total */}
      <div style={{ marginTop: 16, padding: 12, background: theme.soft, borderRadius: 10, border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: theme.muted }}>Total da Proposta</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: theme.gold }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={handleSubmit} disabled={!leadId} style={{ ...btnGold, opacity: leadId ? 1 : 0.4 }}>Salvar Proposta</button>
        <button onClick={onCancel} style={btnSoft}>Cancelar</button>
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function StatusBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    gerada: theme.muted,
    enviada: theme.warning,
    aprovada: theme.success,
    bloqueada: theme.danger,
    pendente: theme.warning,
    agendada: '#5B9BD5',
    em_andamento: theme.gold,
    concluida: theme.success,
  };
  const color = colorMap[value] ?? theme.muted;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      padding: '3px 10px',
      borderRadius: 999,
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
    }}>
      {value}
    </span>
  );
}

function formatDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 8 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnDanger: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '2px 8px', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
