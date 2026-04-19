import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { KitsRepository } from './kits.repository';

@Controller('kits')
@UseGuards(JwtGuard)
export class KitsController {
  constructor(private readonly kitsRepo: KitsRepository) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('codMarca') codMarca?: string,
  ) {
    return this.kitsRepo.findAll({
      page,
      pageSize,
      q: q || undefined,
      codMarca: codMarca ? Number(codMarca) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kitsRepo.findById(id);
  }
}
