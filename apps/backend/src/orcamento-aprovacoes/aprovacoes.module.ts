import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrcamentoAprovacao } from './orcamento-aprovacao.entity';
import { AprovacoesController } from './aprovacoes.controller';
import { AprovacoesService } from './aprovacoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrcamentoAprovacao], 'app')],
  controllers: [AprovacoesController],
  providers: [AprovacoesService],
  exports: [AprovacoesService],
})
export class AprovacoesModule {}
