import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface TipoEstoqueDto {
  codEstoque: number;
  tipoEstoque: string;
  inativo: boolean;
}

@Injectable()
export class TiposEstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(incluirInativos = false): Promise<TipoEstoqueDto[]> {
    this.prisma.ensureConnection();

    const where = incluirInativos ? {} : { OR: [{ inativo: false }, { inativo: null }] };
    const items = await this.prisma.tipoEstoque.findMany({
      where,
      orderBy: { tipoEstoque: 'asc' },
    });

    return items.map((t) => ({
      codEstoque: t.codEstoque,
      tipoEstoque: (t.tipoEstoque ?? '').trim() || `Tipo ${t.codEstoque}`,
      inativo: t.inativo === true,
    }));
  }
}
