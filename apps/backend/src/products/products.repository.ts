import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginatedResponse, PaginatedResponse, parsePagination, PaginationQuery } from '../shared/pagination';

export interface ProductFilters extends PaginationQuery {
  q?: string;
  codMarca?: number;
  codGrupo?: number;
  codCategoria?: number;
  cancelado?: boolean;
  /** Filtrar apenas produtos com GrupoOrçamento preenchido (padrão: false — ERP atual tem só 4 com esse campo) */
  apenasOrcamento?: boolean;
  grupoOrcamento?: string;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ProductFilters = {}): Promise<PaginatedResponse<any>> {
    this.prisma.ensureConnection();

    const { skip, take, page, pageSize } = parsePagination(filters);
    const where: Record<string, any> = {};

    if (filters.q) {
      where.descricao = { contains: filters.q };
    }
    if (filters.codMarca !== undefined) {
      where.codMarca = filters.codMarca;
    }
    if (filters.codGrupo !== undefined) {
      where.codGrupo = filters.codGrupo;
    }
    if (filters.codCategoria !== undefined) {
      where.codCategoria = filters.codCategoria;
    }
    if (filters.cancelado !== undefined) {
      where.cancelado = filters.cancelado;
    } else {
      where.cancelado = false;
    }

    // Default: retorna catálogo completo (ERP atual só tem 4 produtos com grupoOrcamento preenchido).
    // Para o subcatálogo "orçamento", passar explicitamente ?apenasOrcamento=true.
    if (filters.apenasOrcamento === true) {
      // NOT NULL e NOT empty — Prisma SQL Server exige AND explícito p/ cobrir NULL
      where.AND = [
        { grupoOrcamento: { not: null } },
        { grupoOrcamento: { not: '' } },
      ];
      if (filters.grupoOrcamento) {
        where.grupoOrcamento = filters.grupoOrcamento;
        delete where.AND;
      }
    } else if (filters.grupoOrcamento) {
      where.grupoOrcamento = filters.grupoOrcamento;
    }

    const [items, total] = await Promise.all([
      this.prisma.produto.findMany({
        where,
        orderBy: { codProduto: 'asc' },
        skip,
        take,
      }),
      this.prisma.produto.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async findById(codProduto: number) {
    this.prisma.ensureConnection();

    return this.prisma.produto.findUnique({
      where: { codProduto },
      include: { kitItens: { include: { itemProduto: true } } },
    });
  }
}
