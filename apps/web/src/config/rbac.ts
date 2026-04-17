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

const allRoles: UserRole[] = ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR', 'TECNICO'];
const publicPaths = ['/login'];

/*
  Sidebar order per role (chronological sales funnel):
  ADMIN:     Dashboard → SDR → Pipeline → Propostas → Orçamentos → Instalações → Comissões → Kits → Equipamentos → Usuários
  GESTOR:    Dashboard → Pipeline → Propostas → Orçamentos → Instalações → Comissões → Kits → SDR
  VENDEDOR:  Pipeline → Kits → Minhas Vendas
  SDR:       SDR → Pipeline
  TECNICO:   Instalações → Equipamentos
*/
const routes: RouteConfig[] = [
  { path: '/', roles: allRoles },
  { path: '/dashboard', roles: ['ADMIN', 'GESTOR'], label: 'Dashboard', showInSidebar: true },
  { path: '/sdr', roles: ['ADMIN', 'GESTOR', 'SDR'], label: 'SDR Log', showInSidebar: true, sidebarRoles: ['ADMIN', 'SDR'] },
  { path: '/kanban', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR'], label: 'Pipeline', showInSidebar: true },
  { path: '/vendas', roles: ['ADMIN', 'GESTOR', 'VENDEDOR'], label: 'Minhas Vendas', showInSidebar: true, sidebarRoles: ['VENDEDOR'] },
  { path: '/venda', roles: ['ADMIN', 'GESTOR', 'VENDEDOR'] },
  { path: '/leads', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR'] },
  { path: '/solucoes', roles: ['ADMIN', 'GESTOR', 'VENDEDOR', 'TECNICO'], label: 'Propostas', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR', 'TECNICO'] },
  { path: '/orcamentos', roles: ['ADMIN', 'GESTOR'], label: 'Orçamentos', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR'] },
  { path: '/kits', roles: ['ADMIN', 'GESTOR', 'VENDEDOR', 'SDR'], label: 'Kits & Modelos', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR', 'VENDEDOR'] },
  { path: '/modelos', roles: ['ADMIN', 'GESTOR', 'SDR', 'VENDEDOR'] },
  { path: '/instalacoes', roles: ['ADMIN', 'GESTOR', 'TECNICO'], label: 'Instalações', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR', 'TECNICO'] },
  { path: '/comissoes', roles: ['ADMIN', 'GESTOR'], label: 'Comissoes', showInSidebar: true, sidebarRoles: ['ADMIN', 'GESTOR'] },
  { path: '/equipamentos', roles: ['ADMIN', 'TECNICO'], label: 'Equipamentos', showInSidebar: true, sidebarRoles: ['ADMIN', 'TECNICO'] },
  { path: '/usuarios', roles: ['ADMIN'], label: 'Usuários', showInSidebar: true },
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
