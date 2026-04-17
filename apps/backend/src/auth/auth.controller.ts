import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto';
import { JwtGuard } from './jwt.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @Post('auth/refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: { user: unknown }) {
    return req.user;
  }

  @UseGuards(JwtGuard)
  @Post('auth/change-password')
  changePassword(
    @Req() req: { user?: { sub?: number } },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changeOwnPassword(req.user?.sub ?? 0, body.currentPassword, body.newPassword);
  }

  /** Lista usuários da tabela Senhas — apenas para ADMIN. */
  @UseGuards(JwtGuard)
  @Get('users')
  listUsers() {
    return this.authService.listUsers();
  }
}
