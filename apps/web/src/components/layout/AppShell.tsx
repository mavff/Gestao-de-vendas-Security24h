'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getNavForRole } from '../../config/rbac';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../common/theme';

const MOBILE_BREAKPOINT = 900;
const SIDEBAR_WIDTH = 188;
const iconByPath: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/kanban': 'kanban',
  '/vendas': 'vendas',
  '/propostas': 'propostas',
  '/solucoes': 'solucoes',
  '/orcamentos': 'orcamentos',
  '/instalacoes': 'instalacoes',
  '/equipamentos': 'equipamentos',
  '/kits': 'kits',
  '/usuarios': 'usuarios',
  '/missoes': 'missoes',
  '/sdr': 'sdr',
};

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? theme.gold : theme.muted;
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (icon === 'vendas') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3.5" y="8" width="17" height="11" rx="2" />
        <path d="M8 8V6.5a4 4 0 0 1 8 0V8" />
        <line x1="12" y1="12" x2="12" y2="15" />
        <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
      </svg>
    );
  }

  if (icon === 'kanban') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <line x1="8.5" y1="8" x2="8.5" y2="16" />
        <line x1="15.5" y1="10" x2="15.5" y2="16" />
      </svg>
    );
  }

  if (icon === 'propostas') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M7 4.5h8l3 3v12h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z" />
        <path d="M15 4.5v3h3" />
        <line x1="8" y1="12" x2="15" y2="12" />
        <line x1="8" y1="15.5" x2="13" y2="15.5" />
      </svg>
    );
  }

  if (icon === 'solucoes') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4.5 7.5h6v-3h3v3h6v6h-3v3h-3v-3h-6v3h-3v-3h-3v-6h3z" />
      </svg>
    );
  }

  if (icon === 'orcamentos') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="11.5" x2="16" y2="11.5" />
        <line x1="8" y1="15" x2="13" y2="15" />
        <text x="15" y="16.5" fontSize="7" fill={color} stroke="none" fontWeight="bold">$</text>
      </svg>
    );
  }

  if (icon === 'instalacoes') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4.5 11.5L12 5l7.5 6.5" />
        <path d="M6.5 10v8.5h11V10" />
        <line x1="10" y1="18.5" x2="10" y2="13.5" />
        <line x1="14" y1="18.5" x2="14" y2="13.5" />
      </svg>
    );
  }

  if (icon === 'equipamentos') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3.5" y="8" width="17" height="8" rx="2.2" />
        <circle cx="8" cy="12" r="1.3" />
        <line x1="13" y1="12" x2="17.5" y2="12" />
      </svg>
    );
  }

  if (icon === 'kits') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4.5 9.5L12 5l7.5 4.5L12 14z" />
        <path d="M4.5 9.5V16.5L12 20.5L19.5 16.5V9.5" />
        <line x1="12" y1="14" x2="12" y2="20.5" />
      </svg>
    );
  }

  if (icon === 'usuarios') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="9" cy="9" r="2.5" />
        <circle cx="16.5" cy="10" r="2" />
        <path d="M4.5 18c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4" />
        <path d="M13.5 18c.2-1.5 1.6-2.8 3.3-2.8 1.7 0 3.1 1.3 3.3 2.8" />
      </svg>
    );
  }

  if (icon === 'missoes') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3.2" />
        <line x1="12" y1="4.5" x2="12" y2="6.7" />
        <line x1="12" y1="17.3" x2="12" y2="19.5" />
        <line x1="4.5" y1="12" x2="6.7" y2="12" />
        <line x1="17.3" y1="12" x2="19.5" y2="12" />
      </svg>
    );
  }

  if (icon === 'sdr') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 7h16M4 12h10M4 17h7" />
        <circle cx="19" cy="16" r="3.5" />
        <line x1="21.5" y1="18.5" x2="23" y2="20" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13" y="4.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="4.5" y="13" width="6.5" height="6.5" rx="1.2" />
      <rect x="13" y="13" width="6.5" height="6.5" rx="1.2" />
    </svg>
  );
}


export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const navItems = getNavForRole(role);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `${SIDEBAR_WIDTH}px 1fr`, minHeight: '100vh', background: theme.bg }}>
      {isMobile && isSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            border: 'none',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 20,
            cursor: 'pointer',
          }}
        />
      )}

      <aside
        style={{
          borderRight: `1px solid ${theme.border}`,
          padding: 14,
          background: '#0f0f0f',
          boxShadow: '10px 0 32px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          height: '100vh',
          width: SIDEBAR_WIDTH,
          maxWidth: '76vw',
          zIndex: 30,
          transform: isMobile && !isSidebarOpen ? 'translateX(-105%)' : 'translateX(0)',
          transition: 'transform 200ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h1 style={{ color: theme.gold, margin: 0, fontSize: 18 }}>Security24h</h1>
          {isMobile && (
            <button
              type="button"
              aria-label="Fechar sidebar"
              onClick={() => setIsSidebarOpen(false)}
              style={{
                border: `1px solid ${theme.border}`,
                background: theme.panel,
                color: theme.text,
                borderRadius: 6,
                width: 28,
                height: 28,
                cursor: 'pointer',
              }}
            >
              {'<'}
            </button>
          )}
        </div>

        <nav style={{ display: 'grid', gap: 4 }}>
          {navItems.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            const icon = iconByPath[link.href] ?? 'dashboard';
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: active ? theme.gold : theme.text,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 8px',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  borderRadius: 8,
                  background: active ? 'rgba(200, 169, 81, 0.08)' : 'transparent',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(200, 169, 81, 0.35)' : 'none',
                  transition: 'background 140ms ease, box-shadow 140ms ease',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                  <NavIcon icon={icon} active={active} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main style={{ padding: isMobile ? 16 : 24, color: theme.text, overflowY: 'auto', background: 'radial-gradient(circle at top right, rgba(200, 169, 81, 0.1), transparent 45%)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          background: 'rgba(20, 20, 20, 0.72)',
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.28)',
          padding: '10px 12px',
          backdropFilter: 'blur(3px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button
                type="button"
                aria-label="Abrir menu"
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  border: `1px solid ${theme.border}`,
                  background: theme.panel,
                  color: theme.gold,
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                  letterSpacing: 0.3,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                MENU
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: isMobile ? 21 : 25, color: theme.text }}>{title}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Avatar com inicial */}
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.gold}44, ${theme.gold}22)`,
              border: `1px solid ${theme.gold}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: theme.gold,
              flexShrink: 0,
            }}>
              {(user?.name ?? role).charAt(0).toUpperCase()}
            </div>
            {/* Nome e role */}
            <div style={{ display: isMobile ? 'none' : 'grid', gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.text, lineHeight: 1.2 }}>
                {user?.name ?? user?.username ?? '—'}
              </span>
              <span style={{ fontSize: 10, color: theme.gold, fontWeight: 600, letterSpacing: 0.4 }}>
                {role}
              </span>
            </div>
            {/* Botão sair */}
            <button
              type="button"
              onClick={logout}
              title="Sair"
              style={{
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.muted,
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: 0.3,
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = theme.danger;
                (e.currentTarget as HTMLButtonElement).style.borderColor = theme.danger;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = theme.muted;
                (e.currentTarget as HTMLButtonElement).style.borderColor = theme.border;
              }}
            >
              Sair
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
