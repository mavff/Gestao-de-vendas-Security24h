import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { PhotosService } from './photos.service';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Post('upload')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: { user?: { sub?: number }; body: Record<string, string> },
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const { entityType, entityId, pontoId } = req.body;
    if (!entityType || !entityId) {
      throw new BadRequestException('entityType e entityId são obrigatórios');
    }
    const saved = await this.photos.upload(file.buffer, {
      entityType,
      entityId,
      pontoId: pontoId || null,
      mimeType: file.mimetype,
      createdBy: req.user?.sub ?? null,
    });
    return { id: saved.id, mimeType: saved.mimeType, createdAt: saved.createdAt };
  }

  @Get()
  @UseGuards(JwtGuard)
  async listByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    if (!entityType || !entityId) {
      throw new BadRequestException('entityType e entityId são obrigatórios');
    }
    const list = await this.photos.findByEntity(entityType, entityId);
    return list.map((p) => ({
      id: p.id,
      pontoId: p.pontoId,
      mimeType: p.mimeType,
      createdAt: p.createdAt,
    }));
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async stream(@Param('id') id: string, @Res() res: Response) {
    const photo = await this.photos.findById(id);
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.sendFile(photo.filePath);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@Param('id') id: string) {
    await this.photos.delete(id);
    return { id, deleted: true };
  }
}
