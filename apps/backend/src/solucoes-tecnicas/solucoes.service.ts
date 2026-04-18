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
import { Solucao } from './solucao.entity';

export interface ListSolucoesFilters {
  status?: string;
  criadoPor?: string;
  leadId?: string;
  search?: string;
  page?: number | string;
  pageSize?: number | string;
}

@Injectable()
export class SolucoesService {
  constructor(
    @InjectRepository(Solucao, 'app')
    private readonly repo: Repository<Solucao>,
  ) {}

  async list(req: AuthedRequest, filters: ListSolucoesFilters): Promise<PaginatedResponse<Solucao>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const ownerFilter = resolveOwnerListFilter(req, filters.criadoPor);
    const qb = this.repo.createQueryBuilder('s');
    if (filters.status) qb.andWhere('s.status = :status', { status: filters.status });
    if (ownerFilter) qb.andWhere('s.criadoPor = :u', { u: ownerFilter });
    if (filters.leadId) qb.andWhere('s.leadId = :l', { l: filters.leadId });
    if (filters.search) {
      qb.andWhere('(LOWER(s.clienteNome) LIKE :q OR LOWER(s.marca) LIKE :q)', { q: `%${filters.search.toLowerCase()}%` });
    }
    qb.orderBy('s.updatedAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  private async findOneRaw(id: string): Promise<Solucao> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException(`Solução ${id} não encontrada`);
    return s;
  }

  async findOneScoped(req: AuthedRequest, id: string): Promise<Solucao> {
    const s = await this.findOneRaw(id);
    if (!isAdminRole(req.user?.role)) {
      assertCanMutate(req, s.criadoPor);
    }
    return s;
  }

  async upsert(req: AuthedRequest, id: string, data: Partial<Solucao>): Promise<Solucao> {
    const existing = await this.repo.findOne({ where: { id } });
    if (existing) assertCanMutate(req, existing.criadoPor);
    const stamped = stampOwnerOnCreate(req, data);
    await this.repo.save({ ...stamped, id } as Solucao);
    return this.findOneRaw(id);
  }

  async remove(req: AuthedRequest, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return;
    assertCanMutate(req, existing.criadoPor);
    await this.repo.delete(id);
  }
}
