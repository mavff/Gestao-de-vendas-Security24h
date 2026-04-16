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
import { ListVendasFilters, VendasService } from './vendas.service';

@Controller('vendas')
@UseGuards(JwtGuard)
export class VendasController {
  constructor(private readonly svc: VendasService) {}

  @Get()
  list(@Query() query: ListVendasFilters) {
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

  @Post(':id/contrato')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async anexarContrato(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: { user?: { sub?: number } },
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(`Formato ${file.mimetype} não aceito (use PDF/JPG/PNG)`);
    }
    return this.svc.anexarContrato(id, file.buffer, file.mimetype, req.user?.sub ?? null);
  }
}
