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
import { TipoVistoria, Vistoria } from './vistoria.entity';

export interface ListVistoriasFilters {
  tipoVistoria?: TipoVistoria;
  leadId?: string;
  status?: string;
  criadoPor?: string;
  page?: number | string;
  pageSize?: number | string;
}

@Injectable()
export class VistoriasService {
  constructor(
    @InjectRepository(Vistoria, 'app')
    private readonly repo: Repository<Vistoria>,
  ) {}

  async list(req: AuthedRequest, filters: ListVistoriasFilters): Promise<PaginatedResponse<Vistoria>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const ownerFilter = resolveOwnerListFilter(req, filters.criadoPor);
    const qb = this.repo.createQueryBuilder('v');
    if (filters.tipoVistoria) qb.andWhere('v.tipoVistoria = :t', { t: filters.tipoVistoria });
    if (filters.leadId) qb.andWhere('v.leadId = :l', { l: filters.leadId });
    if (filters.status) qb.andWhere('v.status = :s', { s: filters.status });
    if (ownerFilter) qb.andWhere('v.criadoPor = :u', { u: ownerFilter });
    qb.orderBy('v.updatedAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  private async findOneRaw(id: string): Promise<Vistoria> {
    const v = await this.repo.findOne({ where: { id } });
    if (!v) throw new NotFoundException(`Vistoria ${id} não encontrada`);
    return v;
  }

  async findOneScoped(req: AuthedRequest, id: string): Promise<Vistoria> {
    const v = await this.findOneRaw(id);
    if (!isAdminRole(req.user?.role)) {
      assertCanMutate(req, v.criadoPor);
    }
    return v;
  }

  async upsert(req: AuthedRequest, id: string, data: Partial<Vistoria>): Promise<Vistoria> {
    const existing = await this.repo.findOne({ where: { id } });
    if (existing) assertCanMutate(req, existing.criadoPor);
    const stamped = stampOwnerOnCreate(req, data);
    await this.repo.save({ ...stamped, id } as Vistoria);
    return this.findOneRaw(id);
  }

  async remove(req: AuthedRequest, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return;
    assertCanMutate(req, existing.criadoPor);
    await this.repo.delete(id);
  }
}
