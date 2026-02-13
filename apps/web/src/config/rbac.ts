import { UserRole } from '../types';

export type NavItem = {
  href: string;
  label: string;
};

type RouteConfig = {
  path: string;
  roles: UserRole[];
  sidebarRoles?: UserRole[];
  label?: string;
  showInSidebar?: boolean;
};

const allRoles: UserRole[] = ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR', 'TECNICO', 'INFRA', 'MONITOR'];
const publicPaths = ['/login'];

const routes: RouteConfig[] = [
  { path: '/', roles: allRoles },
  { path: '/dashboard', roles: allRoles, label: 'Dashboard', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR', 'SDR', 'MONITOR'] },
  { path: '/kanban', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR'], label: 'Pipeline', showInSidebar: true },
  { path: '/vendas', roles: ['ADMIN', 'VENDEDOR'], label: 'Minhas Vendas', showInSidebar: true, sidebarRoles: ['VENDEDOR'] },
  { path: '/venda', roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/leads', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR'] },
  { path: '/propostas', roles: ['ADMIN', 'GESTOR', 'VENDEDOR'], label: 'Propostas', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR'] },
  { path: '/solucoes', roles: ['ADMIN', 'VENDEDOR', 'TECNICO'], label: 'Soluções', showInSidebar: true, sidebarRoles: ['ADMIN', 'TECNICO'] },
  { path: '/orcamentos', roles: ['ADMIN', 'GESTOR', 'VENDEDOR'], label: 'Orçamentos', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR'] },
  { path: '/instalacoes', roles: ['ADMIN', 'TECNICO'], label: 'Ordens de Serviço', showInSidebar: true },
  { path: '/equipamentos', roles: ['ADMIN', 'TECNICO', 'INFRA'], label: 'Equipamentos', showInSidebar: true, sidebarRoles: ['ADMIN', 'INFRA'] },
  { path: '/kits', roles: ['ADMIN', 'INFRA'], label: 'Kits', showInSidebar: true },
  { path: '/usuarios', roles: ['ADMIN', 'INFRA'], label: 'Usuários', showInSidebar: true },
  { path: '/missoes', roles: allRoles, label: 'Missões', showInSidebar: true },
  { path: '/login', roles: allRoles },
];

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function findRoute(pathname: string): RouteConfig | undefined {
  const normalized = normalizePath(pathname);

  return routes.find((route) => (
    normalized === route.path || normalized.startsWith(route.path + '/')
  ));
}

export function getNavForRole(role: UserRole): NavItem[] {
  return routes
    .filter((route) => route.showInSidebar && route.label && (route.sidebarRoles ?? route.roles).includes(role))
    .map((route) => ({ href: route.path, label: route.label! }));
}

export function isPublicPath(pathname: string): boolean {
  return publicPaths.includes(normalizePath(pathname));
}

export function getFallbackRouteForRole(role: UserRole): string {
  const first = getNavForRole(role)[0];
  return first?.href ?? '/dashboard';
}

export function canAccess(role: UserRole, pathname: string): boolean {
  if (isPublicPath(pathname)) return true;

  const route = findRoute(pathname);
  if (!route) return false;

  return route.roles.includes(role);
}
