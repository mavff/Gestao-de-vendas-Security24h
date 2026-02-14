import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginatedResponse, PaginatedResponse, parsePagination, PaginationQuery } from '../shared/pagination';

export interface OrcamentoFilters extends PaginationQuery {
  q?: string;
  status?: string;
  vendedor?: number;
  prospect?: number;
  modalidade?: string;
}

@Injectable()
export class OrcamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: OrcamentoFilters = {}): Promise<PaginatedResponse<any>> {
    this.prisma.ensureConnection();

    const { skip, take, page, pageSize } = parsePagination(filters);
    const where: Record<string, any> = {};

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

    const [items, total] = await Promise.all([
      this.prisma.orcamento.findMany({
        where,
        orderBy: { codInterno: 'desc' },
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

  async findById(codInterno: number) {
    this.prisma.ensureConnection();

    const orcamento = await this.prisma.orcamento.findUnique({
      where: { codInterno },
      include: {
        produtos: {
          orderBy: { codInterno: 'asc' },
        },
        servicosAdicionais: {
          orderBy: { codInterno: 'asc' },
        },
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return orcamento;
  }
}
