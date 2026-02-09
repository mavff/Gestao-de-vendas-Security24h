import { UserRole } from '../types';

export type NavItem = {
  href: string;
  label: string;
};

const allNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/kanban', label: 'Pipeline' },
  { href: '/propostas', label: 'Propostas' },
  { href: '/instalacoes', label: 'Ordens de Serviço' },
  { href: '/equipamentos', label: 'Equipamentos' },
  { href: '/kits', label: 'Kits' },
  { href: '/usuarios', label: 'Usuários' },
  { href: '/missoes', label: 'Missões' },
];

/** Routes each role is allowed to access */
const roleRoutes: Record<UserRole, string[]> = {
  ADMIN:    ['/dashboard', '/kanban', '/leads', '/propostas', '/instalacoes', '/equipamentos', '/kits', '/usuarios', '/missoes'],
  SDR:      ['/dashboard', '/kanban', '/leads'],
  VENDEDOR: ['/dashboard', '/kanban', '/leads', '/propostas', '/instalacoes', '/equipamentos', '/kits'],
  TECNICO:  ['/dashboard', '/instalacoes'],
  INFRA:    ['/dashboard', '/equipamentos', '/kits', '/usuarios'],
  MONITOR:  ['/dashboard'],
};

export function getNavForRole(role: UserRole): NavItem[] {
  const allowed = roleRoutes[role];
  return allNav.filter((item) => allowed.includes(item.href));
}

export function canAccess(role: UserRole, pathname: string): boolean {
  // Root path is always dashboard
  if (pathname === '/') return true;
  const allowed = roleRoutes[role];
  return allowed.some((route) => pathname === route || pathname.startsWith(route + '/'));
}
