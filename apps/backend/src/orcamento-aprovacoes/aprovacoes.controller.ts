import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { AprovacoesService, CreateAprovacaoInput } from './aprovacoes.service';

type AuthedRequest = Request & { user?: { username?: string } };

function getClientIp(req: Request): string {
  const fwd = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? '';
}

@Controller('orcamento-aprovacoes')
@UseGuards(JwtGuard)
export class AprovacoesController {
  constructor(private readonly svc: AprovacoesService) {}

  @Post()
  create(@Body() body: CreateAprovacaoInput, @Req() req: AuthedRequest) {
    return this.svc.create(body, {
      ip: getClientIp(req),
      userAgent: String(req.headers['user-agent'] ?? '').slice(0, 500),
      criadoPor: req.user?.username ?? '',
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get()
  list(@Query('vendaId') vendaId?: string) {
    if (!vendaId) return [];
    return this.svc.listByVenda(vendaId);
  }
}
