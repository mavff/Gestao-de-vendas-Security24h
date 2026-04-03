import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { ComissoesController } from './comissoes.controller';
import { ComissoesRepository } from './comissoes.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ComissoesController],
  providers: [ComissoesRepository],
})
export class ComissoesModule {}
