import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginatedResponse, parsePagination, PaginatedResponse } from '../shared/pagination';
import { PhotosService } from '../photos/photos.service';
import { Venda } from './venda.entity';

export interface ListVendasFilters {
  status?: string;
  criadoPor?: string;
  search?: string;
  page?: number | string;
  pageSize?: number | string;
}

@Injectable()
export class VendasService {
  constructor(
    @InjectRepository(Venda, 'app')
    private readonly repo: Repository<Venda>,
    private readonly photos: PhotosService,
  ) {}

  async anexarContrato(
    id: string,
    buffer: Buffer,
    mimeType: string,
    userId: number | null,
  ): Promise<Venda> {
    const venda = await this.findOne(id);
    const saved = await this.photos.upload(buffer, {
      entityType: 'contrato',
      entityId: id,
      mimeType,
      createdBy: userId,
    });
    venda.contratoUrl = `photo:${saved.id}`;
    venda.contratoAssinadoEm = new Date().toISOString();
    venda.updatedAt = new Date().toISOString();
    await this.repo.save(venda);
    return venda;
  }

  async list(filters: ListVendasFilters): Promise<PaginatedResponse<Venda>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const qb = this.repo.createQueryBuilder('v');
    if (filters.status) qb.andWhere('v.status = :status', { status: filters.status });
    if (filters.criadoPor) qb.andWhere('v.criadoPor = :u', { u: filters.criadoPor });
    if (filters.search) {
      qb.andWhere(
        '(LOWER(v.clienteNome) LIKE :q OR LOWER(v.clienteEmpresa) LIKE :q OR LOWER(v.clienteTelefone) LIKE :q)',
        { q: `%${filters.search.toLowerCase()}%` },
      );
    }
    qb.orderBy('v.updatedAt', 'DESC').skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, pageSize);
  }

  async findOne(id: string): Promise<Venda> {
    const v = await this.repo.findOne({ where: { id } });
    if (!v) throw new NotFoundException(`Venda ${id} não encontrada`);
    return v;
  }

  async upsert(id: string, data: Partial<Venda>): Promise<Venda> {
    const payload: Partial<Venda> = { ...data, id };
    await this.repo.save(payload as Venda);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
