import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { AuthedRequest, AuthUser } from '../auth/authed-request';

const ADMIN_ROLES = new Set(['ADMIN', 'GESTOR']);

export function isAdminRole(role: string | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

export function requireUser(req: AuthedRequest): AuthUser {
  if (!req.user?.username) {
    throw new UnauthorizedException('Sessão inválida');
  }
  return req.user;
}

/**
 * Para list(): se não é ADMIN/GESTOR, força o filtro por `criadoPor = username`.
 * Se já veio um `criadoPor` no query e o usuário não é admin, só permite se bater com o próprio.
 */
export function resolveOwnerListFilter(
  req: AuthedRequest,
  requested: string | undefined,
): string | undefined {
  const user = requireUser(req);
  if (isAdminRole(user.role)) return requested;
  if (requested && requested !== user.username) {
    throw new ForbiddenException('Sem permissão para listar dados de outro usuário');
  }
  return user.username;
}

/**
 * Para create/upsert(): sobrescreve `criadoPor` com o username do JWT.
 * ADMIN/GESTOR podem informar explicitamente outro dono (mantém o body); demais sempre se tornam donos.
 */
export function stampOwnerOnCreate<T extends { criadoPor?: string | null }>(
  req: AuthedRequest,
  data: T,
): T {
  const user = requireUser(req);
  if (isAdminRole(user.role) && data.criadoPor) return data;
  return { ...data, criadoPor: user.username };
}

/**
 * Para update/delete(): garante que o registro alvo pertence ao usuário
 * (ou o usuário é ADMIN/GESTOR). Passe o valor atual de `criadoPor` do registro.
 */
export function assertCanMutate(req: AuthedRequest, recordOwner: string | null | undefined): void {
  const user = requireUser(req);
  if (isAdminRole(user.role)) return;
  if (!recordOwner || recordOwner !== user.username) {
    throw new ForbiddenException('Sem permissão para alterar este registro');
  }
}
