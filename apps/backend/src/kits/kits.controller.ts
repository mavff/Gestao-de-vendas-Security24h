import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { KitsRepository } from './kits.repository';

@Controller('kits')
export class KitsController {
  constructor(private readonly kitsRepo: KitsRepository) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('codMarca') codMarca?: string,
  ) {
    return this.kitsRepo.findAll(
      {
        q: q || undefined,
        codMarca: codMarca ? Number(codMarca) : undefined,
      },
      Number(page),
      Number(pageSize),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kitsRepo.findById(id);
  }
}
