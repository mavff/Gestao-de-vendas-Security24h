import { Module } from '@nestjs/common';
import { TiposEstoqueController } from './tipos-estoque.controller';
import { TiposEstoqueRepository } from './tipos-estoque.repository';

@Module({
  controllers: [TiposEstoqueController],
  providers: [TiposEstoqueRepository],
  exports: [TiposEstoqueRepository],
})
export class TiposEstoqueModule {}
