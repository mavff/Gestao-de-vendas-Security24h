import { Module } from '@nestjs/common';
import { OrcamentosController } from './orcamentos.controller';
import { OrcamentosRepository } from './orcamentos.repository';

@Module({
  controllers: [OrcamentosController],
  providers: [OrcamentosRepository],
  exports: [OrcamentosRepository],
})
export class OrcamentosModule {}
