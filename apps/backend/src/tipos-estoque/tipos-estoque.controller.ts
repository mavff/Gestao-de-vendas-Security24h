import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { TiposEstoqueRepository } from './tipos-estoque.repository';

@Controller('tipos-estoque')
@UseGuards(JwtGuard)
export class TiposEstoqueController {
  constructor(private readonly repo: TiposEstoqueRepository) {}

  @Get()
  list(@Query('incluirInativos') incluirInativos?: string) {
    return this.repo.findAll(incluirInativos === 'true');
  }
}
