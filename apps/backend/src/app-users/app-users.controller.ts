import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AppUsersService } from './app-users.service';

@Controller('app-users')
@UseGuards(JwtGuard)
export class AppUsersController {
  constructor(private readonly service: AppUsersService) {}

  private assertAdmin(req: { user?: { role?: string } }) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode gerenciar usuários');
    }
  }

  @Get()
  list(@Req() req: { user?: { role?: string } }) {
    this.assertAdmin(req);
    return this.service.findAll();
  }

  @Post()
  create(
    @Req() req: { user?: { role?: string } },
    @Body() body: { username: string; password: string; name: string; role: string },
  ) {
    this.assertAdmin(req);
    return this.service.create(body);
  }

  @Put(':id')
  update(
    @Req() req: { user?: { role?: string } },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { username?: string; password?: string; name?: string; role?: string; active?: boolean },
  ) {
    this.assertAdmin(req);
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(
    @Req() req: { user?: { role?: string } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.assertAdmin(req);
    return this.service.remove(id);
  }
}
