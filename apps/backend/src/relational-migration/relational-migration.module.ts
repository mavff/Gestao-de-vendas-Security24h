import { Module } from '@nestjs/common';
import { AppUsersModule } from '../app-users/app-users.module';
import { VendasModule } from '../vendas/vendas.module';
import { SolucoesModule } from '../solucoes-tecnicas/solucoes.module';
import { VistoriasModule } from '../vistorias/vistorias.module';
import { OrdensModule } from '../ordens-servico/ordens.module';
import { PropostasLocalModule } from '../propostas-local/propostas-local.module';
import { OrcamentosLocalModule } from '../orcamentos-local/orcamentos-local.module';
import { RelationalMigrationService } from './relational-migration.service';

@Module({
  imports: [
    AppUsersModule,
    VendasModule,
    SolucoesModule,
    VistoriasModule,
    OrdensModule,
    PropostasLocalModule,
    OrcamentosLocalModule,
  ],
  providers: [RelationalMigrationService],
})
export class RelationalMigrationModule {}
