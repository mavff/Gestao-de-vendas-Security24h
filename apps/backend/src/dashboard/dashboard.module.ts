import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardRepository],
})
export class DashboardModule {}
