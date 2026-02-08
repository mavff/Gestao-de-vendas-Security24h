export type LeadStage = 'Novo' | 'Contato' | 'Proposta' | 'Negociação' | 'Fechado';

export type Lead = {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: LeadStage;
  responsible: string;
  origin: 'Site' | 'Indicação' | 'Campanha' | 'WhatsApp';
  week: string;
  status: 'ativo' | 'pausado';
  notes: string[];
  timeline: { id: string; date: string; text: string }[];
  attachments: { id: string; name: string; url?: string }[];
};

export type User = { id: string; name: string; role: 'ADMIN' | 'SDR' | 'VENDEDOR' | 'TECNICO'; status: 'ativo' | 'inativo' };

export type Mission = { id: string; title: string; assignedTo: string; status: 'Pendente' | 'Em andamento' | 'Concluída'; dueDate: string };

export type InstallationPoint = {
  id: string;
  environment: string;
  type: string;
  note: string;
  status: 'Pendente' | 'Em execução' | 'Finalizado';
  photos: string[];
};

export type Installation = { id: string; client: string; leadId: string; technician: string; points: InstallationPoint[] };

export type Equipment = { id: string; name: string; category: 'Câmera' | 'Sensor' | 'Central' | 'Acessório'; price: number };

export type Kit = { id: string; name: string; items: { equipmentId: string; quantity: number }[]; linkedLeadId?: string };
