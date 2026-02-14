import { Equipment, Kit, Lead } from '../../types';
import { mockEquipments, mockKits, mockLeads } from '../../mocks/data';
import { loadMock } from '../../services/mockStorage';
import { DataSourceRegistry, IEquipmentDataSource, IKitsDataSource, IProspectsDataSource } from './interfaces';
import {
  EquipmentQuery,
  KitsQuery,
  PaginatedResult,
  ProspectApiDto,
  ProspectsQuery,
  paginateArray,
} from './types';

class MockEquipmentDataSource implements IEquipmentDataSource {
  async list(query: EquipmentQuery = {}): Promise<PaginatedResult<Equipment>> {
    const stored = loadMock<Equipment[]>('mock_equipments', mockEquipments);
    const q = (query.q || '').trim().toLowerCase();

    const filtered = !q
      ? stored
      : stored.filter((item) => `${item.name} ${item.sku} ${item.descricao}`.toLowerCase().includes(q));

    return paginateArray(filtered, query.page, query.pageSize);
  }

  async getById(id: string): Promise<Equipment | null> {
    const stored = loadMock<Equipment[]>('mock_equipments', mockEquipments);
    return stored.find((item) => item.id === id) ?? null;
  }
}

class MockKitsDataSource implements IKitsDataSource {
  async list(query: KitsQuery = {}): Promise<PaginatedResult<Kit>> {
    const stored = loadMock<Kit[]>('mock_kits', mockKits);
    const q = (query.q || '').trim().toLowerCase();

    const filtered = !q
      ? stored
      : stored.filter((item) => item.name.toLowerCase().includes(q));

    return paginateArray(filtered, query.page, query.pageSize);
  }

  async getById(id: string): Promise<Kit | null> {
    const stored = loadMock<Kit[]>('mock_kits', mockKits);
    return stored.find((item) => item.id === id) ?? null;
  }
}

function leadToProspect(lead: Lead, index: number): ProspectApiDto {
  const numericId = Number(lead.id.replace(/\D/g, '')) || index + 1;
  return {
    codProspect: numericId,
    nome: lead.name,
    email: null,
    vendedor: null,
    origem: null,
    status: lead.status === 'ativo' ? 'A' : 'C',
    inativo: lead.status !== 'ativo',
  };
}

class MockProspectsDataSource implements IProspectsDataSource {
  async list(query: ProspectsQuery = {}): Promise<PaginatedResult<ProspectApiDto>> {
    const leads = loadMock<Lead[]>('mock_leads', mockLeads);
    const prospects = leads.map(leadToProspect);

    const q = (query.q || '').trim().toLowerCase();
    const filteredBySearch = !q
      ? prospects
      : prospects.filter((item) => item.nome.toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q));

    const filtered = query.status
      ? filteredBySearch.filter((item) => item.status === query.status)
      : filteredBySearch;

    return paginateArray(filtered, query.page, query.pageSize);
  }

  async getById(id: string | number): Promise<ProspectApiDto | null> {
    const leads = loadMock<Lead[]>('mock_leads', mockLeads);
    const prospects = leads.map(leadToProspect);
    const normalizedId = Number(id);
    return prospects.find((item) => item.codProspect === normalizedId) ?? null;
  }
}

export function createMockDataSource(): DataSourceRegistry {
  return {
    mode: 'mock',
    equipment: new MockEquipmentDataSource(),
    kits: new MockKitsDataSource(),
    prospects: new MockProspectsDataSource(),
  };
}

