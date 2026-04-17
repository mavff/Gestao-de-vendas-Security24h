'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { loadState, saveState } from '../../services/appState';
import { compressImage } from '../../services/imageUtils';
import { photoSrc, uploadBase64Photo } from '../../services/photoService';
import { apiClient } from '../../lib/apiClient';
import { btnGold, btnSoft, inputStyle, labelStyle } from '../venda/shared/styles';
import {
  ATRIBUICAO_TECNICO_KEY,
  DEFAULT_ATRIBUICAO_TECNICO_CONFIG,
  AtribuicaoTecnicoConfig,
  escolherTecnicoRoundRobin,
} from '../venda/shared/configs';
import type { OrdemDeServico, OSStatus, VendaLocal, Vistoria, UserRole } from '../../types';

const isApiMode = process.env.NEXT_PUBLIC_DATA_SOURCE === 'api';

type AppUserSummary = { id: string; username: string; name: string; role: UserRole; active: boolean };

const STATUS_LABEL: Record<OSStatus, string> = {
  bloqueada: 'Bloqueada',
  pendente: 'Pendente',
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  semi_concluida: 'Aguardando validação',
  concluida: 'Concluída',
};

const STATUS_COLOR: Record<OSStatus, string> = {
  bloqueada: theme.muted,
  pendente: theme.warning,
  agendada: '#5B9BD5',
  em_andamento: '#FF9800',
  semi_concluida: '#C077DB',
  concluida: theme.success,
};

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function InstalacoesPage() {
  const { showToast } = useToast();
  const { user, role } = useAuth();
  const username = user?.username ?? '';
  const isTecnico = role === 'TECNICO';
  const isAdminOrGestor = role === 'ADMIN' || role === 'GESTOR';
  const canConfig = role === 'ADMIN';

  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [vendas, setVendas] = useState<VendaLocal[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [tecnicos, setTecnicos] = useState<AppUserSummary[]>([]);
  const [atribCfg, setAtribCfg] = useState<AtribuicaoTecnicoConfig>(DEFAULT_ATRIBUICAO_TECNICO_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<'ativas' | 'concluidas' | 'todas'>('ativas');

  const [semiModal, setSemiModal] = useState<OrdemDeServico | null>(null);
  const [validModal, setValidModal] = useState<OrdemDeServico | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [os, vs, vsts] = await Promise.all([
      loadState<OrdemDeServico[]>('ordens_servico', []),
      loadState<VendaLocal[]>('vendedor_vendas', []),
      loadState<Vistoria[]>('vistorias', []),
    ]);
    setOrdens(os);
    setVendas(vs);
    setVistorias(vsts);
  }, []);

  useEffect(() => {
    (async () => {
      await reload();
      const cfg = await loadState<AtribuicaoTecnicoConfig>(ATRIBUICAO_TECNICO_KEY, DEFAULT_ATRIBUICAO_TECNICO_CONFIG);
      setAtribCfg(cfg);
      if (isApiMode) {
        try {
          const { data } = await apiClient.get<Array<{ id: number; username: string; name: string; role: UserRole; active: boolean }>>('/app-users');
          setTecnicos(data
            .filter((u) => u.role === 'TECNICO' && u.active !== false)
            .map((u) => ({ id: String(u.id), username: u.username, name: u.name, role: u.role, active: u.active !== false })));
        } catch {
          setTecnicos([]);
        }
      }
      setLoaded(true);
    })();
  }, [reload]);

  const ordensVisiveis = useMemo(() => {
    let list = ordens;
    if (isTecnico) list = list.filter((o) => o.tecnicoId === username);
    if (filter === 'ativas') {
      list = list.filter((o) => o.status !== 'concluida' && o.status !== 'bloqueada');
    } else if (filter === 'concluidas') {
      list = list.filter((o) => o.status === 'concluida');
    }
    return [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [ordens, filter, isTecnico, username]);

  const vendaByLeadId = useMemo(() => {
    const m = new Map<string, VendaLocal>();
    vendas.forEach((v) => m.set(v.id, v));
    return m;
  }, [vendas]);

  const vistoriaById = useMemo(() => {
    const m = new Map<string, Vistoria>();
    vistorias.forEach((v) => m.set(v.id, v));
    return m;
  }, [vistorias]);

  async function persistOrdens(next: OrdemDeServico[]) {
    setOrdens(next);
    await saveState('ordens_servico', next);
  }

  async function handleAssignTecnico(os: OrdemDeServico, tecnicoUsername: string) {
    const next = ordens.map((o) => o.id === os.id ? { ...o, tecnicoId: tecnicoUsername } : o);
    await persistOrdens(next);
    showToast('Técnico atribuído', 'success');
  }

  async function handleAutoAssignAll() {
    const pendentesSemTecnico = ordens.filter((o) => !o.tecnicoId && o.status === 'pendente');
    if (pendentesSemTecnico.length === 0) { showToast('Nenhuma OS pendente sem técnico', 'warning'); return; }
    if (atribCfg.tecnicosAtivos.length === 0) { showToast('Nenhum técnico ativo configurado', 'warning'); return; }
    let next = [...ordens];
    for (const os of pendentesSemTecnico) {
      const chosen = escolherTecnicoRoundRobin(atribCfg.tecnicosAtivos, next);
      if (!chosen) break;
      next = next.map((o) => o.id === os.id ? { ...o, tecnicoId: chosen, status: 'agendada' as OSStatus } : o);
    }
    await persistOrdens(next);
    showToast(`${pendentesSemTecnico.length} OS atribuídas via round-robin`, 'success');
  }

  async function handleStartOS(os: OrdemDeServico) {
    const next = ordens.map((o) => o.id === os.id ? { ...o, status: 'em_andamento' as OSStatus } : o);
    await persistOrdens(next);
    showToast('OS marcada como em andamento', 'success');
  }

  async function handleSemiConcluir(os: OrdemDeServico, fotoToken: string, observacoes: string) {
    const next = ordens.map((o) => o.id === os.id ? {
      ...o,
      status: 'semi_concluida' as OSStatus,
      fotoComprovante: fotoToken,
      observacoesTecnico: observacoes,
      semiConcluidaEm: new Date().toISOString(),
    } : o);
    await persistOrdens(next);
    showToast('Instalação marcada como semi-concluída. Aguardando validação.', 'success');
    setSemiModal(null);
  }

  async function handleValidar(os: OrdemDeServico, aprovar: boolean) {
    const now = new Date().toISOString();
    if (aprovar) {
      const next = ordens.map((o) => o.id === os.id ? {
        ...o,
        status: 'concluida' as OSStatus,
        concluidaEm: now,
        validadoPor: username,
      } : o);
      await persistOrdens(next);

      const venda = vendaByLeadId.get(os.leadId);
      if (venda) {
        const vendasNext = vendas.map((v) => v.id === venda.id ? {
          ...v,
          status: 'entrega' as VendaLocal['status'],
          instalacaoConcluidaEm: now,
          updatedAt: now,
        } : v);
        setVendas(vendasNext);
        await saveState('vendedor_vendas', vendasNext);
      }
      showToast('Instalação validada e concluída', 'success');
    } else {
      const next = ordens.map((o) => o.id === os.id ? {
        ...o,
        status: 'em_andamento' as OSStatus,
        observacoesTecnico: (o.observacoesTecnico || '') + '\n[Validação rejeitada em ' + fmtDate(now) + ']',
      } : o);
      await persistOrdens(next);
      showToast('Validação rejeitada. OS voltou para "em andamento".', 'warning');
    }
    setValidModal(null);
  }

  async function saveConfig(cfg: AtribuicaoTecnicoConfig) {
    setAtribCfg(cfg);
    await saveState(ATRIBUICAO_TECNICO_KEY, cfg);
    setConfigOpen(false);
    showToast('Configuração salva', 'success');
  }

  if (!loaded) {
    return <AppShell title="Instalações"><div style={{ color: theme.muted, padding: 24 }}>Carregando…</div></AppShell>;
  }

  return (
    <AppShell title="Instalações">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {(['ativas', 'concluidas', 'todas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...btnSoft,
              background: filter === f ? theme.gold : theme.soft,
              color: filter === f ? '#111' : theme.text,
              padding: '8px 14px',
              fontWeight: filter === f ? 700 : 400,
            }}
          >
            {f === 'ativas' ? 'Ativas' : f === 'concluidas' ? 'Concluídas' : 'Todas'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {isAdminOrGestor && atribCfg.modo === 'auto_round_robin' && (
          <button onClick={handleAutoAssignAll} style={btnSoft}>Atribuir pendentes (auto)</button>
        )}
        {canConfig && (
          <button onClick={() => setConfigOpen(true)} style={btnSoft}>⚙ Atribuição</button>
        )}
      </div>

      {ordensVisiveis.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: theme.muted, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>
          {isTecnico ? 'Nenhuma OS atribuída a você.' : 'Nenhuma OS neste filtro.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ordensVisiveis.map((os) => {
            const venda = vendaByLeadId.get(os.leadId);
            const vistoria = os.vistoriaId ? vistoriaById.get(os.vistoriaId) : undefined;
            const totalFotos = vistoria?.ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0) ?? 0;
            const tecNome = os.tecnicoId
              ? (tecnicos.find((t) => t.username === os.tecnicoId)?.name || os.tecnicoId)
              : '—';

            return (
              <div key={os.id} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{os.cliente || '(sem cliente)'}</div>
                    <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                      OS {os.id.slice(0, 8)} · Criada {fmtDate(os.createdAt)}
                    </div>
                  </div>
                  <span style={{
                    background: STATUS_COLOR[os.status] + '22',
                    color: STATUS_COLOR[os.status],
                    border: `1px solid ${STATUS_COLOR[os.status]}55`,
                    borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  }}>
                    {STATUS_LABEL[os.status]}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 13, marginBottom: 10 }}>
                  <div><div style={{ color: theme.muted, fontSize: 11 }}>Técnico</div><div>{tecNome}</div></div>
                  <div><div style={{ color: theme.muted, fontSize: 11 }}>Endereço</div><div>{venda?.clienteEndereco || '—'}</div></div>
                  <div><div style={{ color: theme.muted, fontSize: 11 }}>Telefone</div><div>{venda?.clienteTelefone || '—'}</div></div>
                  <div><div style={{ color: theme.muted, fontSize: 11 }}>Pontos / Fotos</div><div>{os.pontos?.length ?? 0} / {totalFotos}</div></div>
                </div>

                {os.observacoes && (
                  <div style={{ fontSize: 12, color: theme.muted, marginBottom: 10, padding: 8, background: theme.soft, borderRadius: 8 }}>
                    <strong style={{ color: theme.text }}>Obs do vendedor:</strong> {os.observacoes}
                  </div>
                )}

                {os.status === 'semi_concluida' && (
                  <div style={{ background: '#C077DB12', border: '1px solid #C077DB44', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: '#C077DB', fontWeight: 700, marginBottom: 6 }}>
                      Semi-concluída {fmtDate(os.semiConcluidaEm)}
                    </div>
                    {os.fotoComprovante && (
                      <img
                        src={photoSrc(os.fotoComprovante)}
                        alt="Comprovante"
                        onClick={() => setPhotoLightbox(photoSrc(os.fotoComprovante!))}
                        style={{ maxWidth: 200, borderRadius: 8, cursor: 'pointer', marginBottom: 6 }}
                      />
                    )}
                    {os.observacoesTecnico && (
                      <div style={{ fontSize: 12, color: theme.text, whiteSpace: 'pre-wrap' }}>{os.observacoesTecnico}</div>
                    )}
                  </div>
                )}

                {vistoria && totalFotos > 0 && (
                  <VistoriaFotosRef vistoria={vistoria} onPhotoClick={(src) => setPhotoLightbox(src)} />
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {isTecnico && os.status === 'agendada' && (
                    <button onClick={() => handleStartOS(os)} style={btnGold}>Iniciar instalação</button>
                  )}
                  {isTecnico && (os.status === 'em_andamento' || os.status === 'agendada') && (
                    <button onClick={() => setSemiModal(os)} style={btnGold}>Marcar semi-concluída</button>
                  )}
                  {isAdminOrGestor && os.status === 'pendente' && atribCfg.modo === 'manual' && (
                    <select
                      value={os.tecnicoId || ''}
                      onChange={(e) => handleAssignTecnico(os, e.target.value)}
                      style={{ ...inputStyle, marginBottom: 0, maxWidth: 240 }}
                    >
                      <option value="">Atribuir técnico…</option>
                      {tecnicos.map((t) => (
                        <option key={t.username} value={t.username}>{t.name || t.username}</option>
                      ))}
                    </select>
                  )}
                  {isAdminOrGestor && os.status === 'semi_concluida' && (
                    <button onClick={() => setValidModal(os)} style={btnGold}>Validar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {semiModal && (
        <SemiConcluirModal
          os={semiModal}
          onClose={() => setSemiModal(null)}
          onSave={handleSemiConcluir}
        />
      )}

      {validModal && (
        <ValidarModal
          os={validModal}
          onClose={() => setValidModal(null)}
          onDecidir={handleValidar}
          onPhotoClick={(src) => setPhotoLightbox(src)}
        />
      )}

      {configOpen && (
        <ConfigAtribuicaoModal
          initial={atribCfg}
          tecnicos={tecnicos}
          onClose={() => setConfigOpen(false)}
          onSave={saveConfig}
        />
      )}

      {photoLightbox && (
        <div
          onClick={() => setPhotoLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out' }}
        >
          <img src={photoLightbox} alt="Foto" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12 }} />
        </div>
      )}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Vistoria fotos reference                                          */
/* ------------------------------------------------------------------ */

function VistoriaFotosRef({ vistoria, onPhotoClick }: { vistoria: Vistoria; onPhotoClick: (src: string) => void }) {
  const [open, setOpen] = useState(false);
  const totalPhotos = vistoria.ambientes.reduce((s, a) => s + a.pontos.reduce((ss, p) => ss + p.photos.length, 0), 0);

  return (
    <div style={{ background: '#C077DB10', border: '1px solid #C077DB33', borderRadius: 10, overflow: 'hidden', marginBottom: 6 }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#C077DB', fontWeight: 700 }}>📋 Referência da 1ª Visita · {totalPhotos} fotos com X</span>
        <span style={{ color: theme.muted, fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          {vistoria.ambientes.map((amb) => {
            if (amb.pontos.every((p) => p.photos.length === 0)) return null;
            return (
              <div key={amb.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{amb.nome}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amb.pontos.flatMap((p) => p.photos.map((photo, idx) => {
                    const src = photoSrc(photo);
                    return (
                      <img
                        key={`${p.id}-${idx}`}
                        src={src}
                        alt={`${amb.nome} ${p.type}`}
                        onClick={() => onPhotoClick(src)}
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: `1px solid ${theme.border}` }}
                      />
                    );
                  }))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: marcar semi-concluída                                      */
/* ------------------------------------------------------------------ */

function SemiConcluirModal({
  os,
  onClose,
  onSave,
}: {
  os: OrdemDeServico;
  onClose: () => void;
  onSave: (os: OrdemDeServico, fotoToken: string, observacoes: string) => void | Promise<void>;
}) {
  const { showToast } = useToast();
  const [photo, setPhoto] = useState<string>('');
  const [obs, setObs] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const b64 = await compressImage(f, 1200, 0.75);
      setPhoto(b64);
    } catch {
      showToast('Falha ao processar foto', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSave() {
    if (!photo) { showToast('Anexe uma foto de comprovação', 'warning'); return; }
    setSaving(true);
    try {
      let token = photo;
      if (photo.startsWith('data:')) {
        token = await uploadBase64Photo(photo, { entityType: 'os', entityId: os.id });
      }
      await onSave(os, token, obs.trim());
    } catch {
      showToast('Falha ao salvar. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ margin: 0, marginBottom: 4, color: theme.gold, fontSize: 16 }}>Marcar semi-concluída</h3>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>
          Anexe uma foto da instalação finalizada. O vendedor/gestor validará para concluir.
        </div>

        <label style={labelStyle}>Foto de comprovação *</label>
        {photo ? (
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <img src={photo.startsWith('data:') ? photo : photoSrc(photo)} alt="Comprovante" style={{ width: '100%', borderRadius: 10 }} />
            <button
              onClick={() => setPhoto('')}
              style={{ position: 'absolute', top: 6, right: 6, background: theme.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}
            >
              Remover
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...btnGold, flex: 1 }}>
              {uploading ? 'Processando…' : '📷 Tirar / escolher foto'}
            </button>
          </div>
        )}

        <label style={labelStyle}>Observações do técnico</label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ex: cabeamento reforçado, sensor realocado por obstáculo…"
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSoft} disabled={saving}>Cancelar</button>
          <button onClick={handleSave} style={btnGold} disabled={saving || uploading}>
            {saving ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: validar (admin/gestor)                                     */
/* ------------------------------------------------------------------ */

function ValidarModal({
  os,
  onClose,
  onDecidir,
  onPhotoClick,
}: {
  os: OrdemDeServico;
  onClose: () => void;
  onDecidir: (os: OrdemDeServico, aprovar: boolean) => void | Promise<void>;
  onPhotoClick: (src: string) => void;
}) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ margin: 0, marginBottom: 4, color: theme.gold, fontSize: 16 }}>Validar instalação</h3>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>
          Cliente: <strong style={{ color: theme.text }}>{os.cliente}</strong>
        </div>

        {os.fotoComprovante && (
          <img
            src={photoSrc(os.fotoComprovante)}
            alt="Comprovante"
            onClick={() => onPhotoClick(photoSrc(os.fotoComprovante!))}
            style={{ width: '100%', borderRadius: 10, marginBottom: 10, cursor: 'zoom-in' }}
          />
        )}

        {os.observacoesTecnico && (
          <div style={{ fontSize: 13, color: theme.text, background: theme.soft, padding: 10, borderRadius: 8, marginBottom: 14, whiteSpace: 'pre-wrap' }}>
            <strong>Obs. do técnico:</strong>
            <br />
            {os.observacoesTecnico}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={onClose} style={btnSoft}>Cancelar</button>
          <button onClick={() => onDecidir(os, false)} style={{ ...btnSoft, borderColor: theme.danger, color: theme.danger }}>
            Rejeitar
          </button>
          <button onClick={() => onDecidir(os, true)} style={btnGold}>Aprovar e concluir</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: configuração de atribuição (admin)                         */
/* ------------------------------------------------------------------ */

function ConfigAtribuicaoModal({
  initial,
  tecnicos,
  onClose,
  onSave,
}: {
  initial: AtribuicaoTecnicoConfig;
  tecnicos: AppUserSummary[];
  onClose: () => void;
  onSave: (cfg: AtribuicaoTecnicoConfig) => void | Promise<void>;
}) {
  const [modo, setModo] = useState<AtribuicaoTecnicoConfig['modo']>(initial.modo);
  const [ativos, setAtivos] = useState<string[]>(initial.tecnicosAtivos);

  function toggleAtivo(username: string) {
    setAtivos((prev) => prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ margin: 0, marginBottom: 14, color: theme.gold, fontSize: 16 }}>Atribuição de técnico</h3>

        <label style={labelStyle}>Modo</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {(['manual', 'auto_round_robin'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              style={{
                ...btnSoft,
                background: modo === m ? theme.gold : theme.soft,
                color: modo === m ? '#111' : theme.text,
                fontWeight: modo === m ? 700 : 400,
                flex: '1 1 auto',
              }}
            >
              {m === 'manual' ? 'Manual' : 'Auto (round-robin)'}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>
          {modo === 'manual'
            ? 'Admin/Gestor atribui técnico manualmente em cada OS pendente.'
            : 'Sistema atribui o técnico com menor carga ativa automaticamente.'}
        </div>

        <label style={labelStyle}>Técnicos ativos ({ativos.length})</label>
        {tecnicos.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.muted, padding: 12, border: `1px dashed ${theme.border}`, borderRadius: 8, marginBottom: 14 }}>
            Nenhum técnico cadastrado. Cadastre usuários com role TECNICO em /usuarios.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, maxHeight: 240, overflow: 'auto' }}>
            {tecnicos.map((t) => (
              <label key={t.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: theme.soft, borderRadius: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ativos.includes(t.username)}
                  onChange={() => toggleAtivo(t.username)}
                />
                <span style={{ fontSize: 13, color: theme.text }}>{t.name || t.username}</span>
                <span style={{ fontSize: 11, color: theme.muted, marginLeft: 'auto' }}>@{t.username}</span>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSoft}>Cancelar</button>
          <button onClick={() => onSave({ modo, tecnicosAtivos: ativos })} style={btnGold}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
