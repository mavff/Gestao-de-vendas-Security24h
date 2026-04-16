import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginatedResponse, parsePagination, PaginatedResponse } from '../shared/pagination';
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

  async list(filters: ListPropostasFilters): Promise<PaginatedResponse<PropostaLocal>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const qb = this.repo.createQueryBuilder('p');
    if (filters.status) qb.andWhere('p.status = :s', { s: filters.status });
    if (filters.criadoPor) qb.andWhere('p.criadoPor = :u', { u: filters.criadoPor });
    if (filters.leadId) qb.andWhere('p.leadId = :l', { l: filters.leadId });
    if (filters.search) qb.andWhere('LOWER(p.clienteNome) LIKE :q', { q: `%${filters.search.toLowerCase()}%` });
    qb.orderBy('p.updatedAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  async findOne(id: string): Promise<PropostaLocal> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Proposta ${id} não encontrada`);
    return p;
  }

  async upsert(id: string, data: Partial<PropostaLocal>): Promise<PropostaLocal> {
    await this.repo.save({ ...data, id } as PropostaLocal);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
