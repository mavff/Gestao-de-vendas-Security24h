import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { QuotesModule } from './quotes/quotes.module';
import { SenhaUser } from './database/senha-user.entity';
import { Prospect } from './database/prospect.entity';
import { ProspectAcaoVenda } from './database/prospect-acao-venda.entity';
import { Orcamento } from './database/orcamento.entity';
import { OrcamentoProduto } from './database/orcamento-produto.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        trustServerCertificate: true
      },
      synchronize: false
    }),
    AuthModule,
    LeadsModule,
    QuotesModule
  ]
})
export class AppModule {}
