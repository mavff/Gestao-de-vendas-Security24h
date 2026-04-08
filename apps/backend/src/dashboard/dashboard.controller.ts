import { Controller, Get, Query } from '@nestjs/common';
import { DashboardRepository, PeriodKey } from './dashboard.repository';

const VALID_PERIODS: PeriodKey[] = ['7d', '30d', '90d', 'all'];

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardRepo: DashboardRepository) {}

  @Get('financeiro')
  getFinanceiro(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.dashboardRepo.getFinanceiro(dataInicio, dataFim);
  }

  @Get('faturamento-anual')
  getFaturamentoAnual() {
    return this.dashboardRepo.getFaturamentoAnual();
  }

  @Get('retencao')
  getRetencao(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.dashboardRepo.getRetencao(dataInicio, dataFim);
  }

  @Get('stats')
  getStats(@Query('period') period?: string) {
    const p: PeriodKey = VALID_PERIODS.includes(period as PeriodKey)
      ? (period as PeriodKey)
      : 'all';
    return this.dashboardRepo.getStats(p);
  }
}
