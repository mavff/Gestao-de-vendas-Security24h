'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { mockInstallations } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Installation, InstallationPoint } from '../../types';

export function InstallationsPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const { role } = useAuth();
  // VENDEDOR: read-only; TECNICO/ADMIN/INFRA: can edit
  const readOnly = role === 'VENDEDOR';

  useEffect(() => {
    const data = loadMock('mock_installations', mockInstallations);
    setInstallations(data);
    setSelectedId(data[0]?.id ?? '');
  }, []);
  useEffect(() => saveMock('mock_installations', installations), [installations]);

  const selected = installations.find((i) => i.id === selectedId);

  function updatePoint(point: InstallationPoint) {
    if (!selected) return;
    setInstallations((cur) => cur.map((ins) => ins.id === selected.id ? { ...ins, points: ins.points.map((p) => p.id === point.id ? point : p) } : ins));
  }

  return (
    <AppShell title="Instalações">
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
        <aside>{installations.map((ins) => <button key={ins.id} onClick={() => setSelectedId(ins.id)} style={{ display: 'block', width: '100%', marginBottom: 8 }}>{ins.client} ({ins.technician})</button>)}</aside>
        <section>
          {selected && selected.points.map((point) => (
            <div key={point.id} style={{ border: '1px solid #3A3A3A', borderRadius: 10, padding: 10, marginTop: 10 }}>
              <strong>{point.environment}</strong> · {point.type}
              <div><textarea value={point.note} disabled={readOnly} onChange={(e) => updatePoint({ ...point, note: e.target.value })} /></div>
              <div>
                <select value={point.status} onChange={(e) => updatePoint({ ...point, status: e.target.value as InstallationPoint['status'] })}>
                  <option>Pendente</option><option>Em execução</option><option>Finalizado</option>
                </select>
              </div>
              <input type="file" accept="image/*" disabled={readOnly} onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                updatePoint({ ...point, photos: [...point.photos, url] });
              }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{point.photos.map((photo) => <img key={photo} src={photo} width={80} height={60} alt="preview" />)}</div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
