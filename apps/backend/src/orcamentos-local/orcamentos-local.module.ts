import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrcamentoLocal } from './orcamento-local.entity';
import { OrcamentosLocalController } from './orcamentos-local.controller';
import { OrcamentosLocalService } from './orcamentos-local.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrcamentoLocal], 'app')],
  controllers: [OrcamentosLocalController],
  providers: [OrcamentosLocalService],
  exports: [OrcamentosLocalService],
})
export class OrcamentosLocalModule {}
