import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from '../database/prospect.entity';
import { ProspectAcaoVenda } from '../database/prospect-acao-venda.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prospect, ProspectAcaoVenda])],
  controllers: [LeadsController],
  providers: [LeadsService]
})
export class LeadsModule {}
