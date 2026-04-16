import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginatedResponse, parsePagination, PaginatedResponse } from '../shared/pagination';
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

  async list(filters: ListSolucoesFilters): Promise<PaginatedResponse<Solucao>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const qb = this.repo.createQueryBuilder('s');
    if (filters.status) qb.andWhere('s.status = :status', { status: filters.status });
    if (filters.criadoPor) qb.andWhere('s.criadoPor = :u', { u: filters.criadoPor });
    if (filters.leadId) qb.andWhere('s.leadId = :l', { l: filters.leadId });
    if (filters.search) {
      qb.andWhere('(LOWER(s.clienteNome) LIKE :q OR LOWER(s.marca) LIKE :q)', { q: `%${filters.search.toLowerCase()}%` });
    }
    qb.orderBy('s.updatedAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  async findOne(id: string): Promise<Solucao> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException(`Solução ${id} não encontrada`);
    return s;
  }

  async upsert(id: string, data: Partial<Solucao>): Promise<Solucao> {
    await this.repo.save({ ...data, id } as Solucao);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
