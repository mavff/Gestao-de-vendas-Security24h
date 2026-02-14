import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LookupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPipelineStages(usuario?: string, unidade?: number) {
    this.prisma.ensureConnection();

    const where: Record<string, any> = {};
    if (usuario) where.usuario = usuario;
    if (unidade !== undefined) where.unidade = unidade;

    return this.prisma.etapaOrcamento.findMany({
      where,
      orderBy: { ordem: 'asc' },
    });
  }

  async findByEntity(codEntidade: number) {
    this.prisma.ensureConnection();

    return this.prisma.dadoEntidade.findMany({
      where: { codEntidade, inativa: false },
      orderBy: { descreve: 'asc' },
    });
  }
}
