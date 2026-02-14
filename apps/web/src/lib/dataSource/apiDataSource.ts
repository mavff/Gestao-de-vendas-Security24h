import { apiClient, ApiClientError, ApiMeta } from '../apiClient';
import { Equipment, Kit } from '../../types';
import { DataSourceRegistry, IEquipmentDataSource, IKitsDataSource, IProspectsDataSource } from './interfaces';
import {
  DataSourceEntity,
  DataSourceError,
  DataSourceOperation,
  EquipmentQuery,
  KitApiDto,
  KitsQuery,
  PaginatedResult,
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

export function createApiDataSource(): DataSourceRegistry {
  return {
    mode: 'api',
    equipment: new ApiEquipmentDataSource(),
    kits: new ApiKitsDataSource(),
    prospects: new ApiProspectsDataSource(),
  };
}

export function createApiDefaultPagination(): { page: number; pageSize: number } {
  return {
    page: normalizePage(),
    pageSize: normalizePageSize(),
  };
}

