// ---- Types ----
export type PeriodKey = '7d' | '30d' | '90d' | 'all';

export interface DashboardDataSet {
  funnelData: { stage: string; total: number }[];
  leadsByWeek: { week: string; leads: number }[];
  closuresBySeller: { seller: string; closures: number }[];
  leadsByOrigin: { origin: string; total: number }[];
  kpis: {
    totalLeads: number;
    conversionRate: number;
    estimatedRevenue: number;
    newLeadsThisWeek: number;
  };
}

// ---- Legacy exports (unchanged) ----
export const funnelData = [
  { stage: 'Novo', total: 48 },
  { stage: 'Contato', total: 36 },
  { stage: 'Proposta', total: 24 },
  { stage: 'Negociação', total: 14 },
  { stage: 'Fechado', total: 8 },
];

export const leadsByWeek = [
  { week: 'Sem 1', leads: 12 },
  { week: 'Sem 2', leads: 18 },
  { week: 'Sem 3', leads: 14 },
  { week: 'Sem 4', leads: 22 },
  { week: 'Sem 5', leads: 17 },
];

export const closuresBySeller = [
  { seller: 'Paula', closures: 4 },
  { seller: 'Marcos', closures: 6 },
  { seller: 'João', closures: 3 },
  { seller: 'Nina', closures: 5 },
];

export const leadsByOrigin = [
  { origin: 'Site', total: 26 },
  { origin: 'Indicação', total: 14 },
  { origin: 'Campanha', total: 21 },
  { origin: 'WhatsApp', total: 17 },
];

// ---- Period-based datasets ----
export const dashboardDataByPeriod: Record<PeriodKey, DashboardDataSet> = {
  '7d': {
    funnelData: [
      { stage: 'Novo', total: 10 },
      { stage: 'Contato', total: 7 },
      { stage: 'Proposta', total: 4 },
      { stage: 'Negociação', total: 2 },
      { stage: 'Fechado', total: 1 },
    ],
    leadsByWeek: [
      { week: 'Seg', leads: 3 },
      { week: 'Ter', leads: 2 },
      { week: 'Qua', leads: 4 },
      { week: 'Qui', leads: 1 },
      { week: 'Sex', leads: 5 },
    ],
    closuresBySeller: [
      { seller: 'Paula', closures: 1 },
      { seller: 'Marcos', closures: 2 },
      { seller: 'João', closures: 0 },
      { seller: 'Nina', closures: 1 },
    ],
    leadsByOrigin: [
      { origin: 'Site', total: 5 },
      { origin: 'Indicação', total: 2 },
      { origin: 'Campanha', total: 4 },
      { origin: 'WhatsApp', total: 3 },
    ],
    kpis: {
      totalLeads: 14,
      conversionRate: 7.1,
      estimatedRevenue: 28500,
      newLeadsThisWeek: 9,
    },
  },
  '30d': {
    funnelData: [
      { stage: 'Novo', total: 30 },
      { stage: 'Contato', total: 22 },
      { stage: 'Proposta', total: 15 },
      { stage: 'Negociação', total: 9 },
      { stage: 'Fechado', total: 5 },
    ],
    leadsByWeek: [
      { week: 'Sem 1', leads: 8 },
      { week: 'Sem 2', leads: 11 },
      { week: 'Sem 3', leads: 9 },
      { week: 'Sem 4', leads: 14 },
    ],
    closuresBySeller: [
      { seller: 'Paula', closures: 2 },
      { seller: 'Marcos', closures: 4 },
      { seller: 'João', closures: 1 },
      { seller: 'Nina', closures: 3 },
    ],
    leadsByOrigin: [
      { origin: 'Site', total: 15 },
      { origin: 'Indicação', total: 8 },
      { origin: 'Campanha', total: 12 },
      { origin: 'WhatsApp', total: 10 },
    ],
    kpis: {
      totalLeads: 42,
      conversionRate: 11.9,
      estimatedRevenue: 98700,
      newLeadsThisWeek: 9,
    },
  },
  '90d': {
    funnelData: [
      { stage: 'Novo', total: 62 },
      { stage: 'Contato', total: 48 },
      { stage: 'Proposta', total: 31 },
      { stage: 'Negociação', total: 18 },
      { stage: 'Fechado', total: 10 },
    ],
    leadsByWeek: [
      { week: 'Jan', leads: 20 },
      { week: 'Fev', leads: 25 },
      { week: 'Mar', leads: 30 },
    ],
    closuresBySeller: [
      { seller: 'Paula', closures: 5 },
      { seller: 'Marcos', closures: 8 },
      { seller: 'João', closures: 4 },
      { seller: 'Nina', closures: 6 },
    ],
    leadsByOrigin: [
      { origin: 'Site', total: 30 },
      { origin: 'Indicação', total: 18 },
      { origin: 'Campanha', total: 25 },
      { origin: 'WhatsApp', total: 20 },
    ],
    kpis: {
      totalLeads: 62,
      conversionRate: 16.1,
      estimatedRevenue: 168400,
      newLeadsThisWeek: 9,
    },
  },
  all: {
    funnelData,
    leadsByWeek,
    closuresBySeller,
    leadsByOrigin,
    kpis: {
      totalLeads: 78,
      conversionRate: 16.7,
      estimatedRevenue: 201200,
      newLeadsThisWeek: 9,
    },
  },
};
