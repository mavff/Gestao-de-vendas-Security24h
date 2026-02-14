import { Equipment, Kit } from '../../types';
import { DataSourceMode, EquipmentQuery, KitsQuery, PaginatedResult, ProspectApiDto, ProspectsQuery } from './types';

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

export type DataSourceRegistry = {
  mode: DataSourceMode;
  equipment: IEquipmentDataSource;
  kits: IKitsDataSource;
  prospects: IProspectsDataSource;
};

