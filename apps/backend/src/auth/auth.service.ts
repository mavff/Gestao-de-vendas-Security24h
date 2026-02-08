import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SenhaUser } from '../database/senha-user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SenhaUser) private readonly usersRepository: Repository<SenhaUser>,
    private readonly jwtService: JwtService
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { usuario: username } });
    if (!user || user.usuarioInativo || user.senhaSis !== password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const role = this.resolveRole(username);
    const payload = { sub: user.idUsuario, username: user.usuario, role, name: user.identificacao ?? user.usuario };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
      }),
      user: payload
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET
    });

    return {
      accessToken: await this.jwtService.signAsync(
        { sub: payload.sub, username: payload.username, role: payload.role, name: payload.name },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
      )
    };
  }

  private resolveRole(username: string): string {
    const admins = (process.env.ADMIN_USERS || '').split(',').map((v) => v.trim());
    if (admins.includes(username)) return 'ADMIN';
    return 'VENDEDOR';
  }
}
