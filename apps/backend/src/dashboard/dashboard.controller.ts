import { Controller, Get, Query } from '@nestjs/common';
import { DashboardRepository, PeriodKey } from './dashboard.repository';

const VALID_PERIODS: PeriodKey[] = ['7d', '30d', '90d', 'all'];

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardRepo: DashboardRepository) {}

  @Get('stats')
  getStats(@Query('period') period?: string) {
    const p: PeriodKey = VALID_PERIODS.includes(period as PeriodKey)
      ? (period as PeriodKey)
      : 'all';
    return this.dashboardRepo.getStats(p);
  }
}
