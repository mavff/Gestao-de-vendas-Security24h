import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ListOrcamentosFilters, OrcamentosLocalService } from './orcamentos-local.service';

@Controller('orcamentos-local')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN', 'GESTOR')
export class OrcamentosLocalController {
  constructor(private readonly svc: OrcamentosLocalService) {}

  @Get()
  list(@Query() query: ListOrcamentosFilters) {
    return this.svc.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() body: Record<string, any>) {
    return this.svc.upsert(String(body.id), body as any);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.svc.upsert(id, body as any);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
    return { id, deleted: true };
  }
}
