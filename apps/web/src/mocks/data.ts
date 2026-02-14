import { Equipment, Installation, Kit, Lead, Mission, Oportunidade, Orcamento, OrdemDeServico, Proposta, SolucaoTecnica, User } from '../types';

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
    fotos: [],
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
    fotos: [],
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
    fotos: [],
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
    fotos: [],
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
    fotos: [],
  },
];

export const mockUsers: User[] = [
  { id: 'U1', name: 'Admin Master', role: 'ADMIN', status: 'ativo' },
  { id: 'U2', name: 'Paula Vendas', role: 'VENDEDOR', status: 'ativo' },
  { id: 'U3', name: 'Marcos SDR', role: 'SDR', status: 'ativo' },
  { id: 'U4', name: 'Téc. Bruno', role: 'TECNICO', status: 'inativo' },
  { id: 'U5', name: 'Rafael Infra', role: 'INFRA', status: 'ativo' },
  { id: 'U6', name: 'Carla Monitor', role: 'MONITOR', status: 'ativo' },
  { id: 'U7', name: 'Renata Gestora', role: 'GESTOR', status: 'ativo' },
];

export const mockMissions: Mission[] = [
  { id: 'M1', title: 'Follow-up top 10 leads', description: 'Entrar em contato com os 10 leads de maior valor que não receberam follow-up na última semana.', assignedTo: 'U3', status: 'Pendente', priority: 'Alta', dueDate: '2026-02-15', createdAt: '2026-02-01' },
  { id: 'M2', title: 'Atualizar proposta Mercado Alfa', description: 'Revisar valores e incluir desconto de 5% conforme negociação.', assignedTo: 'U2', status: 'Em andamento', priority: 'Alta', dueDate: '2026-02-12', createdAt: '2026-02-02' },
  { id: 'M3', title: 'Revisão técnica Loja Beta', description: 'Verificar pontos de instalação e validar viabilidade técnica.', assignedTo: 'U4', status: 'Concluída', priority: 'Média', dueDate: '2026-02-08', createdAt: '2026-01-28' },
  { id: 'M4', title: 'Cadastrar novos equipamentos', description: 'Adicionar 3 novos modelos de câmera ao catálogo.', assignedTo: 'U5', status: 'Pendente', priority: 'Baixa', dueDate: '2026-02-20', createdAt: '2026-02-05' },
  { id: 'M5', title: 'Ligar para leads da campanha', description: 'Fazer primeiro contato com leads originados da campanha de janeiro.', assignedTo: 'U3', status: 'Em andamento', priority: 'Média', dueDate: '2026-02-18', createdAt: '2026-02-03' },
  { id: 'M6', title: 'Montar kit condomínio premium', description: 'Criar kit de equipamentos para condomínios acima de 100 unidades.', assignedTo: 'U2', status: 'Pendente', priority: 'Média', dueDate: '2026-02-22', createdAt: '2026-02-06' },
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
  // Intelbras — Sensores
  { id: 'E1', name: 'Câmera Dome VHD 1220 D', sku: 'INT-VHD1220D', category: 'Câmera', marca: 'Intelbras', bloco: 'camera_analogica', price: 420, estoque: 35, descricao: 'Câmera dome Full HD 1080p, IR 20m, IP67' },
  { id: 'E2', name: 'Sensor IVP 3000 CF', sku: 'INT-IVP3000', category: 'Sensor', marca: 'Intelbras', bloco: 'sensor_interno', price: 95, estoque: 60, descricao: 'Sensor interno cortina, alcance 9m' },
  { id: 'E3', name: 'Central AMT 4010 Smart', sku: 'INT-AMT4010', category: 'Central', marca: 'Intelbras', bloco: 'central_alarme', price: 750, estoque: 12, descricao: 'Central de alarme 10 zonas, Wi-Fi integrado' },
  { id: 'E4', name: 'Fonte 12V 5A', sku: 'GEN-F12V5A', category: 'Acessório', marca: 'Genérico', bloco: 'acessorio', price: 70, estoque: 80, descricao: 'Fonte chaveada 12V 5A' },
  { id: 'E5', name: 'Câmera VIP 1230 B G2', sku: 'INT-VIP1230B', category: 'Câmera', marca: 'Intelbras', bloco: 'camera_ip', price: 580, estoque: 20, descricao: 'Câmera IP bullet 2MP, visão noturna 30m, PoE' },
  { id: 'E6', name: 'Sensor XAS 4010 Smart', sku: 'INT-XAS4010', category: 'Sensor', marca: 'Intelbras', bloco: 'sensor_porta_janela', price: 45, estoque: 100, descricao: 'Sensor magnético para portas e janelas' },
  { id: 'E7', name: 'DVR MHDX 1008-C', sku: 'INT-MHDX1008', category: 'Central', marca: 'Intelbras', bloco: 'dvr_nvr', price: 1200, estoque: 8, descricao: 'DVR 8 canais, H.265, acesso remoto' },
  { id: 'E8', name: 'Cabo coaxial RG59 100m', sku: 'GEN-CX100', category: 'Acessório', marca: 'Genérico', bloco: 'acessorio', price: 120, estoque: 40, descricao: 'Cabo coaxial RG59 com alimentação, rolo 100m' },
  // Intelbras — Mais produtos
  { id: 'E9', name: 'IVP 5002 PET', sku: 'INT-IVP5002', category: 'Sensor', marca: 'Intelbras', bloco: 'sensor_externo', price: 210, estoque: 30, descricao: 'Sensor externo duplo PET, alcance 15m' },
  { id: 'E10', name: 'Sensor IVP 2000', sku: 'INT-IVP2000', category: 'Sensor', marca: 'Intelbras', bloco: 'sensor_interno', price: 65, estoque: 80, descricao: 'Sensor PIR interno passivo, alcance 12m' },
  { id: 'E11', name: 'VHD 1120 D', sku: 'INT-VHD1120', category: 'Câmera', marca: 'Intelbras', bloco: 'camera_analogica', price: 320, estoque: 25, descricao: 'Câmera dome analógica HD 720p, IR 20m' },
  { id: 'E12', name: 'VIP 7230 IA', sku: 'INT-VIP7230', category: 'Câmera', marca: 'Intelbras', bloco: 'camera_ia', price: 1850, estoque: 6, descricao: 'Câmera IP com IA, detecção facial, 2MP' },
  { id: 'E13', name: 'NVD 1308', sku: 'INT-NVD1308', category: 'Central', marca: 'Intelbras', bloco: 'dvr_nvr', price: 980, estoque: 10, descricao: 'NVR 8 canais IP, H.265, PoE opcional' },
  { id: 'E14', name: 'XE 4000 Smart', sku: 'INT-XE4000', category: 'Central', marca: 'Intelbras', bloco: 'modulo_comunicacao', price: 340, estoque: 15, descricao: 'Módulo Ethernet/GPRS para centrais Intelbras' },
  { id: 'E15', name: 'Fonte VFP 1210', sku: 'INT-VFP1210', category: 'Acessório', marca: 'Intelbras', bloco: 'acessorio', price: 85, estoque: 45, descricao: 'Fonte para CFTV 12V 10A com 18 saídas' },
  // Hikvision
  { id: 'E16', name: 'DS-2CE16D0T-IRF', sku: 'HIK-CE16D0T', category: 'Câmera', marca: 'Hikvision', bloco: 'camera_analogica', price: 290, estoque: 18, descricao: 'Câmera bullet Turbo HD 2MP, IR 25m' },
  { id: 'E17', name: 'DS-2CD1023G2-LIU', sku: 'HIK-CD1023', category: 'Câmera', marca: 'Hikvision', bloco: 'camera_ip', price: 620, estoque: 14, descricao: 'Câmera IP bullet 2MP, ColorVu, mic integrado' },
  { id: 'E18', name: 'DS-2CD2347G2P-LSU', sku: 'HIK-CD2347', category: 'Câmera', marca: 'Hikvision', bloco: 'camera_ia', price: 2100, estoque: 4, descricao: 'Câmera IP 4MP com AcuSense, panorâmica 180°' },
  { id: 'E19', name: 'DS-7208HUHI-K1', sku: 'HIK-7208', category: 'Central', marca: 'Hikvision', bloco: 'dvr_nvr', price: 1450, estoque: 6, descricao: 'DVR 8 canais 5MP, H.265 Pro+' },
  { id: 'E20', name: 'DS-PDC15-EG2', sku: 'HIK-PDC15', category: 'Sensor', marca: 'Hikvision', bloco: 'sensor_externo', price: 280, estoque: 20, descricao: 'Sensor cortina externo wireless, alcance 15m' },
  { id: 'E21', name: 'DS-PD2-P15C-W', sku: 'HIK-PD2P15', category: 'Sensor', marca: 'Hikvision', bloco: 'sensor_interno', price: 150, estoque: 35, descricao: 'Sensor PIR interno wireless, PET 15kg' },
  { id: 'E22', name: 'DS-PDMC-EG2', sku: 'HIK-PDMC', category: 'Sensor', marca: 'Hikvision', bloco: 'sensor_porta_janela', price: 65, estoque: 50, descricao: 'Sensor magnético wireless porta/janela' },
  { id: 'E23', name: 'DS-PWA96-Kit-WB', sku: 'HIK-PWA96', category: 'Central', marca: 'Hikvision', bloco: 'modulo_comunicacao', price: 890, estoque: 5, descricao: 'Hub AX PRO Wi-Fi/3G/4G, até 96 zonas' },
  // DSC
  { id: 'E24', name: 'LC-100-PI', sku: 'DSC-LC100', category: 'Sensor', marca: 'DSC', bloco: 'sensor_externo', price: 195, estoque: 25, descricao: 'Sensor externo PIR, alcance 15m, PET imune' },
  { id: 'E25', name: 'LC-104-PIMW', sku: 'DSC-LC104', category: 'Sensor', marca: 'DSC', bloco: 'sensor_interno', price: 120, estoque: 40, descricao: 'Sensor interno PIR microondas, anti-masking' },
  { id: 'E26', name: 'EV-DW4975', sku: 'DSC-DW4975', category: 'Sensor', marca: 'DSC', bloco: 'sensor_porta_janela', price: 55, estoque: 70, descricao: 'Sensor magnético wireless vandalproof' },
  { id: 'E27', name: 'HS2032 Neo', sku: 'DSC-HS2032', category: 'Central', marca: 'DSC', bloco: 'central_alarme', price: 680, estoque: 8, descricao: 'Central PowerSeries Neo 32 zonas' },
  { id: 'E28', name: 'TL405LE', sku: 'DSC-TL405', category: 'Central', marca: 'DSC', bloco: 'modulo_comunicacao', price: 420, estoque: 12, descricao: 'Comunicador dual 4G/Ethernet para Neo' },
  // Genérico — Acessórios
  { id: 'E29', name: 'Conector BNC macho', sku: 'GEN-BNC01', category: 'Acessório', marca: 'Genérico', bloco: 'acessorio', price: 3, estoque: 500, descricao: 'Conector BNC macho de mola' },
  { id: 'E30', name: 'Cabo UTP Cat5e 100m', sku: 'GEN-UTP100', category: 'Acessório', marca: 'Genérico', bloco: 'acessorio', price: 180, estoque: 30, descricao: 'Cabo UTP Cat5e caixa 100m, uso interno' },
  { id: 'E31', name: 'Caixa de passagem', sku: 'GEN-CXP01', category: 'Acessório', marca: 'Genérico', bloco: 'acessorio', price: 25, estoque: 100, descricao: 'Caixa de passagem sobrepor 10x10cm' },
];

export const mockKits: Kit[] = [
  { id: 'K1', name: 'Kit Loja Pequena', items: [{ equipmentId: 'E1', quantity: 4 }, { equipmentId: 'E2', quantity: 2 }] },
];

export const mockOportunidades: Oportunidade[] = [
  { id: 'OP1', leadId: 'L3', valorEstimado: 18400, probabilidade: 70, proximaAcao: 'Enviar proposta revisada', status: 'aberta', vendedorId: 'U2', createdAt: '2026-01-09' },
  { id: 'OP2', leadId: 'L5', valorEstimado: 32200, probabilidade: 100, proximaAcao: '', status: 'ganha', vendedorId: 'U2', createdAt: '2026-01-11' },
];

export const mockPropostas: Proposta[] = [
  {
    id: 'PR1', oportunidadeId: 'OP1', leadId: 'L3', leadNome: 'Ricardo Moraes — Loja Beta',
    itens: [
      { equipamentoId: 'E1', nome: 'Câmera Dome 2MP', quantidade: 4, precoUnitario: 420 },
      { equipamentoId: 'E2', nome: 'Sensor IVP', quantidade: 2, precoUnitario: 180 },
    ],
    servicos: [
      { descricao: 'Instalação completa', valor: 1200, tipo: 'instalacao' },
      { descricao: 'Monitoramento 24h', valor: 350, tipo: 'mensalidade' },
    ],
    total: 3690,
    observacoes: 'Proposta válida por 15 dias.',
    status: 'enviado',
    createdAt: '2026-01-10',
  },
];

export const mockOrdens: OrdemDeServico[] = [
  {
    id: 'OS1', propostaId: 'PR-SEED1', oportunidadeId: 'OP2', leadId: 'L5',
    cliente: 'Luan Costa — Auto Center X',
    dataAgendada: '2026-02-20', tecnicoId: 'U4',
    checklist: [
      { id: 'CK1', text: 'Instalar 6x Câmera Dome 2MP', done: true },
      { id: 'CK2', text: 'Instalar 2x Sensor IVP', done: false },
      { id: 'CK3', text: 'Instalar 1x Central de Alarme X', done: false },
    ],
    pontos: [
      { id: 'OSP1', environment: 'Fachada', type: 'Câmera Dome 2MP', note: 'Cobrir entrada veículos', status: 'Finalizado', photos: [], locationTag: 'Câmera frontal' },
      { id: 'OSP2', environment: 'Oficina', type: 'Sensor IVP', note: 'Altura 2.5m', status: 'Em execução', photos: [], locationTag: 'Sensor presença' },
      { id: 'OSP3', environment: 'Escritório', type: 'Central de Alarme X', note: '', status: 'Pendente', photos: [], locationTag: 'Central alarme' },
    ],
    observacoes: 'Cliente pede instalação fora do horário comercial.',
    status: 'em andamento',
    createdAt: '2026-01-15',
  },
  {
    id: 'OS2', propostaId: 'PR-SEED2', oportunidadeId: 'OP1', leadId: 'L3',
    cliente: 'Ricardo Moraes — Loja Beta',
    dataAgendada: '2026-02-25', tecnicoId: '',
    checklist: [
      { id: 'CK4', text: 'Instalar 4x Câmera Dome 2MP', done: false },
      { id: 'CK5', text: 'Instalar 2x Sensor IVP', done: false },
    ],
    pontos: [],
    observacoes: '',
    status: 'pendente',
    createdAt: '2026-01-18',
  },
];

export const mockOrcamentos: Orcamento[] = [];

export const mockSolucoes: SolucaoTecnica[] = [
  {
    id: 'SOL1',
    oportunidadeId: 'OP1',
    leadId: 'L3',
    clienteNome: 'Ricardo Moraes — Loja Beta',
    marca: 'Intelbras',
    blocos: [
      { categoria: 'sensor_externo', itens: [{ equipmentId: 'E9', quantidade: 2, observacao: 'Perímetro frontal, h=2.2m' }] },
      { categoria: 'sensor_interno', itens: [{ equipmentId: 'E2', quantidade: 3, observacao: 'Corredor, estoque, escritório' }] },
      { categoria: 'sensor_porta_janela', itens: [{ equipmentId: 'E6', quantidade: 4, observacao: 'Portas fundos e lateral' }] },
      { categoria: 'camera_analogica', itens: [] },
      { categoria: 'camera_ip', itens: [{ equipmentId: 'E5', quantidade: 4, observacao: '2 fachada, 1 estoque, 1 caixa' }] },
      { categoria: 'camera_ia', itens: [] },
      { categoria: 'dvr_nvr', itens: [{ equipmentId: 'E13', quantidade: 1, observacao: 'Rack no escritório' }] },
      { categoria: 'modulo_comunicacao', itens: [{ equipmentId: 'E14', quantidade: 1, observacao: '' }] },
      { categoria: 'central_alarme', itens: [{ equipmentId: 'E3', quantidade: 1, observacao: '' }] },
      { categoria: 'acessorio', itens: [{ equipmentId: 'E15', quantidade: 1, observacao: '' }, { equipmentId: 'E30', quantidade: 2, observacao: '' }] },
    ],
    observacaoGeral: 'Cliente quer câmeras com boa visão noturna. Priorizar fachada e estoque.',
    status: 'rascunho',
    criadoPor: 'U2',
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
];
