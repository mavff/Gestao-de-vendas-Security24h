import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropostaLocal } from './proposta-local.entity';
import { PropostasLocalController } from './propostas-local.controller';
import { PropostasLocalService } from './propostas-local.service';

@Module({
  imports: [TypeOrmModule.forFeature([PropostaLocal], 'app')],
  controllers: [PropostasLocalController],
  providers: [PropostasLocalService],
  exports: [PropostasLocalService],
})
export class PropostasLocalModule {}
