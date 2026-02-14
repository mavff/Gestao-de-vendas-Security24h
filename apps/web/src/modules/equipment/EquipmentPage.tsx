'use client';

import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { useToast } from '../../components/common/Toast';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockEquipments } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { BlocoCategoria, Equipment, EquipmentCategory, Marca } from '../../types';

const categories: EquipmentCategory[] = ['Câmera', 'Sensor', 'Central', 'Acessório'];
const allMarcas: Marca[] = ['Intelbras', 'Hikvision', 'DSC', 'Viaweb', 'Vetti', 'Genérico'];

const blocosByCategory: Record<EquipmentCategory, BlocoCategoria[]> = {
  'Câmera': ['camera_analogica', 'camera_ip', 'camera_ia'],
  'Sensor': ['sensor_externo', 'sensor_interno', 'sensor_porta_janela'],
  'Central': ['dvr_nvr', 'modulo_comunicacao', 'central_alarme'],
  'Acessório': ['acessorio'],
};

const blocoLabels: Record<BlocoCategoria, string> = {
  sensor_externo: 'Sensor Externo', sensor_interno: 'Sensor Interno', sensor_porta_janela: 'Porta/Janela',
  camera_analogica: 'Analógica', camera_ip: 'IP', camera_ia: 'IA',
  dvr_nvr: 'DVR/NVR', modulo_comunicacao: 'Comunicação', central_alarme: 'Central Alarme',
  acessorio: 'Acessório',
};

const emptyDraft: Equipment = { id: '', name: '', sku: '', category: 'Câmera', marca: 'Intelbras', bloco: 'camera_analogica', price: 0, estoque: 0, descricao: '' };

export function EquipmentPage() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canWrite = role === 'ADMIN' || role === 'INFRA';

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [category, setCategory] = useState('Todas');
  const [marcaFilter, setMarcaFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Equipment>(emptyDraft);

  useEffect(() => setEquipments(loadMock('mock_equipments', mockEquipments)), []);
  useEffect(() => { if (equipments.length) saveMock('mock_equipments', equipments); }, [equipments]);

  const filtered = useMemo(() =>
    equipments.filter((eq) => {
      const byCat = category === 'Todas' || eq.category === category;
      const byMarca = marcaFilter === 'Todas' || eq.marca === marcaFilter;
      const bySearch = `${eq.name} ${eq.sku} ${eq.descricao}`.toLowerCase().includes(search.toLowerCase());
      return byCat && byMarca && bySearch;
    }),
  [equipments, category, marcaFilter, search]);

  function openNew() {
    setDraft(emptyDraft);
    setModalOpen(true);
  }

  function openEdit(eq: Equipment) {
    setDraft(eq);
    setModalOpen(true);
  }

  function handleSave() {
    if (!draft.name.trim() || !draft.sku.trim()) return;
    if (draft.id) {
      setEquipments((cur) => cur.map((e) => e.id === draft.id ? draft : e));
      showToast('Equipamento atualizado.', 'success');
    } else {
      setEquipments((cur) => [...cur, { ...draft, id: 'E' + Date.now() }]);
      showToast('Equipamento criado.', 'success');
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    setEquipments((cur) => cur.filter((e) => e.id !== id));
    showToast('Equipamento excluído.', 'warning');
  }

  return (
    <AppShell title="Equipamentos">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar por nome, SKU ou descrição"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200, marginBottom: 0 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: 'auto' }}>
          <option>Todas</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={marcaFilter} onChange={(e) => setMarcaFilter(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: 'auto' }}>
          <option>Todas</option>
          {allMarcas.map((m) => <option key={m}>{m}</option>)}
        </select>
        {canWrite && (
          <button onClick={openNew} style={btnGold}>+ Novo</button>
        )}
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 10 }}>
        {filtered.length} equipamento(s)
        {category !== 'Todas' && ` na categoria "${category}"`}
        {marcaFilter !== 'Todas' && ` · marca "${marcaFilter}"`}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          Nenhum equipamento encontrado.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['SKU', 'Nome', 'Marca', 'Categoria', 'Bloco', 'Preço', 'Estoque', ...(canWrite ? [''] : [])].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => (
                <tr key={eq.id}>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12, color: theme.muted }}>{eq.sku}</span></td>
                  <td style={tdStyle}><strong>{eq.name}</strong></td>
                  <td style={tdStyle}><MarcaBadge marca={eq.marca} /></td>
                  <td style={tdStyle}><CategoryBadge category={eq.category} /></td>
                  <td style={tdStyle}><span style={{ fontSize: 11, color: theme.muted }}>{blocoLabels[eq.bloco]}</span></td>
                  <td style={tdStyle}>R$ {eq.price.toLocaleString('pt-BR')}</td>
                  <td style={tdStyle}>
                    <span style={{ color: eq.estoque <= 10 ? theme.danger : eq.estoque <= 20 ? theme.warning : theme.success, fontWeight: 600 }}>
                      {eq.estoque}
                    </span>
                  </td>
                  {canWrite && (
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(eq)} style={btnSmall}>Editar</button>
                        <button onClick={() => handleDelete(eq.id)} style={{ ...btnSmall, borderColor: theme.danger, color: theme.danger }}>Excluir</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', color: theme.gold }}>{draft.id ? 'Editar Equipamento' : 'Novo Equipamento'}</h3>

            <label style={labelStyle}>Nome *</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />

            <label style={labelStyle}>SKU *</label>
            <input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} style={inputStyle} placeholder="Ex: CAM-D2MP" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={draft.category} onChange={(e) => {
                  const cat = e.target.value as EquipmentCategory;
                  const firstBloco = blocosByCategory[cat][0];
                  setDraft({ ...draft, category: cat, bloco: firstBloco });
                }} style={inputStyle}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bloco</label>
                <select value={draft.bloco} onChange={(e) => setDraft({ ...draft, bloco: e.target.value as BlocoCategoria })} style={inputStyle}>
                  {blocosByCategory[draft.category].map((b) => <option key={b} value={b}>{blocoLabels[b]}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Marca</label>
                <select value={draft.marca} onChange={(e) => setDraft({ ...draft, marca: e.target.value as Marca })} style={inputStyle}>
                  {allMarcas.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Preço (R$)</label>
                <input type="number" min={0} value={draft.price || ''} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>Estoque</label>
            <input type="number" min={0} value={draft.estoque || ''} onChange={(e) => setDraft({ ...draft, estoque: Number(e.target.value) })} style={inputStyle} />

            <label style={labelStyle}>Descrição</label>
            <textarea value={draft.descricao} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={handleSave} style={btnGold}>Salvar</button>
              <button onClick={() => setModalOpen(false)} style={btnSoft}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ---- Helpers ---- */

const marcaColors: Record<Marca, string> = {
  Intelbras: '#4CAF50', Hikvision: '#E53935', DSC: '#1E88E5',
  Viaweb: '#AB47BC', Vetti: '#FF7043', 'Genérico': '#9E9E9E',
};

function MarcaBadge({ marca }: { marca: Marca }) {
  const color = marcaColors[marca];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {marca}
    </span>
  );
}

function CategoryBadge({ category }: { category: EquipmentCategory }) {
  const colorMap: Record<EquipmentCategory, string> = {
    'Câmera': '#5B9BD5',
    'Sensor': '#E3B341',
    'Central': '#C8A951',
    'Acessório': '#B5B5B5',
  };
  const color = colorMap[category];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {category}
    </span>
  );
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 4 };
const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const btnSmall: React.CSSProperties = { background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, padding: '3px 10px', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, fontSize: 13 };
