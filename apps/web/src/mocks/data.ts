import { Equipment, Installation, Kit, Lead, Mission, User } from '../types';

export const mockLeads: Lead[] = [
  {
    id: 'L1', name: 'Carlos Silva', company: 'Mercado Alfa', value: 12500, stage: 'Novo', responsible: 'Paula', origin: 'Site', week: 'Sem 1', status: 'ativo',
    notes: ['Cliente pediu contato à tarde.'],
    timeline: [
      { id: 't1a', date: '2026-01-02', text: 'Lead cadastrado' },
      { id: 't1b', date: '2026-01-03', text: 'E-mail de boas-vindas enviado' },
      { id: 't1c', date: '2026-01-05', text: 'Ligação agendada' },
    ],
    attachments: [],
  },
  {
    id: 'L2', name: 'Fernanda Gomes', company: 'Condomínio Sol', value: 28300, stage: 'Contato', responsible: 'Marcos', origin: 'Indicação', week: 'Sem 2', status: 'ativo',
    notes: ['Interesse em monitoramento 24h.'],
    timeline: [
      { id: 't2a', date: '2026-01-04', text: 'Lead cadastrado' },
      { id: 't2b', date: '2026-01-06', text: 'Primeira ligação concluída' },
      { id: 't2c', date: '2026-01-08', text: 'Visita técnica agendada' },
    ],
    attachments: [],
  },
  {
    id: 'L3', name: 'Ricardo Moraes', company: 'Loja Beta', value: 18400, stage: 'Proposta', responsible: 'João', origin: 'Campanha', week: 'Sem 3', status: 'ativo',
    notes: ['Aguardando aprovação financeira.'],
    timeline: [
      { id: 't3a', date: '2026-01-05', text: 'Lead cadastrado via campanha' },
      { id: 't3b', date: '2026-01-07', text: 'Reunião de apresentação' },
      { id: 't3c', date: '2026-01-09', text: 'Proposta enviada' },
    ],
    attachments: [],
  },
  {
    id: 'L4', name: 'Ana Beatriz', company: 'Residencial Vita', value: 9800, stage: 'Negociação', responsible: 'Nina', origin: 'WhatsApp', week: 'Sem 4', status: 'ativo',
    notes: ['Solicitou desconto de 5%.'],
    timeline: [
      { id: 't4a', date: '2026-01-06', text: 'Lead cadastrado via WhatsApp' },
      { id: 't4b', date: '2026-01-09', text: 'Reunião comercial realizada' },
      { id: 't4c', date: '2026-01-12', text: 'Contraproposta recebida' },
    ],
    attachments: [],
  },
  {
    id: 'L5', name: 'Luan Costa', company: 'Auto Center X', value: 32200, stage: 'Fechado', responsible: 'Paula', origin: 'Site', week: 'Sem 5', status: 'ativo',
    notes: ['Contrato assinado.'],
    timeline: [
      { id: 't5a', date: '2026-01-08', text: 'Lead cadastrado' },
      { id: 't5b', date: '2026-01-11', text: 'Proposta aprovada' },
      { id: 't5c', date: '2026-01-14', text: 'Venda fechada — contrato assinado' },
    ],
    attachments: [],
  },
];

export const mockUsers: User[] = [
  { id: 'U1', name: 'Admin Master', role: 'ADMIN', status: 'ativo' },
  { id: 'U2', name: 'Paula Vendas', role: 'VENDEDOR', status: 'ativo' },
  { id: 'U3', name: 'Marcos SDR', role: 'SDR', status: 'ativo' },
  { id: 'U4', name: 'Téc. Bruno', role: 'TECNICO', status: 'inativo' },
  { id: 'U5', name: 'Rafael Infra', role: 'INFRA', status: 'ativo' },
  { id: 'U6', name: 'Carla Monitor', role: 'MONITOR', status: 'ativo' },
];

export const mockMissions: Mission[] = [
  { id: 'M1', title: 'Follow-up top 10 leads', assignedTo: 'Marcos', status: 'Pendente', dueDate: '2026-02-15' },
  { id: 'M2', title: 'Atualizar proposta Mercado Alfa', assignedTo: 'Paula', status: 'Em andamento', dueDate: '2026-02-12' },
  { id: 'M3', title: 'Revisão técnica Loja Beta', assignedTo: 'Bruno', status: 'Concluída', dueDate: '2026-02-08' },
];

export const mockInstallations: Installation[] = [
  {
    id: 'I1', client: 'Mercado Alfa', leadId: 'L1', technician: 'Bruno', points: [
      { id: 'P1', environment: 'Entrada principal', type: 'Câmera dome', note: 'Cobrir fluxo de caixa', status: 'Pendente', photos: [] },
      { id: 'P2', environment: 'Estoque', type: 'Sensor presença', note: 'Altura 2.2m', status: 'Em execução', photos: [] },
    ],
  },
];

export const mockEquipments: Equipment[] = [
  { id: 'E1', name: 'Câmera Dome 2MP', category: 'Câmera', price: 420 },
  { id: 'E2', name: 'Sensor IVP', category: 'Sensor', price: 180 },
  { id: 'E3', name: 'Central de Alarme X', category: 'Central', price: 750 },
  { id: 'E4', name: 'Fonte 12V', category: 'Acessório', price: 70 },
];

export const mockKits: Kit[] = [
  { id: 'K1', name: 'Kit Loja Pequena', items: [{ equipmentId: 'E1', quantity: 4 }, { equipmentId: 'E2', quantity: 2 }] },
];
