import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginatedResponse, PaginatedResponse, parsePagination, PaginationQuery } from '../shared/pagination';

export interface OrcamentoFilters extends PaginationQuery {
  q?: string;
  status?: string;
  vendedor?: number;
  prospect?: number;
  modalidade?: string;
  dataInicio?: string; // ISO date YYYY-MM-DD
  dataFim?: string;    // ISO date YYYY-MM-DD
}

const EMPRESA_IDS = [2, 1002];

function buildDateFilter(dataInicio?: string, dataFim?: string) {
  if (!dataInicio && !dataFim) return undefined;
  const filter: Record<string, Date> = {};
  if (dataInicio) filter.gte = new Date(dataInicio + 'T00:00:00.000Z');
  if (dataFim)    filter.lte = new Date(dataFim   + 'T23:59:59.999Z');
  return filter;
}

@Injectable()
export class OrcamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: OrcamentoFilters = {}): Promise<PaginatedResponse<any>> {
    this.prisma.ensureConnection();

    const { skip, take, page, pageSize } = parsePagination(filters);
    const where: Record<string, any> = { empresa: { in: EMPRESA_IDS } };

    if (filters.q) {
      where.OR = [
        { clienteNome: { contains: filters.q } },
        { cgcCpf: { contains: filters.q } },
        { observacoes: { contains: filters.q } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.vendedor !== undefined) {
      where.vendedor = filters.vendedor;
    }
    if (filters.prospect !== undefined) {
      where.prospect = filters.prospect;
    }
    if (filters.modalidade) {
      where.modalidade = filters.modalidade;
    }

    const emissaoFilter = buildDateFilter(filters.dataInicio, filters.dataFim);
    if (emissaoFilter) {
      where.emissao = emissaoFilter;
    }

    const [items, total] = await Promise.all([
      this.prisma.orcamento.findMany({
        where,
        orderBy: { emissao: 'desc' },
        skip,
        take,
        select: {
          codInterno: true,
          numOrcamento: true,
          clienteNome: true,
          cgcCpf: true,
          cidade: true,
          uf: true,
          vendedor: true,
          status: true,
          modalidade: true,
          emissao: true,
          validade: true,
          fechamento: true,
          pontos: true,
          totalProdutos: true,
          totalServicos: true,
          valorMonitoramento: true,
          etapa: true,
          probabilidade: true,
        },
      }),
      this.prisma.orcamento.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async getFunnel(dataInicio?: string, dataFim?: string) {
    this.prisma.ensureConnection();

    const emissaoFilter = buildDateFilter(dataInicio, dataFim);
    const baseWhere: Record<string, any> = { empresa: { in: EMPRESA_IDS }, ...(emissaoFilter ? { emissao: emissaoFilter } : {}) };
    const prospectWhere: Record<string, any> = {};
    if (emissaoFilter) prospectWhere.dataCadastro = emissaoFilter;

    const [
      totalOrcamentos,
      abertos,
      emAprovacao,
      liberados,
      emInstalacao,
      cancelados,
      prospects,
      ticketAgg,
    ] = await Promise.all([
      this.prisma.orcamento.count({ where: { ...baseWhere, status: { not: 'C' } } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'A' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'P' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'L' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'E' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'C' } }),
      this.prisma.prospect.count({ where: prospectWhere }),
      this.prisma.orcamento.aggregate({
        _avg: { totalProdutos: true, valorMonitoramento: true },
        where: { ...baseWhere, status: { not: 'C' } },
      }),
    ]);

    const avancados = liberados + emInstalacao;
    const taxaConversao = totalOrcamentos > 0
      ? Math.round((avancados / totalOrcamentos) * 100)
      : 0;

    return {
      prospects,
      totalOrcamentos,
      abertos,
      emAprovacao,
      liberados,
      emInstalacao,
      cancelados,
      avancados,
      taxaConversao,
      ticketMedioEquip: Number(ticketAgg._avg.totalProdutos) || 0,
      ticketMedioMensal: Number(ticketAgg._avg.valorMonitoramento) || 0,
    };
  }

  async findById(codInterno: number) {
    this.prisma.ensureConnection();

    const orcamento = await this.prisma.orcamento.findUnique({
      where: { codInterno },
      include: {
        produtos: { orderBy: { codInterno: 'asc' } },
        servicosAdicionais: { orderBy: { codInterno: 'asc' } },
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return orcamento;
  }
}
