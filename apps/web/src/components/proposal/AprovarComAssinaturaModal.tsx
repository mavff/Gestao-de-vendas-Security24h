'use client';

import { useRef, useState } from 'react';
import { theme } from '../common/theme';
import { useToast } from '../common/Toast';
import { SignaturePad, SignaturePadHandle } from '../common/SignaturePad';
import { apiClient } from '../../lib/apiClient';

export type AprovacaoResponse = {
  id: string;
  clienteNome: string;
  clienteCpf: string;
  assinaturaBase64: string;
  assinaturaHash: string;
  valorTotal: number;
  modalidade: string;
  createdAt: string;
};

type Props = {
  clienteNome: string;
  valorTotal: number;
  modalidade: string;
  vendaId?: string;
  propostaId?: string;
  orcamentoId?: string;
  onClose: () => void;
  onAprovado: (ap: AprovacaoResponse) => void;
};

const btnGold: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 10, color: '#111', padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const btnSoft: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, padding: '10px 16px', cursor: 'pointer', fontSize: 14 };
const inputStyle: React.CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, width: '100%', fontSize: 14 };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: theme.muted, marginBottom: 4, marginTop: 4 };

function maskCpf(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AprovarComAssinaturaModal({
  clienteNome: nomeInicial,
  valorTotal,
  modalidade,
  vendaId,
  propostaId,
  orcamentoId,
  onClose,
  onAprovado,
}: Props) {
  const { showToast } = useToast();
  const padRef = useRef<SignaturePadHandle>(null);
  const [nome, setNome] = useState(nomeInicial);
  const [cpf, setCpf] = useState('');
  const [aceite, setAceite] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!nome.trim()) { showToast('Informe o nome do cliente', 'warning'); return; }
    if (!aceite) { showToast('Marque o aceite para continuar', 'warning'); return; }
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) { showToast('Capture a assinatura do cliente', 'warning'); return; }

    const assinatura = pad.toDataURL();
    setSaving(true);
    try {
      const { data } = await apiClient.post<AprovacaoResponse>('/orcamento-aprovacoes', {
        body: {
          clienteNome: nome.trim(),
          clienteCpf: cpf.replace(/\D/g, ''),
          assinaturaBase64: assinatura,
          valorTotal,
          modalidade,
          vendaId,
          propostaId,
          orcamentoId,
        },
      });
      showToast('Assinatura registrada', 'success');
      onAprovado(data);
    } catch {
      showToast('Falha ao registrar. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, maxWidth: 560, width: '100%', maxHeight: '92vh', overflow: 'auto' }}>
        <h3 style={{ margin: 0, marginBottom: 4, color: theme.gold, fontSize: 17 }}>Pré-aprovar com assinatura</h3>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Passe o dispositivo para o cliente assinar. A assinatura é registrada no banco com hash de verificação e aparece como selo no PDF.
        </div>

        <div style={{ background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: theme.muted }}>Valor aprovado</span>
            <strong style={{ color: theme.gold }}>R$ {fmtBRL(valorTotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: theme.muted }}>Modalidade</span>
            <strong style={{ color: theme.text }}>{modalidade}</strong>
          </div>
        </div>

        <label style={labelStyle}>Nome do cliente *</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>CPF (opcional)</label>
        <input value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" style={inputStyle} />

        <label style={labelStyle}>Assinatura *</label>
        <SignaturePad ref={padRef} height={180} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, marginBottom: 12 }}>
          <button onClick={() => padRef.current?.clear()} style={{ ...btnSoft, padding: '6px 12px', fontSize: 12 }}>Limpar</button>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: theme.text, marginBottom: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} style={{ marginTop: 2 }} />
          <span>
            Declaro que li e aprovo os valores da proposta acima como pré-aprovação comercial.
            A assinatura fica arquivada com data/hora e hash de verificação.
          </span>
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSoft} disabled={saving}>Cancelar</button>
          <button onClick={handleConfirm} style={btnGold} disabled={saving}>
            {saving ? 'Registrando…' : 'Confirmar aprovação'}
          </button>
        </div>
      </div>
    </div>
  );
}
