import * as path from 'path';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { AppUsersModule } from './app-users/app-users.module';
import { AppUser } from './app-users/app-user.entity';
import { AppKv } from './app-users/app-kv.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { SheetsModule } from './sheets/sheets.module';
import { ComissoesModule } from './comissoes/comissoes.module';
import { CrmModule } from './crm/crm.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { KitsModule } from './kits/kits.module';
import { LookupsModule } from './lookups/lookups.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { PreOrcamentosModule } from './pre-orcamentos/pre-orcamentos.module';
import { ProductsModule } from './products/products.module';
import { ProspectsModule } from './prospects/prospects.module';
import { SenhaUser } from './database/senha-user.entity';
import { PhotosModule } from './photos/photos.module';
import { Photo } from './photos/photo.entity';
import { VendasModule } from './vendas/vendas.module';
import { Venda } from './vendas/venda.entity';
import { SolucoesModule } from './solucoes-tecnicas/solucoes.module';
import { Solucao } from './solucoes-tecnicas/solucao.entity';
import { VistoriasModule } from './vistorias/vistorias.module';
import { Vistoria } from './vistorias/vistoria.entity';
import { OrdensModule } from './ordens-servico/ordens.module';
import { OrdemServico } from './ordens-servico/ordem.entity';
import { PropostasLocalModule } from './propostas-local/propostas-local.module';
import { PropostaLocal } from './propostas-local/proposta-local.entity';
import { OrcamentosLocalModule } from './orcamentos-local/orcamentos-local.module';
import { OrcamentoLocal } from './orcamentos-local/orcamento-local.entity';
import { RelationalMigrationModule } from './relational-migration/relational-migration.module';

const logger = new Logger('AppModule');

/**
 * Returns TypeOrmModule only when SQL_SERVER_HOST is configured.
 * Uses dataSourceFactory to catch connection errors gracefully — the backend
 * stays up even when the SQL Server is unreachable (e.g. outside company network).
 * Auth endpoints will return 503 in that case.
 */
function buildTypeOrmModule(): DynamicModule[] {
  if (!process.env.SQL_SERVER_HOST) {
    logger.warn('SQL_SERVER_HOST not set — TypeORM disabled (fail-soft mode)');
    return [];
  }

  return [
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => ({
        type: 'mssql',
        host: process.env.SQL_SERVER_HOST,
        port: Number(process.env.SQL_SERVER_PORT || 1433),
        username: process.env.SQL_SERVER_USERNAME,
        password: process.env.SQL_SERVER_PASSWORD,
        database: process.env.SQL_SERVER_DATABASE,
        entities: [SenhaUser],
        synchronize: false,
        retryAttempts: 0,         // não retenta — falha rápida sem crashar
        options: {
          encrypt: process.env.SQL_SERVER_ENCRYPT === 'true',
          trustServerCertificate: true,
          connectTimeout: 5000,   // desiste em 5 s na primeira tentativa
        },
      }),

      /**
       * dataSourceFactory intercepts the initialization error so the backend
       * stays up even when SQL Server is unreachable.
       *
       * NestJS TypeORM checks `dataSource.isInitialized` after the factory returns
       * and re-tries `initialize()` if false. To prevent this retry loop we
       * override the getter to return `true` when the connection failed — the
       * driver stays disconnected so queries will still throw, which AuthService
       * catches and converts to 503 ServiceUnavailable.
       */
      dataSourceFactory: async (options) => {
        const ds = new DataSource(options!);
        try {
          await Promise.race([
            ds.initialize(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('TypeORM connection timeout after 8s')), 8000),
            ),
          ]);
          logger.log('TypeORM ✓ conectado ao SQL Server');
        } catch (err) {
          logger.warn(
            `TypeORM ✗ SQL Server inacessível — Auth retornará 503. ${(err as Error).message}`,
          );
          // Faz o NestJS TypeORM pensar que o DataSource está pronto
          // para não entrar no loop de retry. Queries falharão em runtime
          // com erro capturado pelo AuthService.
          Object.defineProperty(ds, 'isInitialized', { get: () => true, configurable: true });
        }
        return ds;
      },
    }),
  ];
}

/**
 * App DB connection (name: 'app') — stores data owned by this application
 * (users, settings, vendas, vistorias, fotos, logs, pipeline).
 *
 * Dual-mode:
 * - If APP_DATABASE_URL is set → Postgres (dev via docker-compose, prod via EasyPanel).
 * - Otherwise → SQLite fallback at apps/backend/data/app.sqlite (legado / dev offline).
 *
 * synchronize=true in non-production so new entities are created automatically.
 * In production use TypeORM migrations (dist/migrations/*.js).
 */
function buildAppDbModule(): DynamicModule[] {
  const isProd = process.env.NODE_ENV === 'production';
  const pgUrl = process.env.APP_DATABASE_URL;

  if (pgUrl) {
    logger.log('App DB: Postgres (APP_DATABASE_URL set)');
    return [
      TypeOrmModule.forRoot({
        name: 'app',
        type: 'postgres',
        url: pgUrl,
        entities: [AppUser, AppKv, Photo, Venda, Solucao, Vistoria, OrdemServico, PropostaLocal, OrcamentoLocal],
        synchronize: !isProd,
        migrations: ['dist/migrations/*.js'],
      }),
    ];
  }

  const dbPath = path.resolve(__dirname, '..', 'data', 'app.sqlite');
  logger.warn(`App DB: SQLite fallback at ${dbPath} (set APP_DATABASE_URL for Postgres)`);
  return [
    TypeOrmModule.forRoot({
      name: 'app',
      type: 'better-sqlite3',
      database: dbPath,
      entities: [AppUser, AppKv, Photo, Venda, Solucao, Vistoria, OrdemServico, PropostaLocal, OrcamentoLocal],
      synchronize: true,
    }),
  ];
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', path.resolve(__dirname, '..', '.env')] }),
    ...buildTypeOrmModule(),
    ...buildAppDbModule(),
    PrismaModule,
    HealthModule,
    AppUsersModule,
    PhotosModule,
    VendasModule,
    SolucoesModule,
    VistoriasModule,
    OrdensModule,
    PropostasLocalModule,
    OrcamentosLocalModule,
    RelationalMigrationModule,
    ProductsModule,
    KitsModule,
    LookupsModule,
    ProspectsModule,
    OrcamentosModule,
    PreOrcamentosModule,
    DashboardModule,
    SheetsModule,
    ComissoesModule,
    CrmModule,
    ...(process.env.SQL_SERVER_HOST ? [AuthModule] : []),
  ],
})
export class AppModule {}
