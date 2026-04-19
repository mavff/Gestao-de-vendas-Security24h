import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { ProspectsRepository } from './prospects.repository';

@Controller('prospects')
@UseGuards(JwtGuard)
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
