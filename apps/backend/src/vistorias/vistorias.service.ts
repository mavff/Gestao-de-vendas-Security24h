import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginatedResponse, parsePagination, PaginatedResponse } from '../shared/pagination';
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

  async list(filters: ListVistoriasFilters): Promise<PaginatedResponse<Vistoria>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const qb = this.repo.createQueryBuilder('v');
    if (filters.tipoVistoria) qb.andWhere('v.tipoVistoria = :t', { t: filters.tipoVistoria });
    if (filters.leadId) qb.andWhere('v.leadId = :l', { l: filters.leadId });
    if (filters.status) qb.andWhere('v.status = :s', { s: filters.status });
    if (filters.criadoPor) qb.andWhere('v.criadoPor = :u', { u: filters.criadoPor });
    qb.orderBy('v.updatedAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  async findOne(id: string): Promise<Vistoria> {
    const v = await this.repo.findOne({ where: { id } });
    if (!v) throw new NotFoundException(`Vistoria ${id} não encontrada`);
    return v;
  }

  async upsert(id: string, data: Partial<Vistoria>): Promise<Vistoria> {
    await this.repo.save({ ...data, id } as Vistoria);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
