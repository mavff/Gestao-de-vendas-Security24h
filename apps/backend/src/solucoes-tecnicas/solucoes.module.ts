import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solucao } from './solucao.entity';
import { SolucoesController } from './solucoes.controller';
import { SolucoesService } from './solucoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Solucao], 'app')],
  controllers: [SolucoesController],
  providers: [SolucoesService],
  exports: [SolucoesService],
})
export class SolucoesModule {}
