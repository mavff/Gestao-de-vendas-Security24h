import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProspectsRepository } from './prospects.repository';

@Controller('prospects')
export class ProspectsController {
  constructor(private readonly prospectsRepo: ProspectsRepository) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('vendedor') vendedor?: string,
    @Query('origem') origem?: string,
  ) {
    return this.prospectsRepo.findAll({
      page,
      pageSize,
      q: q || undefined,
      status: status || undefined,
      vendedor: vendedor ? Number(vendedor) : undefined,
      origem: origem ? Number(origem) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prospectsRepo.findById(id);
  }
}
