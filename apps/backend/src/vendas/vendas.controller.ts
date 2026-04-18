import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard';
import type { AuthedRequest } from '../auth/authed-request';
import { ListVendasFilters, VendasService } from './vendas.service';

@Controller('vendas')
@UseGuards(JwtGuard)
export class VendasController {
  constructor(private readonly svc: VendasService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query() query: ListVendasFilters) {
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

  @Post(':id/contrato')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async anexarContrato(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(`Formato ${file.mimetype} não aceito (use PDF/JPG/PNG)`);
    }
    return this.svc.anexarContrato(req, id, file.buffer, file.mimetype);
  }
}
