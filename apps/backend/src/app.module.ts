import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { KitsModule } from './kits/kits.module';
import { LookupsModule } from './lookups/lookups.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { PreOrcamentosModule } from './pre-orcamentos/pre-orcamentos.module';
import { ProductsModule } from './products/products.module';
import { ProspectsModule } from './prospects/prospects.module';
import { SenhaUser } from './database/senha-user.entity';

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
          await ds.initialize();
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...buildTypeOrmModule(),
    PrismaModule,
    HealthModule,
    ProductsModule,
    KitsModule,
    LookupsModule,
    ProspectsModule,
    OrcamentosModule,
    PreOrcamentosModule,
    DashboardModule,
    ...(process.env.SQL_SERVER_HOST ? [AuthModule] : []),
  ],
})
export class AppModule {}
