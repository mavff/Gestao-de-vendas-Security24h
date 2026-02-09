'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { mockMissions } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Mission } from '../../types';

const statuses: Mission['status'][] = ['Pendente', 'Em andamento', 'Concluída'];

export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  useEffect(() => setMissions(loadMock('mock_missions', mockMissions)), []);
  useEffect(() => saveMock('mock_missions', missions), [missions]);

  return (
    <AppShell title="Missões">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <section>
          <h3>Lista</h3>
          {missions.map((m) => <div key={m.id} style={{ marginBottom: 8, border: '1px solid #3A3A3A', borderRadius: 8, padding: 8 }}>{m.title} · {m.assignedTo} · {m.status}</div>)}
        </section>
        <section>
          <h3>Board</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {statuses.map((status) => <div key={status} style={{ border: '1px solid #3A3A3A', borderRadius: 8, padding: 8 }}><strong>{status}</strong>{missions.filter((m) => m.status === status).map((m) => <div key={m.id} style={{ marginTop: 6, background: '#1D1D1D', padding: 6, borderRadius: 6 }}>{m.title}</div>)}</div>)}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
