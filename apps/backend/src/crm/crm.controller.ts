import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { CrmQuery, CrmService } from './crm.service';

@Controller('crm')
@UseGuards(JwtGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  getLeads(
    @Query('search')           search?: string,
    @Query('origem')           origem?: string,
    @Query('status')           status?: string,
    @Query('responsavel')      responsavel?: string,
    @Query('prioridade')       prioridade?: string,
    @Query('produtoInteresse') produtoInteresse?: string,
    @Query('cidade')           cidade?: string,
    @Query('period')           period?: string,
    @Query('start')            start?: string,
    @Query('end')              end?: string,
  ) {
    const query: CrmQuery = {
      search, origem, status, responsavel, prioridade, produtoInteresse, cidade,
      period: period as CrmQuery['period'],
      start, end,
    };
    return this.crmService.getLeads(query);
  }

  @Get('stats')
  getStats() {
    return this.crmService.getStats();
  }

  @Get('sources')
  getSources() {
    return this.crmService.getSourceList();
  }
}
