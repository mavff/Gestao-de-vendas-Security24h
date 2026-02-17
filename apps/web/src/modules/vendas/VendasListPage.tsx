'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../components/common/theme';
import { AppShell } from '../../components/layout/AppShell';
import { mockLeads, mockOrdens, mockSolucoes, mockVistorias } from '../../mocks/data';
import { loadMock } from '../../services/mockStorage';
import { Lead, OrdemDeServico, SolucaoTecnica, Vistoria } from '../../types';

type VendaStatus = 'solucao' | 'vistoria' | 'os_pendente' | 'em_instalacao' | 'concluida';

type VendaResumo = {
  leadId: string;
  leadNome: string;
  empresa: string;
  valor: number;
  status: VendaStatus;
  statusLabel: string;
  etapa: number; // 0-3 for progress bar
  marca: string;
  createdAt: string;
};

const STATUS_CONFIG: Record<VendaStatus, { label: string; color: string; etapa: number }> = {
  solucao:       { label: 'Montando Solução',  color: theme.muted,   etapa: 1 },
  vistoria:      { label: 'Fotos/Pontos',      color: '#5B9BD5',     etapa: 2 },
  os_pendente:   { label: 'OS Criada',         color: theme.warning, etapa: 3 },
  em_instalacao: { label: 'Em Instalação',     color: theme.gold,    etapa: 3 },
  concluida:     { label: 'Concluída',         color: theme.success, etapa: 3 },
};

const ETAPAS = ['Lead', 'Solução', 'Fotos/Pontos', 'OS'];

type FiltroStatus = 'todas' | 'em_andamento' | 'aguardando' | 'concluidas';

export function VendasListPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [solucoes, setSolucoes] = useState<SolucaoTecnica[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [filtro, setFiltro] = useState<FiltroStatus>('todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLeads(loadMock('mock_leads', mockLeads));
    setSolucoes(loadMock('mock_solucoes', mockSolucoes));
    setVistorias(loadMock('mock_vistorias', mockVistorias));
    setOrdens(loadMock('mock_ordens', mockOrdens));
  }, []);

  const vendas = useMemo<VendaResumo[]>(() => {
    const result: VendaResumo[] = [];

    for (const lead of leads) {
      const sol = solucoes.find((s) => s.leadId === lead.id);
      const vis = vistorias.find((v) => v.leadId === lead.id);
      const os = ordens.find((o) => o.leadId === lead.id);

      // Only show leads that have at least a solução started
      if (!sol && !vis && !os) continue;

      let status: VendaStatus = 'solucao';
      if (os && os.status === 'concluida') {
        status = 'concluida';
      } else if (os && os.status === 'em_andamento') {
        status = 'em_instalacao';
      } else if (os) {
        status = 'os_pendente';
      } else if (vis) {
        status = 'vistoria';
      }

      const cfg = STATUS_CONFIG[status];

      result.push({
        leadId: lead.id,
        leadNome: lead.name,
        empresa: lead.company,
        valor: lead.value,
        status,
        statusLabel: cfg.label,
        etapa: cfg.etapa,
        marca: sol?.marca ?? '',
        createdAt: sol?.createdAt ?? '',
      });
    }

    // Most recent first
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  }, [leads, solucoes, vistorias, ordens]);

  const filtered = useMemo(() => {
    let list = vendas;

    if (filtro === 'em_andamento') {
      list = list.filter((v) => ['solucao', 'vistoria'].includes(v.status));
    } else if (filtro === 'aguardando') {
      list = list.filter((v) => v.status === 'os_pendente');
    } else if (filtro === 'concluidas') {
      list = list.filter((v) => ['em_instalacao', 'concluida'].includes(v.status));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.leadNome.toLowerCase().includes(q) || v.empresa.toLowerCase().includes(q));
    }

    return list;
  }, [vendas, filtro, search]);

  const countByFiltro = useMemo(() => ({
    todas: vendas.length,
    em_andamento: vendas.filter((v) => ['solucao', 'vistoria'].includes(v.status)).length,
    aguardando: vendas.filter((v) => v.status === 'os_pendente').length,
    concluidas: vendas.filter((v) => ['em_instalacao', 'concluida'].includes(v.status)).length,
  }), [vendas]);

  return (
    <AppShell title="Minhas Vendas">
      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {([
          ['todas', 'Todas'],
          ['em_andamento', 'Em andamento'],
          ['aguardando', 'Aguardando'],
          ['concluidas', 'Concluídas'],
        ] as [FiltroStatus, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              background: filtro === key ? 'rgba(200,169,81,0.12)' : theme.soft,
              border: `1px solid ${filtro === key ? theme.gold : theme.border}`,
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              color: filtro === key ? theme.gold : theme.text,
              fontWeight: filtro === key ? 700 : 400,
              fontSize: 13,
            }}
          >
            {label}
            <span style={{ marginLeft: 6, fontSize: 11, color: theme.muted }}>
              {countByFiltro[key]}
            </span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          border: `1px dashed ${theme.border}`,
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          color: theme.muted,
        }}>
          {vendas.length === 0
            ? 'Nenhuma venda iniciada. Abra uma venda a partir do Pipeline.'
            : 'Nenhuma venda encontrada com esse filtro.'
          }
        </div>
      )}

      {/* Venda cards */}
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((venda) => {
          const cfg = STATUS_CONFIG[venda.status];
          return (
            <button
              key={venda.leadId}
              onClick={() => router.push(`/venda/${venda.leadId}`)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                color: theme.text,
                transition: 'border-color 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <strong style={{ fontSize: 15 }}>{venda.leadNome}</strong>
                  <span style={{ fontSize: 13, color: theme.muted, marginLeft: 8 }}>{venda.empresa}</span>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: cfg.color + '22',
                  color: cfg.color,
                  border: `1px solid ${cfg.color}44`,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  whiteSpace: 'nowrap',
                }}>
                  {cfg.label}
                </span>
              </div>

              {/* Info row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: theme.gold }}>
                  R$ {venda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {venda.marca && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                    background: theme.soft, color: theme.muted, border: `1px solid ${theme.border}`,
                  }}>
                    {venda.marca}
                  </span>
                )}
                {venda.createdAt && (
                  <span style={{ fontSize: 12, color: theme.muted }}>
                    Iniciada em {formatDate(venda.createdAt)}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {ETAPAS.map((label, i) => {
                  const done = i <= venda.etapa;
                  const isCurrent = i === venda.etapa;
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
                        {i < venda.etapa ? '✓' : i + 1}
                      </div>
                      <span style={{
                        fontSize: 10,
                        color: done ? (isCurrent ? cfg.color : theme.gold) : theme.muted,
                        fontWeight: isCurrent ? 700 : 400,
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                      {i < ETAPAS.length - 1 && (
                        <div style={{
                          flex: 1, height: 2, minWidth: 8,
                          background: i < venda.etapa ? theme.gold : theme.border,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}

/* ---- Helpers ---- */

function formatDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

/* ---- Styles ---- */

const inputStyle: React.CSSProperties = {
  background: theme.soft,
  color: theme.text,
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  minWidth: 180,
};
