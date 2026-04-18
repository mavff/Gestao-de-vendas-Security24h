import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginatedResponse, parsePagination, PaginatedResponse } from '../shared/pagination';
import {
  assertCanMutate,
  isAdminRole,
  resolveOwnerListFilter,
  stampOwnerOnCreate,
} from '../shared/ownership';
import type { AuthedRequest } from '../auth/authed-request';
import { PropostaLocal } from './proposta-local.entity';

export interface ListPropostasFilters {
  status?: string;
  criadoPor?: string;
  leadId?: string;
  search?: string;
  page?: number | string;
  pageSize?: number | string;
}

@Injectable()
export class PropostasLocalService {
  constructor(
    @InjectRepository(PropostaLocal, 'app')
    private readonly repo: Repository<PropostaLocal>,
  ) {}

  async list(req: AuthedRequest, filters: ListPropostasFilters): Promise<PaginatedResponse<PropostaLocal>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const ownerFilter = resolveOwnerListFilter(req, filters.criadoPor);
    const qb = this.repo.createQueryBuilder('p');
    if (filters.status) qb.andWhere('p.status = :s', { s: filters.status });
    if (ownerFilter) qb.andWhere('p.criadoPor = :u', { u: ownerFilter });
    if (filters.leadId) qb.andWhere('p.leadId = :l', { l: filters.leadId });
    if (filters.search) qb.andWhere('LOWER(p.clienteNome) LIKE :q', { q: `%${filters.search.toLowerCase()}%` });
    qb.orderBy('p.updatedAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  private async findOneRaw(id: string): Promise<PropostaLocal> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Proposta ${id} não encontrada`);
    return p;
  }

  async findOneScoped(req: AuthedRequest, id: string): Promise<PropostaLocal> {
    const p = await this.findOneRaw(id);
    if (!isAdminRole(req.user?.role)) {
      assertCanMutate(req, p.criadoPor);
    }
    return p;
  }

  async upsert(req: AuthedRequest, id: string, data: Partial<PropostaLocal>): Promise<PropostaLocal> {
    const existing = await this.repo.findOne({ where: { id } });
    if (existing) assertCanMutate(req, existing.criadoPor);
    const stamped = stampOwnerOnCreate(req, data);
    await this.repo.save({ ...stamped, id } as PropostaLocal);
    return this.findOneRaw(id);
  }

  async remove(req: AuthedRequest, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return;
    assertCanMutate(req, existing.criadoPor);
    await this.repo.delete(id);
  }
}
