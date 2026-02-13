import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { KitsModule } from './kits/kits.module';
import { LeadsModule } from './leads/leads.module';
import { LookupsModule } from './lookups/lookups.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { ProductsModule } from './products/products.module';
import { ProspectsModule } from './prospects/prospects.module';
import { QuotesModule } from './quotes/quotes.module';
import { SenhaUser } from './database/senha-user.entity';
import { Prospect } from './database/prospect.entity';
import { ProspectAcaoVenda } from './database/prospect-acao-venda.entity';
import { Orcamento } from './database/orcamento.entity';
import { OrcamentoProduto } from './database/orcamento-produto.entity';

const logger = new Logger('AppModule');

/**
 * Returns TypeOrmModule only when SQL_SERVER_HOST is configured.
 * This lets the server boot without a real database (fail-soft).
 */
function buildTypeOrmModule(): DynamicModule[] {
  if (!process.env.SQL_SERVER_HOST) {
    logger.warn('SQL_SERVER_HOST not set — TypeORM disabled (fail-soft mode)');
    return [];
  }

  return [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.SQL_SERVER_HOST,
      port: Number(process.env.SQL_SERVER_PORT || 1433),
      username: process.env.SQL_SERVER_USERNAME,
      password: process.env.SQL_SERVER_PASSWORD,
      database: process.env.SQL_SERVER_DATABASE,
      entities: [SenhaUser, Prospect, ProspectAcaoVenda, Orcamento, OrcamentoProduto],
      options: {
        encrypt: process.env.SQL_SERVER_ENCRYPT === 'true',
        trustServerCertificate: true,
      },
      synchronize: false,
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
    ...(process.env.SQL_SERVER_HOST ? [AuthModule, LeadsModule, QuotesModule] : []),
  ],
})
export class AppModule {}
