import { Controller, Get, Query } from '@nestjs/common';
import { SdrQuery, SheetsService } from './sheets.service';

@Controller('sheets')
export class SheetsController {
  constructor(private readonly sheetsService: SheetsService) {}

  @Get('leads')
  getLeads() {
    return this.sheetsService.getLeadStats();
  }

  @Get('sdr-log')
  getSdrLog(
    @Query('tab')    tab?:    string,
    @Query('period') period?: string,
    @Query('start')  start?:  string,
    @Query('end')    end?:    string,
  ) {
    const query: SdrQuery = {
      tab: (tab as SdrQuery['tab']) || 'whatsapp',
      period: period as SdrQuery['period'],
      start,
      end,
    };
    return this.sheetsService.getSdrTab(query);
  }

  @Get('health')
  checkHealth() {
    return this.sheetsService.checkHealth();
  }
}
