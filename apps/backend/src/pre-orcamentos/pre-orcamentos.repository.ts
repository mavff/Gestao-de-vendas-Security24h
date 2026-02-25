import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginatedResponse, PaginatedResponse, parsePagination, PaginationQuery } from '../shared/pagination';

export interface PreOrcamentoFilters extends PaginationQuery {
  q?: string;
}

@Injectable()
export class PreOrcamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: PreOrcamentoFilters = {}): Promise<PaginatedResponse<any>> {
    this.prisma.ensureConnection();

    const { skip, take, page, pageSize } = parsePagination(filters);
    const where: Record<string, any> = {};

    if (filters.q) {
      where.descricao = { contains: filters.q };
    }

    const [items, total] = await Promise.all([
      this.prisma.preOrcamento.findMany({
        where,
        orderBy: { descricao: 'asc' },
        skip,
        take,
        include: {
          produtos: {
            orderBy: { orcOrdem: 'asc' },
            include: { produto: true },
          },
        },
      }),
      this.prisma.preOrcamento.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async findById(codInterno: number): Promise<any | null> {
    this.prisma.ensureConnection();

    return this.prisma.preOrcamento.findUnique({
      where: { codInterno },
      include: {
        produtos: {
          orderBy: { orcOrdem: 'asc' },
          include: { produto: true },
        },
      },
    });
  }
}
