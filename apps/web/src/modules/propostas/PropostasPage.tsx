'use client';

import { theme } from '../../components/common/theme';
import { AppShell } from '../../components/layout/AppShell';

export function PropostasPage() {
  return (
    <AppShell title="Propostas">
      <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: theme.muted }}>
        <p style={{ fontSize: 16 }}>Módulo de Propostas/Orçamentos será implementado na Etapa 3.</p>
      </div>
    </AppShell>
  );
}
