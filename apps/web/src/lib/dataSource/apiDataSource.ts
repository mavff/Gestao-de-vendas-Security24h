import { apiClient, ApiClientError, ApiMeta } from '../apiClient';
import { Equipment, Kit } from '../../types';
import { DataSourceRegistry, IDashboardDataSource, IEquipmentDataSource, IKitsDataSource, IOrcamentosDataSource, IPreOrcamentosDataSource, IProspectsDataSource } from './interfaces';
import {
  DashboardStats,
  DataSourceEntity,
  DataSourceError,
  DataSourceOperation,
  EquipmentQuery,
  FunnelStats,
  KitApiDto,
  KitsQuery,
  OrcamentoApiDto,
  OrcamentoDetalheApiDto,
  OrcamentosQuery,
  PaginatedResult,
  PeriodKey,
  PreOrcamentoApiDto,
  PreOrcamentosQuery,
  ProductApiDto,
  ProspectApiDto,
  ProspectsQuery,
  buildMeta,
  normalizePage,
  normalizePageSize,
} from './types';
import { mapProductsToEquipments, mapProductToEquipment } from './adapters/productAdapter';
import { mapKitToUi, mapKitsToUi } from './adapters/kitAdapter';

function normalizeMeta(meta: ApiMeta | undefined, page?: number, pageSize?: number, totalFromData = 0): ApiMeta {
  if (meta) return meta;
  return buildMeta(totalFromData, page, pageSize);
}

function createApiDataSourceError(params: {
  entity: DataSourceEntity;
  operation: DataSourceOperation;
  cause: unknown;
}): DataSourceError {
  const { entity, operation, cause } = params;

  if (cause instanceof ApiClientError) {
    const statusText = cause.status ? ` (status ${cause.status})` : '';
    return new DataSourceError({
      code: cause.code,
      mode: 'api',
      entity,
      operation,
      message: `API ${entity}.${operation} falhou${statusText}: ${cause.message}`,
      cause,
    });
  }

  return new DataSourceError({
    code: 'UNKNOWN_ERROR',
    mode: 'api',
    entity,
    operation,
    message: `API ${entity}.${operation} falhou por erro inesperado.`,
    cause,
  });
}

class ApiEquipmentDataSource implements IEquipmentDataSource {
  async list(query: EquipmentQuery = {}): Promise<PaginatedResult<Equipment>> {
    try {
      const response = await apiClient.get<ProductApiDto[]>('/products', { query });
      const mapped = mapProductsToEquipments(response.data);

      return {
        data: mapped,
        meta: normalizeMeta(response.meta, query.page, query.pageSize, mapped.length),
      };
    } catch (error) {
      throw createApiDataSourceError({ entity: 'equipment', operation: 'list', cause: error });
    }
  }

  async getById(id: string): Promise<Equipment | null> {
    try {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        throw new DataSourceError({
          code: 'INVALID_ID',
          mode: 'api',
          entity: 'equipment',
          operation: 'getById',
          message: `ID inválido para equipment.getById: "${id}"`,
        });
      }

      const response = await apiClient.get<ProductApiDto>(`/products/${numericId}`);
      return response.data ? mapProductToEquipment(response.data) : null;
    } catch (error) {
      if (error instanceof DataSourceError) throw error;
      throw createApiDataSourceError({ entity: 'equipment', operation: 'getById', cause: error });
    }
  }
}

class ApiKitsDataSource implements IKitsDataSource {
  async list(query: KitsQuery = {}): Promise<PaginatedResult<Kit>> {
    try {
      const response = await apiClient.get<KitApiDto[]>('/kits', { query });
      const mapped = mapKitsToUi(response.data);

      return {
        data: mapped,
        meta: normalizeMeta(response.meta, query.page, query.pageSize, mapped.length),
      };
    } catch (error) {
      throw createApiDataSourceError({ entity: 'kits', operation: 'list', cause: error });
    }
  }

  async getById(id: string): Promise<Kit | null> {
    try {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        throw new DataSourceError({
          code: 'INVALID_ID',
          mode: 'api',
          entity: 'kits',
          operation: 'getById',
          message: `ID inválido para kits.getById: "${id}"`,
        });
      }

      const response = await apiClient.get<KitApiDto>(`/kits/${numericId}`);
      return response.data ? mapKitToUi(response.data) : null;
    } catch (error) {
      if (error instanceof DataSourceError) throw error;
      throw createApiDataSourceError({ entity: 'kits', operation: 'getById', cause: error });
    }
  }
}

class ApiProspectsDataSource implements IProspectsDataSource {
  async list(query: ProspectsQuery = {}): Promise<PaginatedResult<ProspectApiDto>> {
    try {
      const response = await apiClient.get<ProspectApiDto[]>('/prospects', { query });
      const meta = normalizeMeta(response.meta, query.page, query.pageSize, response.data.length);

      return {
        data: response.data,
        meta,
      };
    } catch (error) {
      throw createApiDataSourceError({ entity: 'prospects', operation: 'list', cause: error });
    }
  }

  async getById(id: string | number): Promise<ProspectApiDto | null> {
    try {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        throw new DataSourceError({
          code: 'INVALID_ID',
          mode: 'api',
          entity: 'prospects',
          operation: 'getById',
          message: `ID inválido para prospects.getById: "${id}"`,
        });
      }

      const response = await apiClient.get<ProspectApiDto>(`/prospects/${numericId}`);
      return response.data ?? null;
    } catch (error) {
      if (error instanceof DataSourceError) throw error;
      throw createApiDataSourceError({ entity: 'prospects', operation: 'getById', cause: error });
    }
  }
}

class ApiDashboardDataSource implements IDashboardDataSource {
  async getStats(period: PeriodKey): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', { query: { period } });
    return response.data;
  }
}

/** Prisma serializa Decimal(18,2) como string — converte para number na borda da API. */
function parseOrcamentoDecimals(orc: OrcamentoApiDto): OrcamentoApiDto {
  return {
    ...orc,
    totalProdutos: orc.totalProdutos != null ? Number(orc.totalProdutos) : null,
    totalServicos: orc.totalServicos != null ? Number(orc.totalServicos) : null,
    valorMonitoramento: orc.valorMonitoramento != null ? Number(orc.valorMonitoramento) : null,
    probabilidade: orc.probabilidade != null ? Number(orc.probabilidade) : null,
  };
}

function parseOrcamentoDetalhe(orc: OrcamentoDetalheApiDto): OrcamentoDetalheApiDto {
  return {
    ...parseOrcamentoDecimals(orc),
    produtos: (orc.produtos ?? []).map((p) => ({
      ...p,
      quantidade: p.quantidade != null ? Number(p.quantidade) : null,
      unitario: p.unitario != null ? Number(p.unitario) : null,
      total: p.total != null ? Number(p.total) : null,
      liquido: p.liquido != null ? Number(p.liquido) : null,
    })),
    servicosAdicionais: (orc.servicosAdicionais ?? []).map((s) => ({
      ...s,
      valorServico: s.valorServico != null ? Number(s.valorServico) : null,
      quantidade: s.quantidade != null ? Number(s.quantidade) : null,
    })),
  };
}

class ApiOrcamentosDataSource implements IOrcamentosDataSource {
  async list(query: OrcamentosQuery = {}): Promise<PaginatedResult<OrcamentoApiDto>> {
    try {
      const response = await apiClient.get<OrcamentoApiDto[]>('/orcamentos', { query });
      const meta = normalizeMeta(response.meta, query.page, query.pageSize, response.data.length);
      return { data: response.data.map(parseOrcamentoDecimals), meta };
    } catch (error) {
      throw createApiDataSourceError({ entity: 'orcamentos', operation: 'list', cause: error });
    }
  }

  async getById(id: number): Promise<OrcamentoDetalheApiDto | null> {
    try {
      const response = await apiClient.get<OrcamentoDetalheApiDto>(`/orcamentos/${id}`);
      return parseOrcamentoDetalhe(response.data);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) return null;
      throw createApiDataSourceError({ entity: 'orcamentos', operation: 'getById', cause: error });
    }
  }

  async getFunnel(query?: { dataInicio?: string; dataFim?: string }): Promise<FunnelStats> {
    try {
      const response = await apiClient.get<FunnelStats>('/orcamentos/funnel', { query });
      return response.data;
    } catch (error) {
      throw createApiDataSourceError({ entity: 'orcamentos', operation: 'list', cause: error });
    }
  }
}

function parsePreOrcamentoDecimals(o: PreOrcamentoApiDto): PreOrcamentoApiDto {
  return {
    ...o,
    valorMensalVenda: o.valorMensalVenda != null ? Number(o.valorMensalVenda) : null,
    valorMensalComodato: o.valorMensalComodato != null ? Number(o.valorMensalComodato) : null,
    valorPontoAdicional: o.valorPontoAdicional != null ? Number(o.valorPontoAdicional) : null,
    valorCrea: o.valorCrea != null ? Number(o.valorCrea) : null,
    produtos: (o.produtos ?? []).map((p) => ({
      ...p,
      quantidade: p.quantidade != null ? Number(p.quantidade) : null,
      produto: p.produto
        ? { ...p.produto, preco: p.produto.preco != null ? Number(p.produto.preco) : null }
        : null,
    })),
  };
}

class ApiPreOrcamentosDataSource implements IPreOrcamentosDataSource {
  async list(query: PreOrcamentosQuery = {}): Promise<PaginatedResult<PreOrcamentoApiDto>> {
    try {
      const response = await apiClient.get<PreOrcamentoApiDto[]>('/pre-orcamentos', { query });
      const meta = normalizeMeta(response.meta, query.page, query.pageSize, response.data.length);
      return { data: response.data.map(parsePreOrcamentoDecimals), meta };
    } catch (error) {
      throw createApiDataSourceError({ entity: 'preOrcamentos', operation: 'list', cause: error });
    }
  }

  async getById(id: number): Promise<PreOrcamentoApiDto | null> {
    try {
      const response = await apiClient.get<PreOrcamentoApiDto>(`/pre-orcamentos/${id}`);
      return parsePreOrcamentoDecimals(response.data);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) return null;
      throw createApiDataSourceError({ entity: 'preOrcamentos', operation: 'getById', cause: error });
    }
  }
}

export function createApiDataSource(): DataSourceRegistry {
  return {
    mode: 'api',
    equipment: new ApiEquipmentDataSource(),
    kits: new ApiKitsDataSource(),
    prospects: new ApiProspectsDataSource(),
    dashboard: new ApiDashboardDataSource(),
    orcamentos: new ApiOrcamentosDataSource(),
    preOrcamentos: new ApiPreOrcamentosDataSource(),
  };
}

export function createApiDefaultPagination(): { page: number; pageSize: number } {
  return {
    page: normalizePage(),
    pageSize: normalizePageSize(),
  };
}

