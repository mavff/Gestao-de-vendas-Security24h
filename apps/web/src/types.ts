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
  fotos: string[];
};

export type UserRole = 'ADMIN' | 'GESTOR' | 'SDR' | 'VENDEDOR' | 'TECNICO' | 'INFRA' | 'MONITOR';

export type User = { id: string; name: string; role: UserRole; status: 'ativo' | 'inativo' };

export type MissionPriority = 'Alta' | 'Média' | 'Baixa';

export type Mission = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'Pendente' | 'Em andamento' | 'Concluída';
  priority: MissionPriority;
  dueDate: string;
  createdAt: string;
};

export type InstallationPoint = {
  id: string;
  environment: string;
  type: string;
  note: string;
  status: 'Pendente' | 'Em execução' | 'Finalizado';
  photos: string[];
  equipmentId?: string;
  locationTag?: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Installation = { id: string; client: string; leadId: string; technician: string; points: InstallationPoint[] };

export type EquipmentCategory = 'Câmera' | 'Sensor' | 'Central' | 'Acessório';

export type Marca = 'Intelbras' | 'Hikvision' | 'DSC' | 'Viaweb' | 'Vetti' | 'Genérico';

export type KitCategoria = 'alarme_residencial' | 'alarme_comercial' | 'alarme_cftv' | 'cftv_analogico' | 'cftv_ip' | 'cftv_inteligente';

export type KitPresetItem = {
  equipmentId: string;
  quantidade: number;
};

export type KitPreset = {
  id: string;
  nome: string;
  descricao: string;
  categoria: KitCategoria;
  marca: Marca;
  itens: KitPresetItem[];
};

export type BlocoCategoria =
  | 'sensor_externo'
  | 'sensor_interno'
  | 'sensor_porta_janela'
  | 'camera_analogica'
  | 'camera_ip'
  | 'camera_ia'
  | 'dvr_nvr'
  | 'modulo_comunicacao'
  | 'central_alarme'
  | 'acessorio';

export type Equipment = {
  id: string;
  name: string;
  sku: string;
  category: EquipmentCategory;
  marca: Marca;
  bloco: BlocoCategoria;
  price: number;
  estoque: number;
  descricao: string;
};

export type Kit = { id: string; name: string; items: { equipmentId: string; quantity: number }[]; linkedLeadId?: string };

// --- Etapa 3: Oportunidade, Proposta, OS ---

export type Oportunidade = {
  id: string;
  leadId: string;
  valorEstimado: number;
  probabilidade: number; // 0-100
  proximaAcao: string;
  status: 'aberta' | 'ganha' | 'perdida';
  vendedorId: string;
  createdAt: string;
};

export type PropostaItem = {
  equipamentoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
};

export type PropostaServico = {
  descricao: string;
  valor: number;
  tipo: 'instalacao' | 'mensalidade';
};

export type Proposta = {
  id: string;
  oportunidadeId: string;
  leadId: string;
  leadNome: string;
  itens: PropostaItem[];
  servicos: PropostaServico[];
  total: number;
  observacoes: string;
  status: 'rascunho' | 'enviado' | 'aprovado';
  createdAt: string;
};

export type OrdemDeServico = {
  id: string;
  propostaId: string;
  oportunidadeId: string;
  leadId: string;
  cliente: string;
  dataAgendada: string;
  tecnicoId: string;
  checklist: ChecklistItem[];
  pontos: InstallationPoint[];
  observacoes: string;
  status: 'pendente' | 'em andamento' | 'concluida';
  createdAt: string;
};

// --- Etapa 9: Orçamento Automático ---

export type OrcamentoItem = {
  equipmentId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  bloco: BlocoCategoria;
};

export type FaixaZona = {
  label: string;      // 'P', 'M', 'G', 'GG', 'E'
  min: number;
  max: number;        // Infinity para última faixa
  fator: number;
  maoDeObra: number;
  mensalidade: number;
};

export const FAIXAS_ZONA: FaixaZona[] = [
  { label: 'P',  min: 1,  max: 4,        fator: 1.00, maoDeObra: 800,  mensalidade: 199 },
  { label: 'M',  min: 5,  max: 8,        fator: 1.15, maoDeObra: 1200, mensalidade: 299 },
  { label: 'G',  min: 9,  max: 12,       fator: 1.30, maoDeObra: 1800, mensalidade: 449 },
  { label: 'GG', min: 13, max: 16,       fator: 1.50, maoDeObra: 2500, mensalidade: 599 },
  { label: 'E',  min: 17, max: Infinity, fator: 1.75, maoDeObra: 3500, mensalidade: 799 },
];

export type Orcamento = {
  id: string;
  solucaoId: string;
  oportunidadeId: string;
  leadId: string;
  clienteNome: string;
  marca: Marca;
  zonas: number;
  itens: OrcamentoItem[];
  subtotalEquipamentos: number;
  fatorZona: number;
  totalEquipamentos: number;
  maoDeObra: number;
  mensalidade: number;
  desconto: number;       // 0-30 (percentual)
  totalFinal: number;
  observacoes: string;
  status: 'gerado' | 'ajustado' | 'proposta_criada';
  createdAt: string;
};

// --- Etapa 8: Solução Técnica ---

export type ItemSolucao = {
  equipmentId: string;
  quantidade: number;
  observacao: string;
};

export type BlocoTecnico = {
  categoria: BlocoCategoria;
  itens: ItemSolucao[];
};

export type SolucaoTecnica = {
  id: string;
  oportunidadeId: string;
  leadId: string;
  clienteNome: string;
  marca: Marca;
  blocos: BlocoTecnico[];
  observacaoGeral: string;
  status: 'rascunho' | 'aprovada' | 'orcamento_gerado';
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
};
