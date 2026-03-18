import { Injectable, Logger } from '@nestjs/common';

// ── Spreadsheet IDs ──────────────────────────────────────────────────────────
const SHEET_LP    = '1PQ6waKBq275qD59TW0lLMa2-7jYNOiYkfnuVyPM6c78';
const SHEET_SITE  = '1T4F3U6AaoW6Qc7R3tSYNU9CPh9iLXNkSDhYme7eRCKM';
const SHEET_INSTA = '1JSkHEwSH5Aj9RfUVgFdigF9mqDAL6fXnO7Zb_qBQKEY';
const SHEET_SDR   = '1mnYYS2-cPMld0pzsVRqNth5JanKSvjV46hYch33oatY';

const CRM_CACHE_TTL = Number(process.env.CRM_CACHE_TTL_MS ?? 120_000);

// ── Canonical Lead ───────────────────────────────────────────────────────────
export interface CrmLead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  bairro: string;
  empresa: string;

  origem: string;
  origemLabel: string;
  produtoInteresse: string;
  tipoLocal: string;
  urgencia: string;
  valorPretendido: string;
  objetivo: string;

  status: string;
  statusNorm: string;
  responsavel: string;

  dataEntrada: string;
  horaEntrada: string;
  fontes: string[];
  score: number;
  prioridade: 'alta' | 'media' | 'baixa';
  observacoes: string;

  duplicatas: number;
  fechou: string;
  motivoPerda: string;
  valorOrcamento: string;
  instagramHandle: string;
}

export interface CrmStats {
  total: number;
  novos: number;
  emContato: number;
  qualificados: number;
  orcamentoEnviado: number;
  fechados: number;
  perdidos: number;
  semAtendimento: number;
  porOrigem: { origem: string; total: number }[];
  porProduto: { produto: string; total: number }[];
  porResponsavel: { responsavel: string; total: number }[];
  porStatus: { status: string; total: number }[];
  porPrioridade: { prioridade: string; total: number }[];
  porPeriodo: { mes: string; total: number }[];
}

export interface CrmQuery {
  search?: string;
  origem?: string;
  status?: string;
  responsavel?: string;
  prioridade?: string;
  produtoInteresse?: string;
  cidade?: string;
  period?: 'week' | 'month' | '30d' | '90d' | 'custom' | 'all';
  start?: string;
  end?: string;
}

// ── Source config ─────────────────────────────────────────────────────────────

interface SourceConfig {
  id: string;
  sheetId: string;
  gid?: string;
  sheetName?: string;
  origemKey: string;
  origemLabel: string;
  mapper: (rows: string[][], cfg: SourceConfig) => CrmLead[];
}

const MES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ── Status normalization map ─────────────────────────────────────────────────
const STATUS_NORM: Record<string, string> = {
  // SDR WhatsApp
  'T1': 'Primeiro contato', 'T2': 'Primeiro contato', 'T3': 'Primeiro contato',
  'INT': 'Conversando', 'IQ': 'Qualificado', 'ANL': 'Conversando',
  'MV': 'Agendado', 'OE': 'Orçamento enviado',
  'NR3': 'Perdido', 'CE': 'Perdido',
  'LD-PRE': 'Perdido', 'LD-FOR': 'Perdido', 'LD-SEM': 'Perdido',
  'LD-CONC': 'Perdido', 'LD-CLIEN': 'Perdido',
  // SDR Instagram
  'IG-NOVO': 'Novo', 'PA': 'Primeiro contato',
  'IG-INFO': 'Conversando', 'IG-REA': 'Conversando', 'IG-COM': 'Fechado',
  // SDR Visitas
  'A-VIS': 'Agendado', 'VR': 'Qualificado', 'VNE': 'Perdido', 'VNE-CLI': 'Perdido',
  'OPF': 'Orçamento enviado', 'EA': 'Conversando', 'REC': 'Perdido',
  'S-RET': 'Perdido', 'FCH': 'Fechado',
};

// ── Produto mapping ──────────────────────────────────────────────────────────
function inferProduto(text: string): string {
  if (!text) return '';
  const t = text.toLowerCase();
  if (t.includes('alarme') && t.includes('câmera')) return 'Alarme e Câmeras';
  if (t.includes('alarme')) return 'Alarme Monitorado';
  if (t.includes('câmera') || t.includes('camera')) return 'Câmeras Monitoradas';
  if (t.includes('cerca') || t.includes('concertina')) return 'Cerca Elétrica';
  if (t.includes('totem')) return 'Totem de Segurança';
  if (t.includes('portaria') || t.includes('controle de acesso')) return 'Controle de Acesso';
  if (t.includes('segurança') || t.includes('monitoramento')) return 'Segurança Eletrônica';
  return text.length > 50 ? text.slice(0, 50) : text;
}

// ── Priority scoring ─────────────────────────────────────────────────────────
function calcScore(lead: Partial<CrmLead>): number {
  let score = 30; // base

  // Urgência
  const urg = (lead.urgencia ?? '').toLowerCase();
  if (urg.includes('quanto antes') || urg.includes('urgente') || urg.includes('imediato')) score += 30;
  else if (urg.includes('30 dias') || urg.includes('próxim')) score += 15;
  else if (urg.includes('pesquisando') || urg.includes('futuro')) score -= 10;

  // Status
  const st = lead.statusNorm ?? '';
  if (st === 'Qualificado' || st === 'Agendado') score += 20;
  else if (st === 'Orçamento enviado') score += 15;
  else if (st === 'Conversando') score += 10;
  else if (st === 'Novo') score += 5;
  else if (st === 'Perdido') score -= 20;

  // Origem quente
  const orig = (lead.origem ?? '').toLowerCase();
  if (orig.includes('site') || orig.includes('form')) score += 10;
  if (orig.includes('indicação') || orig.includes('indicacao')) score += 15;

  // Valor pretendido
  const val = (lead.valorPretendido ?? '').toLowerCase();
  if (val.includes('5.000') || val.includes('10.000') || val.includes('acima')) score += 10;

  // Produto definido
  if (lead.produtoInteresse) score += 5;

  return Math.max(0, Math.min(100, score));
}

function scoreToPrioridade(score: number): 'alta' | 'media' | 'baixa' {
  if (score >= 60) return 'alta';
  if (score >= 35) return 'media';
  return 'baixa';
}

// ── Phone normalization ──────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  // Remove country code 55 if present and length > 11
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  // Ensure 11 digits (DDD + 9 + number)
  if (digits.length === 10 && digits[2] !== '9') {
    // landline - keep as is
  } else if (digits.length === 10) {
    digits = digits.slice(0, 2) + '9' + digits.slice(2);
  }
  return digits;
}

// ── Date parsing ─────────────────────────────────────────────────────────────
function parseDateBR(v: string): Date | null {
  if (!v) return null;
  // DD/MM/YYYY
  const m1 = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m1) {
    const year = m1[3].length === 2 ? 2000 + Number(m1[3]) : Number(m1[3]);
    return new Date(year, Number(m1[2]) - 1, Number(m1[1]));
  }
  // YYYY-MM-DD HH:MM:SS or YYYY-MM-DD
  const m2 = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));
  // DD/MM/YY, HH:MM
  const m3 = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}),?\s/);
  if (m3) return new Date(2000 + Number(m3[3]), Number(m3[2]) - 1, Number(m3[1]));
  return null;
}

function toISODate(v: string): string {
  const d = parseDateBR(v);
  if (!d || isNaN(d.getTime())) return v || '';
  return d.toISOString().slice(0, 10);
}

// ── ID generation ────────────────────────────────────────────────────────────
let _idCounter = 0;
function makeId(phone: string, nome: string, origem: string): string {
  const base = phone || `${nome}-${origem}`;
  return `${base}-${++_idCounter}`;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapLandingPage(rows: string[][], cfg: SourceConfig): CrmLead[] {
  // Row 0 is always the header for LPs (confirmed from gviz: cols are A,B,C...)
  // All LP tabs: Data(0) Hora(1) Origem(2) [specific 3-7] Nome(8) Telefone(9) CidadeBairro(10) Status(11) Responsavel(12) Obs(13)
  return rows.slice(1).filter(r => (r[8] ?? '').trim()).map(r => {
    const telefone = normalizePhone(r[9] ?? '');
    const statusRaw = (r[11] ?? '').trim().toUpperCase();
    const cidadeBairro = (r[10] ?? '').trim();
    const parts = cidadeBairro.split(/[\/,;-]/);
    const lead: CrmLead = {
      id: '',
      nome: (r[8] ?? '').trim(),
      telefone,
      email: '',
      endereco: '',
      cidade: parts[0]?.trim() ?? '',
      bairro: parts[1]?.trim() ?? '',
      empresa: '',
      origem: cfg.origemKey,
      origemLabel: cfg.origemLabel,
      produtoInteresse: inferProduto(r[4] ?? r[5] ?? ''),
      tipoLocal: (r[3] ?? '').trim(),
      urgencia: (r[7] ?? r[6] ?? '').trim(),
      valorPretendido: '',
      objetivo: (r[5] ?? '').trim(),
      status: statusRaw,
      statusNorm: STATUS_NORM[statusRaw] ?? (statusRaw ? statusRaw : 'Novo'),
      responsavel: (r[12] ?? '').trim(),
      dataEntrada: toISODate(r[0] ?? ''),
      horaEntrada: (r[1] ?? '').trim(),
      fontes: [cfg.origemKey],
      score: 0,
      prioridade: 'media',
      observacoes: (r[13] ?? '').trim(),
      duplicatas: 0,
      fechou: '',
      motivoPerda: '',
      valorOrcamento: '',
      instagramHandle: '',
    };
    lead.score = calcScore(lead);
    lead.prioridade = scoreToPrioridade(lead.score);
    lead.id = makeId(telefone, lead.nome, cfg.origemKey);
    return lead;
  });
}

function mapSiteLeads(rows: string[][], cfg: SourceConfig): CrmLead[] {
  // Site: Nome(0) Contato(1,number) Email(2) Endereço(3) Serviço(4) Local(5) ValorPretendido(6) PodemosConversar(7) DataHora(8)
  // No header row to skip — gviz col labels are the actual column names
  return rows.filter(r => (r[2] ?? (r[0] ?? '')).trim()).map(r => {
    const telefone = normalizePhone(r[1] ?? '');
    const lead: CrmLead = {
      id: '',
      nome: (r[0] ?? '').trim(),
      telefone,
      email: (r[2] ?? '').trim(),
      endereco: (r[3] ?? '').trim(),
      cidade: '',
      bairro: '',
      empresa: '',
      origem: cfg.origemKey,
      origemLabel: cfg.origemLabel,
      produtoInteresse: inferProduto(r[4] ?? ''),
      tipoLocal: (r[5] ?? '').trim(),
      urgencia: (r[7] ?? '').trim(),
      valorPretendido: (r[6] ?? '').trim(),
      objetivo: '',
      status: '',
      statusNorm: 'Novo',
      responsavel: '',
      dataEntrada: toISODate(r[8] ?? ''),
      horaEntrada: '',
      fontes: [cfg.origemKey],
      score: 0,
      prioridade: 'media',
      observacoes: '',
      duplicatas: 0,
      fechou: '',
      motivoPerda: '',
      valorOrcamento: '',
      instagramHandle: '',
    };
    lead.score = calcScore(lead);
    lead.prioridade = scoreToPrioridade(lead.score);
    lead.id = makeId(telefone, lead.nome, cfg.origemKey);
    return lead;
  });
}

function mapInstaForm(rows: string[][], cfg: SourceConfig): CrmLead[] {
  // InstaForm: TipoServico(0) LocalInstalacao(1) Nome(2) Telefone(3) Email(4) Pontuacao(5) Data(6) ID(7) @(8)
  return rows.filter(r => (r[2] ?? '').trim()).map(r => {
    const telefone = normalizePhone(r[3] ?? '');
    const lead: CrmLead = {
      id: '',
      nome: (r[2] ?? '').trim(),
      telefone,
      email: (r[4] ?? '').trim(),
      endereco: '',
      cidade: '',
      bairro: '',
      empresa: '',
      origem: cfg.origemKey,
      origemLabel: cfg.origemLabel,
      produtoInteresse: inferProduto(r[0] ?? ''),
      tipoLocal: (r[1] ?? '').trim(),
      urgencia: '',
      valorPretendido: '',
      objetivo: '',
      status: '',
      statusNorm: 'Novo',
      responsavel: '',
      dataEntrada: toISODate(r[6] ?? ''),
      horaEntrada: '',
      fontes: [cfg.origemKey],
      score: 0,
      prioridade: 'media',
      observacoes: '',
      duplicatas: 0,
      fechou: '',
      motivoPerda: '',
      valorOrcamento: '',
      instagramHandle: (r[8] ?? '').trim(),
    };
    lead.score = calcScore(lead);
    lead.prioridade = scoreToPrioridade(lead.score);
    lead.id = makeId(telefone, lead.nome, cfg.origemKey);
    return lead;
  });
}

function mapSdrWhatsapp(rows: string[][], cfg: SourceConfig): CrmLead[] {
  // WA: Data(0) Nome(1) Empresa(2) Telefone(3) Origem(4) Status(5) Obs(6)
  // Row 0 is header (skip)
  return rows.slice(1).filter(r => (r[1] ?? '').trim()).map(r => {
    const telefone = normalizePhone(r[3] ?? '');
    const statusRaw = (r[5] ?? '').trim().toUpperCase();
    const lead: CrmLead = {
      id: '',
      nome: (r[1] ?? '').trim(),
      telefone,
      email: '',
      endereco: '',
      cidade: '',
      bairro: '',
      empresa: (r[2] ?? '').trim(),
      origem: cfg.origemKey,
      origemLabel: cfg.origemLabel,
      produtoInteresse: '',
      tipoLocal: (r[2] ?? '').trim(),
      urgencia: '',
      valorPretendido: '',
      objetivo: '',
      status: statusRaw,
      statusNorm: STATUS_NORM[statusRaw] ?? (statusRaw || 'Novo'),
      responsavel: '',
      dataEntrada: toISODate(r[0] ?? ''),
      horaEntrada: '',
      fontes: [cfg.origemKey],
      score: 0,
      prioridade: 'media',
      observacoes: (r[6] ?? '').trim(),
      duplicatas: 0,
      fechou: '',
      motivoPerda: '',
      valorOrcamento: '',
      instagramHandle: '',
    };
    lead.score = calcScore(lead);
    lead.prioridade = scoreToPrioridade(lead.score);
    lead.id = makeId(telefone, lead.nome, cfg.origemKey);
    return lead;
  });
}

function mapSdrInstagram(rows: string[][], cfg: SourceConfig): CrmLead[] {
  // IG: Data(0) Nome(1) Empresa(2) Cargo(3) Handle(4) Origem(5) Status(6) Obs(7)
  // gviz may treat row 0 as col labels → fetchSheet already handles prepend
  return rows.filter(r => (r[1] ?? '').trim()).map(r => {
    const statusRaw = (r[6] ?? '').trim().toUpperCase();
    // col 5 is "Origem do Lead" but sometimes contains SDR name
    const origemRaw = (r[5] ?? '').trim();
    const lead: CrmLead = {
      id: '',
      nome: (r[1] ?? '').trim(),
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      bairro: '',
      empresa: (r[2] ?? '').trim(),
      origem: cfg.origemKey,
      origemLabel: cfg.origemLabel,
      produtoInteresse: '',
      tipoLocal: '',
      urgencia: '',
      valorPretendido: '',
      objetivo: '',
      status: statusRaw,
      statusNorm: STATUS_NORM[statusRaw] ?? (statusRaw || 'Novo'),
      responsavel: origemRaw,
      dataEntrada: toISODate(r[0] ?? ''),
      horaEntrada: '',
      fontes: [cfg.origemKey],
      score: 0,
      prioridade: 'media',
      observacoes: (r[7] ?? '').trim(),
      duplicatas: 0,
      fechou: '',
      motivoPerda: '',
      valorOrcamento: '',
      instagramHandle: (r[4] ?? '').trim(),
    };
    lead.score = calcScore(lead);
    lead.prioridade = scoreToPrioridade(lead.score);
    lead.id = makeId('', lead.nome, cfg.origemKey);
    return lead;
  });
}

function mapSdrVisitas(rows: string[][], cfg: SourceConfig): CrmLead[] {
  // Visitas: Data(0) Nome(1) Empresa(2) Origem(3) Bairro(4) Contato(5) Status(6) Obs(7) Fechou(8) PorQue(9) NOrçamento(10) Valor(11)
  return rows.filter(r => (r[1] ?? '').trim()).map(r => {
    const telefone = normalizePhone(r[5] ?? '');
    const statusRaw = (r[6] ?? '').trim().toUpperCase();
    const lead: CrmLead = {
      id: '',
      nome: (r[1] ?? '').trim(),
      telefone,
      email: '',
      endereco: '',
      cidade: '',
      bairro: (r[4] ?? '').trim(),
      empresa: (r[2] ?? '').trim(),
      origem: cfg.origemKey,
      origemLabel: cfg.origemLabel,
      produtoInteresse: '',
      tipoLocal: (r[2] ?? '').trim(),
      urgencia: '',
      valorPretendido: '',
      objetivo: '',
      status: statusRaw,
      statusNorm: (() => {
        const fechouVal = (r[8] ?? '').trim().toUpperCase();
        if (fechouVal === 'SIM' || fechouVal === 'FECHADO' || fechouVal === 'FECHOU') return 'Fechado';
        return STATUS_NORM[statusRaw] ?? (statusRaw || 'Novo');
      })(),
      responsavel: '',
      dataEntrada: toISODate(r[0] ?? ''),
      horaEntrada: '',
      fontes: [cfg.origemKey],
      score: 0,
      prioridade: 'media',
      observacoes: (r[7] ?? '').trim(),
      duplicatas: 0,
      fechou: (r[8] ?? '').trim(),
      motivoPerda: (r[9] ?? '').trim(),
      valorOrcamento: (r[11] ?? '').trim(),
      instagramHandle: '',
    };
    lead.score = calcScore(lead);
    lead.prioridade = scoreToPrioridade(lead.score);
    lead.id = makeId(telefone, lead.nome, cfg.origemKey);
    return lead;
  });
}

// ── Source registry ──────────────────────────────────────────────────────────

const SOURCES: SourceConfig[] = [
  // Landing Pages (5 tabs, same spreadsheet)
  { id: 'lp-seguranca',   sheetId: SHEET_LP, gid: '91662513',   origemKey: 'lp-seguranca',   origemLabel: 'LP Segurança',   mapper: mapLandingPage, sheetName: undefined },
  { id: 'lp-empresas',    sheetId: SHEET_LP, gid: '1947091908', origemKey: 'lp-empresas',    origemLabel: 'LP Empresas',    mapper: mapLandingPage, sheetName: undefined },
  { id: 'lp-residencial', sheetId: SHEET_LP, gid: '248543358',  origemKey: 'lp-residencial', origemLabel: 'LP Residencial', mapper: mapLandingPage, sheetName: undefined },
  { id: 'lp-geral',       sheetId: SHEET_LP, gid: '0',          origemKey: 'lp-geral',       origemLabel: 'LP Geral',       mapper: mapLandingPage, sheetName: undefined },
  { id: 'lp-outro',       sheetId: SHEET_LP, gid: '524968067',  origemKey: 'lp-outro',       origemLabel: 'LP Outro',       mapper: mapLandingPage, sheetName: undefined },
  // Site
  { id: 'site',           sheetId: SHEET_SITE, gid: '0', origemKey: 'site', origemLabel: 'Site', mapper: mapSiteLeads, sheetName: undefined },
  // Instagram Form
  { id: 'insta-form',     sheetId: SHEET_INSTA, gid: '0', origemKey: 'insta-form', origemLabel: 'Form. Instagram', mapper: mapInstaForm, sheetName: undefined },
  // SDR sheets (same spreadsheet, different tabs by name)
  { id: 'sdr-whatsapp',   sheetId: SHEET_SDR, sheetName: 'SDR Log',          origemKey: 'sdr-whatsapp',   origemLabel: 'SDR WhatsApp',   mapper: mapSdrWhatsapp },
  { id: 'sdr-instagram',  sheetId: SHEET_SDR, sheetName: 'Instagram',        origemKey: 'sdr-instagram',  origemLabel: 'SDR Instagram',  mapper: mapSdrInstagram },
  { id: 'sdr-visitas',    sheetId: SHEET_SDR, sheetName: 'Visitas marcadas', origemKey: 'sdr-visitas',    origemLabel: 'SDR Visitas',    mapper: mapSdrVisitas },
];

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);
  private cache: { leads: CrmLead[]; stats: CrmStats; ts: number } | null = null;

  // ── gviz fetch ─────────────────────────────────────────────────────────────

  private cellStr(cell: any): string {
    if (!cell) return '';
    if (cell.f != null) return String(cell.f).trim();
    if (cell.v == null) return '';
    return String(cell.v).trim();
  }

  private colsAreDataRow(cols: string[]): boolean {
    return /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test((cols[0] ?? '').trim());
  }

  private async fetchSheetByGid(sheetId: string, gid: string): Promise<string[][]> {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`gviz HTTP ${res.status} for sheet ${sheetId} gid=${gid}`);
    const text = await res.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const json = JSON.parse(text.slice(start, end + 1));

    const cols: string[] = (json.table?.cols ?? []).map(
      (c: any) => String(c.label || c.id || '').trim(),
    );
    const rawRows: any[] = json.table?.rows ?? [];
    const dataRows: string[][] = rawRows
      .map((row: any) => (row.c ?? []).map((cell: any) => this.cellStr(cell)))
      .filter((r) => r.some((v: string) => v !== ''));

    if (this.colsAreDataRow(cols)) {
      return [cols, ...dataRows];
    }
    return dataRows;
  }

  private async fetchSheetByName(sheetId: string, sheetName: string): Promise<string[][]> {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`gviz HTTP ${res.status} for "${sheetName}"`);
    const text = await res.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const json = JSON.parse(text.slice(start, end + 1));

    const cols: string[] = (json.table?.cols ?? []).map(
      (c: any) => String(c.label || c.id || '').trim(),
    );
    const rawRows: any[] = json.table?.rows ?? [];
    const dataRows: string[][] = rawRows
      .map((row: any) => (row.c ?? []).map((cell: any) => this.cellStr(cell)))
      .filter((r) => r.some((v: string) => v !== ''));

    if (this.colsAreDataRow(cols)) {
      return [cols, ...dataRows];
    }
    return dataRows;
  }

  // ── Fetch all sources ──────────────────────────────────────────────────────

  private async fetchAllSources(): Promise<CrmLead[]> {
    const allLeads: CrmLead[] = [];

    const results = await Promise.allSettled(
      SOURCES.map(async (cfg) => {
        try {
          const rows = cfg.sheetName
            ? await this.fetchSheetByName(cfg.sheetId, cfg.sheetName)
            : await this.fetchSheetByGid(cfg.sheetId, cfg.gid!);
          return { cfg, rows };
        } catch (err) {
          this.logger.warn(`Failed to fetch source "${cfg.id}": ${err}`);
          return { cfg, rows: [] as string[][] };
        }
      }),
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { cfg, rows } = r.value;
        try {
          const leads = cfg.mapper(rows, cfg);
          allLeads.push(...leads);
        } catch (err) {
          this.logger.warn(`Failed to map source "${cfg.id}": ${err}`);
        }
      }
    }

    return allLeads;
  }

  // ── Deduplication ──────────────────────────────────────────────────────────

  private deduplicateLeads(leads: CrmLead[]): CrmLead[] {
    const phoneMap = new Map<string, CrmLead>();
    const nameMap = new Map<string, CrmLead>();
    const result: CrmLead[] = [];

    for (const lead of leads) {
      const phoneKey = lead.telefone.length >= 10 ? lead.telefone : '';
      const nameKey = lead.nome.toLowerCase().replace(/\s+/g, ' ').trim();

      let existing: CrmLead | undefined;

      if (phoneKey) {
        existing = phoneMap.get(phoneKey);
      }
      if (!existing && nameKey.length > 3) {
        existing = nameMap.get(nameKey);
      }

      if (existing) {
        // Merge: enrich existing with new data
        existing.duplicatas++;
        if (!existing.fontes.includes(lead.origem)) existing.fontes.push(lead.origem);
        if (!existing.email && lead.email) existing.email = lead.email;
        if (!existing.telefone && lead.telefone) existing.telefone = lead.telefone;
        if (!existing.endereco && lead.endereco) existing.endereco = lead.endereco;
        if (!existing.cidade && lead.cidade) existing.cidade = lead.cidade;
        if (!existing.bairro && lead.bairro) existing.bairro = lead.bairro;
        if (!existing.empresa && lead.empresa) existing.empresa = lead.empresa;
        if (!existing.produtoInteresse && lead.produtoInteresse) existing.produtoInteresse = lead.produtoInteresse;
        if (!existing.urgencia && lead.urgencia) existing.urgencia = lead.urgencia;
        if (!existing.valorPretendido && lead.valorPretendido) existing.valorPretendido = lead.valorPretendido;
        if (!existing.instagramHandle && lead.instagramHandle) existing.instagramHandle = lead.instagramHandle;
        if (!existing.responsavel && lead.responsavel) existing.responsavel = lead.responsavel;
        if (!existing.fechou && lead.fechou) existing.fechou = lead.fechou;
        if (!existing.valorOrcamento && lead.valorOrcamento) existing.valorOrcamento = lead.valorOrcamento;
        // Keep the most advanced status
        const statusPriority = ['Novo', 'Primeiro contato', 'Conversando', 'Qualificado', 'Agendado', 'Orçamento enviado', 'Fechado'];
        const existIdx = statusPriority.indexOf(existing.statusNorm);
        const newIdx = statusPriority.indexOf(lead.statusNorm);
        if (newIdx > existIdx) {
          existing.statusNorm = lead.statusNorm;
          existing.status = lead.status;
        }
        // Recalc score
        existing.score = calcScore(existing);
        existing.prioridade = scoreToPrioridade(existing.score);
        // Keep more recent date
        if (lead.dataEntrada > existing.dataEntrada) {
          existing.dataEntrada = lead.dataEntrada;
          existing.horaEntrada = lead.horaEntrada;
        }
        if (lead.observacoes && !existing.observacoes) existing.observacoes = lead.observacoes;
      } else {
        result.push(lead);
        if (phoneKey) phoneMap.set(phoneKey, lead);
        if (nameKey.length > 3) nameMap.set(nameKey, lead);
      }
    }

    return result;
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  private buildStats(leads: CrmLead[]): CrmStats {
    const count = (fn: (l: CrmLead) => boolean) => leads.filter(fn).length;

    const groupBy = <K extends string>(key: (l: CrmLead) => K) => {
      const map = new Map<K, number>();
      for (const l of leads) {
        const k = key(l);
        if (k) map.set(k, (map.get(k) ?? 0) + 1);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };

    // Por período mensal
    const mesMap = new Map<string, number>();
    for (const l of leads) {
      const d = parseDateBR(l.dataEntrada) ?? new Date(l.dataEntrada);
      if (d && !isNaN(d.getTime())) {
        const key = `${MES_NOMES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        mesMap.set(key, (mesMap.get(key) ?? 0) + 1);
      }
    }

    return {
      total: leads.length,
      novos: count(l => l.statusNorm === 'Novo'),
      emContato: count(l => ['Primeiro contato', 'Conversando'].includes(l.statusNorm)),
      qualificados: count(l => l.statusNorm === 'Qualificado'),
      orcamentoEnviado: count(l => l.statusNorm === 'Orçamento enviado'),
      fechados: count(l => l.statusNorm === 'Fechado'),
      perdidos: count(l => l.statusNorm === 'Perdido'),
      semAtendimento: count(l => l.statusNorm === 'Novo' && !l.responsavel),
      porOrigem: groupBy(l => l.origemLabel).map(([origem, total]) => ({ origem, total })),
      porProduto: groupBy(l => l.produtoInteresse).map(([produto, total]) => ({ produto, total })),
      porResponsavel: groupBy(l => l.responsavel).map(([responsavel, total]) => ({ responsavel, total })),
      porStatus: groupBy(l => l.statusNorm).map(([status, total]) => ({ status, total })),
      porPrioridade: groupBy(l => l.prioridade).map(([prioridade, total]) => ({ prioridade, total })),
      porPeriodo: [...mesMap.entries()]
        .sort((a, b) => {
          const [mA, yA] = a[0].split('/');
          const [mB, yB] = b[0].split('/');
          const numA = Number(yA) * 100 + MES_NOMES.indexOf(mA);
          const numB = Number(yB) * 100 + MES_NOMES.indexOf(mB);
          return numA - numB;
        })
        .map(([mes, total]) => ({ mes, total })),
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async getLeads(query: CrmQuery = {}): Promise<{ leads: CrmLead[]; stats: CrmStats }> {
    if (!this.cache || Date.now() - this.cache.ts >= CRM_CACHE_TTL) {
      this.logger.log('CRM: fetching all sources...');
      _idCounter = 0;
      const raw = await this.fetchAllSources();
      const leads = this.deduplicateLeads(raw);
      // Sort by date desc, then by score desc
      leads.sort((a, b) => {
        const dateCompare = (b.dataEntrada || '').localeCompare(a.dataEntrada || '');
        if (dateCompare !== 0) return dateCompare;
        return b.score - a.score;
      });
      const stats = this.buildStats(leads);
      this.cache = { leads, stats, ts: Date.now() };
      this.logger.log(`CRM: ${raw.length} raw → ${leads.length} deduplicated leads from ${SOURCES.length} sources`);
    }

    let filtered = [...this.cache.leads];

    // Apply filters
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.nome.toLowerCase().includes(q) ||
        l.telefone.includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.empresa.toLowerCase().includes(q) ||
        l.cidade.toLowerCase().includes(q) ||
        l.bairro.toLowerCase().includes(q) ||
        l.observacoes.toLowerCase().includes(q),
      );
    }
    if (query.origem) filtered = filtered.filter(l => l.origem === query.origem);
    if (query.status) filtered = filtered.filter(l => l.statusNorm === query.status);
    if (query.responsavel) filtered = filtered.filter(l => l.responsavel === query.responsavel);
    if (query.prioridade) filtered = filtered.filter(l => l.prioridade === query.prioridade);
    if (query.produtoInteresse) filtered = filtered.filter(l => l.produtoInteresse === query.produtoInteresse);
    if (query.cidade) filtered = filtered.filter(l => l.cidade.toLowerCase().includes(query.cidade!.toLowerCase()));

    // Period filter
    if (query.period && query.period !== 'all') {
      const now = new Date();
      let from: Date | null = null;
      let to: Date | null = now;

      if (query.period === 'week') from = new Date(Date.now() - 7 * 86_400_000);
      else if (query.period === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (query.period === '30d') from = new Date(Date.now() - 30 * 86_400_000);
      else if (query.period === '90d') from = new Date(Date.now() - 90 * 86_400_000);
      else if (query.period === 'custom') {
        if (query.start) from = new Date(query.start);
        if (query.end) { to = new Date(query.end); to.setHours(23, 59, 59, 999); }
      }

      filtered = filtered.filter(l => {
        const d = parseDateBR(l.dataEntrada) ?? new Date(l.dataEntrada);
        if (!d || isNaN(d.getTime())) return true;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    const stats = this.buildStats(filtered);
    return { leads: filtered, stats };
  }

  async getStats(): Promise<CrmStats> {
    const { stats } = await this.getLeads();
    return stats;
  }

  getSourceList(): { id: string; label: string }[] {
    return SOURCES.map(s => ({ id: s.origemKey, label: s.origemLabel }));
  }
}
