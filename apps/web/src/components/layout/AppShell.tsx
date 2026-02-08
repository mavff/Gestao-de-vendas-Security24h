'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '../common/theme';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/kanban', label: 'Kanban' },
  { href: '/usuarios', label: 'Usuários' },
  { href: '/missoes', label: 'Missões' },
  { href: '/instalacoes', label: 'Instalações' },
  { href: '/equipamentos', label: 'Equipamentos' },
  { href: '/kits', label: 'Kits' },
];

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', background: theme.bg }}>
      <aside style={{ borderRight: `1px solid ${theme.border}`, padding: 20, background: '#101010' }}>
        <h1 style={{ color: theme.gold, marginTop: 0, fontSize: 22 }}>Security24h Admin</h1>
        <nav style={{ display: 'grid', gap: 10 }}>
          {links.map((link) => {
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
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main style={{ padding: 24, color: theme.text }}>
        <h2 style={{ marginTop: 0, fontSize: 28, color: theme.text }}>{title}</h2>
        {children}
      </main>
    </div>
  );
}
