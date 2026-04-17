import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

// Bloqueia traversal (..), separadores de path e null bytes no nome da pasta.
// entityType/entityId viram segmentos de diretório em disco, então têm que ser
// identificadores simples. IDs reais são UUIDs, 'ENT<timestamp>', 'VND<timestamp>' etc.
function assertSafeSegment(value: string, field: string): void {
  if (!value || typeof value !== 'string') {
    throw new BadRequestException(`${field} inválido`);
  }
  if (value.length > 100) {
    throw new BadRequestException(`${field} muito longo`);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new BadRequestException(`${field} contém caracteres inválidos`);
  }
}

function extForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'application/pdf') return 'pdf';
  return 'jpg';
}

export interface PhotoUploadMeta {
  entityType: string;
  entityId: string;
  pontoId?: string | null;
  mimeType?: string;
  createdBy?: number | null;
}

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);
  private readonly baseDir: string;

  constructor(
    @InjectRepository(Photo, 'app')
    private readonly repo: Repository<Photo>,
  ) {
    this.baseDir =
      process.env.PHOTOS_DIR ||
      path.resolve(__dirname, '..', '..', 'data', 'photos');
  }

  async upload(buffer: Buffer, meta: PhotoUploadMeta): Promise<Photo> {
    assertSafeSegment(meta.entityType, 'entityType');
    assertSafeSegment(meta.entityId, 'entityId');

    const id = randomUUID();
    const mimeType = meta.mimeType || 'image/jpeg';
    const ext = extForMime(mimeType);

    const dir = path.join(this.baseDir, meta.entityType, meta.entityId);
    let filePath: string;
    try {
      await fs.mkdir(dir, { recursive: true });
      filePath = path.join(dir, `${id}.${ext}`);
      await fs.writeFile(filePath, buffer);
    } catch (err) {
      this.logger.error(`Falha ao salvar foto em ${dir}: ${(err as Error).message}`);
      throw new InternalServerErrorException('Não foi possível salvar a foto no servidor');
    }

    const photo = this.repo.create({
      id,
      entityType: meta.entityType,
      entityId: meta.entityId,
      pontoId: meta.pontoId ?? null,
      filePath,
      mimeType,
      createdBy: meta.createdBy ?? null,
    });
    return this.repo.save(photo);
  }

  async findById(id: string): Promise<Photo> {
    const photo = await this.repo.findOne({ where: { id } });
    if (!photo) throw new NotFoundException(`Photo ${id} not found`);
    return photo;
  }

  async findByEntity(entityType: string, entityId: string): Promise<Photo[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'ASC' },
    });
  }

  async delete(id: string): Promise<void> {
    const photo = await this.findById(id);
    try {
      await fs.unlink(photo.filePath);
    } catch (err) {
      this.logger.warn(
        `Falha ao remover arquivo ${photo.filePath}: ${(err as Error).message}`,
      );
    }
    await this.repo.delete(id);
  }
}
