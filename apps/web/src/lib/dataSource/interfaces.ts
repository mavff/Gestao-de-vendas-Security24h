import { Equipment, Kit } from '../../types';
import { DashboardStats, DataSourceMode, EquipmentQuery, KitsQuery, OrcamentoApiDto, OrcamentosQuery, PaginatedResult, PeriodKey, ProspectApiDto, ProspectsQuery } from './types';

export interface IEquipmentDataSource {
  list(query?: EquipmentQuery): Promise<PaginatedResult<Equipment>>;
  getById(id: string): Promise<Equipment | null>;
}

export interface IKitsDataSource {
  list(query?: KitsQuery): Promise<PaginatedResult<Kit>>;
  getById(id: string): Promise<Kit | null>;
}

export interface IProspectsDataSource {
  list(query?: ProspectsQuery): Promise<PaginatedResult<ProspectApiDto>>;
  getById(id: string | number): Promise<ProspectApiDto | null>;
}

export interface IDashboardDataSource {
  getStats(period: PeriodKey): Promise<DashboardStats>;
}

export interface IOrcamentosDataSource {
  list(query?: OrcamentosQuery): Promise<PaginatedResult<OrcamentoApiDto>>;
}

export type DataSourceRegistry = {
  mode: DataSourceMode;
  equipment: IEquipmentDataSource;
  kits: IKitsDataSource;
  prospects: IProspectsDataSource;
  dashboard: IDashboardDataSource;
  orcamentos: IOrcamentosDataSource;
};

