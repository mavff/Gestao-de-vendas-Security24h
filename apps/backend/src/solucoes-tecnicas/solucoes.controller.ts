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
import type { AuthedRequest } from '../auth/authed-request';
import { ListSolucoesFilters, SolucoesService } from './solucoes.service';

@Controller('solucoes-tecnicas')
@UseGuards(JwtGuard)
export class SolucoesController {
  constructor(private readonly svc: SolucoesService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query() query: ListSolucoesFilters) {
    return this.svc.list(req, query);
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.svc.findOneScoped(req, id);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() body: Record<string, any>) {
    return this.svc.upsert(req, String(body.id), body as any);
  }

  @Put(':id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.svc.upsert(req, id, body as any);
  }

  @Delete(':id')
  async remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    await this.svc.remove(req, id);
    return { id, deleted: true };
  }
}
