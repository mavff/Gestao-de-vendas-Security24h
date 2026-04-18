import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthedRequest } from '../auth/authed-request';
import { ListOrdensFilters, OrdensService } from './ordens.service';

@Controller('ordens-servico')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN', 'GESTOR', 'TECNICO', 'VENDEDOR')
export class OrdensController {
  constructor(private readonly svc: OrdensService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query() query: ListOrdensFilters) {
    return this.svc.list(req, query);
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
