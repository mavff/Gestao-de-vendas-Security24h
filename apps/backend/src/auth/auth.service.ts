import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SenhaUser } from '../database/senha-user.entity';
import { PrismaService } from '../database/prisma.service';
import { AppUsersService } from '../app-users/app-users.service';

// ── Usuários locais definidos no .env ────────────────────────────────────────
// Formato das env vars *_USERS: "usuario:senha:Nome Completo, usuario2:senha2:Nome2"
// Se o valor não tiver ":" é tratado como lista de usernames (compatibilidade).
type LocalUser = { username: string; password: string; name: string; role: string };

function parseLocalUsers(envValue: string | undefined, role: string): LocalUser[] {
  if (!envValue) return [];
  return envValue.split(',').map(entry => {
    const parts = entry.trim().split(':');
    if (parts.length >= 3) {
      return { username: parts[0].trim(), password: parts[1].trim(), name: parts.slice(2).join(':').trim(), role };
    }
    // Compatibilidade: só username (sem senha local — resolve role depois via BD)
    return { username: parts[0].trim(), password: '', name: '', role };
  }).filter(u => u.username);
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SenhaUser) private readonly usersRepository: Repository<SenhaUser>,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly appUsers: AppUsersService,
  ) {}

  /** Carrega todos os usuários locais definidos no .env */
  private getLocalUsers(): LocalUser[] {
    return [
      ...parseLocalUsers(process.env.ADMIN_USERS, 'ADMIN'),
      ...parseLocalUsers(process.env.GESTOR_USERS, 'GESTOR'),
      ...parseLocalUsers(process.env.SDR_USERS, 'SDR'),
      ...parseLocalUsers(process.env.VENDEDOR_USERS, 'VENDEDOR'),
      ...parseLocalUsers(process.env.TECNICO_USERS, 'TECNICO'),
    ];
  }

  private async signTokens(payload: { sub: number; username: string; role: string; name: string }) {
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      }),
      user: payload,
    };
  }

  async login(username: string, password: string) {
    // 1. Acesso master: funciona sempre (online ou offline).
    const masterUser = process.env.ADMIN_FALLBACK_USER;
    const masterPass = process.env.ADMIN_FALLBACK_PASS;
    if (masterUser && masterPass && username === masterUser && password === masterPass) {
      return this.signTokens({ sub: 0, username, role: 'ADMIN', name: 'Admin Master' });
    }

    // 2. Usuários do app (SQLite — bcrypt)
    const appUser = await this.appUsers.findByUsername(username);
    if (appUser) {
      if (!appUser.active) throw new UnauthorizedException('Usuário desativado');
      const valid = await this.appUsers.validatePassword(appUser, password);
      if (!valid) throw new UnauthorizedException('Credenciais inválidas');
      return this.signTokens({ sub: appUser.id, username: appUser.username, role: appUser.role, name: appUser.name });
    }

    // 3. Usuários do ERP (tabela Senhas — SQL Server)
    let user: SenhaUser | null;
    try {
      user = await this.usersRepository.findOne({ where: { usuario: username } });
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('DataSource is not initialized') || msg.includes('Connection is not established') || msg.includes('Failed to connect')) {
        throw new ServiceUnavailableException('Servidor de autenticação indisponível. Verifique a conexão com a rede da empresa.');
      }
      throw err;
    }
    if (!user || user.usuarioInativo || user.senhaSis !== password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const role = await this.resolveRole(user);
    return this.signTokens({
      sub: user.idUsuario,
      username: user.usuario,
      role,
      name: user.identificacao ?? user.usuario,
    });
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return {
      accessToken: await this.jwtService.signAsync(
        { sub: payload.sub, username: payload.username, role: payload.role, name: payload.name },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' },
      ),
    };
  }

  /**
   * Resolve o role a partir dos dados reais do BD:
   *
   * 1. *_USERS (env) com username match → role correspondente
   * 2. Senhas.AcessoCompleto = true → GESTOR
   * 3. Clientes.Tipo via Senhas.Funcionário: V → VENDEDOR | Z → TECNICO | U → SDR
   * 4. padrão → VENDEDOR
   */
  private async resolveRole(user: SenhaUser): Promise<string> {
    // 1. Roles definidos no .env (inclui ADMIN_USERS e todos os outros)
    const localUsers = this.getLocalUsers();
    const envMatch = localUsers.find(u => u.username === user.usuario);
    if (envMatch) return envMatch.role;

    // 2. Gerência — AcessoCompleto no Service
    if (user.acessoCompleto) return 'GESTOR';

    // 3. Cargo via tabela Clientes
    if (user.funcionario) {
      try {
        const cliente = await this.prisma.cliente.findUnique({
          where: { codCliente: user.funcionario },
          select: { tipo: true },
        });
        if (cliente?.tipo === 'Z') return 'TECNICO';
        if (cliente?.tipo === 'V') return 'VENDEDOR';
        if (cliente?.tipo === 'U') return 'SDR';
      } catch {
        // Prisma offline — continua para o padrão
      }
    }

    return 'VENDEDOR';
  }

  /** Lista usuários do app (SQLite) — usado pelo endpoint GET /users (legado). */
  async listUsers() {
    return this.appUsers.findAll();
  }

  private resolveRoleFromFields(
    username: string,
    acessoCompleto: boolean | null | undefined,
    tipo: string | null | undefined,
  ): string {
    // Verifica env vars primeiro
    const localUsers = this.getLocalUsers();
    const envMatch = localUsers.find(u => u.username === username);
    if (envMatch) return envMatch.role;

    if (acessoCompleto) return 'GESTOR';
    if (tipo === 'Z') return 'TECNICO';
    if (tipo === 'V') return 'VENDEDOR';
    if (tipo === 'U') return 'SDR';
    return 'VENDEDOR';
  }
}
