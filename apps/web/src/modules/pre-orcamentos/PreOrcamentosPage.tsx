'use client';

import { useEffect, useState } from 'react';
import { theme } from '../../components/common/theme';
import { AppShell } from '../../components/layout/AppShell';
import { createDataSource } from '../../lib/dataSource/factory';
import { PreOrcamentoApiDto, PreOrcamentoProdutoApiDto } from '../../lib/dataSource/types';

export function PreOrcamentosPage() {
  const [modelos, setModelos] = useState<PreOrcamentoApiDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PreOrcamentoApiDto | null>(null);
  const [localQtds, setLocalQtds] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErro(null);
      try {
        const ds = createDataSource();
        const res = await ds.preOrcamentos.list({ pageSize: 200 });
        if (!cancelled) setModelos(res.data);
      } catch {
        if (!cancelled) setErro('Não foi possível carregar os modelos. Verifique a conexão com o servidor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function openModelo(m: PreOrcamentoApiDto) {
    setSelected(m);
    const qtds: Record<number, number> = {};
    m.produtos.forEach((p) => {
      qtds[p.codInterno] = Number(p.quantidade) || 1;
    });
    setLocalQtds(qtds);
  }

  const filtered = modelos.filter((m) =>
    !search || m.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Modelos de Pré-Orçamento">
      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar modelo..."
          style={{
            flex: 1, background: theme.soft, color: theme.text,
            border: `1px solid ${theme.border}`, borderRadius: 8,
            padding: '8px 12px', fontSize: 14,
          }}
        />
        <span style={{ fontSize: 13, color: theme.muted }}>
          {!loading && `${filtered.length} modelo${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* States */}
      {loading && (
        <div style={{ textAlign: 'center', color: theme.muted, padding: 48 }}>Carregando modelos...</div>
      )}
      {!loading && erro && (
        <div style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: 10, padding: 20, color: '#e57373', textAlign: 'center' }}>
          {erro}
        </div>
      )}
      {!loading && !erro && filtered.length === 0 && (
        <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
          {search ? `Nenhum modelo encontrado para "${search}".` : 'Nenhum pré-orçamento cadastrado no banco de dados.'}
        </div>
      )}

      {/* Grid */}
      {!loading && !erro && (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.map((m) => {
            const totalProdutos = m.produtos.reduce((s, p) => {
              const qty = Number(p.quantidade) || 0;
              const preco = Number(p.produto?.preco) || 0;
              return s + qty * preco;
            }, 0);
            const mensalVenda = Number(m.valorMensalVenda) || 0;
            const isAmpliacao = !!m.ampliacao;

            return (
              <div
                key={m.codInterno}
                onClick={() => openModelo(m)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.gold + '66')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
                style={{
                  background: theme.panel, border: `1px solid ${theme.border}`,
                  borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14, lineHeight: 1.3 }}>{m.descricao}</strong>
                    {isAmpliacao && (
                      <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(200,169,81,0.15)', color: theme.gold, border: `1px solid ${theme.gold}44` }}>
                        Ampliação
                      </span>
                    )}
                  </div>
                </div>

                {m.observacoes && (
                  <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>
                    {m.observacoes.length > 80 ? m.observacoes.slice(0, 80) + '...' : m.observacoes}
                  </div>
                )}

                <div style={{ display: 'grid', gap: 3, marginBottom: 10 }}>
                  {m.produtos.slice(0, 4).map((p) => (
                    <div key={p.codInterno} style={{ fontSize: 12, color: theme.muted, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{Number(p.quantidade) || 1}× {p.produto?.descricao ?? p.descricao ?? `Produto ${p.codProduto}`}</span>
                      {p.produto?.preco != null && (
                        <span>R$ {(Number(p.produto.preco) * (Number(p.quantidade) || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      )}
                    </div>
                  ))}
                  {m.produtos.length > 4 && (
                    <div style={{ fontSize: 11, color: theme.muted }}>+ {m.produtos.length - 4} itens...</div>
                  )}
                </div>

                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {totalProdutos > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: theme.muted }}>Equipamentos</span>
                      <span style={{ fontWeight: 600 }}>R$ {totalProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {mensalVenda > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: theme.muted }}>Mensalidade</span>
                      <span style={{ fontWeight: 600, color: theme.gold }}>R$ {mensalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: theme.muted }}>
                  Clique para simular quantidades
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <ModeloDetailModal
          modelo={selected}
          localQtds={localQtds}
          setLocalQtds={setLocalQtds}
          onClose={() => setSelected(null)}
        />
      )}
    </AppShell>
  );
}

/* ---- Detail Modal ---- */

function ModeloDetailModal({
  modelo,
  localQtds,
  setLocalQtds,
  onClose,
}: {
  modelo: PreOrcamentoApiDto;
  localQtds: Record<number, number>;
  setLocalQtds: (q: Record<number, number>) => void;
  onClose: () => void;
}) {
  function changeQty(codInterno: number, delta: number) {
    const cur = localQtds[codInterno] ?? 1;
    setLocalQtds({ ...localQtds, [codInterno]: Math.max(0, cur + delta) });
  }

  function resetQtds() {
    const qtds: Record<number, number> = {};
    modelo.produtos.forEach((p) => { qtds[p.codInterno] = Number(p.quantidade) || 1; });
    setLocalQtds(qtds);
  }

  const totalEquip = modelo.produtos.reduce((s, p) => {
    const qty = localQtds[p.codInterno] ?? Number(p.quantidade) ?? 1;
    const preco = Number(p.produto?.preco) || 0;
    return s + qty * preco;
  }, 0);

  const mensalVenda = Number(modelo.valorMensalVenda) || 0;
  const mensalComodato = Number(modelo.valorMensalComodato) || 0;
  const valorCrea = Number(modelo.valorCrea) || 0;

  const hasChanges = modelo.produtos.some(
    (p) => (localQtds[p.codInterno] ?? Number(p.quantidade)) !== Number(p.quantidade)
  );

  function prodName(p: PreOrcamentoProdutoApiDto) {
    return p.produto?.descricao ?? p.descricao ?? `Produto ${p.codProduto}`;
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center', zIndex: 50 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: theme.panel, border: `1px solid ${theme.border}`,
        borderRadius: 14, padding: 24, width: 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: theme.gold, fontSize: 18 }}>{modelo.descricao}</h3>
            {modelo.observacoes && (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{modelo.observacoes}</p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.muted, fontSize: 22, cursor: 'pointer', padding: '0 4px' }}>×</button>
        </div>

        {/* Hint */}
        <div style={{ background: 'rgba(200,169,81,0.08)', border: `1px solid ${theme.gold}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: theme.muted }}>
          Ajuste as quantidades para simular o preço final. Alterações são temporárias.
        </div>

        {/* Products table */}
        {modelo.produtos.length > 0 && (
          <>
            <h4 style={{ color: theme.gold, margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Equipamentos</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={thS}>Produto</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Unit.</th>
                  <th style={{ ...thS, textAlign: 'center' }}>Qtd.</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {modelo.produtos.map((p) => {
                  const qty = localQtds[p.codInterno] ?? Number(p.quantidade) ?? 1;
                  const unit = Number(p.produto?.preco) || 0;
                  return (
                    <tr key={p.codInterno} style={{ opacity: qty === 0 ? 0.4 : 1 }}>
                      <td style={tdS}>
                        <div>{prodName(p)}</div>
                        {p.grupoOrcamento && <div style={{ fontSize: 11, color: theme.muted }}>{p.grupoOrcamento}</div>}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', color: theme.muted, whiteSpace: 'nowrap' }}>
                        {unit > 0 ? `R$ ${unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button onClick={() => changeQty(p.codInterno, -1)} style={qtyBtnS} disabled={qty === 0}>−</button>
                          <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                          <button onClick={() => changeQty(p.codInterno, +1)} style={qtyBtnS}>+</button>
                        </div>
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {unit > 0 ? `R$ ${(unit * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* Financial summary */}
        <div style={{ background: theme.soft, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ margin: '0 0 4px', color: theme.gold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Resumo Financeiro</h4>
          {totalEquip > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: theme.muted }}>Equipamentos (instalação)</span>
              <span style={{ fontWeight: 600 }}>R$ {totalEquip.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {valorCrea > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: theme.muted }}>CREA</span>
              <span>R$ {valorCrea.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {modelo.limitePontos != null && modelo.limitePontos > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: theme.muted }}>Limite de pontos</span>
              <span>{modelo.limitePontos} pts</span>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, marginTop: 4 }}>
            {mensalVenda > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                <span style={{ color: theme.muted }}>Mensalidade (venda)</span>
                <span style={{ fontWeight: 700, color: theme.gold }}>R$ {mensalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
              </div>
            )}
            {mensalComodato > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: theme.muted }}>Mensalidade (comodato/locação)</span>
                <span style={{ fontWeight: 700, color: theme.gold }}>R$ {mensalComodato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
              </div>
            )}
          </div>
          {totalEquip > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, paddingTop: 6, borderTop: `2px solid ${theme.gold}44` }}>
              <span style={{ fontWeight: 700 }}>Total equipamentos</span>
              <span style={{ fontWeight: 700, color: theme.gold }}>R$ {totalEquip.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          {hasChanges && (
            <button onClick={resetQtds} style={btnSoftS}>Resetar qtds</button>
          )}
          {hasChanges && (
            <span style={{ fontSize: 11, color: theme.gold, border: `1px solid ${theme.gold}44`, borderRadius: 6, padding: '2px 8px' }}>modificado</span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnGoldS}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Styles ---- */
const thS: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted };
const tdS: React.CSSProperties = { padding: '7px 8px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, verticalAlign: 'middle' };
const qtyBtnS: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, width: 28, height: 28, cursor: 'pointer', fontSize: 16, fontWeight: 700, lineHeight: 1 };
const btnGoldS: React.CSSProperties = { background: theme.gold, border: 'none', borderRadius: 8, color: '#111', padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSoftS: React.CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
