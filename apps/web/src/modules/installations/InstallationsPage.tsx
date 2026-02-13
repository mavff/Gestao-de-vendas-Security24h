'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockEquipments, mockOrdens, mockPropostas, mockUsers } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Equipment, InstallationPoint, OrdemDeServico, Proposta, User } from '../../types';

type OSStatus = OrdemDeServico['status'];
const statuses: OSStatus[] = ['pendente', 'em andamento', 'concluida'];

export function InstallationsPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canEdit = role === 'TECNICO' || role === 'ADMIN';

  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OSStatus | 'todos'>('todos');
  const [filterTecnico, setFilterTecnico] = useState('todos');

  useEffect(() => {
    const data = loadMock('mock_ordens', mockOrdens);
    setOrdens(data);
    setUsers(loadMock('mock_users', mockUsers));
    setEquipments(loadMock('mock_equipments', mockEquipments));
    setPropostas(loadMock('mock_propostas', mockPropostas));
    if (data.length > 0) setSelectedId(data[0].id);
  }, []);

  useEffect(() => { if (ordens.length) saveMock('mock_ordens', ordens); }, [ordens]);

  const tecnicos = useMemo(() => users.filter((u) => u.role === 'TECNICO'), [users]);

  const filtered = useMemo(() =>
    ordens.filter((os) => {
      if (filterStatus !== 'todos' && os.status !== filterStatus) return false;
      if (filterTecnico !== 'todos' && os.tecnicoId !== filterTecnico) return false;
      return true;
    }),
  [ordens, filterStatus, filterTecnico]);

  const selected = ordens.find((os) => os.id === selectedId) ?? null;

  function updateOS(updated: OrdemDeServico) {
    setOrdens((cur) => cur.map((os) => os.id === updated.id ? updated : os));
  }

  return (
    <AppShell title="Ordens de Serviço">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 300px) 1fr', gap: 16, minHeight: 'calc(100vh - 140px)' }}>
        {/* Left panel — list */}
        <div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as OSStatus | 'todos')} style={inputStyle}>
              <option value="todos">Todos os status</option>
              {statuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <select value={filterTecnico} onChange={(e) => setFilterTecnico(e.target.value)} style={inputStyle}>
              <option value="todos">Todos os técnicos</option>
              {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {filtered.length === 0 && (
            <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhuma OS encontrada.</div>
          )}

          <div style={{ display: 'grid', gap: 6 }}>
            {filtered.map((os) => {
              const isSelected = os.id === selectedId;
              const progress = os.pontos.length > 0
                ? Math.round((os.pontos.filter((p) => p.status === 'Finalizado').length / os.pontos.length) * 100)
                : 0;
              return (
                <button
                  key={os.id}
                  onClick={() => setSelectedId(os.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: isSelected ? 'rgba(200,169,81,0.08)' : theme.panel,
                    border: `1px solid ${isSelected ? theme.gold : theme.border}`,
                    borderRadius: 10,
                    padding: 10,
                    cursor: 'pointer',
                    color: theme.text,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13 }}>{os.cliente}</strong>
                    <StatusBadge value={os.status} />
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
                    {os.id} · {os.pontos.length} ponto(s)
                    {os.dataAgendada && ` · ${formatDate(os.dataAgendada)}`}
                  </div>
                  {/* Mini progress bar */}
                  {os.pontos.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.muted, marginBottom: 2 }}>
                        <span>Progresso</span>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: theme.soft }}>
                        <div style={{
                          height: '100%', borderRadius: 2, width: `${progress}%`,
                          background: progress === 100 ? theme.success : theme.gold,
                          transition: 'width 200ms ease',
                        }} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — detail */}
        <div>
          {!selected ? (
            <div style={{ color: theme.muted, textAlign: 'center', paddingTop: 40 }}>Selecione uma OS na lista.</div>
          ) : (
            <OSDetail
              os={selected}
              tecnicos={tecnicos}
              equipments={equipments}
              propostas={propostas}
              canEdit={canEdit}
              onUpdate={updateOS}
              onToast={showToast}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ---- Detalhe da OS ---- */

function OSDetail({ os, tecnicos, equipments, propostas, canEdit, onUpdate, onToast }: {
  os: OrdemDeServico;
  tecnicos: User[];
  equipments: Equipment[];
  propostas: Proposta[];
  canEdit: boolean;
  onUpdate: (os: OrdemDeServico) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}) {
  const [showAddPonto, setShowAddPonto] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const proposta = propostas.find((p) => p.id === os.propostaId);

  const pontosFinalizados = os.pontos.filter((p) => p.status === 'Finalizado').length;
  const totalPontos = os.pontos.length;
  const progressPct = totalPontos > 0 ? Math.round((pontosFinalizados / totalPontos) * 100) : 0;
  const checkDone = os.checklist.filter((c) => c.done).length;

  function updateField<K extends keyof OrdemDeServico>(key: K, value: OrdemDeServico[K]) {
    onUpdate({ ...os, [key]: value });
  }

  function updatePonto(updated: InstallationPoint) {
    onUpdate({ ...os, pontos: os.pontos.map((p) => p.id === updated.id ? updated : p) });
  }

  function removePonto(id: string) {
    onUpdate({ ...os, pontos: os.pontos.filter((p) => p.id !== id) });
  }

  function toggleChecklist(ckId: string) {
    onUpdate({
      ...os,
      checklist: os.checklist.map((c) => c.id === ckId ? { ...c, done: !c.done } : c),
    });
  }

  function concluirOS() {
    const pendentes = os.pontos.filter((p) => p.status !== 'Finalizado');
    if (pendentes.length > 0) {
      onToast(`Ainda há ${pendentes.length} ponto(s) não finalizados.`, 'warning');
      return;
    }
    const unchk = os.checklist.filter((c) => !c.done);
    if (unchk.length > 0) {
      onToast(`Ainda há ${unchk.length} item(ns) do checklist pendentes.`, 'warning');
      return;
    }
    onUpdate({ ...os, status: 'concluida' });
    onToast('OS concluída com sucesso!', 'success');
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Photo lightbox */}
      {expandedPhoto && (
        <>
          <div onClick={() => setExpandedPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 60, cursor: 'pointer' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 61, maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={expandedPhoto} alt="Foto ampliada" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 10, objectFit: 'contain' }} />
            <button onClick={() => setExpandedPhoto(null)} style={{ position: 'absolute', top: -12, right: -12, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: '50%', width: 28, height: 28, color: theme.text, cursor: 'pointer', fontSize: 14 }}>x</button>
          </div>
        </>
      )}

      {/* Header card */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>{os.cliente}</h3>
            <div style={{ fontSize: 12, color: theme.muted }}>{os.id} · Criada em {formatDate(os.createdAt)}</div>
          </div>
          <StatusBadge value={os.status} />
        </div>

        {/* Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Técnico</label>
            <select value={os.tecnicoId} disabled={!canEdit} onChange={(e) => updateField('tecnicoId', e.target.value)} style={inputStyle}>
              <option value="">Não atribuído</option>
              {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Data agendada</label>
            <input type="date" value={os.dataAgendada} disabled={!canEdit} onChange={(e) => updateField('dataAgendada', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={os.status} disabled={!canEdit} onChange={(e) => updateField('status', e.target.value as OSStatus)} style={inputStyle}>
              {statuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Observações gerais</label>
            <input value={os.observacoes} disabled={!canEdit} onChange={(e) => updateField('observacoes', e.target.value)} style={inputStyle} placeholder="Observações gerais" />
          </div>
        </div>

        {/* Progress bar */}
        {totalPontos > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.muted, marginBottom: 4 }}>
              <span>Progresso da instalação</span>
              <span style={{ fontWeight: 600, color: progressPct === 100 ? theme.success : theme.gold }}>
                {pontosFinalizados}/{totalPontos} pontos · {progressPct}%
              </span>
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
      </div>

      {/* Resumo do Projeto (info from Proposta) */}
      {proposta && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
          <h4 style={{ color: theme.gold, margin: '0 0 10px', fontSize: 14 }}>Resumo do Projeto</h4>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8 }}>
            Proposta {proposta.id} · {proposta.leadNome}
          </div>

          {/* Equipment list from proposta */}
          {proposta.itens.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Equipamentos</div>
              <div style={{ display: 'grid', gap: 4 }}>
                {proposta.itens.map((item, i) => {
                  const eq = equipments.find((e) => e.id === item.equipamentoId);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 8px', background: theme.soft, borderRadius: 6 }}>
                      <span><strong>{item.quantidade}x</strong> {item.nome}</span>
                      {eq && <span style={{ color: theme.muted, fontSize: 11 }}>{eq.sku}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Services from proposta */}
          {proposta.servicos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Serviços</div>
              <div style={{ display: 'grid', gap: 4 }}>
                {proposta.servicos.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 8px', background: theme.soft, borderRadius: 6 }}>
                    <span>{s.descricao}</span>
                    <span style={{ color: theme.gold, fontWeight: 600 }}>R$ {s.valor.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {proposta.observacoes && (
            <div style={{ marginTop: 8, fontSize: 12, color: theme.muted, fontStyle: 'italic' }}>
              {proposta.observacoes}
            </div>
          )}
        </div>
      )}

      {/* Interactive Checklist */}
      {os.checklist.length > 0 && (
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ color: theme.gold, margin: 0, fontSize: 14 }}>Checklist de Instalação</h4>
            <span style={{ fontSize: 12, color: checkDone === os.checklist.length ? theme.success : theme.muted, fontWeight: 600 }}>
              {checkDone}/{os.checklist.length}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {os.checklist.map((ck) => (
              <button
                key={ck.id}
                onClick={() => canEdit && toggleChecklist(ck.id)}
                disabled={!canEdit}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: ck.done ? theme.success + '10' : theme.soft,
                  border: `1px solid ${ck.done ? theme.success + '44' : theme.border}`,
                  borderRadius: 8, padding: '10px 12px', cursor: canEdit ? 'pointer' : 'default',
                  color: theme.text, textAlign: 'left', width: '100%',
                  transition: 'background 150ms, border-color 150ms',
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 6, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  border: `2px solid ${ck.done ? theme.success : theme.border}`,
                  background: ck.done ? theme.success : 'transparent',
                  color: ck.done ? '#111' : 'transparent',
                  fontSize: 13, fontWeight: 700, transition: 'all 150ms',
                }}>
                  {ck.done ? '✓' : ''}
                </span>
                <span style={{
                  fontSize: 13,
                  textDecoration: ck.done ? 'line-through' : 'none',
                  color: ck.done ? theme.muted : theme.text,
                }}>
                  {ck.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pontos de instalação */}
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ color: theme.gold, margin: 0, fontSize: 14 }}>Pontos de Instalação ({os.pontos.length})</h4>
          {canEdit && !showAddPonto && (
            <button onClick={() => setShowAddPonto(true)} style={btnGold}>+ Ponto</button>
          )}
        </div>

        {showAddPonto && canEdit && (
          <AddPontoForm
            equipments={equipments}
            onAdd={(ponto) => {
              onUpdate({ ...os, pontos: [...os.pontos, ponto] });
              setShowAddPonto(false);
            }}
            onCancel={() => setShowAddPonto(false)}
          />
        )}

        {os.pontos.length === 0 && (
          <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 10, padding: 20, textAlign: 'center', color: theme.muted, fontSize: 13 }}>
            Nenhum ponto de instalação registrado.
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {os.pontos.map((ponto) => (
            <PontoCard
              key={ponto.id}
              ponto={ponto}
              equipments={equipments}
              canEdit={canEdit}
              onUpdate={updatePonto}
              onRemove={removePonto}
              onExpandPhoto={setExpandedPhoto}
            />
          ))}
        </div>
      </div>

      {/* Concluir */}
      {canEdit && os.status !== 'concluida' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={concluirOS} style={{ ...btnGold, background: theme.success, padding: '12px 24px', fontSize: 14 }}>
            Finalizar Instalação
          </button>
          <span style={{ fontSize: 12, color: theme.muted }}>
            {totalPontos === 0 ? 'Adicione pontos de instalação' :
              pontosFinalizados < totalPontos ? `${totalPontos - pontosFinalizados} ponto(s) pendentes` :
              checkDone < os.checklist.length ? `${os.checklist.length - checkDone} item(ns) do checklist pendentes` :
              'Tudo pronto para finalizar!'}
          </span>
        </div>
      )}

      {os.status === 'concluida' && (
        <div style={{
          background: theme.success + '15', border: `1px solid ${theme.success}44`,
          borderRadius: 12, padding: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>✓</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.success }}>Instalação Concluída</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
            {totalPontos} ponto(s) finalizados · {checkDone}/{os.checklist.length} checklist completo
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Ponto card ---- */

function PontoCard({ ponto, equipments, canEdit, onUpdate, onRemove, onExpandPhoto }: {
  ponto: InstallationPoint;
  equipments: Equipment[];
  canEdit: boolean;
  onUpdate: (p: InstallationPoint) => void;
  onRemove: (id: string) => void;
  onExpandPhoto: (src: string) => void;
}) {
  const statusColor = ponto.status === 'Finalizado' ? theme.success : ponto.status === 'Em execução' ? theme.warning : theme.muted;
  const eq = ponto.equipmentId ? equipments.find((e) => e.id === ponto.equipmentId) : null;

  return (
    <div style={{
      background: theme.soft,
      border: `1px solid ${ponto.status === 'Finalizado' ? theme.success + '44' : theme.border}`,
      borderRadius: 10, padding: 12,
      borderLeft: `4px solid ${statusColor}`,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>{ponto.environment}</strong>
            <span style={{ color: theme.muted, fontSize: 12 }}>· {ponto.type}</span>
            {ponto.locationTag && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: theme.gold + '22', color: theme.gold, border: `1px solid ${theme.gold}44`,
              }}>
                {ponto.locationTag}
              </span>
            )}
          </div>
          {eq && (
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
              {eq.name} · {eq.sku} · {eq.marca}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <select
            value={ponto.status}
            disabled={!canEdit}
            onChange={(e) => onUpdate({ ...ponto, status: e.target.value as InstallationPoint['status'] })}
            style={{ ...inputStyle, marginBottom: 0, fontSize: 12, padding: '4px 8px', width: 'auto', color: statusColor, borderColor: statusColor + '66' }}
          >
            <option>Pendente</option>
            <option>Em execução</option>
            <option>Finalizado</option>
          </select>
          {canEdit && (
            <button onClick={() => onRemove(ponto.id)} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, borderRadius: 6, color: theme.danger, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>x</button>
          )}
        </div>
      </div>

      {/* Location tag editor */}
      {canEdit && (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{ fontSize: 11, color: theme.muted, whiteSpace: 'nowrap' }}>Marcação:</label>
          <input
            value={ponto.locationTag ?? ''}
            onChange={(e) => onUpdate({ ...ponto, locationTag: e.target.value })}
            placeholder="Ex: Câmera frontal, Sensor porta X"
            style={{ ...inputStyle, marginBottom: 0, fontSize: 12, padding: '4px 8px', flex: 1 }}
          />
        </div>
      )}

      {/* Note */}
      <div style={{ marginTop: 8 }}>
        <textarea
          value={ponto.note}
          disabled={!canEdit}
          placeholder="Observação visual / técnica do ponto"
          onChange={(e) => onUpdate({ ...ponto, note: e.target.value })}
          rows={2}
          style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 0, fontSize: 13 }}
        />
      </div>

      {/* Photos */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          {canEdit && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: theme.muted }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Adicionar foto
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result as string;
                    onUpdate({ ...ponto, photos: [...ponto.photos, base64] });
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
          {ponto.photos.length > 0 && (
            <span style={{ fontSize: 11, color: theme.muted }}>{ponto.photos.length} foto(s)</span>
          )}
        </div>
        {ponto.photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ponto.photos.map((photo, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={photo}
                  width={100}
                  height={75}
                  alt={`Foto ${i + 1}`}
                  onClick={() => onExpandPhoto(photo)}
                  style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${theme.border}`, cursor: 'pointer', display: 'block' }}
                />
                {canEdit && (
                  <button
                    onClick={() => onUpdate({ ...ponto, photos: ponto.photos.filter((_, idx) => idx !== i) })}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      background: theme.danger, border: 'none', borderRadius: '50%',
                      width: 20, height: 20, color: '#fff', cursor: 'pointer',
                      fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Form adicionar ponto ---- */

function AddPontoForm({ equipments, onAdd, onCancel }: {
  equipments: Equipment[];
  onAdd: (p: InstallationPoint) => void;
  onCancel: () => void;
}) {
  const [environment, setEnvironment] = useState('');
  const [type, setType] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [equipmentId, setEquipmentId] = useState('');

  function handleAdd() {
    if (!environment.trim() || !type.trim()) return;
    onAdd({
      id: 'PT' + Date.now(),
      environment: environment.trim(),
      type: type.trim(),
      note: '',
      status: 'Pendente',
      photos: [],
      locationTag: locationTag.trim() || undefined,
      equipmentId: equipmentId || undefined,
    });
  }

  return (
    <div style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.gold, marginBottom: 8 }}>Novo ponto de instalação</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>Ambiente *</label>
          <input placeholder="Ex: Fachada, Escritório" value={environment} onChange={(e) => setEnvironment(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tipo equipamento *</label>
          <input placeholder="Ex: Câmera Dome, Sensor" value={type} onChange={(e) => setType(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Marcação de posição</label>
          <input placeholder="Ex: Câmera frontal, Sensor porta X" value={locationTag} onChange={(e) => setLocationTag(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Equipamento (catálogo)</label>
          <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} style={inputStyle}>
            <option value="">Nenhum (manual)</option>
            {equipments.filter((e) => e.category === 'Câmera' || e.category === 'Sensor' || e.category === 'Central').map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name} ({eq.marca})</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleAdd} disabled={!environment.trim() || !type.trim()} style={{ ...btnGold, opacity: environment.trim() && type.trim() ? 1 : 0.4 }}>Adicionar</button>
        <button onClick={onCancel} style={btnSoft}>Cancelar</button>
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function StatusBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    pendente: theme.warning,
    'em andamento': theme.gold,
    concluida: theme.success,
  };
  const color = colorMap[value] ?? theme.muted;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '3px 10px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {statusLabel(value as OSStatus)}
    </span>
  );
}

function statusLabel(s: OSStatus): string {
  const map: Record<OSStatus, string> = { pendente: 'Pendente', 'em andamento': 'Em andamento', concluida: 'Concluída' };
  return map[s] ?? s;
}

function formatDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
