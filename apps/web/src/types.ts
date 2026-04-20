export type LeadStage = 'Novo' | 'Contato' | 'Proposta' | 'Negociação' | 'Fechado';

export type VendaStep =
  | 'solucao'
  | 'vistoria'
  | 'os_criada';

export type Lead = {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: LeadStage;
  responsible: string;
  origin: string;
  week: string;
  status: 'ativo' | 'pausado';
  notes: string[];
  timeline: { id: string; date: string; text: string }[];
  attachments: { id: string; name: string; url?: string }[];
  contato?: string;
  email?: string;
  endereco?: string;
  tipoLocal?: TipoLocal;
  vendaStep?: VendaStep;
  probabilidade?: number;
};

export type UserRole = 'ADMIN' | 'GESTOR' | 'SDR' | 'VENDEDOR' | 'TECNICO';

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

export type Marca = 'Intelbras' | 'Hikvision' | 'Hilook' | 'Ezviz' | 'DSC' | 'JFL' | 'PPA' | 'Viaweb' | 'Genérico';

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
  pontos?: number;
  acrescimoMensal?: number;
  acrescimoInstalacao?: number;
};

export type Kit = {
  id: string;
  name: string;
  items: { equipmentId: string; quantity: number; itemName?: string; unitPrice?: number }[];
  linkedLeadId?: string;
  marca?: Marca;
  categoria?: KitCategoria;
  descricao?: string;
};

// --- Proposta ---

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

export type PropostaStatus = 'gerada' | 'enviada' | 'aprovada';

export type Proposta = {
  id: string;
  orcamentoId: string;
  leadId: string;
  leadNome: string;
  itens: PropostaItem[];
  servicos: PropostaServico[];
  total: number;
  observacoes: string;
  status: PropostaStatus;
  createdAt: string;
};

// --- Ordem de Serviço ---

export type OSStatus = 'bloqueada' | 'pendente' | 'agendada' | 'em_andamento' | 'semi_concluida' | 'concluida';

export type OrdemDeServico = {
  id: string;
  propostaId?: string;
  vistoriaId?: string;
  leadId: string;
  cliente: string;
  dataAgendada: string;
  tecnicoId: string;
  checklist: ChecklistItem[];
  pontos: InstallationPoint[];
  observacoes: string;
  status: OSStatus;
  createdAt: string;
  /** Foto de comprovação anexada pelo técnico ao marcar semi-concluída (base64 ou token photo:) */
  fotoComprovante?: string;
  /** Observações que o técnico deixa ao finalizar a instalação */
  observacoesTecnico?: string;
  /** ISO timestamp quando técnico marcou semi-concluída */
  semiConcluidaEm?: string;
  /** ISO timestamp quando vendedor/gestor validou e marcou concluída */
  concluidaEm?: string;
  /** Username do vendedor/gestor/admin que validou a conclusão */
  validadoPor?: string;
};

// --- Orçamento ---

export type OrcamentoItem = {
  equipmentId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  precoCusto: number;
  subtotal: number;
  subtotalCusto: number;
  bloco: BlocoCategoria;
};

export type FaixaZona = {
  label: string;
  min: number;
  max: number;
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

export type OrcamentoStatus = 'rascunho' | 'finalizado' | 'escolhido';

export type TipoCentral = 'pequena' | 'media' | 'grande';

export const INCREMENTO_CAMERA = 15;
export const INCREMENTO_CENTRAL: Record<TipoCentral, number> = {
  pequena: 0,
  media: 50,
  grande: 120,
};

export type ComodatoConfig = {
  prazo: 24 | 36 | 48;
  numCameras: number;
  tipoCentral: TipoCentral;
};

export type Orcamento = {
  id: string;
  numero: number;
  solucaoId: string;
  leadId: string;
  clienteNome: string;
  marca: Marca;
  zonas: number;
  itens: OrcamentoItem[];
  subtotalEquipamentos: number;
  subtotalCusto: number;
  fatorZona: number;
  totalEquipamentos: number;
  maoDeObra: number;
  mensalidade: number;
  desconto: number;
  totalFinal: number;
  observacoes: string;
  status: OrcamentoStatus;
  createdAt: string;
  modalidade: 'venda' | 'comodato' | 'imagem';
  comodato?: ComodatoConfig;
};

// --- Solução Técnica ---

export type ItemSolucao = {
  equipmentId: string;
  quantidade: number;
  observacao: string;
};

export type BlocoTecnico = {
  categoria: BlocoCategoria;
  itens: ItemSolucao[];
};

export type SolucaoStatus = 'rascunho' | 'enviada' | 'aprovada';

export type TipoSolucao = 'alarme' | 'cftv' | 'alarme_cftv';

export type TipoLocal =
  | 'Residencial'
  | 'Comercial'
  | 'Condomínio'
  | 'Industrial'
  | 'Galpão'
  | 'Escola/Creche'
  | 'Clínica'
  | 'Posto'
  | 'Rural/Fazenda'
  | 'Outro';

export type SolucaoTecnica = {
  id: string;
  leadId: string;
  clienteNome: string;
  marca: Marca;
  /** Pré-diagnóstico: Alarme, CFTV ou Alarme+CFTV — filtra os kits exibidos ao vendedor. */
  tipoSolucao?: TipoSolucao;
  blocos: BlocoTecnico[];
  servicos: PropostaServico[];
  observacaoGeral: string;
  status: SolucaoStatus;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
};

// --- Vistoria ---

// --- Venda do Vendedor (Mini CRM) ---

export type VendaLocalStatus =
  | 'rascunho'
  | 'solucao_pronta'
  | 'proposta_gerada'
  | 'cliente_aprovou'
  | 'vistoria'
  | 'em_instalacao'
  | 'entrega'
  | 'concluida'
  | 'perdida';

export type VendaLocal = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  clienteEndereco: string;
  clienteEmpresa: string;
  tipoLocal: TipoLocal;
  observacoes: string;
  status: VendaLocalStatus;
  solucaoId: string;
  vistoriaId: string;
  ordemId: string;
  propostaId: string;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
  /** Pipeline lead linkage (optional) */
  leadId?: string;
  /** Proposta — modalidade escolhida */
  modalidade?: 'venda' | 'comodato' | 'ambos' | 'imagem';
  /** Proposta — monitoramento mensal ajustado */
  monitoramentoMensal?: number;
  /** Proposta — mão de obra */
  maoDeObra?: number;
  /** Proposta — prazo comodato */
  prazoComodato?: 24 | 36 | 48;
  /** Proposta — acréscimo instalação */
  acrescimoInstalacao?: number;
  /** Proposta — valor CREA */
  valorCrea?: number;
  /** Proposta — add-on "+ Monitoramento de Imagem" somado à mensalidade */
  addonImagemAtivo?: boolean;
  /** Flag: cliente aprovou a proposta */
  clienteAprovado?: boolean;
  /** Visita 1 concluída (pré-instalação) */
  visita1Concluida?: boolean;
  /** Visita 2 concluída (entrega/conferência) */
  visita2Concluida?: boolean;
  /** Contrato assinado anexado (token do PhotoService, ex.: photo:<uuid>) */
  contratoUrl?: string;
  /** ISO timestamp do anexo do contrato assinado */
  contratoAssinadoEm?: string;
  /** ISO timestamp do agendamento da instalação */
  instalacaoAgendadaEm?: string;
  /** ISO timestamp da conclusão da instalação */
  instalacaoConcluidaEm?: string;
  /** ID do registro de aprovação com assinatura (OrcamentoAprovacao no backend) */
  aprovacaoId?: string;
};

export type ActivityLogType =
  | 'venda_criada'
  | 'cliente_editado'
  | 'solucao_salva'
  | 'solucao_enviada'
  | 'solucao_aprovada'
  | 'vistoria_iniciada'
  | 'ambiente_adicionado'
  | 'ponto_adicionado'
  | 'foto_adicionada'
  | 'vistoria_concluida'
  | 'proposta_gerada'
  | 'proposta_enviada'
  | 'os_criada'
  | 'instalacao_iniciada'
  | 'entrega_concluida'
  | 'status_alterado'
  | 'observacao';

export type ActivityLog = {
  id: string;
  vendaId: string;
  tipo: ActivityLogType;
  descricao: string;
  criadoPor: string;
  createdAt: string;
  /** Optional metadata (e.g. photo count, equipment name) */
  meta?: Record<string, string | number>;
};

export type VistoriaStatus = 'pendente' | 'em_andamento' | 'concluida';

export type AmbienteVistoria = {
  id: string;
  nome: string;
  pontos: InstallationPoint[];
  status: 'pendente' | 'concluido';
};

export type Vistoria = {
  id: string;
  leadId: string;
  propostaId: string;
  ambientes: AmbienteVistoria[];
  plantaUrl?: string;
  observacoes: string;
  status: VistoriaStatus;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
};
