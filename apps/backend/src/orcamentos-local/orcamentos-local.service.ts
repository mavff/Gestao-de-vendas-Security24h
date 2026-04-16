import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginatedResponse, parsePagination, PaginatedResponse } from '../shared/pagination';
import { OrcamentoLocal } from './orcamento-local.entity';

export interface ListOrcamentosFilters {
  status?: string;
  leadId?: string;
  modalidade?: string;
  page?: number | string;
  pageSize?: number | string;
}

@Injectable()
export class OrcamentosLocalService {
  constructor(
    @InjectRepository(OrcamentoLocal, 'app')
    private readonly repo: Repository<OrcamentoLocal>,
  ) {}

  async list(filters: ListOrcamentosFilters): Promise<PaginatedResponse<OrcamentoLocal>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const qb = this.repo.createQueryBuilder('o');
    if (filters.status) qb.andWhere('o.status = :s', { s: filters.status });
    if (filters.leadId) qb.andWhere('o.leadId = :l', { l: filters.leadId });
    if (filters.modalidade) qb.andWhere('o.modalidade = :m', { m: filters.modalidade });
    qb.orderBy('o.createdAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  async findOne(id: string): Promise<OrcamentoLocal> {
    const o = await this.repo.findOne({ where: { id } });
    if (!o) throw new NotFoundException(`Orçamento ${id} não encontrado`);
    return o;
  }

  async upsert(id: string, data: Partial<OrcamentoLocal>): Promise<OrcamentoLocal> {
    await this.repo.save({ ...data, id } as OrcamentoLocal);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
