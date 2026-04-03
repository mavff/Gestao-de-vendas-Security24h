'use client';

import { useEffect, useState } from 'react';
import { theme } from '../common/theme';
import { CustosEmpresaConfig, CustoCategoriaOperacional, DEFAULT_CUSTOS_CONFIG } from '../../lib/dataSource/types';
import { loadState, saveState } from '../../services/appState';

interface CustosConfigModalProps {
  onClose: () => void;
  onSave: (config: CustosEmpresaConfig) => void;
}

const inputStyle: React.CSSProperties = {
  background: theme.soft,
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  color: theme.text,
  padding: '8px 12px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: theme.muted,
  fontWeight: 600,
  marginBottom: 4,
  display: 'block',
};

const sectionStyle: React.CSSProperties = {
  background: theme.soft,
  border: `1px solid ${theme.border}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};

function NumInput({ label, value, onChange, prefix = 'R$' }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: theme.muted, fontSize: 13, pointerEvents: 'none',
          }}>{prefix}</span>
        )}
        <input
          type="number"
          min={0}
          step={100}
          value={value || ''}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          style={{ ...inputStyle, paddingLeft: prefix ? 36 : 12 }}
        />
      </div>
    </div>
  );
}

export function CustosConfigModal({ onClose, onSave }: CustosConfigModalProps) {
  const [config, setConfig] = useState<CustosEmpresaConfig>(DEFAULT_CUSTOS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadState<CustosEmpresaConfig>('config:custos_empresa', DEFAULT_CUSTOS_CONFIG)
      .then((c) => { setConfig(c); setLoading(false); });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const updateFolha = (field: keyof CustosEmpresaConfig['folhaSalarial'], val: number) => {
    setConfig((prev) => {
      const folha = { ...prev.folhaSalarial, [field]: val };
      if (field !== 'total') {
        folha.total = folha.tecnicos + folha.vendedores + folha.administrativo;
      }
      return { ...prev, folhaSalarial: folha };
    });
  };

  const updateOperacional = (idx: number, field: keyof CustoCategoriaOperacional, val: string | number) => {
    setConfig((prev) => {
      const ops = [...prev.custosOperacionais];
      ops[idx] = { ...ops[idx], [field]: val };
      return { ...prev, custosOperacionais: ops };
    });
  };

  const addOperacional = () => {
    setConfig((prev) => ({
      ...prev,
      custosOperacionais: [...prev.custosOperacionais, { label: '', valor: 0 }],
    }));
  };

  const removeOperacional = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      custosOperacionais: prev.custosOperacionais.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const toSave: CustosEmpresaConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await saveState('config:custos_empresa', toSave);
    // Backwards compatibility with marketing tab localStorage
    localStorage.setItem('inv_pago_mensal', String(config.investimentoMarketing));
    onSave(toSave);
    setSaving(false);
    onClose();
  };

  const totalOperacional = config.custosOperacionais.reduce((s, c) => s + c.valor, 0);
  const totalGeral = config.folhaSalarial.total + totalOperacional + config.investimentoMarketing;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px 14px',
          borderBottom: `1px solid ${theme.border}`,
          position: 'sticky', top: 0, background: theme.panel, zIndex: 1,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.gold }}>
            Configurar Custos da Empresa
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted, fontSize: 22, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.muted }}>Carregando...</div>
        ) : (
          <div style={{ padding: '20px 24px 24px' }}>

            {/* ── Folha Salarial ── */}
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: theme.text }}>
                Folha Salarial (mensal)
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <NumInput label="Técnicos" value={config.folhaSalarial.tecnicos} onChange={(v) => updateFolha('tecnicos', v)} />
                <NumInput label="Vendedores" value={config.folhaSalarial.vendedores} onChange={(v) => updateFolha('vendedores', v)} />
                <NumInput label="Administrativo" value={config.folhaSalarial.administrativo} onChange={(v) => updateFolha('administrativo', v)} />
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: theme.muted }}>Total Folha:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>
                  R$ {config.folhaSalarial.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* ── Custos Operacionais ── */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.text }}>
                  Custos Operacionais (mensal)
                </h3>
                <button
                  onClick={addOperacional}
                  style={{
                    background: theme.gold, color: '#0B0B0B', border: 'none',
                    borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                  }}
                >
                  + Adicionar
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {config.custosOperacionais.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                    <div style={{ flex: 2 }}>
                      {idx === 0 && <label style={labelStyle}>Categoria</label>}
                      <input
                        type="text"
                        value={item.label}
                        placeholder="Ex: Aluguel"
                        onChange={(e) => updateOperacional(idx, 'label', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      {idx === 0 && <label style={labelStyle}>Valor (R$)</label>}
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={item.valor || ''}
                        placeholder="0"
                        onChange={(e) => updateOperacional(idx, 'valor', Number(e.target.value) || 0)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      onClick={() => removeOperacional(idx)}
                      style={{
                        background: 'none', border: `1px solid ${theme.border}`,
                        borderRadius: 6, color: theme.danger, cursor: 'pointer',
                        padding: '8px 10px', fontSize: 14, lineHeight: 1,
                        marginBottom: 1,
                      }}
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: theme.muted }}>Total Operacional:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>
                  R$ {totalOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* ── CMV ── */}
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: theme.text }}>
                CMV — Custo de Mercadoria Vendida
              </h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['percentual', 'fixo'] as const).map((modo) => (
                  <button
                    key={modo}
                    onClick={() => setConfig((p) => ({ ...p, cmvModo: modo }))}
                    style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: 13,
                      background: config.cmvModo === modo ? theme.gold : theme.soft,
                      color: config.cmvModo === modo ? '#0B0B0B' : theme.text,
                    }}
                  >
                    {modo === 'percentual' ? '% sobre Equipamentos' : 'Valor Fixo (R$)'}
                  </button>
                ))}
              </div>
              {config.cmvModo === 'percentual' ? (
                <NumInput
                  label="Percentual do CMV sobre receita de equipamentos"
                  value={config.cmvPercentual}
                  onChange={(v) => setConfig((p) => ({ ...p, cmvPercentual: v }))}
                  prefix="%"
                />
              ) : (
                <NumInput
                  label="Valor fixo mensal do CMV"
                  value={config.cmvFixo}
                  onChange={(v) => setConfig((p) => ({ ...p, cmvFixo: v }))}
                />
              )}
            </div>

            {/* ── Marketing ── */}
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: theme.text }}>
                Investimento em Marketing (mensal)
              </h3>
              <NumInput
                label="Valor investido em tráfego pago e marketing"
                value={config.investimentoMarketing}
                onChange={(v) => setConfig((p) => ({ ...p, investimentoMarketing: v }))}
              />
            </div>

            {/* ── Resumo ── */}
            <div style={{
              background: '#1a1a1a',
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: theme.text }}>
                Resumo de Custos Mensais
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Folha Salarial', valor: config.folhaSalarial.total },
                  { label: 'Custos Operacionais', valor: totalOperacional },
                  { label: 'Marketing', valor: config.investimentoMarketing },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: theme.muted }}>{item.label}</span>
                    <span style={{ color: theme.text, fontWeight: 600 }}>
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div style={{
                  borderTop: `1px solid ${theme.border}`,
                  marginTop: 6, paddingTop: 8,
                  display: 'flex', justifyContent: 'space-between', fontSize: 15,
                }}>
                  <span style={{ color: theme.text, fontWeight: 700 }}>Total Mensal (sem CMV)</span>
                  <span style={{ color: theme.gold, fontWeight: 700 }}>
                    R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent', color: theme.text,
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: theme.gold, color: '#0B0B0B',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 14,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Salvar Custos'}
              </button>
            </div>

            {config.updatedAt && (
              <p style={{ margin: '12px 0 0', fontSize: 11, color: theme.muted, textAlign: 'right' }}>
                Última atualização: {new Date(config.updatedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
