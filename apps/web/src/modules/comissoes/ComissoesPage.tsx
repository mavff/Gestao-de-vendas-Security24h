'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { theme } from '../../components/common/theme';
import { createDataSource } from '../../lib/dataSource/factory';
import { loadState, saveState } from '../../services/appState';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClienteAtivo,
  ComissaoConfig,
  ComissaoClienteInfo,
  ComissaoClienteStatus,
  ComissaoOverride,
  ComissaoVendedor,
  DEFAULT_COMISSAO_CONFIG,
  PagamentoStatus,
} from '../../lib/dataSource/types';

const ds = createDataSource();

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusLabel(s: ComissaoClienteStatus): string {
  const m: Record<ComissaoClienteStatus, string> = {
    pendente: 'Pendente', carencia: 'Carencia', liberada: 'Liberada', paga: 'Paga', estornada: 'Estornada',
  };
  return m[s];
}

function statusColor(s: ComissaoClienteStatus): string {
  const m: Record<ComissaoClienteStatus, string> = {
    pendente: theme.muted, carencia: theme.warning, liberada: theme.success, paga: '#5B9BD5', estornada: theme.danger,
  };
  return m[s];
}

function pagamentoLabel(s: PagamentoStatus): string {
  const m: Record<PagamentoStatus, string> = { em_dia: 'Em dia', atrasado: 'Atrasado', cancelado: 'Cancelado' };
  return m[s];
}

function pagamentoColor(s: PagamentoStatus): string {
  const m: Record<PagamentoStatus, string> = { em_dia: theme.success, atrasado: theme.danger, cancelado: '#888' };
  return m[s];
}

function deriveComissaoStatus(cli: ComissaoClienteInfo, cfg: ComissaoConfig): ComissaoClienteStatus {
  if (cli.mesesAtivos >= cfg.prazoMinimoMeses) return 'liberada';
  if (cli.mesesAtivos > 0) return 'carencia';
  return 'pendente';
}

function calcComissaoValor(cli: ComissaoClienteInfo, cfg: ComissaoConfig): number {
  return cli.valorMonitoramento * cfg.qtdMensalidadesComissao;
}

function calcTaxaAdesao(cli: ComissaoClienteInfo, cfg: ComissaoConfig): number {
  return cli.valorMonitoramento * cfg.multiplicadorAdesao;
}

function progressPercent(meses: number, prazo: number): number {
  return Math.min(100, Math.round((meses / prazo) * 100));
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

// ── Shared Styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
  background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8,
  color: theme.text, fontSize: 14, outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 18px', background: theme.gold, color: '#000', border: 'none',
  borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '8px 18px', background: 'transparent', color: theme.muted,
  border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer',
};

const badgeStyle = (color: string): React.CSSProperties => ({
  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
  background: `${color}22`, color,
});

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12,
      padding: '16px 18px', flex: '1 1 150px', minWidth: 150,
    }}>
      <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || theme.gold }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, meses, prazo }: { pct: number; meses: number; prazo: number }) {
  const color = pct >= 100 ? theme.success : pct >= 50 ? theme.warning : theme.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: theme.soft, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 300ms' }} />
      </div>
      <span style={{ fontSize: 11, color: theme.muted, whiteSpace: 'nowrap' }}>{meses}/{prazo}m</span>
    </div>
  );
}

// ── Config Modal ─────────────────────────────────────────────────────────────

function ConfigModal({ cfg, vendedoresAtivos, todosUsuarios, onSave, onClose }: {
  cfg: ComissaoConfig;
  vendedoresAtivos: string[];
  todosUsuarios: string[];
  onSave: (c: ComissaoConfig, vendedores: string[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(cfg);
  const [selecionados, setSelecionados] = useState<string[]>(vendedoresAtivos);

  const toggle = (u: string) => {
    setSelecionados((prev) => prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14,
        padding: 28, width: 500, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', color: theme.gold, fontSize: 17 }}>Configurar Comissoes</h3>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: theme.muted }}>Prazo minimo (meses)</span>
          <input type="number" value={local.prazoMinimoMeses} min={1} max={36}
            onChange={(e) => setLocal({ ...local, prazoMinimoMeses: Number(e.target.value) })}
            style={inputStyle} />
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: theme.muted }}>Qtd. mensalidades para comissao</span>
          <input type="number" value={local.qtdMensalidadesComissao} min={1} max={12}
            onChange={(e) => setLocal({ ...local, qtdMensalidadesComissao: Number(e.target.value) })}
            style={inputStyle} />
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: theme.muted }}>Multiplicador taxa de adesao (ex: 1.25 = 125%)</span>
          <input type="number" value={local.multiplicadorAdesao} min={1} max={3} step={0.05}
            onChange={(e) => setLocal({ ...local, multiplicadorAdesao: Number(e.target.value) })}
            style={inputStyle} />
        </label>

        {/* Vendedores ativos */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8 }}>Vendedores ativos (selecione quem recebe comissao)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {todosUsuarios.map((u) => {
              const sel = selecionados.includes(u);
              return (
                <button key={u} onClick={() => toggle(u)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: sel ? `1px solid ${theme.gold}` : `1px solid ${theme.border}`,
                  background: sel ? `${theme.gold}22` : 'transparent',
                  color: sel ? theme.gold : theme.muted,
                }}>
                  {u}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={() => onSave(local, selecionados)} style={btnPrimary}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ── Override Modal ───────────────────────────────────────────────────────────

function OverrideModal({ clienteNome, current, onSave, onClose }: {
  clienteNome: string;
  current: ComissaoOverride;
  onSave: (o: ComissaoOverride) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(current);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14,
        padding: 28, width: 440, maxWidth: '92vw',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 6px', color: theme.gold, fontSize: 17 }}>Gerenciar Comissao</h3>
        <div style={{ fontSize: 13, color: theme.muted, marginBottom: 18 }}>{clienteNome}</div>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: theme.muted }}>Status da Comissao</span>
          <select value={local.status}
            onChange={(e) => setLocal({ ...local, status: e.target.value as ComissaoClienteStatus })}
            style={inputStyle}>
            <option value="pendente">Pendente</option>
            <option value="carencia">Carencia</option>
            <option value="liberada">Liberada</option>
            <option value="paga">Paga</option>
            <option value="estornada">Estornada</option>
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: theme.muted }}>Status do Pagamento</span>
          <select value={local.pagamento}
            onChange={(e) => setLocal({ ...local, pagamento: e.target.value as PagamentoStatus })}
            style={inputStyle}>
            <option value="em_dia">Em dia</option>
            <option value="atrasado">Atrasado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: theme.muted }}>Observacoes</span>
          <textarea value={local.observacoes || ''} rows={3}
            onChange={(e) => setLocal({ ...local, observacoes: e.target.value })}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={() => onSave(local)} style={btnPrimary}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Comissoes por Vendedor ──────────────────────────────────────────────

type TabComissoesProps = {
  vendedores: ComissaoVendedor[];
  cfg: ComissaoConfig;
  overrides: Record<number, ComissaoOverride>;
  isAdmin: boolean;
  role: string;
  getEffective: (cli: ComissaoClienteInfo) => { status: ComissaoClienteStatus; pagamento: PagamentoStatus; obs?: string };
  onEditCliente: (cli: ComissaoClienteInfo) => void;
};

function TabComissoes({ vendedores, cfg, overrides, isAdmin, role, getEffective, onEditCliente }: TabComissoesProps) {
  const [expandedVendedor, setExpandedVendedor] = useState<string | null>(
    vendedores.length === 1 ? vendedores[0]?.usuario : null
  );
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return vendedores;
    const q = search.toLowerCase();
    return vendedores.filter((v) =>
      v.usuario.toLowerCase().includes(q) ||
      v.clientes.some((c) => c.clienteNome.toLowerCase().includes(q))
    );
  }, [vendedores, search]);

  // KPIs
  const kpis = useMemo(() => {
    let totalClientes = 0, emCarencia = 0, liberados = 0, inadimplentes = 0;
    let mrrComodato = 0, comissaoPendente = 0, comissaoLiberada = 0, passaram12 = 0;

    for (const v of vendedores) {
      for (const cli of v.clientes) {
        totalClientes++;
        const { status, pagamento } = getEffective(cli);
        const val = calcComissaoValor(cli, cfg);
        mrrComodato += cli.valorMonitoramento;
        if (pagamento === 'atrasado') inadimplentes++;
        if (status === 'carencia' || status === 'pendente') { emCarencia++; comissaoPendente += val; }
        if (status === 'liberada') { liberados++; comissaoLiberada += val; passaram12++; }
        if (status === 'paga') { passaram12++; }
      }
    }
    const taxaRetencao = totalClientes > 0 ? Math.round((passaram12 / totalClientes) * 100) : 0;
    return { totalClientes, emCarencia, liberados, inadimplentes, mrrComodato, comissaoPendente, comissaoLiberada, taxaRetencao };
  }, [vendedores, getEffective, cfg]);

  return (
    <>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Clientes Comodato" value={String(kpis.totalClientes)} />
        <KpiCard label="Em Carencia" value={String(kpis.emCarencia)} color={theme.warning} sub={`< ${cfg.prazoMinimoMeses} meses`} />
        <KpiCard label="Liberados" value={String(kpis.liberados)} color={theme.success} sub={`>= ${cfg.prazoMinimoMeses} meses`} />
        <KpiCard label="Inadimplentes" value={String(kpis.inadimplentes)} color={theme.danger} />
        <KpiCard label="MRR Vendedores" value={fmt(kpis.mrrComodato)} color={theme.gold} />
        <KpiCard label="Comissao Pendente" value={fmt(kpis.comissaoPendente)} color={theme.warning} />
        <KpiCard label="Comissao Liberada" value={fmt(kpis.comissaoLiberada)} color={theme.success} />
        <KpiCard label="Taxa Retencao" value={`${kpis.taxaRetencao}%`} color={kpis.taxaRetencao >= 70 ? theme.success : theme.danger} />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Buscar vendedor ou cliente..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 360 }} />
      </div>

      {/* Vendedor cards */}
      {filtered.map((v) => {
        const isExpanded = expandedVendedor === v.usuario;
        const stats = v.clientes.reduce((acc, cli) => {
          const { status, pagamento } = getEffective(cli);
          acc.total++;
          if (status === 'carencia' || status === 'pendente') acc.carencia++;
          if (status === 'liberada' || status === 'paga') acc.liberados++;
          if (pagamento === 'atrasado') acc.inadimplentes++;
          if (pagamento === 'cancelado') acc.cancelados++;
          acc.comissaoPendente += (status === 'carencia' || status === 'pendente') ? calcComissaoValor(cli, cfg) : 0;
          acc.comissaoLiberada += (status === 'liberada') ? calcComissaoValor(cli, cfg) : 0;
          acc.mrrTotal += cli.valorMonitoramento;
          return acc;
        }, { total: 0, carencia: 0, liberados: 0, inadimplentes: 0, cancelados: 0, comissaoPendente: 0, comissaoLiberada: 0, mrrTotal: 0 });

        // Taxa de retencao do vendedor
        const retencao = stats.total > 0 ? Math.round((stats.liberados / stats.total) * 100) : 0;
        const retencaoBaixa = retencao < 50 && stats.total >= 3; // Retencao ruim se < 50% com pelo menos 3 clientes

        return (
          <div key={v.usuario} style={{
            background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12,
            marginBottom: 10, overflow: 'hidden',
          }}>
            {/* Vendedor Header */}
            <button
              onClick={() => setExpandedVendedor(isExpanded ? null : v.usuario)}
              style={{
                width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                padding: '14px 18px', display: 'flex', flexWrap: 'wrap',
                alignItems: 'center', gap: 16, textAlign: 'left', color: theme.text,
              }}
            >
              <div style={{ flex: '1 1 140px' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{isExpanded ? '▾' : '▸'} {v.usuario}</div>
                <div style={{ fontSize: 11, color: theme.muted }}>
                  {stats.total} clientes | MRR {fmt(stats.mrrTotal)}
                  {' | '}Retencao: <span style={{ color: retencaoBaixa ? theme.danger : theme.success, fontWeight: 600 }}>{retencao}%</span>
                  {retencaoBaixa && <span style={{ color: theme.danger, fontWeight: 600 }}> — Comissao bloqueada</span>}
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase' }}>Carencia</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.warning }}>{stats.carencia}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase' }}>Liberados</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.success }}>{stats.liberados}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase' }}>Inadimpl.</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: stats.inadimplentes > 0 ? theme.danger : theme.muted }}>{stats.inadimplentes}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase' }}>Comissao Pend.</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.warning }}>{fmt(stats.comissaoPendente)}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase' }}>Comissao Lib.</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.success }}>{fmt(stats.comissaoLiberada)}</div>
              </div>
            </button>

            {/* Client table */}
            {isExpanded && (
              <div style={{ borderTop: `1px solid ${theme.border}`, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>1o Faturamento</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Dia Venc.</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Mensalidade</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Taxa Adesao</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tempo</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: 100 }}>Progresso</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Situacao</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Comissao</th>
                      {(isAdmin || role === 'GESTOR') && <th style={{ padding: '8px 10px', textAlign: 'center' }}>Acoes</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {v.clientes.map((cli) => {
                      const { status, pagamento } = getEffective(cli);
                      const comissaoVal = calcComissaoValor(cli, cfg);
                      const taxaAdesao = calcTaxaAdesao(cli, cfg);
                      const pct = progressPercent(cli.mesesAtivos, cfg.prazoMinimoMeses);

                      // Situacao geral do cliente
                      let situacaoLabel = 'Ativo';
                      let situacaoColor = theme.success;
                      if (pagamento === 'cancelado') { situacaoLabel = 'Cancelado'; situacaoColor = '#888'; }
                      else if (pagamento === 'atrasado') { situacaoLabel = 'Inadimplente'; situacaoColor = theme.danger; }
                      else if (cli.mesesAtivos < cfg.prazoMinimoMeses) { situacaoLabel = 'Em carencia'; situacaoColor = theme.warning; }

                      return (
                        <tr key={cli.codInterno} style={{
                          borderTop: `1px solid ${theme.border}22`,
                          background: pagamento === 'atrasado' ? 'rgba(229,91,91,0.06)' :
                            pagamento === 'cancelado' ? 'rgba(136,136,136,0.06)' :
                            status === 'estornada' ? 'rgba(136,136,136,0.06)' : 'transparent',
                        }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 500 }}>{cli.clienteNome}</div>
                            <div style={{ fontSize: 11, color: theme.muted }}>
                              Orc #{cli.numOrcamento || cli.codInterno}
                              {cli.cgcCpf && ` | ${cli.cgcCpf}`}
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: 12 }}>
                            <div>{formatDate(cli.primeiroFaturamento || cli.fechamento)}</div>
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
                            {cli.diaVencimento ? `Dia ${cli.diaVencimento}` : '—'}
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'right', color: theme.gold, fontWeight: 600 }}>
                            {fmt(cli.valorMonitoramento)}
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fmt(taxaAdesao)}</td>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 600 }}>{cli.mesesAtivos}m</div>
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <ProgressBar pct={pct} meses={cli.mesesAtivos} prazo={cfg.prazoMinimoMeses} />
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            <span style={badgeStyle(situacaoColor)}>{situacaoLabel}</span>
                            <div style={{ marginTop: 3 }}>
                              <span style={{ ...badgeStyle(statusColor(status)), fontSize: 10 }}>{statusLabel(status)}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: statusColor(status) }}>{fmt(comissaoVal)}</div>
                          </td>
                          {(isAdmin || role === 'GESTOR') && (
                            <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                              <button onClick={() => onEditCliente(cli)} style={{
                                border: `1px solid ${theme.border}`, background: 'transparent',
                                color: theme.gold, borderRadius: 6, padding: '4px 10px',
                                fontSize: 11, cursor: 'pointer',
                              }}>Editar</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ color: theme.muted, textAlign: 'center', padding: 40 }}>
          Nenhum vendedor encontrado
        </div>
      )}
    </>
  );
}

// ── Tab: Clientes Ativos ─────────────────────────────────────────────────────

function modalidadeLabel(m: string | null): string {
  if (m === 'L' || m === 'C') return 'Comodato';
  if (m === 'V') return 'Venda';
  if (m === 'R') return 'Renovacao';
  return m || '—';
}

const FAIXAS_VALOR = [
  { label: 'Todos', min: 0, max: Infinity },
  { label: 'Ate R$ 150', min: 0, max: 150 },
  { label: 'R$ 150 - 200', min: 150, max: 200 },
  { label: 'R$ 200 - 300', min: 200, max: 300 },
  { label: 'R$ 300 - 500', min: 300, max: 500 },
  { label: 'R$ 500+', min: 500, max: Infinity },
];

function TabClientesAtivos({ clientes, loading }: { clientes: ClienteAtivo[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroFaixaValor, setFiltroFaixaValor] = useState(0);
  const [ordenacao, setOrdenacao] = useState<'nome' | 'valor_asc' | 'valor_desc' | 'data_recente' | 'data_antigo'>('nome');

  const vendedoresUnicos = useMemo(() => {
    const set = new Set(clientes.map((c) => c.vendedorNome || 'Sem vendedor'));
    return Array.from(set).sort();
  }, [clientes]);

  const modalidadesUnicas = useMemo(() => {
    const set = new Set(clientes.map((c) => c.modalidade || ''));
    return Array.from(set).filter(Boolean).sort();
  }, [clientes]);

  const cidadesUnicas = useMemo(() => {
    const set = new Set(clientes.map((c) => c.cidade?.trim()).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [clientes]);

  const filtered = useMemo(() => {
    let result = clientes;

    if (filtroVendedor) {
      result = result.filter((c) => (c.vendedorNome || 'Sem vendedor') === filtroVendedor);
    }
    if (filtroModalidade) {
      result = result.filter((c) => c.modalidade === filtroModalidade);
    }
    if (filtroCidade) {
      result = result.filter((c) => c.cidade?.trim() === filtroCidade);
    }
    if (filtroFaixaValor > 0) {
      const faixa = FAIXAS_VALOR[filtroFaixaValor];
      result = result.filter((c) => c.valorMonitoramento >= faixa.min && c.valorMonitoramento < faixa.max);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.nome.toLowerCase().includes(q) ||
        c.fantasia?.toLowerCase().includes(q) ||
        c.cgcCpf?.toLowerCase().includes(q) ||
        c.fone1?.includes(q) ||
        c.vendedorNome?.toLowerCase().includes(q)
      );
    }

    // Ordenacao
    const sorted = [...result];
    switch (ordenacao) {
      case 'valor_asc': sorted.sort((a, b) => a.valorMonitoramento - b.valorMonitoramento); break;
      case 'valor_desc': sorted.sort((a, b) => b.valorMonitoramento - a.valorMonitoramento); break;
      case 'data_recente': sorted.sort((a, b) => (b.dataFechamento || '').localeCompare(a.dataFechamento || '')); break;
      case 'data_antigo': sorted.sort((a, b) => (a.dataFechamento || '').localeCompare(b.dataFechamento || '')); break;
      default: sorted.sort((a, b) => a.nome.localeCompare(b.nome)); break;
    }
    return sorted;
  }, [clientes, search, filtroVendedor, filtroModalidade, filtroCidade, filtroFaixaValor, ordenacao]);

  const mrrTotal = useMemo(() => filtered.reduce((s, c) => s + c.valorMonitoramento, 0), [filtered]);
  const ticketMedio = filtered.length > 0 ? mrrTotal / filtered.length : 0;

  const temFiltroAtivo = filtroVendedor || filtroModalidade || filtroCidade || filtroFaixaValor > 0 || search.trim();
  const limparFiltros = () => {
    setSearch(''); setFiltroVendedor(''); setFiltroModalidade(''); setFiltroCidade(''); setFiltroFaixaValor(0);
  };

  if (loading) return <div style={{ color: theme.muted, padding: 20 }}>Carregando...</div>;

  return (
    <>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Clientes Ativos" value={String(filtered.length)} sub={temFiltroAtivo ? `de ${clientes.length} total` : undefined} />
        <KpiCard label="MRR Total" value={fmt(mrrTotal)} color={theme.gold} />
        <KpiCard label="Ticket Medio" value={fmt(ticketMedio)} color={theme.text} />
        <KpiCard label="Vendedores" value={String(vendedoresUnicos.length)} />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end',
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 14,
      }}>
        <div style={{ flex: '1 1 220px', maxWidth: 280 }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', marginBottom: 2 }}>Buscar</div>
          <input placeholder="Nome, CPF/CNPJ, telefone..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
        </div>
        <div style={{ flex: '0 1 180px' }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', marginBottom: 2 }}>Vendedor</div>
          <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}
            style={{ ...inputStyle, marginTop: 0 }}>
            <option value="">Todos</option>
            {vendedoresUnicos.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 1 140px' }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', marginBottom: 2 }}>Modalidade</div>
          <select value={filtroModalidade} onChange={(e) => setFiltroModalidade(e.target.value)}
            style={{ ...inputStyle, marginTop: 0 }}>
            <option value="">Todas</option>
            {modalidadesUnicas.map((m) => <option key={m} value={m}>{modalidadeLabel(m)}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 1 160px' }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', marginBottom: 2 }}>Faixa de valor</div>
          <select value={filtroFaixaValor} onChange={(e) => setFiltroFaixaValor(Number(e.target.value))}
            style={{ ...inputStyle, marginTop: 0 }}>
            {FAIXAS_VALOR.map((f, i) => <option key={i} value={i}>{f.label}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 1 160px' }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', marginBottom: 2 }}>Cidade</div>
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)}
            style={{ ...inputStyle, marginTop: 0 }}>
            <option value="">Todas</option>
            {cidadesUnicas.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 1 160px' }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', marginBottom: 2 }}>Ordenar por</div>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as typeof ordenacao)}
            style={{ ...inputStyle, marginTop: 0 }}>
            <option value="nome">Nome A-Z</option>
            <option value="valor_desc">Maior valor</option>
            <option value="valor_asc">Menor valor</option>
            <option value="data_recente">Mais recente</option>
            <option value="data_antigo">Mais antigo</option>
          </select>
        </div>
        {temFiltroAtivo && (
          <button onClick={limparFiltros} style={{
            ...btnSecondary, padding: '8px 14px', fontSize: 11, color: theme.danger,
            borderColor: theme.danger, alignSelf: 'flex-end', marginBottom: 4,
          }}>
            Limpar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Cliente</th>
                <th style={{ padding: '10px 10px', textAlign: 'left' }}>Cidade</th>
                <th style={{ padding: '10px 10px', textAlign: 'left' }}>Vendedor</th>
                <th style={{ padding: '10px 10px', textAlign: 'left' }}>Tecnico</th>
                <th style={{ padding: '10px 10px', textAlign: 'center' }}>Modalidade</th>
                <th style={{ padding: '10px 10px', textAlign: 'right' }}>Valor Mensal</th>
                <th style={{ padding: '10px 10px', textAlign: 'center' }}>Dia Venc.</th>
                <th style={{ padding: '10px 10px', textAlign: 'center' }}>1o Faturamento</th>
                <th style={{ padding: '10px 10px', textAlign: 'center' }}>Tempo</th>
                <th style={{ padding: '10px 10px', textAlign: 'left' }}>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                // Calcular meses desde o primeiro faturamento
                const refDate = c.primeiroFaturamento || c.dataFechamento;
                let mesesAtivos = 0;
                if (refDate) {
                  const d = new Date(refDate);
                  const now = new Date();
                  mesesAtivos = Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
                }

                // Próximo vencimento
                const diaVenc = c.diaVencimento && c.diaVencimento > 0 ? c.diaVencimento : null;

                return (
                <tr key={c.codCliente} style={{ borderTop: `1px solid ${theme.border}22` }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500 }}>{c.nome}</div>
                    {c.fantasia && <div style={{ fontSize: 11, color: theme.muted }}>{c.fantasia}</div>}
                    {c.cgcCpf && <div style={{ fontSize: 11, color: theme.muted }}>{c.cgcCpf}</div>}
                  </td>
                  <td style={{ padding: '10px 10px', color: theme.muted }}>{c.cidade || '—'}</td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{ fontWeight: 600, color: c.vendedorNome ? theme.text : theme.muted }}>
                      {c.vendedorNome || 'Sem vendedor'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', color: theme.muted }}>{c.tecnicoNome || '—'}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <span style={badgeStyle(c.modalidade === 'L' || c.modalidade === 'C' ? '#5B9BD5' : c.modalidade === 'R' ? '#C077DB' : theme.gold)}>
                      {modalidadeLabel(c.modalidade)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: theme.gold }}>
                    {fmt(c.valorMonitoramento)}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600 }}>
                    {diaVenc ? `Dia ${diaVenc}` : '—'}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: 12, color: theme.muted }}>
                    {formatDate(c.primeiroFaturamento)}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, color: mesesAtivos >= 12 ? theme.success : mesesAtivos > 0 ? theme.warning : theme.muted }}>
                      {mesesAtivos > 0 ? `${mesesAtivos}m` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: 12, color: theme.muted }}>{c.fone1 || '—'}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ color: theme.muted, textAlign: 'center', padding: 30 }}>Nenhum cliente encontrado</div>
        )}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted, display: 'flex', justifyContent: 'space-between' }}>
            <span>Exibindo {filtered.length} de {clientes.length} clientes</span>
            <span>MRR filtrado: <strong style={{ color: theme.gold }}>{fmt(mrrTotal)}</strong></span>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'comissoes' | 'clientes';

export function ComissoesPage() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [tab, setTab] = useState<TabId>('comissoes');
  const [vendedores, setVendedores] = useState<ComissaoVendedor[]>([]);
  const [todosUsuarios, setTodosUsuarios] = useState<string[]>([]);
  const [clientesAtivos, setClientesAtivos] = useState<ClienteAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cfg, setCfg] = useState<ComissaoConfig>(DEFAULT_COMISSAO_CONFIG);
  const [overrides, setOverrides] = useState<Record<number, ComissaoOverride>>({});
  const [vendedoresAtivos, setVendedoresAtivos] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ComissaoClienteInfo | null>(null);

  // Load config + overrides + vendedores ativos from AppKv
  useEffect(() => {
    loadState<ComissaoConfig>('config:comissoes', DEFAULT_COMISSAO_CONFIG).then(setCfg);
    loadState<Record<number, ComissaoOverride>>('comissoes:overrides', {}).then(setOverrides);
    loadState<string[]>('comissoes:vendedores_ativos', []).then(setVendedoresAtivos);
  }, []);

  // Load vendedores data from API
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, usuarios] = await Promise.all([
        ds.comissoes.getVendedores(),
        ds.comissoes.getUsuariosDisponiveis(),
      ]);
      setVendedores(result.vendedores);
      setTodosUsuarios(usuarios.usuarios);
    } catch (err) {
      setError('Erro ao carregar dados de comissoes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load clientes ativos
  const loadClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const result = await ds.comissoes.getClientesAtivos();
      setClientesAtivos(result.clientes);
    } catch (err) {
      console.error('Erro ao carregar clientes ativos:', err);
    } finally {
      setLoadingClientes(false);
    }
  }, []);

  useEffect(() => { load(); loadClientes(); }, [load, loadClientes]);

  // Filter vendedores to only show active ones
  const vendedoresFiltrados = useMemo(() => {
    if (vendedoresAtivos.length === 0) return vendedores; // If none configured, show all
    return vendedores.filter((v) => vendedoresAtivos.includes(v.usuario));
  }, [vendedores, vendedoresAtivos]);

  const updateOverrides = useCallback((next: Record<number, ComissaoOverride>) => {
    setOverrides(next);
    saveState('comissoes:overrides', next);
  }, []);

  const handleSaveConfig = useCallback((next: ComissaoConfig, vendedores: string[]) => {
    setCfg(next);
    saveState('config:comissoes', next);
    setVendedoresAtivos(vendedores);
    saveState('comissoes:vendedores_ativos', vendedores);
    setShowConfig(false);
  }, []);

  const handleSaveOverride = useCallback((cli: ComissaoClienteInfo, ov: ComissaoOverride) => {
    updateOverrides({ ...overrides, [cli.codInterno]: ov });
    setEditingCliente(null);
  }, [overrides, updateOverrides]);

  const getEffective = useCallback((cli: ComissaoClienteInfo) => {
    const ov = overrides[cli.codInterno];
    if (ov) return { status: ov.status, pagamento: ov.pagamento, obs: ov.observacoes };
    return { status: deriveComissaoStatus(cli, cfg), pagamento: 'em_dia' as PagamentoStatus, obs: undefined };
  }, [overrides, cfg]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'comissoes', label: 'Comissoes por Vendedor' },
    { id: 'clientes', label: 'Clientes Ativos' },
  ];

  return (
    <AppShell title="Comissoes">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, color: theme.muted }}>
          <strong style={{ color: theme.text }}>{cfg.qtdMensalidadesComissao} mensalidades</strong> de comissao
          {' | '}Adesao: <strong style={{ color: theme.text }}>{(cfg.multiplicadorAdesao * 100).toFixed(0)}%</strong>
          {' | '}Prazo: <strong style={{ color: theme.text }}>{cfg.prazoMinimoMeses} meses</strong>
          {vendedoresAtivos.length > 0 && (
            <> | Vendedores: <strong style={{ color: theme.gold }}>{vendedoresAtivos.join(', ')}</strong></>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { load(); loadClientes(); }} style={btnSecondary}>Atualizar</button>
          {isAdmin && (
            <button onClick={() => setShowConfig(true)} style={btnPrimary}>Configurar</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${theme.border}`, paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            borderBottom: tab === t.id ? `2px solid ${theme.gold}` : '2px solid transparent',
            background: 'transparent',
            color: tab === t.id ? theme.gold : theme.muted,
            transition: 'color 150ms, border-color 150ms',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && tab === 'comissoes' && <div style={{ color: theme.muted, padding: 20 }}>Carregando...</div>}
      {error && <div style={{ color: theme.danger, padding: 20 }}>{error}</div>}

      {/* Tab content */}
      {tab === 'comissoes' && !loading && !error && (
        <TabComissoes
          vendedores={vendedoresFiltrados}
          cfg={cfg}
          overrides={overrides}
          isAdmin={isAdmin}
          role={role}
          getEffective={getEffective}
          onEditCliente={setEditingCliente}
        />
      )}

      {tab === 'clientes' && (
        <TabClientesAtivos clientes={clientesAtivos} loading={loadingClientes} />
      )}

      {/* Config Modal */}
      {showConfig && (
        <ConfigModal
          cfg={cfg}
          vendedoresAtivos={vendedoresAtivos}
          todosUsuarios={todosUsuarios}
          onSave={handleSaveConfig}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* Override Modal */}
      {editingCliente && (
        <OverrideModal
          clienteNome={editingCliente.clienteNome}
          current={overrides[editingCliente.codInterno] || {
            status: deriveComissaoStatus(editingCliente, cfg),
            pagamento: 'em_dia',
          }}
          onSave={(ov) => handleSaveOverride(editingCliente, ov)}
          onClose={() => setEditingCliente(null)}
        />
      )}
    </AppShell>
  );
}
