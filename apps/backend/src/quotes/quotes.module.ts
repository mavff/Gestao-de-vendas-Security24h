import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orcamento } from '../database/orcamento.entity';
import { OrcamentoProduto } from '../database/orcamento-produto.entity';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Orcamento, OrcamentoProduto])],
  controllers: [QuotesController],
  providers: [QuotesService]
})
export class QuotesModule {}
