'use client';

type PropostaPDFItem = {
  nome: string;
  quantidade: number;
  precoUnitario: number;
  bloco: string;
};

type PropostaPDFData = {
  clienteNome: string;
  clienteTel: string;
  clienteEndereco: string;
  tipoLocal: string;
  marca: string;
  itens: PropostaPDFItem[];
  observacoes: string;
  vendedorNome: string;
  subtotalEquipamentos: number;
  taxaInstalacao: number;
  valorCrea: number;
  totalVenda: number;
  monitoramentoMensal: number;
  mensalidadeComodato: number;
  prazo: number;
  modalidade: 'venda' | 'comodato' | 'ambos' | 'imagem';
  /** Add-on "+ Monitoramento de Imagem" — valor mensal extra quando ativo (0 ou omitido = desativado). */
  addonImagemValor?: number;
  /** Selo de pré-aprovação (opcional) — presente quando o cliente assinou via modal. */
  aprovacao?: {
    id: string;
    clienteNome: string;
    clienteCpf: string;
    assinaturaBase64: string;
    assinaturaHash: string;
    createdAt: string;
  };
};

export function openPropostaPDF(data: PropostaPDFData) {
  const w = window.open('', '_blank');
  if (!w) return;

  const blocoLabels: Record<string, string> = {
    sensor_externo: 'Sensores Externos',
    sensor_interno: 'Sensores Internos',
    sensor_porta_janela: 'Sensores Porta/Janela',
    camera_analogica: 'Câmeras Analógicas',
    camera_ip: 'Câmeras IP',
    camera_ia: 'Câmeras com IA',
    dvr_nvr: 'DVR / NVR',
    modulo_comunicacao: 'Módulo de Comunicação',
    central_alarme: 'Central de Alarme',
    acessorio: 'Acessórios',
  };

  const groups: Record<string, PropostaPDFItem[]> = {};
  for (const item of data.itens) {
    const key = item.bloco || 'outros';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hoje = new Date();
  const dataFmt = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
  const totalItens = data.itens.reduce((s, i) => s + i.quantidade, 0);

  // ── SVG Waves ──
  const waveTop = `<svg viewBox="0 0 1440 120" preserveAspectRatio="none" style="width:100%;height:80px;display:block"><path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,0 L0,0 Z" fill="#C8A951" opacity="0.12"/><path d="M0,40 C360,100 720,-20 1080,50 C1260,80 1380,20 1440,40 L1440,0 L0,0 Z" fill="#C8A951" opacity="0.07"/></svg>`;
  const waveBottom = `<svg viewBox="0 0 1440 100" preserveAspectRatio="none" style="width:100%;height:60px;display:block"><path d="M0,40 C360,-10 720,80 1080,30 C1260,0 1380,60 1440,40 L1440,100 L0,100 Z" fill="#C8A951" opacity="0.10"/></svg>`;
  const waveDivider = `<svg viewBox="0 0 1440 50" preserveAspectRatio="none" style="width:100%;height:30px;display:block;margin:20px 0"><path d="M0,25 C480,50 960,0 1440,25" stroke="#C8A95133" stroke-width="1.5" fill="none"/></svg>`;

  // ── Equipment rows ──
  let equipRows = '';
  for (const [bloco, items] of Object.entries(groups)) {
    equipRows += `<tr><td colspan="4" style="padding:10px 16px 6px;font-size:11px;font-weight:700;color:#C8A951;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #C8A95133">${blocoLabels[bloco] || bloco}</td></tr>`;
    for (const item of items) {
      equipRows += `<tr>
        <td style="padding:8px 16px;font-size:12px;color:#E8E8E8;border-bottom:1px solid #ffffff0a">${item.nome}</td>
        <td style="padding:8px 16px;font-size:12px;color:#aaa;text-align:center;border-bottom:1px solid #ffffff0a">${item.quantidade}</td>
        <td style="padding:8px 16px;font-size:12px;color:#aaa;text-align:right;border-bottom:1px solid #ffffff0a">R$ ${fmt(item.precoUnitario)}</td>
        <td style="padding:8px 16px;font-size:12px;color:#F2F2F2;text-align:right;font-weight:600;border-bottom:1px solid #ffffff0a">R$ ${fmt(item.precoUnitario * item.quantidade)}</td>
      </tr>`;
    }
  }

  // ── Pricing cards ──
  const pricingRow = (label: string, value: string, highlight = false, sub = false) =>
    `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:${highlight ? '6px 0' : '3px 0'}">
      <span style="font-size:${highlight ? '14px' : sub ? '11px' : '12px'};color:${highlight ? '#F2F2F2' : '#999'};font-weight:${highlight ? '700' : '400'}">${label}</span>
      <span style="font-size:${highlight ? '18px' : '13px'};color:${highlight ? '#C8A951' : '#ccc'};font-weight:${highlight ? '700' : '500'}">${value}</span>
    </div>`;

  let pricingHTML = '';

  const addonImg = data.addonImagemValor ?? 0;
  const addonRow = addonImg > 0
    ? `<div style="margin-top:6px;padding:6px 10px;background:#43C17B14;border:1px solid #43C17B33;border-radius:8px;display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:11px;color:#43C17B;font-weight:600">+ Monitoramento de Imagem</span>
        <span style="font-size:12px;color:#43C17B;font-weight:700">+ R$ ${fmt(addonImg)}/mês</span>
      </div>`
    : '';

  if (data.modalidade === 'venda' || data.modalidade === 'ambos') {
    const monitTotalVenda = data.monitoramentoMensal + addonImg;
    pricingHTML += `
      <div style="flex:1;min-width:260px;background:#1a1a1a;border:1px solid #C8A95133;border-radius:16px;padding:20px;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:80px;height:80px;background:radial-gradient(circle at top right,#C8A95115,transparent 70%);border-radius:0 16px 0 0"></div>
        <div style="font-size:12px;font-weight:700;color:#C8A951;margin-bottom:14px;text-transform:uppercase;letter-spacing:1.5px">Compra</div>
        ${pricingRow('Equipamentos', `R$ ${fmt(data.subtotalEquipamentos)}`)}
        ${pricingRow('Taxa de Instalação', `R$ ${fmt(data.taxaInstalacao)}`)}
        ${data.valorCrea > 0 ? pricingRow('CREA', `R$ ${fmt(data.valorCrea)}`) : ''}
        <div style="border-top:1px solid #ffffff15;margin:10px 0"></div>
        ${pricingRow('Investimento Total', `R$ ${fmt(data.totalVenda)}`, true)}
        <div style="margin-top:8px;padding:8px 12px;background:#ffffff08;border-radius:10px">
          ${pricingRow('Monitoramento', `R$ ${fmt(data.monitoramentoMensal)}/mês`, false, true)}
          ${addonImg > 0 ? `
            <div style="display:flex;justify-content:space-between;align-items:baseline;padding:2px 0">
              <span style="font-size:11px;color:#43C17B;font-weight:600">+ Monitoramento de Imagem</span>
              <span style="font-size:11px;color:#43C17B;font-weight:600">+ R$ ${fmt(addonImg)}/mês</span>
            </div>
            <div style="border-top:1px dashed #ffffff1a;margin:4px 0"></div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;padding:2px 0">
              <span style="font-size:12px;color:#F2F2F2;font-weight:700">Mensalidade Total</span>
              <span style="font-size:14px;color:#C8A951;font-weight:700">R$ ${fmt(monitTotalVenda)}/mês</span>
            </div>
          ` : ''}
        </div>
      </div>`;
  }

  if (data.modalidade === 'comodato' || data.modalidade === 'ambos') {
    const mensalidadeTotalComodato = data.mensalidadeComodato + addonImg;
    pricingHTML += `
      <div style="flex:1;min-width:260px;background:#1a1a1a;border:1px solid #3a7abd55;border-radius:16px;padding:20px;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:80px;height:80px;background:radial-gradient(circle at top right,#3a7abd20,transparent 70%);border-radius:0 16px 0 0"></div>
        <div style="font-size:12px;font-weight:700;color:#5B9BD5;margin-bottom:14px;text-transform:uppercase;letter-spacing:1.5px">Comodato · ${data.prazo} meses</div>
        ${addonImg > 0 ? `
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding:3px 0">
            <span style="font-size:12px;color:#999">Mensalidade base</span>
            <span style="font-size:13px;color:#ccc;font-weight:500">R$ ${fmt(data.mensalidadeComodato)}/mês</span>
          </div>
          ${addonRow}
          <div style="border-top:1px solid #ffffff15;margin:10px 0"></div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0">
          <span style="font-size:14px;color:#F2F2F2;font-weight:700">Mensalidade${addonImg > 0 ? ' Total' : ''}</span>
          <span style="font-size:22px;color:#5B9BD5;font-weight:700">R$ ${fmt(mensalidadeTotalComodato)}<span style="font-size:12px;font-weight:400">/mês</span></span>
        </div>
        <div style="border-top:1px solid #ffffff15;margin:10px 0"></div>
        <div style="padding:8px 12px;background:#C8A95110;border-radius:10px;margin-bottom:8px">
          ${pricingRow('Taxa de Instalação', `R$ ${fmt(data.taxaInstalacao)}`, false)}
        </div>
        <div style="font-size:10px;color:#888;padding:2px 0 6px;line-height:1.5">Paga na assinatura do contrato · ${data.prazo} mensalidades de R$ ${fmt(mensalidadeTotalComodato)} para monitoramento</div>
      </div>`;
  }

  if (data.modalidade === 'imagem') {
    pricingHTML += `
      <div style="flex:1;min-width:260px;background:#1a1a1a;border:1px solid #43C17B55;border-radius:16px;padding:20px;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:80px;height:80px;background:radial-gradient(circle at top right,#43C17B20,transparent 70%);border-radius:0 16px 0 0"></div>
        <div style="font-size:12px;font-weight:700;color:#43C17B;margin-bottom:14px;text-transform:uppercase;letter-spacing:1.5px">Monitoramento de Imagem</div>
        <div style="font-size:11px;color:#999;margin-bottom:12px;line-height:1.5">Para clientes que já possuem equipamentos próprios. Apenas serviço de monitoramento.</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0">
          <span style="font-size:14px;color:#F2F2F2;font-weight:700">Mensalidade</span>
          <span style="font-size:22px;color:#43C17B;font-weight:700">R$ ${fmt(data.monitoramentoMensal)}<span style="font-size:12px;font-weight:400">/mês</span></span>
        </div>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Security24h — ${data.clienteNome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; color: #F2F2F2; background: #0B0B0B; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @media print {
      html, body { background: #0B0B0B !important; margin: 0 !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; max-width: 100% !important; width: 100% !important; }
      .glass-card, .hero, .content, .footer-section { page-break-inside: avoid; break-inside: avoid; }
      @page { margin: 8mm; size: A4; }
    }
    .page { max-width: 760px; margin: 0 auto; position: relative; }

    .hero { position: relative; padding: 40px 40px 20px; }
    .hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #111 0%, #0B0B0B 50%, #1a1508 100%); z-index: 0; }

    .content { padding: 0 40px; position: relative; z-index: 1; }
    .section-label { font-size: 10px; font-weight: 700; color: #C8A951; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }

    .glass-card { background: #14141499; backdrop-filter: blur(10px); border: 1px solid #3A3A3A; border-radius: 16px; padding: 20px; margin-bottom: 20px; }

    .badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    table { width: 100%; border-collapse: collapse; }

    .footer-section { padding: 20px 40px 30px; text-align: center; position: relative; z-index: 1; }

    .glow-line { height: 1px; background: linear-gradient(90deg, transparent, #C8A951, transparent); margin: 0 40px; }

    .print-btn {
      position: fixed; bottom: 24px; right: 24px;
      background: linear-gradient(135deg, #C8A951, #a88b3a);
      color: #111; border: none; padding: 14px 28px; border-radius: 30px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 20px rgba(200,169,81,0.3); z-index: 100;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .print-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(200,169,81,0.4); }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Imprimir / Salvar PDF</button>

  <div class="page">
    <!-- Hero with wave -->
    <div class="hero">
      <div class="hero-bg"></div>
      <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:16px">
          <img src="/LOGO SECURITY 24H.png" alt="Security 24H" style="height:56px;filter:drop-shadow(0 2px 8px rgba(200,169,81,0.3))" onerror="this.style.display='none'">
          <div>
            <div style="font-size:24px;font-weight:800;color:#C8A951;letter-spacing:2px;text-shadow:0 2px 10px rgba(200,169,81,0.2)">SECURITY 24H</div>
            <div style="font-size:11px;color:#888;letter-spacing:3px;text-transform:uppercase;margin-top:2px">Segurança Eletrônica</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;color:#C8A951;text-transform:uppercase;letter-spacing:2px;font-weight:600">Proposta Comercial</div>
          <div style="font-size:20px;font-weight:300;color:#F2F2F2;margin-top:4px">${dataFmt}</div>
        </div>
      </div>
    </div>
    ${waveTop}

    <div class="content">
      <!-- Client card -->
      <div class="glass-card" style="border-left:3px solid #C8A951">
        <div class="section-label">Cliente</div>
        <div style="font-size:20px;font-weight:700;color:#F2F2F2;margin-bottom:6px">${data.clienteNome}</div>
        ${data.clienteTel ? `<div style="font-size:13px;color:#999;margin-bottom:2px">${data.clienteTel}</div>` : ''}
        ${data.clienteEndereco ? `<div style="font-size:13px;color:#999;margin-bottom:2px">${data.clienteEndereco}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <span class="badge" style="background:#C8A95115;color:#C8A951;border:1px solid #C8A95133">${data.tipoLocal}</span>
          <span class="badge" style="background:#5B9BD515;color:#5B9BD5;border:1px solid #5B9BD533">${data.marca}</span>
          <span class="badge" style="background:#ffffff0a;color:#999;border:1px solid #ffffff15">${totalItens} equipamentos</span>
        </div>
      </div>

      ${data.modalidade !== 'imagem' ? `
      ${waveDivider}

      <!-- Equipment table -->
      <div class="section-label">Equipamentos</div>
      <div class="glass-card" style="padding:0;overflow:hidden">
        <table>
          <thead>
            <tr style="background:linear-gradient(90deg,#1a1a1a,#222)">
              <th style="padding:12px 16px;text-align:left;font-size:10px;font-weight:700;color:#C8A951;text-transform:uppercase;letter-spacing:1px">Produto</th>
              <th style="padding:12px 16px;text-align:center;font-size:10px;font-weight:700;color:#C8A951;text-transform:uppercase;letter-spacing:1px;width:50px">Qtd</th>
              <th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:700;color:#C8A951;text-transform:uppercase;letter-spacing:1px;width:100px">Unitário</th>
              <th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:700;color:#C8A951;text-transform:uppercase;letter-spacing:1px;width:100px">Subtotal</th>
            </tr>
          </thead>
          <tbody>${equipRows}</tbody>
          <tfoot>
            <tr style="background:#C8A95112">
              <td colspan="3" style="padding:12px 16px;font-size:13px;font-weight:700;color:#F2F2F2">Total Equipamentos</td>
              <td style="padding:12px 16px;text-align:right;font-size:16px;font-weight:700;color:#C8A951">R$ ${fmt(data.subtotalEquipamentos)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      ` : ''}

      ${waveDivider}

      <!-- Pricing -->
      <div class="section-label">Investimento</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px">
        ${pricingHTML}
      </div>

      ${data.observacoes ? `
      <div class="glass-card">
        <div class="section-label">Observações</div>
        <div style="font-size:12px;color:#999;white-space:pre-wrap;line-height:1.6">${data.observacoes}</div>
      </div>` : ''}

      ${data.aprovacao ? (() => {
        const ap = data.aprovacao;
        const dt = new Date(ap.createdAt);
        const dtFmt = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
        const cpfFmt = ap.clienteCpf ? ap.clienteCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '';
        const codigoCurto = ap.assinaturaHash.slice(-12).toUpperCase();
        return `
      ${waveDivider}
      <div class="section-label">Pré-aprovação do Cliente</div>
      <div class="glass-card" style="border:2px solid #43C17B55;background:linear-gradient(135deg,#14141499,#0d1a12)">
        <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <div style="flex:1;min-width:200px">
            <div style="display:inline-flex;align-items:center;gap:6px;background:#43C17B15;border:1px solid #43C17B55;border-radius:20px;padding:4px 12px;margin-bottom:10px">
              <span style="width:8px;height:8px;border-radius:50%;background:#43C17B;display:inline-block"></span>
              <span style="font-size:10px;font-weight:700;color:#43C17B;text-transform:uppercase;letter-spacing:1px">Assinatura registrada</span>
            </div>
            <div style="font-size:14px;color:#F2F2F2;font-weight:700;margin-bottom:4px">${ap.clienteNome}</div>
            ${cpfFmt ? `<div style="font-size:11px;color:#999">CPF: ${cpfFmt}</div>` : ''}
            <div style="font-size:11px;color:#999;margin-top:4px">Assinado em ${dtFmt}</div>
            <div style="margin-top:10px;padding:6px 10px;background:#0B0B0B;border:1px dashed #43C17B44;border-radius:8px;display:inline-block">
              <span style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Código de verificação</span>
              <div style="font-family:'Courier New',monospace;font-size:13px;color:#43C17B;font-weight:700;letter-spacing:2px">${codigoCurto}</div>
            </div>
          </div>
          <div style="flex:0 0 auto;background:#FFFFFF;padding:8px;border-radius:10px;border:1px solid #43C17B33">
            <img src="${ap.assinaturaBase64}" alt="Assinatura" style="display:block;max-width:220px;max-height:100px;height:auto;width:auto" />
          </div>
        </div>
        <div style="font-size:10px;color:#666;margin-top:12px;line-height:1.5;padding-top:10px;border-top:1px solid #ffffff10">
          Pré-aprovação comercial. Assinatura manuscrita capturada em dispositivo do vendedor e arquivada no sistema Security 24H com hash SHA-256 para verificação de integridade. Este documento não substitui contrato assinado.
        </div>
      </div>
      `;
      })() : ''}
    </div>

    <!-- Footer wave + content -->
    ${waveBottom}
    <div class="glow-line"></div>
    <div class="footer-section">
      <div style="font-size:16px;font-weight:700;color:#C8A951;letter-spacing:2px;margin-bottom:6px">SECURITY 24H</div>
      <div style="font-size:11px;color:#666;letter-spacing:1px">Segurança Eletrônica</div>
      ${data.vendedorNome ? `<div style="margin-top:10px;font-size:12px;color:#888">Vendedor: <span style="color:#ccc">${data.vendedorNome}</span></div>` : ''}
      <div style="margin-top:12px;padding:8px 20px;display:inline-block;background:#C8A95110;border-radius:20px;border:1px solid #C8A95122">
        <span style="font-size:10px;color:#C8A951;font-weight:600;letter-spacing:0.5px">Proposta válida por 15 dias a partir de ${dataFmt}</span>
      </div>
      <div style="margin-top:10px;font-size:9px;color:#555">Este documento é uma proposta comercial e não possui valor fiscal</div>
    </div>
  </div>
</body>
</html>`;

  w.document.write(html);
  w.document.close();
}
