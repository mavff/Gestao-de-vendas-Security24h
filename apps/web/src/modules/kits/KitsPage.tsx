'use client';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { mockEquipments, mockKits, mockLeads } from '../../mocks/data';
import { loadMock, saveMock } from '../../services/mockStorage';
import { Kit } from '../../types';

export function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [name, setName] = useState('');
  const [equipmentId, setEquipmentId] = useState(mockEquipments[0].id);
  const [qty, setQty] = useState(1);
  const [leadId, setLeadId] = useState('');

  useEffect(() => setKits(loadMock('mock_kits', mockKits)), []);
  useEffect(() => saveMock('mock_kits', kits), [kits]);

  const currentItems = useMemo(() => [{ equipmentId, quantity: qty }], [equipmentId, qty]);

  return (
    <AppShell title="Kits">
      <div style={{ border: '1px solid #3A3A3A', borderRadius: 8, padding: 10, marginBottom: 12 }}>
        <h4>Novo kit</h4>
        <input placeholder="Nome do kit" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>{mockEquipments.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}</select>
        <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <select value={leadId} onChange={(e) => setLeadId(e.target.value)}><option value="">Vincular a lead/venda</option>{mockLeads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select>
        <button onClick={() => setKits((cur) => [...cur, { id: crypto.randomUUID(), name, items: currentItems, linkedLeadId: leadId || undefined }])}>Salvar kit</button>
      </div>
      {kits.map((kit) => <div key={kit.id} style={{ border: '1px solid #3A3A3A', borderRadius: 8, padding: 10, marginBottom: 8 }}><strong>{kit.name}</strong> · Lead: {kit.linkedLeadId ?? 'não vinculado'}{kit.items.map((i) => <div key={i.equipmentId}>{mockEquipments.find((e) => e.id === i.equipmentId)?.name} x {i.quantity}</div>)}</div>)}
    </AppShell>
  );
}
