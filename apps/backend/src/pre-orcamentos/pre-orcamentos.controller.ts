import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { PreOrcamentosRepository } from './pre-orcamentos.repository';

@Controller('pre-orcamentos')
@UseGuards(JwtGuard)
export class PreOrcamentosController {
  constructor(private readonly repo: PreOrcamentosRepository) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.repo.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException('Pré-orçamento não encontrado');
    return item;
  }
}
