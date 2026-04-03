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

/*
  Sidebar order per role (chronological sales funnel):
  ADMIN:     Dashboard → SDR → Pipeline → Propostas → Orçamentos → Kits → Equipamentos → Usuários
  GESTOR:    Dashboard → Pipeline → Propostas → Orçamentos → Kits → SDR
  VENDEDOR:  Pipeline → Propostas → Kits → Minhas Vendas
  SDR:       SDR → Pipeline → Dashboard
  TECNICO:   Propostas → Equipamentos
  INFRA:     Pipeline → Equipamentos
  MONITOR:   Dashboard
*/
const routes: RouteConfig[] = [
  { path: '/', roles: allRoles },
  { path: '/dashboard', roles: allRoles, label: 'Dashboard', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR', 'SDR', 'MONITOR'] },
  { path: '/sdr', roles: ['ADMIN', 'GESTOR', 'SDR'], label: 'SDR Log', showInSidebar: true, sidebarRoles: ['ADMIN', 'SDR'] },
  { path: '/kanban', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR', 'INFRA'], label: 'Pipeline', showInSidebar: true },
  { path: '/vendas', roles: ['ADMIN', 'GESTOR', 'VENDEDOR'], label: 'Minhas Vendas', showInSidebar: true, sidebarRoles: ['VENDEDOR'] },
  { path: '/venda', roles: ['ADMIN', 'GESTOR', 'VENDEDOR'] },
  { path: '/leads', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR'] },
  { path: '/solucoes', roles: ['ADMIN', 'GESTOR', 'VENDEDOR', 'TECNICO'], label: 'Propostas', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR', 'VENDEDOR', 'TECNICO'] },
  { path: '/orcamentos', roles: ['ADMIN', 'GESTOR'], label: 'Orçamentos', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR'] },
  { path: '/kits', roles: ['ADMIN', 'GESTOR', 'INFRA', 'VENDEDOR', 'SDR'], label: 'Kits & Modelos', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR', 'VENDEDOR'] },
  { path: '/modelos', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR'] },
  { path: '/comissoes', roles: ['ADMIN', 'GESTOR'], label: 'Comissoes', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR'] },
  { path: '/equipamentos', roles: ['ADMIN', 'TECNICO', 'INFRA'], label: 'Equipamentos', showInSidebar: true, sidebarRoles: ['ADMIN', 'INFRA', 'TECNICO'] },
  { path: '/usuarios', roles: ['ADMIN', 'INFRA'], label: 'Usuários', showInSidebar: true },
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
