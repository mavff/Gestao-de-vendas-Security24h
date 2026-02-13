import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { OrcamentosRepository } from './orcamentos.repository';

@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly orcamentosRepo: OrcamentosRepository) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('vendedor') vendedor?: string,
    @Query('prospect') prospect?: string,
    @Query('modalidade') modalidade?: string,
  ) {
    return this.orcamentosRepo.findAll({
      page,
      pageSize,
      q: q || undefined,
      status: status || undefined,
      vendedor: vendedor ? Number(vendedor) : undefined,
      prospect: prospect ? Number(prospect) : undefined,
      modalidade: modalidade || undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orcamentosRepo.findById(id);
  }
}
