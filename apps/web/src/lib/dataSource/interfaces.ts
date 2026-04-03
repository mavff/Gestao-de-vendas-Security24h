import { Equipment, Kit } from '../../types';
import { ClientesAtivosResult, ComissoesVendedoresResult, CrmLeadsResult, CrmQuery, CrmSource, DashboardStats, DataSourceMode, EquipmentQuery, FinanceiroDashboard, FunnelStats, KitsQuery, MateriaisVendidosResult, OrcamentoApiDto, OrcamentoDetalheApiDto, OrcamentosQuery, PaginatedResult, PeriodKey, PreOrcamentoApiDto, PreOrcamentosQuery, ProspectApiDto, ProspectsQuery, SdrQuery, SdrTabResult, SheetsLeadStats } from './types';

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
  getFinanceiro(query?: { dataInicio?: string; dataFim?: string }): Promise<FinanceiroDashboard>;
}

export interface IOrcamentosDataSource {
  list(query?: OrcamentosQuery): Promise<PaginatedResult<OrcamentoApiDto>>;
  getById(id: number): Promise<OrcamentoDetalheApiDto | null>;
  getFunnel(query?: { dataInicio?: string; dataFim?: string }): Promise<FunnelStats>;
  getMateriaisVendidos(query?: { dataInicio?: string; dataFim?: string }): Promise<MateriaisVendidosResult>;
}

export interface IPreOrcamentosDataSource {
  list(query?: PreOrcamentosQuery): Promise<PaginatedResult<PreOrcamentoApiDto>>;
  getById(id: number): Promise<PreOrcamentoApiDto | null>;
}

export interface ISheetsDataSource {
  getLeads(): Promise<SheetsLeadStats>;
}

export interface ISdrDataSource {
  getTab(query?: SdrQuery): Promise<SdrTabResult>;
  checkHealth(): Promise<{ online: boolean; latencyMs: number }>;
}

export interface ICrmDataSource {
  getLeads(query?: CrmQuery): Promise<CrmLeadsResult>;
  getSources(): Promise<CrmSource[]>;
}

export interface IComissoesDataSource {
  getVendedores(): Promise<ComissoesVendedoresResult>;
  getUsuariosDisponiveis(): Promise<{ usuarios: string[] }>;
  getClientesAtivos(): Promise<ClientesAtivosResult>;
}

export type DataSourceRegistry = {
  mode: DataSourceMode;
  equipment: IEquipmentDataSource;
  kits: IKitsDataSource;
  prospects: IProspectsDataSource;
  dashboard: IDashboardDataSource;
  orcamentos: IOrcamentosDataSource;
  preOrcamentos: IPreOrcamentosDataSource;
  sheets: ISheetsDataSource;
  sdr: ISdrDataSource;
  crm: ICrmDataSource;
  comissoes: IComissoesDataSource;
};

