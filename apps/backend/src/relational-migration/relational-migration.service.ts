import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppKvService } from '../app-users/app-kv.service';
import { VendasService } from '../vendas/vendas.service';
import { SolucoesService } from '../solucoes-tecnicas/solucoes.service';
import { VistoriasService } from '../vistorias/vistorias.service';
import { OrdensService } from '../ordens-servico/ordens.service';
import { PropostasLocalService } from '../propostas-local/propostas-local.service';
import { OrcamentosLocalService } from '../orcamentos-local/orcamentos-local.service';

const MIGRATION_KEY = 'migration:relational_v1';

type Upserter = (id: string, data: Record<string, unknown>) => Promise<unknown>;

interface Job {
  kvKey: string;
  label: string;
  upsert: Upserter;
  transform?: (item: Record<string, unknown>) => Record<string, unknown>;
}

@Injectable()
export class RelationalMigrationService implements OnModuleInit {
  private readonly logger = new Logger(RelationalMigrationService.name);

  constructor(
    private readonly kv: AppKvService,
    private readonly vendas: VendasService,
    private readonly solucoes: SolucoesService,
    private readonly vistorias: VistoriasService,
    private readonly ordens: OrdensService,
    private readonly propostas: PropostasLocalService,
    private readonly orcamentos: OrcamentosLocalService,
  ) {}

  async onModuleInit() {
    try {
      const flag = await this.kv.get(MIGRATION_KEY);
      if (flag && typeof flag === 'object' && (flag as { done?: boolean }).done) {
        return;
      }

      const jobs: Job[] = [
        {
          kvKey: 'vendedor_vendas',
          label: 'vendas',
          upsert: (id, d) => this.vendas.upsert(id, d as never),
        },
        {
          kvKey: 'solucoes',
          label: 'soluções',
          upsert: (id, d) => this.solucoes.upsert(id, d as never),
        },
        {
          kvKey: 'vistorias',
          label: 'vistorias (1ª visita)',
          upsert: (id, d) => this.vistorias.upsert(id, d as never),
          transform: (item) => ({ ...item, tipoVistoria: 'vistoria' }),
        },
        {
          kvKey: 'entregas',
          label: 'vistorias (2ª visita / entrega)',
          upsert: (id, d) => this.vistorias.upsert(id, d as never),
          transform: (item) => ({ ...item, tipoVistoria: 'entrega' }),
        },
        {
          kvKey: 'ordens_servico',
          label: 'ordens de serviço',
          upsert: (id, d) => this.ordens.upsert(id, d as never),
        },
        {
          kvKey: 'propostas',
          label: 'propostas',
          upsert: (id, d) => this.propostas.upsert(id, d as never),
        },
        {
          kvKey: 'orcamentos_local',
          label: 'orçamentos local',
          upsert: (id, d) => this.orcamentos.upsert(id, d as never),
        },
      ];

      const report: Record<string, { migrated: number; skipped: number }> = {};
      for (const job of jobs) {
        report[job.label] = await this.runJob(job);
      }

      await this.kv.set(MIGRATION_KEY, { done: true, at: new Date().toISOString(), report });
      this.logger.log(`Migração KV → relacional concluída: ${JSON.stringify(report)}`);
    } catch (err) {
      this.logger.error(
        `Falha na migração KV → relacional: ${(err as Error).message}. Será retentada no próximo boot.`,
      );
    }
  }

  private async runJob(job: Job): Promise<{ migrated: number; skipped: number }> {
    const raw = await this.kv.get(job.kvKey);
    if (!Array.isArray(raw)) return { migrated: 0, skipped: 0 };

    let migrated = 0;
    let skipped = 0;
    for (const item of raw as Array<Record<string, unknown>>) {
      const id = typeof item?.id === 'string' ? item.id : null;
      if (!id) {
        skipped++;
        continue;
      }
      try {
        const payload = job.transform ? job.transform(item) : item;
        await job.upsert(id, payload);
        migrated++;
      } catch (err) {
        skipped++;
        this.logger.warn(
          `[${job.kvKey}] falha ao migrar ${id}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`[${job.kvKey}] ${job.label}: ${migrated} migrados · ${skipped} pulados`);
    return { migrated, skipped };
  }
}
