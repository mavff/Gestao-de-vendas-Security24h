import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface KitFilters {
  q?: string;
  codMarca?: number;
}

@Injectable()
export class KitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: KitFilters = {}, page = 1, pageSize = 20) {
    this.prisma.ensureConnection();

    const where: Record<string, any> = {
      produtoKit: true,
      cancelado: false,
    };

    if (filters.q) {
      where.descricao = { contains: filters.q };
    }
    if (filters.codMarca !== undefined) {
      where.codMarca = filters.codMarca;
    }

    const [items, total] = await Promise.all([
      this.prisma.produto.findMany({
        where,
        orderBy: { codProduto: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          kitItens: {
            include: { itemProduto: true },
          },
        },
      }),
      this.prisma.produto.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(codProduto: number) {
    this.prisma.ensureConnection();

    const kit = await this.prisma.produto.findUnique({
      where: { codProduto, produtoKit: true },
      include: {
        kitItens: {
          include: { itemProduto: true },
        },
      },
    });

    if (!kit) {
      throw new NotFoundException('Kit não encontrado');
    }

    return kit;
  }
}
