import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { LookupsRepository } from './lookups.repository';

@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookupsRepo: LookupsRepository) {}

  @Get('pipeline-stages')
  pipelineStages(
    @Query('usuario') usuario?: string,
    @Query('unidade') unidade?: string,
  ) {
    return this.lookupsRepo.findPipelineStages(
      usuario || undefined,
      unidade ? Number(unidade) : undefined,
    );
  }

  @Get('entities/:codEntidade')
  entityValues(@Param('codEntidade', ParseIntPipe) codEntidade: number) {
    return this.lookupsRepo.findByEntity(codEntidade);
  }
}
