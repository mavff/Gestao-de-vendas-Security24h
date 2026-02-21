import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SenhaUser } from '../database/senha-user.entity';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SenhaUser) private readonly usersRepository: Repository<SenhaUser>,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
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
    const payload = {
      sub: user.idUsuario,
      username: user.usuario,
      role,
      name: user.identificacao ?? user.usuario,
    };

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
   * 1. ADMIN_USERS (env) → ADMIN  (conta de plataforma, lista pequena)
   * 2. Senhas.AcessoCompleto = true → GESTOR  (gerência no Service)
   * 3. Clientes.Tipo via Senhas.Funcionário:
   *    V → VENDEDOR | Z → TECNICO | U → SDR
   * 4. padrão → VENDEDOR
   */
  private async resolveRole(user: SenhaUser): Promise<string> {
    // 1. Admin de plataforma (env var, manter mínimo)
    const adminUsers = (process.env.ADMIN_USERS || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (adminUsers.includes(user.usuario)) return 'ADMIN';

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

  /** Lista usuários ativos da tabela Senhas (para o painel admin). */
  async listUsers() {
    try {
      const users = await this.prisma.senhaUser.findMany({
        where: { OR: [{ usuarioInativo: false }, { usuarioInativo: null }] },
        select: {
          idUsuario: true,
          usuario: true,
          identificacao: true,
          usuarioInativo: true,
          funcionario: true,
          acessoCompleto: true,
          dataCadastro: true,
        },
        orderBy: { identificacao: 'asc' },
      });

      // Enriquece com o tipo do Clientes para mostrar o cargo real
      const funcionarioCodes = users
        .map((u) => u.funcionario)
        .filter((f): f is number => f != null);

      const clientes =
        funcionarioCodes.length > 0
          ? await this.prisma.cliente.findMany({
              where: { codCliente: { in: funcionarioCodes } },
              select: { codCliente: true, tipo: true },
            })
          : [];

      const clienteMap = new Map(clientes.map((c) => [c.codCliente, c.tipo]));

      return users.map((u) => {
        const tipo = u.funcionario ? clienteMap.get(u.funcionario) : null;
        const role = this.resolveRoleFromFields(u.usuario, u.acessoCompleto, tipo);
        return { ...u, tipo: tipo ?? null, role };
      });
    } catch {
      return [];
    }
  }

  private resolveRoleFromFields(
    username: string,
    acessoCompleto: boolean | null | undefined,
    tipo: string | null | undefined,
  ): string {
    const adminUsers = (process.env.ADMIN_USERS || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (adminUsers.includes(username)) return 'ADMIN';
    if (acessoCompleto) return 'GESTOR';
    if (tipo === 'Z') return 'TECNICO';
    if (tipo === 'V') return 'VENDEDOR';
    if (tipo === 'U') return 'SDR';
    return 'VENDEDOR';
  }
}
