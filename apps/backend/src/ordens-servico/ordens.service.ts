import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginatedResponse, parsePagination, PaginatedResponse } from '../shared/pagination';
import type { AuthedRequest } from '../auth/authed-request';
import { OrdemServico } from './ordem.entity';

export interface ListOrdensFilters {
  leadId?: string;
  tecnicoId?: string;
  status?: string;
  page?: number | string;
  pageSize?: number | string;
}

@Injectable()
export class OrdensService {
  constructor(
    @InjectRepository(OrdemServico, 'app')
    private readonly repo: Repository<OrdemServico>,
  ) {}

  async list(req: AuthedRequest, filters: ListOrdensFilters): Promise<PaginatedResponse<OrdemServico>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const qb = this.repo.createQueryBuilder('o');

    // TÉCNICO só enxerga as próprias OS (por tecnicoId = username).
    // ADMIN/GESTOR/VENDEDOR enxergam todas (sem campo criadoPor na entity ainda).
    const role = req.user?.role;
    if (role === 'TECNICO') {
      qb.andWhere('o.tecnicoId = :me', { me: req.user?.username ?? '' });
    } else if (filters.tecnicoId) {
      qb.andWhere('o.tecnicoId = :t', { t: filters.tecnicoId });
    }

    if (filters.leadId) qb.andWhere('o.leadId = :l', { l: filters.leadId });
    if (filters.status) qb.andWhere('o.status = :s', { s: filters.status });
    qb.orderBy('o.createdAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  async findOne(id: string): Promise<OrdemServico> {
    const o = await this.repo.findOne({ where: { id } });
    if (!o) throw new NotFoundException(`Ordem ${id} não encontrada`);
    return o;
  }

  async upsert(id: string, data: Partial<OrdemServico>): Promise<OrdemServico> {
    await this.repo.save({ ...data, id } as OrdemServico);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
