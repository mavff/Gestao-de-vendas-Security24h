import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

const SHEET_ID = '1mnYYS2-cPMld0pzsVRqNth5JanKSvjV46hYch33oatY';
const MES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 60_000);

// ── SDR multi-tab types ──────────────────────────────────────────────────────
// 3 tabs from the real Google Sheets:
//   "SDR Log" (WhatsApp leads), "Instagram", "Visitas marcadas"
export type SdrTabEntry = {
  rowIndex: number;
  cells: string[];
};

export type SdrTabStats = {
  total: number;
  porStatus: { label: string; total: number }[];
};

export type SdrTabResult = {
  tab: string;
  sheetName: string;
  columns: string[];
  entries: SdrTabEntry[];
  stats: SdrTabStats;
};

export type SdrQuery = {
  tab?: 'whatsapp' | 'instagram' | 'visitas';
  period?: 'week' | 'month' | '30d' | 'custom';
  start?: string;
  end?: string;
};

// ── Tab config: sheet name, how many data columns to show, which col is date/status ──
const TAB_CONFIG: Record<string, {
  sheetName: string;
  dataCols: number;      // how many columns of real data to show (skip legend cols)
  dateCol: number;       // col index with date for period filter
  statusCol: number;     // col index with status for stats
  nameCol: number;       // col index with lead name (skip empty rows)
  hasColLabels: boolean; // true = gviz cols already have labels; false = row 0 is header
}> = {
  whatsapp: { sheetName: 'SDR Log',          dataCols: 7,  dateCol: 0, statusCol: 5, nameCol: 1, hasColLabels: false },
  instagram: { sheetName: 'Instagram',        dataCols: 8,  dateCol: 0, statusCol: 5, nameCol: 1, hasColLabels: true },
  visitas:  { sheetName: 'Visitas marcadas', dataCols: 12, dateCol: 0, statusCol: 6, nameCol: 1, hasColLabels: true },
};

// Status codes that count as "interessado" (for whatsapp/sdr-log KPIs)
const SDR_INTERESSADOS = new Set(['INT', 'IQ', 'ANL', 'MV', 'OE']);

// ── Canal groups for marketing analysis ──────────────────────────────────────
const CANAL_GRUPOS = [
  { canal: 'Tráfego Pago',    origens: ['ADS'] },
  { canal: 'Form. Instagram', origens: ['FORM/INSTA', 'FORM/INSTA, DIRECIONADA POR LINK'] },
  { canal: 'Central',         origens: ['CENTRAL', 'LIGAÇÃO'] },
  { canal: 'Site',            origens: ['FORM/SITE', 'FORM/SITE, DIRECIONADA POR LINK'] },
  { canal: 'Prospecção',      origens: ['PROSPECÇÃO', 'DIRECIONADA POR LINK', 'INSTA/DM', 'INSTA/PA'] },
];

export type SheetsLeadStats = {
  kpis: {
    totalLeads: number;
    totalVisitas: number;
    totalFechou: number;
    taxaFechamento: number;
    newThisWeek: number;
  };
  funnelCrm: { stage: string; total: number }[];
  porOrigem: { origin: string; total: number }[];
  porCanal: { origin: string; total: number }[];
  porResponsavel: { seller: string; closures: number }[];
  porStatus: { status: string; total: number }[];
  evolucaoMensal: { mes: string; whatsapp: number; instagram: number; visitas: number }[];
  leadsRecentes: {
    nome: string;
    empresa: string;
    canal: string;
    status: string;
    prioridade: string;
    responsavel: string;
    data: string;
  }[];
  analiseCanal: {
    canal: string;
    origens: string[];
    leads: number;
    visitas: number;
    fechamentos: number;
  }[];
};

// ── Column indices (0-based) ──────────────────────────────────────────────────
// WhatsApp: gviz cols are labeled A,B,C...; row 0 in rows[] = header label row (skip it)
//   0:Data  1:Nome  2:Empresa/Tipo  3:Fone  4:Origem  5:Status  6:Obs
const WA = { DATA: 0, NOME: 1, EMPRESA: 2, ORIGEM: 4, STATUS: 5 } as const;

// Instagram: gviz used first data row as col labels → we prepend it back as a data row
//   0:Data  1:Nome  4:Handle(origem)  5:Status  6:Responsável
const IG = { DATA: 0, NOME: 1, HANDLE: 4, STATUS: 5, RESPONSAVEL: 6 } as const;

// Visitas marcadas: gviz used first data row as col labels → we prepend it back
//   0:Data  1:Nome  2:Tipo  3:Origem  6:Status  8:Fechou?
const VIS = { DATA: 0, NOME: 1, ORIGEM: 3, STATUS: 6, FECHOU: 8 } as const;

// ── WhatsApp status code → label ──────────────────────────────────────────────
// Codes confirmed from planilha (col F):
//   Pipeline: T1, T2, T3 (tentativas), INT (interessado), IQ (qualificado),
//             ANL (em análise), MV (marcou visita), OE (orçamento enviado)
//   Descartados: NR3 (não respondeu 3x), CE (contato encerrado),
//                LD-PRE (preço), LD-FOR (fora da área), LD-SEM (sem perfil),
//                LD-CONC (fechou c/ concorrente), LD-CLIEN (já é cliente)
const WA_STATUS: Record<string, string> = {
  'T1':       '1ª Tentativa',
  'T2':       '2ª Tentativa',
  'T3':       '3ª Tentativa',
  'NR3':      'Não respondeu (3x)',
  'CE':       'Contato Encerrado',
  'INT':      'Interessado',
  'IQ':       'Qualificado',
  'ANL':      'Em Análise',
  'MV':       'Marcou Visita',
  'OE':       'Orçamento Enviado',
  'LD-PRE':   'Desc.: Preço',
  'LD-FOR':   'Desc.: Fora da área',
  'LD-SEM':   'Desc.: Sem perfil',
  'LD-CONC':  'Desc.: Concorrente',
  'LD-CLIEN': 'Já é cliente',
};

// ── Visitas status code → label ───────────────────────────────────────────────
// Codes: A-VIS, VR, VNE, VNE-CLI, OPF, OE, EA, REC, S-RET, FCH
const VIS_STATUS: Record<string, string> = {
  'A-VIS':   'Aguardando Visita',
  'VR':      'Visita Realizada',
  'VNE':     'Visita Não Executada',
  'VNE-CLI': 'Cliente Ausente',
  'OPF':     'Orçamento a Fazer',
  'OE':      'Orçamento Enviado',
  'EA':      'Em Análise',
  'REC':     'Recusou Orçamento',
  'S-RET':   'Sem Retorno',
  'FCH':     'Fechou Venda',
};

@Injectable()
export class SheetsService {
  private readonly logger = new Logger(SheetsService.name);
  private cache: { data: SheetsLeadStats; ts: number } | null = null;

  // ── Cell helpers ───────────────────────────────────────────────────────────

  private cellStr(cell: any): string {
    if (!cell) return '';
    if (cell.f != null) return String(cell.f).trim();
    if (cell.v == null) return '';
    return String(cell.v).trim();
  }

  private parseDDMMYYYY(v: string): Date | null {
    const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(+m[3], +m[2] - 1, +m[1]);
  }

  // If col 0 label looks like a date, gviz treated first data row as column
  // headers → we need to prepend that row back into the data.
  private colsAreDataRow(cols: string[]): boolean {
    return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test((cols[0] ?? '').trim());
  }

  // ── Fetch one sheet tab ────────────────────────────────────────────────────

  private async fetchSheet(sheetName: string): Promise<string[][]> {
    const url =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json` +
      `&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Sheets HTTP ${res.status} for "${sheetName}"`);

    const text = await res.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return [];
    let json: any;
    try { json = JSON.parse(text.slice(start, end + 1)); } catch { return []; }

    // Column labels from gviz
    const cols: string[] = (json.table?.cols ?? []).map(
      (c: any) => String(c.label || c.id || '').trim(),
    );

    // Data rows
    const rawRows: any[] = json.table?.rows ?? [];
    const dataRows: string[][] = rawRows
      .map((row: any) => (row.c ?? []).map((cell: any) => this.cellStr(cell)))
      .filter((r) => r.some((v: string) => v !== ''));

    // When gviz treats the first actual data row as column headers (Instagram,
    // Visitas), the col labels contain real values. Prepend them as row 0.
    if (this.colsAreDataRow(cols)) {
      return [cols, ...dataRows];
    }

    // WhatsApp: cols are just "A","B","C"... and rows[0] is the label row —
    // already included in dataRows, will be skipped in buildStats.
    return dataRows;
  }

  // ── Main entry ─────────────────────────────────────────────────────────────

  async getLeadStats(): Promise<SheetsLeadStats> {
    if (this.cache && Date.now() - this.cache.ts < CACHE_TTL_MS) {
      return this.cache.data;
    }

    this.logger.log('Fetching sheets data…');
    const [rawWa, rawIg, rawVis] = await Promise.all([
      this.fetchSheet('Whatsapp'),
      this.fetchSheet('Instagram'),
      this.fetchSheet('Visitas marcadas'),
    ]);

    const data = this.buildStats(rawWa, rawIg, rawVis);
    this.cache = { data, ts: Date.now() };
    return data;
  }

  // ── Aggregation ────────────────────────────────────────────────────────────

  private buildStats(
    rawWa: string[][],
    rawIg: string[][],
    rawVis: string[][],
  ): SheetsLeadStats {
    // WhatsApp row 0 is the header label row ("Nome do Lead", etc.) — skip it.
    // Filter by nome to drop fully-empty rows.
    const waRows = rawWa.slice(1).filter((r) => (r[WA.NOME] ?? '').length > 0);

    // Instagram and Visitas: all rows are data (header was prepended above).
    const igRows = rawIg.filter((r) => (r[IG.NOME] ?? '').length > 0);
    const visRows = rawVis.filter((r) => (r[VIS.NOME] ?? '').length > 0);

    const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    // ── KPIs ──────────────────────────────────────────────────────────────────

    const newThisWeek = [...waRows, ...igRows].filter((r) => {
      const d = this.parseDDMMYYYY(r[0] ?? '');
      return d && d >= weekAgo;
    }).length;

    const totalFechou = visRows.filter(
      (r) => (r[VIS.STATUS] ?? '').trim().toUpperCase() === 'FCH',
    ).length;

    // ── Funnel CRM (channel view) ─────────────────────────────────────────────
    // Staged as: WhatsApp → Instagram → Visitas → Fechou
    // ShFunilModalContent uses: data[0]+data[1]=total, data[2]=visitas, last=fechou
    const funnelCrm = [
      { stage: 'WhatsApp', total: waRows.length },
      { stage: 'Instagram', total: igRows.length },
      { stage: 'Visitas', total: visRows.length },
      { stage: 'Fechou', total: totalFechou },
    ].filter((s) => s.total > 0);

    // ── Por status (WhatsApp pipeline) ────────────────────────────────────────
    const statusMap = new Map<string, number>();
    for (const r of waRows) {
      const code = (r[WA.STATUS] ?? '').trim().toUpperCase();
      if (!code) continue;
      const label = WA_STATUS[code] ?? code;
      statusMap.set(label, (statusMap.get(label) ?? 0) + 1);
    }
    const porStatus = [...statusMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([status, total]) => ({ status, total }));

    // ── Por origem (WhatsApp) ─────────────────────────────────────────────────
    const origemMap = new Map<string, number>();
    for (const r of waRows) {
      const o = (r[WA.ORIGEM] ?? '').trim();
      if (!o) continue;
      origemMap.set(o, (origemMap.get(o) ?? 0) + 1);
    }
    const porOrigem = [...origemMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([origin, total]) => ({ origin, total }));

    // ── Por canal ─────────────────────────────────────────────────────────────
    const porCanal = [
      { origin: 'WhatsApp', total: waRows.length },
      { origin: 'Instagram', total: igRows.length },
    ].filter((c) => c.total > 0);

    // ── Por responsável (Instagram SDR) ───────────────────────────────────────
    // Col 6 sometimes contains status codes (N/R, IG-INT) instead of SDR names.
    // Keep only values that look like person initials/names (letters only, ≤8 chars).
    const sdrMap = new Map<string, number>();
    for (const r of igRows) {
      const s = (r[IG.RESPONSAVEL] ?? '').trim();
      if (s && /^[A-Za-záéíóúãõâêîôûç]{1,8}$/i.test(s)) {
        sdrMap.set(s, (sdrMap.get(s) ?? 0) + 1);
      }
    }
    const porResponsavel = [...sdrMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([seller, closures]) => ({ seller, closures }));

    // ── Evolução mensal ───────────────────────────────────────────────────────
    const mesMap = new Map<
      string,
      { whatsapp: number; instagram: number; visitas: number; sort: number }
    >();

    const addMes = (dateStr: string, canal: 'whatsapp' | 'instagram' | 'visitas') => {
      const d = this.parseDDMMYYYY(dateStr ?? '');
      if (!d) return;
      const key = `${MES_NOMES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const sort = d.getFullYear() * 100 + d.getMonth();
      const entry = mesMap.get(key) ?? { whatsapp: 0, instagram: 0, visitas: 0, sort };
      entry[canal]++;
      mesMap.set(key, entry);
    };

    waRows.forEach((r) => addMes(r[WA.DATA] ?? '', 'whatsapp'));
    igRows.forEach((r) => addMes(r[IG.DATA] ?? '', 'instagram'));
    visRows.forEach((r) => addMes(r[VIS.DATA] ?? '', 'visitas'));

    const evolucaoMensal = [...mesMap.entries()]
      .sort((a, b) => a[1].sort - b[1].sort)
      .map(([mes, v]) => ({ mes, whatsapp: v.whatsapp, instagram: v.instagram, visitas: v.visitas }));

    // ── Leads recentes (WA + IG, últimos 25 por data) ────────────────────────
    type AugRow = { row: string[]; canal: 'WhatsApp' | 'Instagram' };
    const combined: AugRow[] = [
      ...waRows.map((r) => ({ row: r, canal: 'WhatsApp' as const })),
      ...igRows.map((r) => ({ row: r, canal: 'Instagram' as const })),
    ].sort((a, b) => {
      const da = this.parseDDMMYYYY(a.row[0] ?? '');
      const db = this.parseDDMMYYYY(b.row[0] ?? '');
      if (!da || !db) return 0;
      return db.getTime() - da.getTime();
    });

    const leadsRecentes = combined.slice(0, 25).map(({ row: r, canal }) => {
      const isWa = canal === 'WhatsApp';
      const code = ((isWa ? r[WA.STATUS] : r[IG.STATUS]) ?? '').trim().toUpperCase();
      return {
        nome:        (isWa ? r[WA.NOME] : r[IG.NOME]) || '—',
        empresa:     (isWa ? r[WA.EMPRESA] : r[IG.HANDLE]) || '—',
        canal,
        status:      isWa ? (WA_STATUS[code] ?? code) : code,
        prioridade:  '',
        responsavel: isWa ? '' : (r[IG.RESPONSAVEL] ?? ''),
        data:        r[0] ?? '',
      };
    });

    // ── Análise por canal (marketing) ─────────────────────────────────────────
    const analiseCanal = CANAL_GRUPOS.map((grupo) => {
      const origenNorm = grupo.origens.map((o) => o.trim().toUpperCase());

      const leads = waRows.filter((r) => {
        const o = (r[WA.ORIGEM] ?? '').trim().toUpperCase();
        return origenNorm.includes(o);
      }).length;

      const visCanal = visRows.filter((r) => {
        const o = (r[VIS.ORIGEM] ?? '').trim().toUpperCase();
        return origenNorm.includes(o);
      });

      const fechamentos = visCanal.filter(
        (r) => (r[VIS.STATUS] ?? '').trim().toUpperCase() === 'FCH',
      ).length;

      return {
        canal: grupo.canal,
        origens: grupo.origens,
        leads,
        visitas: visCanal.length,
        fechamentos,
      };
    });

    return {
      kpis: {
        totalLeads:     waRows.length + igRows.length,
        totalVisitas:   visRows.length,
        totalFechou,
        taxaFechamento:
          visRows.length > 0
            ? Math.round((totalFechou / visRows.length) * 1000) / 10
            : 0,
        newThisWeek,
      },
      funnelCrm,
      porOrigem,
      porCanal,
      porResponsavel,
      porStatus,
      evolucaoMensal,
      leadsRecentes,
      analiseCanal,
    };
  }

  // ── SDR multi-tab ──────────────────────────────────────────────────────────

  private sdrTabCache = new Map<string, { data: SdrTabResult; ts: number }>();

  /** Fetch a single SDR tab with columns + raw cell entries */
  private async fetchSdrTab(tabKey: string): Promise<SdrTabResult> {
    const conf = TAB_CONFIG[tabKey];
    if (!conf) throw new HttpException(`Tab "${tabKey}" desconhecida`, HttpStatus.BAD_REQUEST);

    const cached = this.sdrTabCache.get(tabKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

    this.logger.log(`Fetching sheet "${conf.sheetName}"…`);
    const rawRows = await this.fetchSheet(conf.sheetName);

    let columns: string[];
    let dataStartIdx: number;

    if (conf.hasColLabels) {
      // gviz used the first row as column labels → they're in cols, rawRows is all data
      // fetchSheet already prepends cols as row 0 if colsAreDataRow — but for IG/Visitas
      // the cols contain the actual labels, so rawRows is pure data.
      // Re-fetch to get raw cols labels:
      const url =
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json` +
        `&sheet=${encodeURIComponent(conf.sheetName)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      const text = await res.text();
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      let json: any;
      try { json = JSON.parse(text.slice(start, end + 1)); } catch { json = {}; }
      const gvizCols: string[] = (json.table?.cols ?? [])
        .map((c: any) => String(c.label || c.id || '').replace(/\n/g, ' ').trim());
      columns = gvizCols.slice(0, conf.dataCols).map((c) => c || '—');
      dataStartIdx = 0; // all rawRows are data
    } else {
      // SDR Log: cols are A,B,C… — row 0 is the header
      const headerRow = rawRows[0] ?? [];
      columns = [];
      for (let i = 0; i < conf.dataCols; i++) {
        const v = (headerRow[i] ?? '').replace(/\n/g, ' ').trim();
        columns.push(v || `Col ${i + 1}`);
      }
      dataStartIdx = 1;
    }

    const entries: SdrTabEntry[] = [];
    for (let i = dataStartIdx; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (!(r[conf.nameCol] ?? '').trim()) continue;
      entries.push({
        rowIndex: i,
        cells: r.slice(0, conf.dataCols),
      });
    }

    // Stats: count by status column
    const statusMap = new Map<string, number>();
    for (const e of entries) {
      const s = (e.cells[conf.statusCol] ?? '').trim() || '—';
      statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }

    const result: SdrTabResult = {
      tab: tabKey,
      sheetName: conf.sheetName,
      columns,
      entries,
      stats: {
        total: entries.length,
        porStatus: [...statusMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([label, total]) => ({ label, total })),
      },
    };

    this.sdrTabCache.set(tabKey, { data: result, ts: Date.now() });
    return result;
  }

  /** Filter entries by period (uses dateCol for each tab) */
  private filterTabByPeriod(result: SdrTabResult, query: SdrQuery): SdrTabResult {
    if (!query.period) return result;

    const conf = TAB_CONFIG[result.tab];
    if (!conf) return result;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let from: Date | null = null;
    let to: Date | null = today;

    if (query.period === 'week')  from = new Date(Date.now() - 7 * 86_400_000);
    else if (query.period === '30d') from = new Date(Date.now() - 30 * 86_400_000);
    else if (query.period === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (query.period === 'custom') {
      if (query.start) from = new Date(query.start);
      if (query.end) { to = new Date(query.end); to.setHours(23, 59, 59, 999); }
    }

    const filtered = result.entries.filter((e) => {
      const d = this.parseDDMMYYYY(e.cells[conf.dateCol] ?? '');
      if (!d) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    // Recompute stats
    const statusMap = new Map<string, number>();
    for (const e of filtered) {
      const s = (e.cells[conf.statusCol] ?? '').trim() || '—';
      statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }

    return {
      ...result,
      entries: filtered,
      stats: {
        total: filtered.length,
        porStatus: [...statusMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([label, total]) => ({ label, total })),
      },
    };
  }

  async getSdrTab(query: SdrQuery): Promise<SdrTabResult> {
    const tabKey = query.tab || 'whatsapp';
    const raw = await this.fetchSdrTab(tabKey);
    return this.filterTabByPeriod(raw, query);
  }

  /** Health check: try to reach Google Sheets */
  async checkHealth(): Promise<{ online: boolean; latencyMs: number }> {
    const t0 = Date.now();
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=select%20A%20limit%201&sheet=SDR%20Log`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      return { online: res.ok, latencyMs: Date.now() - t0 };
    } catch {
      return { online: false, latencyMs: Date.now() - t0 };
    }
  }
}
