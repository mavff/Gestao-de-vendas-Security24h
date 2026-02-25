import { Module } from '@nestjs/common';
import { PreOrcamentosController } from './pre-orcamentos.controller';
import { PreOrcamentosRepository } from './pre-orcamentos.repository';

@Module({
  controllers: [PreOrcamentosController],
  providers: [PreOrcamentosRepository],
  exports: [PreOrcamentosRepository],
})
export class PreOrcamentosModule {}
