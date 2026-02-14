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

export type ProductApiDto = {
  codProduto: number;
  descricao: string;
  codFabricante?: string | null;
  codMarca?: number | null;
  codGrupo?: number | null;
  codCategoria?: number | null;
  preco?: number | string | null;
  aplicacao?: string | null;
  produtoKit?: boolean | null;
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

export type ProspectApiDto = {
  codProspect: number;
  nome: string;
  email?: string | null;
  vendedor?: number | null;
  origem?: number | null;
  status?: string | null;
  inativo?: boolean | null;
};

export type DataSourceEntity = 'equipment' | 'kits' | 'prospects';
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

