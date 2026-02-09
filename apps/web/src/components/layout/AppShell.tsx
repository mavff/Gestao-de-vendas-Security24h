'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavForRole } from '../../config/rbac';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { theme } from '../common/theme';

const allRoles: UserRole[] = ['ADMIN', 'SDR', 'VENDEDOR', 'TECNICO', 'INFRA', 'MONITOR'];

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useAuth();
  const navItems = getNavForRole(role);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', background: theme.bg }}>
      {/* Sidebar */}
      <aside style={{ borderRight: `1px solid ${theme.border}`, padding: 20, background: '#101010', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: theme.gold, marginTop: 0, fontSize: 22 }}>Security24h</h1>
        <nav style={{ display: 'grid', gap: 8, flex: 1 }}>
          {navItems.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: active ? theme.gold : theme.text,
                  textDecoration: 'none',
                  border: `1px solid ${active ? theme.gold : theme.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  background: active ? '#201b0b' : theme.panel,
                  fontSize: 14,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile switcher */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Perfil Demo</div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            style={{
              width: '100%',
              background: theme.soft,
              color: theme.gold,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {allRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main */}
      <main style={{ padding: 24, color: theme.text, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: 28, color: theme.text }}>{title}</h2>
          <span style={{
            background: theme.soft,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            color: theme.gold,
            fontWeight: 600,
          }}>
            {role}
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
