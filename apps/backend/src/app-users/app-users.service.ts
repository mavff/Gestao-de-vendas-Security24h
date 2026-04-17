import { ConflictException, Injectable, NotFoundException, OnModuleInit, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppUser } from './app-user.entity';

type CreateDto = { username: string; password: string; name: string; role: string };
type UpdateDto = Partial<CreateDto> & { active?: boolean };

@Injectable()
export class AppUsersService implements OnModuleInit {
  constructor(
    @InjectRepository(AppUser, 'app')
    private readonly repo: Repository<AppUser>,
  ) {}

  /** Seed + migração de roles legadas na inicialização */
  async onModuleInit() {
    // Migração: roles INFRA/MONITOR foram removidas — rebaixa pra VENDEDOR pra não perder login.
    // Admin pode ajustar o role pela tela /usuarios depois.
    const legacy = await this.repo.find({ where: [{ role: 'INFRA' }, { role: 'MONITOR' }] });
    if (legacy.length) {
      for (const u of legacy) u.role = 'VENDEDOR';
      await this.repo.save(legacy);
      console.log(`[AppUsers] Migração: ${legacy.length} usuário(s) com role legada (INFRA/MONITOR) → VENDEDOR`);
    }

    const count = await this.repo.count();
    if (count > 0) return; // Já tem dados — não refaz seed

    const envRoles: Record<string, string> = {
      ADMIN_USERS: 'ADMIN',
      GESTOR_USERS: 'GESTOR',
      SDR_USERS: 'SDR',
      VENDEDOR_USERS: 'VENDEDOR',
      TECNICO_USERS: 'TECNICO',
    };

    for (const [envKey, role] of Object.entries(envRoles)) {
      const val = process.env[envKey];
      if (!val) continue;
      for (const entry of val.split(',')) {
        const parts = entry.trim().split(':');
        if (parts.length < 3) continue;
        const [username, password, ...nameParts] = parts;
        const name = nameParts.join(':').trim();
        if (!username || !password) continue;

        const exists = await this.repo.findOne({ where: { username: username.trim() } });
        if (exists) continue;

        const hash = await bcrypt.hash(password.trim(), 10);
        await this.repo.save(this.repo.create({
          username: username.trim(),
          passwordHash: hash,
          name,
          role,
          active: true,
        }));
      }
    }

    const seeded = await this.repo.count();
    if (seeded > 0) {
      console.log(`[AppUsers] Seed: ${seeded} usuários migrados do .env para SQLite`);
    }
  }

  async findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  async validatePassword(user: AppUser, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.passwordHash);
    } catch {
      return false;
    }
  }

  async create(dto: CreateDto) {
    const existing = await this.repo.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Usuário já existe');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({
      username: dto.username,
      passwordHash: hash,
      name: dto.name,
      role: dto.role,
      active: true,
    });
    const saved = await this.repo.save(user);
    return this.sanitize(saved);
  }

  async update(id: number, dto: UpdateDto) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (dto.username !== undefined) user.username = dto.username;
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);

    const saved = await this.repo.save(user);
    return this.sanitize(saved);
  }

  /** Troca de senha pelo próprio usuário. Valida senha atual. */
  async changeOwnPassword(id: number, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 4) {
      throw new BadRequestException('Nova senha deve ter ao menos 4 caracteres');
    }
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta');
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await this.repo.save(user);
    return { ok: true };
  }

  /** Reset por admin: grava senha temporária e força troca no próximo login. */
  async resetPassword(id: number, tempPassword: string) {
    if (!tempPassword || tempPassword.length < 4) {
      throw new BadRequestException('Senha temporária deve ter ao menos 4 caracteres');
    }
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    user.passwordHash = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;
    await this.repo.save(user);
    return { ok: true, username: user.username };
  }

  async remove(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.repo.remove(user);
    return { deleted: true };
  }

  private sanitize(user: AppUser) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
