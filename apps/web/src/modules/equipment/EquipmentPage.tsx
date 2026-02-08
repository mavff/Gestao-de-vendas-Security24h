'use client';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { mockEquipments } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Equipment } from '../../types';

export function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [category, setCategory] = useState('Todas');
  useEffect(() => setEquipments(loadMock('mock_equipments', mockEquipments)), []);
  useEffect(() => saveMock('mock_equipments', equipments), [equipments]);

  const filtered = useMemo(() => category === 'Todas' ? equipments : equipments.filter((e) => e.category === category), [equipments, category]);

  return (
    <AppShell title="Equipamentos">
      <select value={category} onChange={(e) => setCategory(e.target.value)}><option>Todas</option><option>Câmera</option><option>Sensor</option><option>Central</option><option>Acessório</option></select>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
        {filtered.map((eq) => <div key={eq.id} style={{ border: '1px solid #3A3A3A', padding: 10, borderRadius: 8 }}><strong>{eq.name}</strong><div>{eq.category}</div><div>R$ {eq.price.toLocaleString('pt-BR')}</div></div>)}
      </div>
    </AppShell>
  );
}
