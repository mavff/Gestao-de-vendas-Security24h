'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { loadState, saveState } from '../../services/appState';
import { photoSrc, uploadContrato } from '../../services/photoService';
import type { VendaLocal, ActivityLog } from '../../types';

/* ================================================================
   Pipeline stages (derivadas do estado da VendaLocal)
   ================================================================ */

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface StageDef {
  id: StageId;
  label: string;
  shortLabel: string;
  vendedorColor: string;
  adminColor: string;
  nextAction: () => string;
}

const STAGE_DEFS: StageDef[] = [
  { id: 1, label: 'Novo',                              shortLabel: 'Novo',        vendedorColor: '#8E7B3A', adminColor: '#6B7280',
    nextAction: () => 'Montar solução e gerar proposta' },
  { id: 2, label: 'Proposta Enviada',                  shortLabel: 'Proposta',    vendedorColor: '#C8A951', adminColor: '#5B9BD5',
    nextAction: () => 'Cobrar retorno do cliente' },
  { id: 3, label: 'Aprovada / Aguardando Contrato',    shortLabel: 'Contrato',    vendedorColor: '#D4B968', adminColor: '#7BA9D1',
    nextAction: () => 'Anexar contrato assinado' },
  { id: 4, label: 'Contrato Assinado',                 shortLabel: '1ª Visita',   vendedorColor: '#E0C87F', adminColor: '#9BBFE0',
    nextAction: () => 'Agendar 1ª visita técnica' },
  { id: 5, label: '1ª Visita OK',                      shortLabel: 'Instalar',    vendedorColor: '#F0D685', adminColor: '#C1D7E8',
    nextAction: () => 'Agendar instalação' },
  { id: 6, label: 'Em Instalação',                     shortLabel: 'Instalando',  vendedorColor: '#FF9800', adminColor: '#4A7FA8',
    nextAction: () => 'Acompanhar instalação' },
  { id: 7, label: 'Instalada / Aguardando 2ª Visita',  shortLabel: '2ª Visita',   vendedorColor: '#43C17B', adminColor: '#385E7C',
    nextAction: () => 'Fazer entrega final / 2ª visita' },
  { id: 8, label: 'Entregue ✓',                        shortLabel: 'Entregue',    vendedorColor: '#2ECC71', adminColor: '#2E5266',
    nextAction: () => 'Venda concluída' },
  { id: 9, label: 'Perdida / Cancelada',               shortLabel: 'Perdida',     vendedorColor: '#8B3A3A', adminColor: '#8B3A3A',
    nextAction: () => 'Arquivada' },
];

function computeStage(v: VendaLocal): StageId {
  if (v.status === 'perdida') return 9;
  if (v.visita2Concluida || v.status === 'concluida') return 8;
  if (v.instalacaoConcluidaEm) return 7;
  if (v.instalacaoAgendadaEm || v.status === 'em_instalacao') return 6;
  if (v.visita1Concluida) return 5;
  if (v.contratoUrl) return 4;
  if (v.clienteAprovado) return 3;
  if (v.propostaId) return 2;
  return 1;
}

function daysSince(iso: string | undefined): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

/* ================================================================
   Root
   ================================================================ */

export function KanbanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [vendas, setVendas] = useState<VendaLocal[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [uploadTarget, setUploadTarget] = useState<VendaLocal | null>(null);

  useEffect(() => {
    loadState<VendaLocal[]>('vendedor_vendas', []).then(setVendas);
    loadState<ActivityLog[]>('vendedor_logs', []).then(setLogs);
  }, []);

  const role = user?.role ?? 'VENDEDOR';
  const isAdmin = role === 'ADMIN' || role === 'GESTOR';

  const myVendas = useMemo(() => {
    if (isAdmin) return vendas;
    const me = user?.username ?? '';
    return vendas.filter((v) => v.criadoPor === me);
  }, [vendas, isAdmin, user]);

  const lastActivity = useMemo(() => {
    const map: Record<string, ActivityLog> = {};
    for (const log of logs) {
      if (!map[log.vendaId] || log.createdAt > map[log.vendaId].createdAt) {
        map[log.vendaId] = log;
      }
    }
    return map;
  }, [logs]);

  const stageCounts = useMemo(() => {
    const counts: Record<StageId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const v of myVendas) counts[computeStage(v)]++;
    return counts;
  }, [myVendas]);

  async function handleUploadContrato(venda: VendaLocal, file: File) {
    const { contratoUrl, contratoAssinadoEm } = await uploadContrato(venda.id, file);
    const updated = vendas.map((v) =>
      v.id === venda.id ? { ...v, contratoUrl, contratoAssinadoEm, updatedAt: new Date().toISOString() } : v,
    );
    setVendas(updated);
    await saveState('vendedor_vendas', updated);
    setUploadTarget(null);
  }

  return (
    <AppShell title={isAdmin ? 'Pipeline — Visão Gestão' : 'Meu Pipeline'}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
        {([
          { label: 'Ativas',              value: myVendas.filter((v) => computeStage(v) < 8).length, color: isAdmin ? '#5B9BD5' : theme.gold },
          { label: 'Em Instalação',       value: stageCounts[6],                                      color: '#FF9800' },
          { label: 'Aguardando contrato', value: stageCounts[3],                                      color: isAdmin ? '#7BA9D1' : '#D4B968' },
          { label: 'Entregues',           value: stageCounts[8],                                      color: theme.success },
          { label: 'Perdidas',            value: stageCounts[9],                                      color: theme.danger },
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

      {uploadTarget && (
        <ContratoUploadModal venda={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUpload={(file) => handleUploadContrato(uploadTarget, file)} />
      )}

      {myVendas.length === 0 ? (
        <div style={{
          border: `1px dashed ${theme.border}`, borderRadius: 12,
          padding: 40, textAlign: 'center', color: theme.muted,
        }}>
          {isAdmin
            ? 'Nenhum vendedor tem vendas no pipeline ainda.'
            : <>Você ainda não tem vendas no pipeline. Crie uma em <strong style={{ color: theme.gold }}>Minhas Vendas</strong>.</>}
        </div>
      ) : isAdmin ? (
        <AdminMatrixView vendas={myVendas} onOpen={(id) => router.push(`/venda/${id}`)} />
      ) : (
        <VendedorSwimlaneView
          vendas={myVendas}
          lastActivity={lastActivity}
          onOpen={(id) => router.push(`/venda/${id}`)}
          onUploadContrato={setUploadTarget}
        />
      )}
    </AppShell>
  );
}

/* ================================================================
   Vendedor — Swim-lane view
   ================================================================ */

function VendedorSwimlaneView({ vendas, lastActivity, onOpen, onUploadContrato }: {
  vendas: VendaLocal[];
  lastActivity: Record<string, ActivityLog>;
  onOpen: (id: string) => void;
  onUploadContrato: (v: VendaLocal) => void;
}) {
  const byStage = useMemo(() => {
    const map: Record<StageId, VendaLocal[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
    for (const v of vendas) map[computeStage(v)].push(v);
    for (const k of Object.keys(map) as unknown as StageId[]) {
      map[k].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return map;
  }, [vendas]);

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
      {STAGE_DEFS.map((stage) => {
        const list = byStage[stage.id];
        return (
          <div key={stage.id} style={{
            minWidth: 260, flex: '0 0 260px',
            background: theme.panel, border: `1px solid ${theme.border}`,
            borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
            maxHeight: 'calc(100vh - 260px)', overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              paddingBottom: 8, borderBottom: `2px solid ${stage.vendedorColor}`,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: stage.vendedorColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.text, flex: 1 }}>{stage.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: stage.vendedorColor,
                background: stage.vendedorColor + '22',
                padding: '2px 8px', borderRadius: 999,
              }}>{list.length}</span>
            </div>

            {list.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 11, textAlign: 'center', padding: '14px 0' }}>—</div>
            ) : list.map((venda) => (
              <VendedorCard
                key={venda.id}
                venda={venda}
                stage={stage}
                last={lastActivity[venda.id]}
                onOpen={() => onOpen(venda.id)}
                onUploadContrato={() => onUploadContrato(venda)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function VendedorCard({ venda, stage, last, onOpen, onUploadContrato }: {
  venda: VendaLocal;
  stage: StageDef;
  last: ActivityLog | undefined;
  onOpen: () => void;
  onUploadContrato: () => void;
}) {
  const days = daysSince(venda.updatedAt);
  const cold = days >= 5 && stage.id < 8;
  const wantsContrato = stage.id === 3;

  return (
    <div style={{
      background: theme.soft, border: `1px solid ${cold ? theme.danger : theme.border}`,
      borderRadius: 8, padding: 10, position: 'relative',
      borderLeft: `3px solid ${stage.vendedorColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={onOpen}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {venda.clienteNome}
          </div>
          {venda.clienteEmpresa && (
            <div style={{ fontSize: 11, color: theme.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {venda.clienteEmpresa}
            </div>
          )}
        </div>
      </div>

      <div style={{
        fontSize: 11, color: stage.vendedorColor, fontWeight: 600,
        background: stage.vendedorColor + '15', padding: '4px 8px', borderRadius: 6,
        marginBottom: 6,
      }}>
        → {stage.nextAction()}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10, color: theme.muted, flexWrap: 'wrap' }}>
        {venda.tipoLocal && <span>{venda.tipoLocal}</span>}
        {venda.clienteTelefone && <span>{venda.clienteTelefone}</span>}
        <span style={{ color: cold ? theme.danger : theme.muted, fontWeight: cold ? 700 : 400 }}>
          {days === 0 ? 'hoje' : `${days}d parada`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <button onClick={onOpen} style={{ ...chipBtn, flex: 1, minWidth: 80 }}>Abrir</button>
        {wantsContrato && (
          <button onClick={onUploadContrato} style={{
            ...chipBtn, background: stage.vendedorColor, color: '#111', fontWeight: 700, flex: 1, minWidth: 110,
          }}>📎 Anexar contrato</button>
        )}
        {venda.contratoUrl && stage.id !== 9 && (
          <a href={photoSrc(venda.contratoUrl)} target="_blank" rel="noreferrer"
            style={{ ...chipBtn, textDecoration: 'none', textAlign: 'center' }}>
            📄 Ver contrato
          </a>
        )}
      </div>

      {last && (
        <div style={{ fontSize: 10, color: theme.muted, marginTop: 6, borderTop: `1px solid ${theme.border}`, paddingTop: 6 }}>
          {last.descricao}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Admin/Gestor — Matriz agregada
   ================================================================ */

function AdminMatrixView({ vendas, onOpen }: {
  vendas: VendaLocal[];
  onOpen: (id: string) => void;
}) {
  const [drillVendedor, setDrillVendedor] = useState<string | null>(null);
  const [drillStage, setDrillStage] = useState<StageId | null>(null);

  const vendedores = useMemo(() => {
    const set = new Set<string>();
    for (const v of vendas) if (v.criadoPor) set.add(v.criadoPor);
    return Array.from(set).sort();
  }, [vendas]);

  const matrix = useMemo(() => {
    const m: Record<string, Record<StageId, number>> = {};
    for (const vend of vendedores) m[vend] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const v of vendas) {
      if (!v.criadoPor || !m[v.criadoPor]) continue;
      m[v.criadoPor][computeStage(v)]++;
    }
    return m;
  }, [vendas, vendedores]);

  const totalsByStage = useMemo(() => {
    const t: Record<StageId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const v of vendas) t[computeStage(v)]++;
    return t;
  }, [vendas]);

  const drillList = useMemo(() => {
    if (!drillVendedor || !drillStage) return [];
    return vendas.filter((v) => v.criadoPor === drillVendedor && computeStage(v) === drillStage);
  }, [vendas, drillVendedor, drillStage]);

  return (
    <>
      <div style={{ overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#0f1419' }}>
              <th style={thStyleSticky}>Vendedor</th>
              {STAGE_DEFS.map((s) => (
                <th key={s.id} style={{
                  ...thStyle,
                  borderBottom: `2px solid ${s.adminColor}`,
                  color: s.adminColor, minWidth: 72,
                }} title={s.label}>
                  {s.shortLabel}
                </th>
              ))}
              <th style={{ ...thStyle, color: theme.gold }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map((vend, idx) => {
              const row = matrix[vend];
              const total = STAGE_DEFS.reduce((sum, s) => sum + row[s.id], 0);
              return (
                <tr key={vend} style={{ background: idx % 2 === 0 ? theme.panel : '#0d1115' }}>
                  <td style={tdStyleSticky}>{vend}</td>
                  {STAGE_DEFS.map((s) => {
                    const n = row[s.id];
                    return (
                      <td key={s.id} style={{ ...tdStyle, background: n > 0 ? s.adminColor + '18' : 'transparent' }}>
                        {n === 0 ? (
                          <span style={{ color: theme.muted }}>–</span>
                        ) : (
                          <button
                            onClick={() => { setDrillVendedor(vend); setDrillStage(s.id); }}
                            style={{
                              background: 'transparent', border: `1px solid ${s.adminColor}`,
                              color: s.adminColor, borderRadius: 6, padding: '2px 10px',
                              cursor: 'pointer', fontWeight: 700, fontSize: 12, minWidth: 34,
                            }}>
                            {n}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle, color: theme.gold, fontWeight: 700 }}>{total}</td>
                </tr>
              );
            })}
            <tr style={{ background: '#141823', borderTop: `2px solid ${theme.border}` }}>
              <td style={{ ...tdStyleSticky, fontWeight: 700, color: theme.text }}>Total</td>
              {STAGE_DEFS.map((s) => (
                <td key={s.id} style={{ ...tdStyle, color: s.adminColor, fontWeight: 700 }}>
                  {totalsByStage[s.id]}
                </td>
              ))}
              <td style={{ ...tdStyle, color: theme.gold, fontWeight: 700 }}>{vendas.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {drillVendedor && drillStage && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => { setDrillVendedor(null); setDrillStage(null); }}>
          <div style={{
            background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14,
            padding: 20, maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: theme.muted }}>{drillVendedor}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: STAGE_DEFS.find((s) => s.id === drillStage)!.adminColor }}>
                {STAGE_DEFS.find((s) => s.id === drillStage)!.label}
              </div>
              <div style={{ fontSize: 12, color: theme.muted }}>{drillList.length} venda(s)</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {drillList.map((v) => (
                <button key={v.id} onClick={() => onOpen(v.id)}
                  style={{
                    textAlign: 'left', background: theme.soft, border: `1px solid ${theme.border}`,
                    borderRadius: 8, padding: 10, cursor: 'pointer', color: theme.text,
                  }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v.clienteNome}</div>
                  <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                    {v.tipoLocal} · {daysSince(v.updatedAt)}d parada · {v.clienteTelefone || 's/ telefone'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================
   Upload contrato modal
   ================================================================ */

function ContratoUploadModal({ venda, onClose, onUpload }: {
  venda: VendaLocal;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16,
        padding: 24, maxWidth: 440, width: '100%',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px', color: theme.gold, fontSize: 17 }}>Anexar contrato assinado</h3>
        <p style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>
          Cliente: <strong style={{ color: theme.text }}>{venda.clienteNome}</strong>
          <br />
          Aceita PDF, JPG ou PNG (máx. 20 MB).
        </p>

        <label style={{
          display: 'block', border: `2px dashed ${file ? theme.gold : theme.border}`,
          borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer',
          background: file ? 'rgba(200,169,81,0.08)' : theme.soft, marginBottom: 14,
        }}>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
          />
          {file ? (
            <>
              <div style={{ fontSize: 13, color: theme.gold, fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB · clique para trocar
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: theme.text }}>Clique para selecionar arquivo</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>ou arraste para cá</div>
            </>
          )}
        </label>

        {error && (
          <div style={{ fontSize: 12, color: theme.danger, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSoft} disabled={uploading}>Cancelar</button>
          <button onClick={handleSubmit} disabled={!file || uploading}
            style={{ ...btnGold, opacity: !file || uploading ? 0.5 : 1 }}>
            {uploading ? 'Enviando…' : 'Anexar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Styles ---- */

const btnGold: React.CSSProperties = {
  background: theme.gold, border: 'none', borderRadius: 8,
  color: '#111', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
};

const btnSoft: React.CSSProperties = {
  background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8,
  color: theme.text, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
};

const chipBtn: React.CSSProperties = {
  background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6,
  color: theme.text, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
};

const thStyle: React.CSSProperties = {
  padding: '10px 6px', textAlign: 'center', fontSize: 11, fontWeight: 600,
  borderBottom: `1px solid ${theme.border}`,
};

const thStyleSticky: React.CSSProperties = {
  ...thStyle, textAlign: 'left', paddingLeft: 14, position: 'sticky', left: 0,
  background: '#0f1419', zIndex: 1, minWidth: 130,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 6px', textAlign: 'center', borderBottom: `1px solid ${theme.border}`,
};

const tdStyleSticky: React.CSSProperties = {
  ...tdStyle, textAlign: 'left', paddingLeft: 14, position: 'sticky', left: 0,
  background: 'inherit', fontWeight: 600, color: theme.text, minWidth: 130,
};
