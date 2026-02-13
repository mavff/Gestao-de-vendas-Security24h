import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginatedResponse, PaginatedResponse, parsePagination, PaginationQuery } from '../shared/pagination';

export interface ProspectFilters extends PaginationQuery {
  q?: string;
  status?: string;
  vendedor?: number;
  origem?: number;
}

@Injectable()
export class ProspectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ProspectFilters = {}): Promise<PaginatedResponse<any>> {
    this.prisma.ensureConnection();

    const { skip, take, page, pageSize } = parsePagination(filters);
    const where: Record<string, any> = {};

    if (filters.q) {
      where.OR = [
        { nome: { contains: filters.q } },
        { email: { contains: filters.q } },
        { cpf: { contains: filters.q } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    } else {
      where.inativo = false;
    }
    if (filters.vendedor !== undefined) {
      where.vendedor = filters.vendedor;
    }
    if (filters.origem !== undefined) {
      where.origem = filters.origem;
    }

    const [items, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        orderBy: { codProspect: 'desc' },
        skip,
        take,
      }),
      this.prisma.prospect.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async findById(codProspect: number) {
    this.prisma.ensureConnection();

    const prospect = await this.prisma.prospect.findUnique({
      where: { codProspect },
      include: {
        acoes: {
          orderBy: { data: 'desc' },
          take: 50,
        },
      },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect não encontrado');
    }

    return prospect;
  }
}
