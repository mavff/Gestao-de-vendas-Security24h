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

  async list(req: AuthedRequest, filters: ListVendasFilters): Promise<PaginatedResponse<Venda>> {
    const { skip, take, page, pageSize } = parsePagination(filters);
    const ownerFilter = resolveOwnerListFilter(req, filters.criadoPor);
    const qb = this.repo.createQueryBuilder('v');
    if (filters.status) qb.andWhere('v.status = :status', { status: filters.status });
    if (ownerFilter) qb.andWhere('v.criadoPor = :u', { u: ownerFilter });
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

  /** Busca interna sem checagem de ownership (uso do próprio service). */
  private async findOneRaw(id: string): Promise<Venda> {
    const v = await this.repo.findOne({ where: { id } });
    if (!v) throw new NotFoundException(`Venda ${id} não encontrada`);
    return v;
  }

  /** GET /:id — bloqueia se usuário não pode acessar esse registro. */
  async findOneScoped(req: AuthedRequest, id: string): Promise<Venda> {
    const v = await this.findOneRaw(id);
    if (!isAdminRole(req.user?.role)) {
      assertCanMutate(req, v.criadoPor);
    }
    return v;
  }

  async upsert(req: AuthedRequest, id: string, data: Partial<Venda>): Promise<Venda> {
    // Se registro existe, valida ownership antes de permitir update
    const existing = await this.repo.findOne({ where: { id } });
    if (existing) {
      assertCanMutate(req, existing.criadoPor);
    }
    const stamped = stampOwnerOnCreate(req, data);
    const payload: Partial<Venda> = { ...stamped, id };
    await this.repo.save(payload as Venda);
    return this.findOneRaw(id);
  }

  async remove(req: AuthedRequest, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return;
    assertCanMutate(req, existing.criadoPor);
    await this.repo.delete(id);
  }

  async anexarContrato(
    req: AuthedRequest,
    id: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<Venda> {
    const venda = await this.findOneScoped(req, id);
    const saved = await this.photos.upload(buffer, {
      entityType: 'contrato',
      entityId: id,
      mimeType,
      createdBy: req.user?.sub ?? null,
    });
    venda.contratoUrl = `photo:${saved.id}`;
    venda.contratoAssinadoEm = new Date().toISOString();
    venda.updatedAt = new Date().toISOString();
    await this.repo.save(venda);
    return venda;
  }
}
