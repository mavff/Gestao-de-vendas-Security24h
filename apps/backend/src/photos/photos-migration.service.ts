import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppKvService } from '../app-users/app-kv.service';
import { PhotosService } from './photos.service';

const MIGRATION_KEY = 'migration:photos_v1';

type Ponto = { id: string; photos: string[] };
type Ambiente = { id: string; pontos: Ponto[] };
type Vistoria = { id: string; ambientes: Ambiente[] };

@Injectable()
export class PhotosMigrationService implements OnModuleInit {
  private readonly logger = new Logger(PhotosMigrationService.name);

  constructor(
    private readonly kv: AppKvService,
    private readonly photos: PhotosService,
  ) {}

  async onModuleInit() {
    try {
      const flag = await this.kv.get(MIGRATION_KEY);
      if (flag && typeof flag === 'object' && (flag as { done?: boolean }).done) {
        return;
      }
      await this.migrateKey('vistorias', 'vistoria');
      await this.migrateKey('entregas', 'entrega');
      await this.kv.set(MIGRATION_KEY, { done: true, at: new Date().toISOString() });
      this.logger.log('Migração de fotos base64 → arquivos concluída');
    } catch (err) {
      this.logger.error(
        `Falha na migração de fotos: ${(err as Error).message}. Será retentada no próximo boot.`,
      );
    }
  }

  private async migrateKey(kvKey: string, entityType: string) {
    const data = await this.kv.get(kvKey);
    if (!Array.isArray(data)) return;

    const vistorias = data as Vistoria[];
    let converted = 0;
    let skipped = 0;

    for (const v of vistorias) {
      if (!v || !Array.isArray(v.ambientes)) continue;
      for (const amb of v.ambientes) {
        if (!amb || !Array.isArray(amb.pontos)) continue;
        for (const p of amb.pontos) {
          if (!p || !Array.isArray(p.photos)) continue;
          for (let i = 0; i < p.photos.length; i++) {
            const current = p.photos[i];
            if (typeof current !== 'string' || !current.startsWith('data:')) {
              skipped++;
              continue;
            }
            try {
              const buffer = this.dataUrlToBuffer(current);
              const mime = this.mimeFromDataUrl(current);
              const saved = await this.photos.upload(buffer, {
                entityType,
                entityId: v.id,
                pontoId: p.id,
                mimeType: mime,
              });
              p.photos[i] = `photo:${saved.id}`;
              converted++;
            } catch (err) {
              this.logger.warn(
                `Falha convertendo foto ${entityType}/${v.id}/${p.id}[${i}]: ${(err as Error).message}`,
              );
            }
          }
        }
      }
    }

    if (converted > 0) {
      await this.kv.set(kvKey, vistorias);
    }
    this.logger.log(
      `[${kvKey}] convertidas: ${converted} · mantidas (não-base64): ${skipped}`,
    );
  }

  private dataUrlToBuffer(dataUrl: string): Buffer {
    const b64 = dataUrl.split(',')[1] ?? '';
    return Buffer.from(b64, 'base64');
  }

  private mimeFromDataUrl(dataUrl: string): string {
    const m = dataUrl.match(/^data:([^;]+);/);
    return m?.[1] || 'image/jpeg';
  }
}
