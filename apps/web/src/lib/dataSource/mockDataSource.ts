import { Equipment, Kit, Lead } from '../../types';
import { mockEquipments, mockKits, mockLeads } from '../../mocks/data';
import { dashboardDataByPeriod } from '../../mocks/dashboard';
import { loadMock, saveMock } from '../../services/mockStorage';
import { DataSourceRegistry, IComissoesDataSource, ICrmDataSource, IDashboardDataSource, IEquipmentDataSource, IKitsDataSource, IOrcamentosDataSource, IPreOrcamentosDataSource, IProspectsDataSource, ISdrDataSource, ISheetsDataSource } from './interfaces';
import {
  DashboardStats,
  EquipmentQuery,
  FinanceiroDashboard,
  FunnelStats,
  RetencaoDashboard,
  MateriaisVendidosResult,
  KitsQuery,
  OrcamentoApiDto,
  OrcamentoDetalheApiDto,
  OrcamentosQuery,
  PaginatedResult,
  PeriodKey,
  PreOrcamentoApiDto,
  PreOrcamentosQuery,
  ProspectApiDto,
  ProspectsQuery,
  CrmLeadsResult,
  CrmQuery,
  CrmSource,
  SdrQuery,
  SdrTabEntry,
  SdrTabResult,
  SheetsLeadStats,
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

class MockDashboardDataSource implements IDashboardDataSource {
  async getStats(period: PeriodKey): Promise<DashboardStats> {
    return dashboardDataByPeriod[period] ?? dashboardDataByPeriod.all;
  }

  async getFinanceiro(): Promise<FinanceiroDashboard> {
    return {
      receitaEquipamentos: 185000,
      receitaInstalacao: 42000,
      receitaTotal: 227000,
      mrrBase: 38500,
      arr: 462000,
      orcamentosFechados: 14,
      ticketMedio: 16214,
      pipelineAberto: 450000,
      osInstalacoes: 18,
      osManutencoes: 7,
      porVendedor: [
        { usuario: 'Ana', equipamentos: 72000, instalacao: 16000, total: 88000 },
        { usuario: 'Carlos', equipamentos: 54000, instalacao: 12000, total: 66000 },
        { usuario: 'Renata', equipamentos: 38000, instalacao: 9000, total: 47000 },
        { usuario: 'Felipe', equipamentos: 21000, instalacao: 5000, total: 26000 },
      ],
      evolucaoMensal: [
        { mes: 'Out/24', equipamentos: 28000, instalacao: 6000 },
        { mes: 'Nov/24', equipamentos: 31000, instalacao: 7500 },
        { mes: 'Dez/24', equipamentos: 22000, instalacao: 5000 },
        { mes: 'Jan/25', equipamentos: 35000, instalacao: 8000 },
        { mes: 'Fev/25', equipamentos: 42000, instalacao: 9500 },
      ],
      mixReceita: [
        { name: 'Equipamentos', value: 185000 },
        { name: 'Instalação', value: 42000 },
        { name: 'Monitoramento MRR', value: 38500 },
      ],
      porTecnico: [],
    };
  }

  async getRetencao(): Promise<RetencaoDashboard> {
    return {
      totalAtivos: 320,
      mrrAtual: 54400,
      novosNoPeriodo: 22,
      canceladosNoPeriodo: 15,
      mrrPerdido: 2550,
      mrrNovos: 3740,
      taxaRetencao: 95.5,
      churnRate: 4.5,
      tempoMedioPermanencia: 18,
      saldoLiquido: 7,
      evolucaoMensal: [
        { mes: 'Mai/25', novos: 8, cancelados: 5, saldo: 3 },
        { mes: 'Jun/25', novos: 6, cancelados: 4, saldo: 2 },
        { mes: 'Jul/25', novos: 9, cancelados: 7, saldo: 2 },
        { mes: 'Ago/25', novos: 7, cancelados: 6, saldo: 1 },
        { mes: 'Set/25', novos: 5, cancelados: 3, saldo: 2 },
        { mes: 'Out/25', novos: 8, cancelados: 5, saldo: 3 },
        { mes: 'Nov/25', novos: 6, cancelados: 4, saldo: 2 },
        { mes: 'Dez/25', novos: 4, cancelados: 6, saldo: -2 },
        { mes: 'Jan/26', novos: 7, cancelados: 5, saldo: 2 },
        { mes: 'Fev/26', novos: 8, cancelados: 4, saldo: 4 },
        { mes: 'Mar/26', novos: 6, cancelados: 5, saldo: 1 },
        { mes: 'Abr/26', novos: 7, cancelados: 6, saldo: 1 },
      ],
      churnPorModalidade: [
        { modalidade: 'Comodato', total: 38 },
        { modalidade: 'Venda', total: 18 },
        { modalidade: 'Rastreamento', total: 4 },
      ],
      permanenciaPorFaixa: [
        { faixa: '0-6 meses', total: 12 },
        { faixa: '6-12 meses', total: 18 },
        { faixa: '1-2 anos', total: 15 },
        { faixa: '2+ anos', total: 15 },
      ],
    };
  }
}

class MockOrcamentosDataSource implements IOrcamentosDataSource {
  async list(query: OrcamentosQuery = {}): Promise<PaginatedResult<OrcamentoApiDto>> {
    return paginateArray([], query.page, query.pageSize);
  }
  async getById(_id: number): Promise<OrcamentoDetalheApiDto | null> {
    return null;
  }
  async getFunnel(): Promise<FunnelStats> {
    return {
      prospects: 0, totalOrcamentos: 0, abertos: 0, emAprovacao: 0,
      liberados: 0, emInstalacao: 0, faturados: 0, cancelados: 0, avancados: 0,
      taxaConversao: 0, ticketMedioEquip: 0, ticketMedioMensal: 0,
    };
  }
  async getMateriaisVendidos(): Promise<MateriaisVendidosResult> {
    return {
      resumo: { totalOrcamentosVendidos: 0, totalItensUnicos: 0, totalPecas: 0, totalValorProdutos: 0, totalValorMensalidades: 0 },
      produtos: [],
      orcamentos: [],
    };
  }
}

class MockPreOrcamentosDataSource implements IPreOrcamentosDataSource {
  async list(query: PreOrcamentosQuery = {}): Promise<PaginatedResult<PreOrcamentoApiDto>> {
    return paginateArray([], query.page, query.pageSize);
  }
  async getById(_id: number): Promise<PreOrcamentoApiDto | null> {
    return null;
  }
}

class MockSheetsDataSource implements ISheetsDataSource {
  async getLeads(): Promise<SheetsLeadStats> {
    return {
      kpis: { totalLeads: 299, totalVisitas: 23, totalFechou: 1, taxaFechamento: 4.3, newThisWeek: 15 },
      funnelCrm: [
        { stage: 'WhatsApp', total: 162 },
        { stage: 'Instagram', total: 137 },
        { stage: 'Visitas', total: 23 },
        { stage: 'Fechou', total: 1 },
      ],
      porOrigem: [
        { origin: 'FORM/INSTA', total: 95 },
        { origin: 'ADS', total: 38 },
        { origin: 'CENTRAL', total: 13 },
        { origin: 'FORM/SITE', total: 4 },
        { origin: 'DIRECIONADA POR LINK', total: 3 },
        { origin: 'PROSPECÇÃO', total: 2 },
      ],
      porCanal: [
        { origin: 'WhatsApp', total: 162 },
        { origin: 'Instagram', total: 137 },
      ],
      porResponsavel: [{ seller: 'RBV', closures: 137 }],
      porStatus: [
        { status: 'Não respondeu (3x)', total: 79 },
        { status: '2ª Tentativa', total: 37 },
        { status: 'Orçamento Enviado', total: 16 },
        { status: 'Interessado', total: 10 },
        { status: 'Desc.: Fora da área', total: 5 },
        { status: 'Desc.: Sem perfil', total: 4 },
        { status: 'Marcou Visita', total: 3 },
        { status: '1ª Tentativa', total: 3 },
        { status: 'Já é cliente', total: 1 },
        { status: 'Contato Encerrado', total: 1 },
        { status: 'Em Análise', total: 1 },
      ],
      evolucaoMensal: [
        { mes: 'Jan/26', whatsapp: 85, instagram: 100, visitas: 8 },
        { mes: 'Fev/26', whatsapp: 62, instagram: 37, visitas: 15 },
        { mes: 'Mar/26', whatsapp: 15, instagram: 0, visitas: 0 },
      ],
      leadsRecentes: [
        { nome: 'Carolina', empresa: 'Residencial', canal: 'WhatsApp', status: 'Desc.: Sem perfil', prioridade: '', responsavel: '', data: '03/03/2026' },
        { nome: 'Maylton', empresa: 'Residencial', canal: 'WhatsApp', status: 'Desc.: Sem perfil', prioridade: '', responsavel: '', data: '02/03/2026' },
        { nome: 'Karina', empresa: 'Residencial', canal: 'WhatsApp', status: 'Interessado', prioridade: '', responsavel: '', data: '26/02/2026' },
        { nome: 'Nayra Bacelar', empresa: 'Residencial', canal: 'WhatsApp', status: 'Desc.: Fora da área', prioridade: '', responsavel: '', data: '06/02/2026' },
        { nome: 'CINTIA', empresa: 'cintiafvc', canal: 'Instagram', status: 'PA', prioridade: '', responsavel: 'RBV', data: '30/01/2026' },
      ],
      analiseCanal: [
        { canal: 'Tráfego Pago',    origens: ['ADS'],                                                               leads: 38, visitas: 3,  fechamentos: 0 },
        { canal: 'Form. Instagram', origens: ['FORM/INSTA', 'FORM/INSTA, DIRECIONADA POR LINK'],                   leads: 95, visitas: 12, fechamentos: 1 },
        { canal: 'Central',         origens: ['CENTRAL', 'LIGAÇÃO'],                                               leads: 13, visitas: 5,  fechamentos: 0 },
        { canal: 'Site',            origens: ['FORM/SITE', 'FORM/SITE, DIRECIONADA POR LINK'],                     leads: 5,  visitas: 1,  fechamentos: 0 },
        { canal: 'Prospecção',      origens: ['PROSPECÇÃO', 'DIRECIONADA POR LINK', 'INSTA/DM', 'INSTA/PA'],      leads: 7,  visitas: 2,  fechamentos: 0 },
      ],
    };
  }
}

const MOCK_SDR_TABS: Record<string, { sheetName: string; columns: string[]; entries: SdrTabEntry[] }> = {
  whatsapp: {
    sheetName: 'SDR Log',
    columns: ['Data', 'Nome do Lead', 'Empresa / Condomínio', 'Telefone', 'Origem do Lead', 'Status do Lead', 'Observações'],
    entries: [
      { rowIndex: 1, cells: ['03/03/2026', 'Carolina', 'Residencial', '8694652078', 'FORM/SITE', 'LD-SEM', 'interesse somente em ronda'] },
      { rowIndex: 2, cells: ['02/03/2026', 'Maylton', 'Residencial', '', 'ADS', 'LD-SEM', 'não tem perfil'] },
      { rowIndex: 3, cells: ['26/02/2026', 'Karina', 'Residencial', '', 'ADS', 'INT', 'Ainda vai receber a casa'] },
      { rowIndex: 4, cells: ['23/02/2026', 'Élisson', 'Comercial', '', 'PROSPECÇÃO', 'MV', 'ainda está construindo ponto'] },
      { rowIndex: 5, cells: ['23/02/2026', 'Fatima', '', '', 'FORM/INSTA', 'INT', 'marcou visita e cancelou'] },
      { rowIndex: 6, cells: ['21/02/2026', 'Daniel Melo', 'Comercial', '86981559728', 'FORM/INSTA', 'NR3', ''] },
      { rowIndex: 7, cells: ['20/02/2026', 'Tereza Cristina', 'Residencial', '', 'ADS', 'ANL', ''] },
      { rowIndex: 8, cells: ['19/02/2026', 'Janaina Holanda', 'Comercial', '', 'FORM/INSTA', 'OE', ''] },
      { rowIndex: 9, cells: ['14/02/2026', 'Renato', 'Residencial', '86981013102', 'FORM/INSTA', 'INT', ''] },
      { rowIndex: 10, cells: ['06/02/2026', 'Roberta', 'Residencial', '86981432376', 'CENTRAL', 'INT', 'retomar contato'] },
    ],
  },
  instagram: {
    sheetName: 'Instagram',
    columns: ['Data de Entrada', 'Nome do Lead', 'Empresa / Condomínio', 'Cargo / Função', 'Instagram / LinkedIn', 'Origem do Lead', 'Status do Lead', 'Observações'],
    entries: [
      { rowIndex: 1, cells: ['30/01/2026', 'CINTIA', 'cintiafvc', '', '@cintiafvc', 'INSTA/DM', 'PA', ''] },
      { rowIndex: 2, cells: ['28/01/2026', 'MARCOS', 'Residencial', 'Proprietário', '@marcos_res', 'FORM/INSTA', 'IG-NOVO', ''] },
      { rowIndex: 3, cells: ['25/01/2026', 'ANA LUCIA', 'Comercial', 'Gerente', '@analucia', 'INSTA/PA', 'IG-INFO', 'solicitou mais informações'] },
      { rowIndex: 4, cells: ['20/01/2026', 'PEDRO', 'Condomínio', 'Síndico', '@pedro.sindico', 'FORM/INSTA', 'IG-REA', ''] },
      { rowIndex: 5, cells: ['15/01/2026', 'JULIANA', 'Residencial', '', '@jul_seg', 'INSTA/DM', 'IG-COM', 'fechou orçamento'] },
    ],
  },
  visitas: {
    sheetName: 'Visitas marcadas',
    columns: ['Data Marcada', 'Nome do Lead', 'Empresa / Condomínio', 'Origem do Lead', 'Bairro', 'Instagram / WhatsApp', 'Status do Lead', 'Observações', 'Fechou?', 'Se não, por quê?', 'Valor', 'Orçamentos'],
    entries: [
      { rowIndex: 1, cells: ['28/02/2026', 'Élisson', 'Comercial', 'PROSPECÇÃO', 'Centro', '', 'A-VIS', '', 'NÃO', 'aguardando obra', '', ''] },
      { rowIndex: 2, cells: ['25/02/2026', 'Karina', 'Residencial', 'ADS', 'Jóquei', '', 'VR', 'visita realizada', 'VERIFICAR', '', '', ''] },
      { rowIndex: 3, cells: ['20/02/2026', 'Roberto', 'Condomínio', 'CENTRAL', 'Fátima', '86999112233', 'FCH', 'fechou contrato', 'SIM', '', 'R$ 4.500', 'ORC-2024-088'] },
      { rowIndex: 4, cells: ['18/02/2026', 'Mariana', 'Residencial', 'FORM/INSTA', 'Ininga', '@mariana', 'VNE', 'não estava', 'NÃO', 'não encontrou em casa', '', ''] },
    ],
  },
};

function buildMockSdrStats(entries: SdrTabEntry[], statusCol: number): { total: number; porStatus: { label: string; total: number }[] } {
  const statusMap = new Map<string, number>();
  for (const e of entries) {
    const s = (e.cells[statusCol] ?? '').trim() || '—';
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
  }
  return {
    total: entries.length,
    porStatus: [...statusMap.entries()].sort((a, b) => b[1] - a[1]).map(([label, total]) => ({ label, total })),
  };
}

const STATUS_COL_MAP: Record<string, number> = { whatsapp: 5, instagram: 6, visitas: 6 };

class MockSdrDataSource implements ISdrDataSource {
  async getTab(query: SdrQuery = {}): Promise<SdrTabResult> {
    const tabKey = query.tab || 'whatsapp';
    const mock = MOCK_SDR_TABS[tabKey] ?? MOCK_SDR_TABS.whatsapp;
    const statusCol = STATUS_COL_MAP[tabKey] ?? 5;
    return {
      tab: tabKey,
      sheetName: mock.sheetName,
      columns: mock.columns,
      entries: mock.entries,
      stats: buildMockSdrStats(mock.entries, statusCol),
    };
  }

  async checkHealth(): Promise<{ online: boolean; latencyMs: number }> {
    return { online: false, latencyMs: 0 };
  }
}

class MockCrmDataSource implements ICrmDataSource {
  async getLeads(_query: CrmQuery = {}): Promise<CrmLeadsResult> {
    return {
      leads: [],
      stats: {
        total: 0, novos: 0, emContato: 0, qualificados: 0,
        orcamentoEnviado: 0, fechados: 0, perdidos: 0, semAtendimento: 0,
        porOrigem: [], porProduto: [], porResponsavel: [],
        porStatus: [], porPrioridade: [], porPeriodo: [],
      },
    };
  }
  async getSources(): Promise<CrmSource[]> {
    return [
      { id: 'site', label: 'Site' },
      { id: 'insta-form', label: 'Form. Instagram' },
      { id: 'sdr-whatsapp', label: 'SDR WhatsApp' },
    ];
  }
}

class MockComissoesDataSource implements IComissoesDataSource {
  async getVendedores() {
    return {
      vendedores: [
        {
          usuario: 'Demo Vendedor',
          clientes: [
            {
              codInterno: 1, numOrcamento: 1001, clienteNome: 'Cliente Exemplo',
              cgcCpf: '000.000.000-00', status: 'F', modalidade: 'C',
              fechamento: '2025-06-01', emissao: '2025-05-20',
              totalProdutos: 3500, totalServicos: 800, valorMonitoramento: 170,
              comissaoBd: 0, pontos: 12, mesesAtivos: 10,
              diaVencimento: 10, primeiroFaturamento: '2025-06-10',
            },
          ],
        },
      ],
      totalClientes: 1,
    };
  }

  async getUsuariosDisponiveis() {
    return { usuarios: ['Demo Vendedor'] };
  }

  async getClientesAtivos() {
    return {
      clientes: [{
        codCliente: 1, nome: 'Cliente Demo', fantasia: null, cgcCpf: '000.000.000-00',
        fone1: '(00) 0000-0000', cidade: 'Cidade', modalidade: 'V',
        vendedorNome: 'Demo Vendedor', tecnicoNome: 'Demo Tecnico',
        valorMonitoramento: 170, diaVencimento: 10, primeiroFaturamento: '2025-06-10',
        dataFechamento: '2025-06-01',
      }],
      total: 1,
    };
  }
}

export function createMockDataSource(): DataSourceRegistry {
  return {
    mode: 'mock',
    equipment: new MockEquipmentDataSource(),
    kits: new MockKitsDataSource(),
    prospects: new MockProspectsDataSource(),
    dashboard: new MockDashboardDataSource(),
    orcamentos: new MockOrcamentosDataSource(),
    preOrcamentos: new MockPreOrcamentosDataSource(),
    sheets: new MockSheetsDataSource(),
    sdr: new MockSdrDataSource(),
    crm: new MockCrmDataSource(),
    comissoes: new MockComissoesDataSource(),
  };
}

