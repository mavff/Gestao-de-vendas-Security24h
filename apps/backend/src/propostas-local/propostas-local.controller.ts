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
import { ListPropostasFilters, PropostasLocalService } from './propostas-local.service';

@Controller('propostas-local')
@UseGuards(JwtGuard)
export class PropostasLocalController {
  constructor(private readonly svc: PropostasLocalService) {}

  @Get()
  list(@Query() query: ListPropostasFilters) {
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
