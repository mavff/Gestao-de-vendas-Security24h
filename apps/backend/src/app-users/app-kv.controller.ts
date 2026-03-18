import { Body, Controller, Delete, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AppKvService } from './app-kv.service';

@Controller('app-state')
@UseGuards(JwtGuard)
export class AppKvController {
  constructor(private readonly kv: AppKvService) {}

  @Get(':key')
  async get(@Param('key') key: string) {
    const value = await this.kv.get(key);
    return { key, value };
  }

  @Put(':key')
  async set(
    @Param('key') key: string,
    @Body() body: { value: unknown },
    @Req() req: { user?: { sub?: number } },
  ) {
    await this.kv.set(key, body.value, req.user?.sub);
    return { key, saved: true };
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    await this.kv.remove(key);
    return { key, deleted: true };
  }
}
