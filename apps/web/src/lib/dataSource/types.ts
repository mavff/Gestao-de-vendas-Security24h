export type DataSourceMode = 'api' | 'mock';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export type EquipmentQuery = ListQuery & {
  codMarca?: number;
  codGrupo?: number;
  codCategoria?: number;
  cancelado?: boolean;
};

export type KitsQuery = ListQuery & {
  codMarca?: number;
};

export type ProspectsQuery = ListQuery & {
  status?: string;
  vendedor?: number;
  origem?: number;
};

export type OrcamentosQuery = ListQuery & {
  status?: string;
  vendedor?: number;
  prospect?: number;
  modalidade?: string;
  dataInicio?: string;
  dataFim?: string;
};

export type ProductApiDto = {
  codProduto: number;
  descricao: string;
  codFabricante?: string | null;
  codMarca?: number | null;
  codGrupo?: number | null;
  codCategoria?: number | null;
  preco?: number | string | null;
  produtoKit?: boolean | null;
  grupoOrcamento?: string | null;
  pontos?: number | null;
  ncm?: string | null;
};

export type ProductKitItemApiDto = {
  codInterno: number;
  codProdutoKit: number;
  codProdutoAgregado: number;
  quantidade: number | string;
  itemProduto?: ProductApiDto;
};

export type KitApiDto = ProductApiDto & {
  kitItens?: ProductKitItemApiDto[];
};

export type OrcamentoApiDto = {
  codInterno: number;
  numOrcamento?: string | null;
  clienteNome?: string | null;
  cgcCpf?: string | null;
  cidade?: string | null;
  uf?: string | null;
  vendedor?: number | null;
  status?: string | null;
  modalidade?: string | null;
  emissao?: string | null;
  validade?: string | null;
  fechamento?: string | null;
  pontos?: number | null;
  totalProdutos?: number | null;
  totalServicos?: number | null;
  valorMonitoramento?: number | null;
  etapa?: string | null;
  probabilidade?: number | null;
};

export type OrcamentoProdutoApiDto = {
  codInterno: number;
  codProduto?: number | null;
  descricao?: string | null;
  quantidade?: number | string | null;
  unitario?: number | string | null;
  total?: number | string | null;
  liquido?: number | string | null;
  grupoOrcamento?: string | null;
  localInstalacao?: string | null;
};

export type OrcamentoServicoApiDto = {
  codInterno: number;
  codServico?: number | null;
  valorServico?: number | string | null;
  observacoes?: string | null;
  quantidade?: number | string | null;
};

export type OrcamentoDetalheApiDto = OrcamentoApiDto & {
  produtos: OrcamentoProdutoApiDto[];
  servicosAdicionais: OrcamentoServicoApiDto[];
};

export type ProspectApiDto = {
  codProspect: number;
  nome: string;
  email?: string | null;
  fone1?: string | null;
  cidade?: string | null;
  estado?: string | null;
  endereco?: string | null;
  vendedor?: number | null;
  usuario?: string | null;
  origem?: number | null;
  origemDescreve?: string | null;
  status?: string | null;
  inativo?: boolean | null;
  dataCadastro?: string | null;
  orcamentoTotal?: number | null;
  ultimaProbabilidade?: number | null;
  ultimaAcaoDescricao?: string | null;
  ultimaAcaoData?: string | null;
};

export type DashboardStats = {
  funnelData: { stage: string; total: number }[];
  leadsByWeek: { week: string; leads: number }[];
  closuresBySeller: { seller: string; closures: number }[];
  leadsByOrigin: { origin: string; total: number }[];
  kpis: {
    totalLeads: number;
    conversionRate: number;
    estimatedRevenue: number;
    newLeadsThisWeek: number;
  };
};

export type TecnicoRow = {
  tecnico: string;
  osInstalacoes: number;
  osManutencoes: number;
  receitaEquipamentos: number;
  receitaInstalacao: number;
  receitaTotal: number;
};

export type FinanceiroDashboard = {
  receitaEquipamentos: number;
  receitaInstalacao: number;
  receitaTotal: number;
  mrrBase: number;
  arr: number;
  orcamentosFechados: number;
  ticketMedio: number;
  pipelineAberto: number;
  osInstalacoes: number;
  osManutencoes: number;
  porVendedor: { usuario: string; equipamentos: number; instalacao: number; total: number }[];
  evolucaoMensal: { mes: string; equipamentos: number; instalacao: number }[];
  mixReceita: { name: string; value: number }[];
  porTecnico: TecnicoRow[];
};

export type FunnelStats = {
  prospects: number;
  totalOrcamentos: number;
  abertos: number;
  emAprovacao: number;
  liberados: number;
  emInstalacao: number;
  faturados: number;
  cancelados: number;
  avancados: number;
  taxaConversao: number;
  ticketMedioEquip: number;
  ticketMedioMensal: number;
};

export type PeriodKey = '7d' | '30d' | '90d' | 'all';

export type MateriaisVendidosProduto = {
  codProduto: number | null;
  descricao: string;
  grupoOrcamento: string | null;
  quantidadeTotal: number;
  valorTotal: number;
  ocorrencias: number;
};

export type MateriaisVendidosOrcamento = {
  codInterno: number;
  numOrcamento?: number | null;
  clienteNome?: string | null;
  emissao?: string | null;
  status?: string | null;
  totalProdutos?: number | string | null;
  totalServicos?: number | string | null;
  valorMonitoramento?: number | string | null;
  qtdProdutos: number;
};

export type MateriaisVendidosResult = {
  resumo: {
    totalOrcamentosVendidos: number;
    totalItensUnicos: number;
    totalPecas: number;
    totalValorProdutos: number;
    totalValorMensalidades: number;
  };
  produtos: MateriaisVendidosProduto[];
  orcamentos: MateriaisVendidosOrcamento[];
};

export type PreOrcamentoProdutoApiDto = {
  codInterno: number;
  codProduto?: number | null;
  descricao?: string | null;
  quantidade?: number | string | null;
  grupoOrcamento?: string | null;
  orcOrdem?: number | null;
  produto?: {
    codProduto: number;
    descricao: string;
    preco?: number | string | null;
    grupoOrcamento?: string | null;
  } | null;
};

export type PreOrcamentoApiDto = {
  codInterno: number;
  descricao: string;
  unidade?: number | null;
  observacoes?: string | null;
  valorMensalVenda?: number | string | null;
  valorMensalComodato?: number | string | null;
  ampliacao?: boolean | null;
  limitePontos?: number | null;
  valorPontoAdicional?: number | string | null;
  valorCrea?: number | string | null;
  produtos: PreOrcamentoProdutoApiDto[];
};

export type PreOrcamentosQuery = ListQuery;

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

// ── CRM Types ────────────────────────────────────────────────────────────────

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

export interface CrmLeadsResult {
  leads: CrmLead[];
  stats: CrmStats;
}

export interface CrmSource {
  id: string;
  label: string;
}

export type DataSourceEntity = 'equipment' | 'kits' | 'prospects' | 'dashboard' | 'orcamentos' | 'preOrcamentos' | 'sheets' | 'sdr' | 'crm';
export type DataSourceOperation = 'list' | 'getById';

export class DataSourceError extends Error {
  readonly code: string;
  readonly mode: DataSourceMode;
  readonly entity: DataSourceEntity;
  readonly operation: DataSourceOperation;

  constructor(params: {
    code: string;
    message: string;
    mode: DataSourceMode;
    entity: DataSourceEntity;
    operation: DataSourceOperation;
    cause?: unknown;
  }) {
    super(params.message, params.cause ? { cause: params.cause } : undefined);
    this.name = 'DataSourceError';
    this.code = params.code;
    this.mode = params.mode;
    this.entity = params.entity;
    this.operation = params.operation;
  }
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function normalizePage(page?: number): number {
  return Math.max(1, Number(page) || DEFAULT_PAGE);
}

export function normalizePageSize(pageSize?: number): number {
  return Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE);
}

export function buildMeta(total: number, page?: number, pageSize?: number): PaginationMeta {
  const normalizedPage = normalizePage(page);
  const normalizedPageSize = normalizePageSize(pageSize);
  const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total,
    totalPages,
  };
}

export function paginateArray<T>(items: T[], page?: number, pageSize?: number): PaginatedResult<T> {
  const normalizedPage = normalizePage(page);
  const normalizedPageSize = normalizePageSize(pageSize);
  const start = (normalizedPage - 1) * normalizedPageSize;
  const end = start + normalizedPageSize;

  return {
    data: items.slice(start, end),
    meta: buildMeta(items.length, normalizedPage, normalizedPageSize),
  };
}

