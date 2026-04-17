'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useAuth } from '../../contexts/AuthContext';
import { loadState, saveState } from '../../services/appState';
import { AppShell } from '../../components/layout/AppShell';
import type { VendaLocal, VendaLocalStatus, ActivityLog, SolucaoTecnica, Vistoria, OrdemDeServico } from '../../types';

/* ================================================================
   Status config
   ================================================================ */

const STATUS_CONFIG: Record<VendaLocalStatus, { label: string; color: string; etapa: number }> = {
  rascunho:          { label: 'Rascunho',           color: theme.muted,   etapa: 0 },
  solucao_pronta:    { label: 'Solução Pronta',     color: '#5B9BD5',     etapa: 1 },
  proposta_gerada:   { label: 'Proposta Gerada',    color: theme.warning, etapa: 2 },
  cliente_aprovou:   { label: 'Cliente Aprovou',    color: theme.gold,    etapa: 3 },
  vistoria:          { label: '1ª Visita',          color: '#C077DB',     etapa: 3 },
  em_instalacao:     { label: 'Em Instalação',      color: '#FF9800',     etapa: 4 },
  entrega:           { label: 'Entrega',            color: '#43C17B',     etapa: 5 },
  concluida:         { label: 'Concluída',          color: theme.success, etapa: 5 },
  perdida:           { label: 'Perdida',             color: theme.danger,  etapa: 0 },
};

const ETAPAS = ['Dados', 'Solução', 'Proposta', '1ª Visita', 'Instalação', 'Entrega'];

type FiltroStatus = 'todas' | 'em_andamento' | 'vistoria' | 'concluidas';

/* ================================================================
   Component
   ================================================================ */

export function VendasListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role } = useAuth();
  const username = user?.username ?? '';
  const seesAllVendas = role === 'ADMIN' || role === 'GESTOR';
  const [vendas, setVendas] = useState<VendaLocal[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filtro, setFiltro] = useState<FiltroStatus>('todas');
  const [search, setSearch] = useState('');
  const [showNovaVenda, setShowNovaVenda] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<VendaLocal | null>(null);
  const autoCreatedRef = useRef(false);

  useEffect(() => {
    loadState<VendaLocal[]>('vendedor_vendas', []).then(setVendas);
    loadState<ActivityLog[]>('vendedor_logs', []).then(setLogs);
  }, []);

  /* --- Auto-create venda from pipeline query params --- */
  const handleAutoCreate = useCallback(async (nome: string, tel: string, empresa: string, endereco: string, tipoLocal: string, leadId: string) => {
    const now = new Date().toISOString();
    const id = 'VND' + Date.now();
    const nova: VendaLocal = {
      id, clienteNome: nome, clienteTelefone: tel, clienteEmail: '',
      clienteEndereco: endereco, clienteEmpresa: empresa,
      tipoLocal: (tipoLocal as VendaLocal['tipoLocal']) || 'Residencial',
      observacoes: '', status: 'rascunho',
      solucaoId: '', vistoriaId: '', ordemId: '', propostaId: '',
      criadoPor: user?.username ?? '', createdAt: now, updatedAt: now, leadId,
    };
    const log: ActivityLog = {
      id: 'LOG' + Date.now(), vendaId: id, tipo: 'venda_criada',
      descricao: `Venda criada a partir do pipeline para ${nome}`,
      criadoPor: user?.username ?? '', createdAt: now,
    };
    const [currentVendas, currentLogs] = await Promise.all([
      loadState<VendaLocal[]>('vendedor_vendas', []),
      loadState<ActivityLog[]>('vendedor_logs', []),
    ]);
    await Promise.all([
      saveState('vendedor_vendas', [nova, ...currentVendas]),
      saveState('vendedor_logs', [log, ...currentLogs]),
    ]);
    router.replace(`/venda/${id}`);
  }, [user, router]);

  useEffect(() => {
    if (autoCreatedRef.current) return;
    const leadId = searchParams.get('leadId');
    const nome = searchParams.get('nome');
    if (leadId && nome) {
      autoCreatedRef.current = true;
      handleAutoCreate(
        nome,
        searchParams.get('tel') ?? '',
        searchParams.get('empresa') ?? '',
        searchParams.get('endereco') ?? '',
        searchParams.get('tipoLocal') ?? '',
        leadId,
      );
    }
  }, [searchParams, handleAutoCreate]);

  /* --- multi-tenant visibility: VENDEDOR só vê as próprias vendas --- */
  const vendasVisiveis = useMemo(() => {
    if (seesAllVendas) return vendas;
    return vendas.filter((v) => v.criadoPor === username);
  }, [vendas, seesAllVendas, username]);

  /* --- filters --- */
  const filtered = useMemo(() => {
    let list = vendasVisiveis;

    if (filtro === 'em_andamento') {
      list = list.filter((v) => ['rascunho', 'solucao_pronta', 'proposta_gerada', 'cliente_aprovou'].includes(v.status));
    } else if (filtro === 'vistoria') {
      list = list.filter((v) => ['vistoria', 'em_instalacao', 'entrega'].includes(v.status));
    } else if (filtro === 'concluidas') {
      list = list.filter((v) => v.status === 'concluida');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.clienteNome.toLowerCase().includes(q) ||
        v.clienteEmpresa.toLowerCase().includes(q) ||
        v.clienteTelefone.includes(q),
      );
    }

    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [vendasVisiveis, filtro, search]);

  const counts = useMemo(() => ({
    todas: vendasVisiveis.length,
    em_andamento: vendasVisiveis.filter((v) => ['rascunho', 'solucao_pronta', 'proposta_gerada', 'cliente_aprovou'].includes(v.status)).length,
    vistoria: vendasVisiveis.filter((v) => ['vistoria', 'em_instalacao', 'entrega'].includes(v.status)).length,
    concluidas: vendasVisiveis.filter((v) => v.status === 'concluida').length,
  }), [vendasVisiveis]);

  /* --- last activity per venda --- */
  const lastActivity = useMemo(() => {
    const map: Record<string, ActivityLog> = {};
    for (const log of logs) {
      if (!map[log.vendaId] || log.createdAt > map[log.vendaId].createdAt) {
        map[log.vendaId] = log;
      }
    }
    return map;
  }, [logs]);

  /* --- create new venda --- */
  async function handleCriarVenda(data: { nome: string; telefone: string; empresa: string; endereco: string; tipoLocal: VendaLocal['tipoLocal'] }) {
    const now = new Date().toISOString();
    const id = 'VND' + Date.now();
    const nova: VendaLocal = {
      id,
      clienteNome: data.nome,
      clienteTelefone: data.telefone,
      clienteEmail: '',
      clienteEndereco: data.endereco,
      clienteEmpresa: data.empresa,
      tipoLocal: data.tipoLocal,
      observacoes: '',
      status: 'rascunho',
      solucaoId: '',
      vistoriaId: '',
      ordemId: '',
      propostaId: '',
      criadoPor: user?.username ?? '',
      createdAt: now,
      updatedAt: now,
    };

    const log: ActivityLog = {
      id: 'LOG' + Date.now(),
      vendaId: id,
      tipo: 'venda_criada',
      descricao: `Venda criada para ${data.nome}`,
      criadoPor: user?.username ?? '',
      createdAt: now,
    };

    const newVendas = [nova, ...vendas];
    const newLogs = [log, ...logs];
    setVendas(newVendas);
    setLogs(newLogs);
    await Promise.all([
      saveState('vendedor_vendas', newVendas),
      saveState('vendedor_logs', newLogs),
    ]);
    setShowNovaVenda(false);
    router.push(`/venda/${id}`);
  }

  /* --- delete venda — limpa entidades relacionadas --- */
  async function handleDeleteVenda(id: string) {
    const updated = vendas.filter((v) => v.id !== id);
    const updatedLogs = logs.filter((l) => l.vendaId !== id);
    setVendas(updated);
    setLogs(updatedLogs);
    await Promise.all([
      saveState('vendedor_vendas', updated),
      saveState('vendedor_logs', updatedLogs),
      loadState<SolucaoTecnica[]>('solucoes', []).then((all) =>
        saveState('solucoes', all.filter((s) => s.leadId !== id)),
      ),
      loadState<Vistoria[]>('vistorias', []).then((all) =>
        saveState('vistorias', all.filter((v) => v.leadId !== id)),
      ),
      loadState<Vistoria[]>('entregas', []).then((all) =>
        saveState('entregas', all.filter((v) => v.leadId !== id)),
      ),
      loadState<OrdemDeServico[]>('ordens_servico', []).then((all) =>
        saveState('ordens_servico', all.filter((o) => o.leadId !== id)),
      ),
    ]);
    setConfirmDelete(null);
  }

  /* --- KPIs --- */
  const fotosTotal = useMemo(() => {
    return logs.filter((l) => l.tipo === 'foto_adicionada').length;
  }, [logs]);

  /* --- Ranking compartilhado (todos os vendedores, para competição saudável) --- */
  const ranking = useMemo(() => {
    type Row = { username: string; total: number; concluidas: number; emAndamento: number };
    const byUser = new Map<string, Row>();
    for (const v of vendas) {
      const u = v.criadoPor || '(sem dono)';
      if (!byUser.has(u)) byUser.set(u, { username: u, total: 0, concluidas: 0, emAndamento: 0 });
      const row = byUser.get(u)!;
      row.total += 1;
      if (v.status === 'concluida') row.concluidas += 1;
      else if (v.status !== 'perdida') row.emAndamento += 1;
    }
    return Array.from(byUser.values()).sort((a, b) => b.concluidas - a.concluidas || b.total - a.total);
  }, [vendas]);

  const myRankIndex = useMemo(() => {
    if (seesAllVendas) return -1;
    return ranking.findIndex((r) => r.username === username);
  }, [ranking, username, seesAllVendas]);

  return (
    <AppShell title="Minhas Vendas">
      {/* Ranking compartilhado */}
      {ranking.length > 1 && (
        <RankingPanel ranking={ranking} myUsername={username} myRankIndex={myRankIndex} />
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
        {([
          { label: 'Total', value: vendas.length, color: theme.gold },
          { label: 'Em andamento', value: counts.em_andamento, color: '#5B9BD5' },
          { label: 'Em vistoria', value: counts.vistoria, color: '#C077DB' },
          { label: 'Concluídas', value: counts.concluidas, color: theme.success },
          { label: 'Fotos tiradas', value: fotosTotal, color: theme.warning },
        ]).map((kpi) => (
          <div key={kpi.label} style={{
            background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10,
            padding: '12px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: theme.muted }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Nova Venda */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {([
          ['todas', 'Todas'],
          ['em_andamento', 'Em andamento'],
          ['vistoria', 'Vistoria'],
          ['concluidas', 'Concluídas'],
        ] as [FiltroStatus, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              background: filtro === key ? 'rgba(200,169,81,0.12)' : theme.soft,
              border: `1px solid ${filtro === key ? theme.gold : theme.border}`,
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: filtro === key ? theme.gold : theme.text,
              fontWeight: filtro === key ? 700 : 400, fontSize: 13,
            }}
          >
            {label}
            <span style={{ marginLeft: 6, fontSize: 11, color: theme.muted }}>{counts[key]}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
        <button onClick={() => setShowNovaVenda(true)} style={btnGold}>+ Nova Venda</button>
      </div>

      {/* Nova Venda modal */}
      {showNovaVenda && (
        <NovaVendaModal onClose={() => setShowNovaVenda(false)} onCriar={handleCriarVenda} />
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          border: `1px dashed ${theme.border}`, borderRadius: 12,
          padding: 40, textAlign: 'center', color: theme.muted,
        }}>
          {vendas.length === 0
            ? <>Nenhuma venda ainda. <button onClick={() => setShowNovaVenda(true)} style={{ ...btnGold, marginTop: 12 }}>Criar primeira venda</button></>
            : 'Nenhuma venda encontrada com esse filtro.'
          }
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setConfirmDelete(null)}>
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, maxWidth: 400, width: '100%' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: theme.danger, fontSize: 16 }}>Excluir venda?</h3>
            <p style={{ fontSize: 13, color: theme.muted, marginBottom: 6 }}>
              Tem certeza que deseja excluir a venda de <strong style={{ color: theme.text }}>{confirmDelete.clienteNome}</strong>?
            </p>
            <p style={{ fontSize: 12, color: theme.danger, marginBottom: 20 }}>
              Esta ação não pode ser desfeita. Todos os dados, fotos e logs serão removidos.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={btnSoft}>Cancelar</button>
              <button onClick={() => handleDeleteVenda(confirmDelete.id)}
                style={{ ...btnGold, background: theme.danger, color: '#fff' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Venda cards */}
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((venda) => {
          const cfg = STATUS_CONFIG[venda.status];
          const last = lastActivity[venda.id];

          return (
            <div
              key={venda.id}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: theme.panel, border: `1px solid ${theme.border}`,
                borderRadius: 12, padding: 16, color: theme.text,
                transition: 'border-color 150ms', position: 'relative',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => router.push(`/venda/${venda.id}`)}>
                  <strong style={{ fontSize: 15 }}>{venda.clienteNome}</strong>
                  {venda.clienteEmpresa && (
                    <span style={{ fontSize: 13, color: theme.muted, marginLeft: 8 }}>{venda.clienteEmpresa}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                    background: cfg.color + '22', color: cfg.color,
                    border: `1px solid ${cfg.color}44`,
                    textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
                  }}>
                    {cfg.label}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(venda); }}
                    title="Excluir venda"
                    style={{
                      background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6,
                      color: theme.muted, cursor: 'pointer', padding: '3px 6px', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color 150ms, border-color 150ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.danger; e.currentTarget.style.borderColor = theme.danger; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.borderColor = theme.border; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Clickable body */}
              <div onClick={() => router.push(`/venda/${venda.id}`)} style={{ cursor: 'pointer' }}>
                {/* Info row */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10, fontSize: 12, color: theme.muted }}>
                  {venda.tipoLocal && (
                    <span style={{ background: theme.soft, padding: '2px 8px', borderRadius: 6, fontSize: 11, border: `1px solid ${theme.border}` }}>
                      {venda.tipoLocal}
                    </span>
                  )}
                  {venda.clienteTelefone && <span>{venda.clienteTelefone}</span>}
                  {venda.clienteEndereco && <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venda.clienteEndereco}</span>}
                  <span>Criada em {formatDate(venda.createdAt)}</span>
                </div>

                {/* Last activity */}
                {last && (
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    {last.descricao} — {formatDateTime(last.createdAt)}
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {ETAPAS.map((label, i) => {
                    const done = i <= cfg.etapa;
                    const isCurrent = i === cfg.etapa;
                    return (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, flexShrink: 0,
                          background: done ? (isCurrent ? cfg.color : theme.gold) : theme.soft,
                          color: done ? '#111' : theme.muted,
                          border: `1.5px solid ${done ? (isCurrent ? cfg.color : theme.gold) : theme.border}`,
                        }}>
                          {i < cfg.etapa ? '✓' : i + 1}
                        </div>
                        <span style={{
                          fontSize: 10,
                          color: done ? (isCurrent ? cfg.color : theme.gold) : theme.muted,
                          fontWeight: isCurrent ? 700 : 400, whiteSpace: 'nowrap',
                        }}>
                          {label}
                        </span>
                        {i < ETAPAS.length - 1 && (
                          <div style={{ flex: 1, height: 2, minWidth: 8, background: i < cfg.etapa ? theme.gold : theme.border }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

/* ================================================================
   Nova Venda Modal
   ================================================================ */

function NovaVendaModal({ onClose, onCriar }: {
  onClose: () => void;
  onCriar: (data: { nome: string; telefone: string; empresa: string; endereco: string; tipoLocal: VendaLocal['tipoLocal'] }) => void;
}) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoLocal, setTipoLocal] = useState<VendaLocal['tipoLocal']>('Residencial');

  function handleSubmit() {
    if (!nome.trim()) return;
    onCriar({ nome: nome.trim(), telefone: telefone.trim(), empresa: empresa.trim(), endereco: endereco.trim(), tipoLocal });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16,
        padding: 24, maxWidth: 480, width: '100%',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', color: theme.gold, fontSize: 18 }}>Nova Venda</h3>

        <label style={labelStyle}>Nome do cliente *</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" style={modalInputStyle} autoFocus />

        <label style={labelStyle}>Telefone</label>
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" style={modalInputStyle} />

        <label style={labelStyle}>Empresa / Condomínio</label>
        <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" style={modalInputStyle} />

        <label style={labelStyle}>Endereço</label>
        <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro" style={modalInputStyle} />

        <label style={labelStyle}>Tipo de local</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {(['Residencial', 'Comercial', 'Condomínio', 'Industrial'] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoLocal(tipo)}
              style={{
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: tipoLocal === tipo ? theme.gold + '22' : theme.soft,
                border: `2px solid ${tipoLocal === tipo ? theme.gold : theme.border}`,
                color: tipoLocal === tipo ? theme.gold : theme.text,
              }}
            >
              {tipo}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSoft}>Cancelar</button>
          <button onClick={handleSubmit} disabled={!nome.trim()} style={{ ...btnGold, opacity: nome.trim() ? 1 : 0.4 }}>
            Criar e abrir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Ranking compartilhado — todos os vendedores
   ================================================================ */

type RankingRow = { username: string; total: number; concluidas: number; emAndamento: number };

function RankingPanel({ ranking, myUsername, myRankIndex }: { ranking: RankingRow[]; myUsername: string; myRankIndex: number }) {
  const [open, setOpen] = useState(false);
  const podium = ranking.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];
  const podiumColors = [theme.gold, '#C0C0C0', '#CD7F32'];

  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.gold }}>Ranking de vendas</div>
            <div style={{ fontSize: 11, color: theme.muted }}>
              {podium.map((p, i) => `${medals[i]} ${p.username} (${p.concluidas})`).join(' · ')}
              {myRankIndex >= 0 && ` · você: #${myRankIndex + 1}`}
            </div>
          </div>
        </div>
        <span style={{ color: theme.muted, fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '4px 16px 16px', borderTop: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, color: theme.muted, padding: '8px 0' }}>
            Vendas concluídas lideram. Empate → total de vendas abertas.
          </div>

          {podium.length >= 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${podium.length}, 1fr)`, gap: 8, marginBottom: 12 }}>
              {podium.map((p, i) => (
                <div key={p.username} style={{
                  background: podiumColors[i] + '15',
                  border: `1px solid ${podiumColors[i]}44`,
                  borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                  outline: p.username === myUsername ? `2px solid ${theme.gold}` : 'none',
                }}>
                  <div style={{ fontSize: 20 }}>{medals[i]}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: podiumColors[i] }}>{p.concluidas}</div>
                  <div style={{ fontSize: 10, color: theme.muted }}>concluídas · {p.total} total</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ranking.map((r, i) => {
              const isMe = r.username === myUsername;
              return (
                <div key={r.username} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr auto auto auto', gap: 10, alignItems: 'center',
                  padding: '8px 10px', borderRadius: 8,
                  background: isMe ? theme.gold + '15' : theme.soft,
                  border: `1px solid ${isMe ? theme.gold + '55' : theme.border}`,
                  fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: i < 3 ? podiumColors[i] : theme.muted, textAlign: 'center' }}>
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </span>
                  <span style={{ color: theme.text, fontWeight: isMe ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.username}{isMe && ' (você)'}
                  </span>
                  <span style={{ color: theme.success, fontWeight: 700 }}>{r.concluidas}<span style={{ color: theme.muted, fontWeight: 400, fontSize: 10 }}> ✓</span></span>
                  <span style={{ color: '#5B9BD5' }}>{r.emAndamento}<span style={{ color: theme.muted, fontSize: 10 }}> ↻</span></span>
                  <span style={{ color: theme.muted }}>{r.total} total</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Helpers ---- */

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = {
  background: theme.soft, color: theme.text,
  border: `1px solid ${theme.border}`, borderRadius: 8,
  padding: '8px 10px', fontSize: 13, minWidth: 180,
};

const modalInputStyle: React.CSSProperties = {
  background: theme.soft, color: theme.text,
  border: `1px solid ${theme.border}`, borderRadius: 8,
  padding: '10px 12px', fontSize: 14, width: '100%', marginBottom: 12,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4,
};

const btnGold: React.CSSProperties = {
  background: theme.gold, border: 'none', borderRadius: 8,
  color: '#111', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
};

const btnSoft: React.CSSProperties = {
  background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8,
  color: theme.text, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
};
