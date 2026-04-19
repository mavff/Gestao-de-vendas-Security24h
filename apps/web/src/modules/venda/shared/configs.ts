/* ---- Monitoramento config ---- */
export type FaixaMonitoramento = { nome: string; base: number; minimo: number };
export type MonitoramentoConfig = {
  faixas: FaixaMonitoramento[];
  maoDeObra: Record<string, number>;
  /** Valor mensal do add-on "+ Monitoramento de Imagem" somado à mensalidade quando ativo. */
  addonImagemValor: number;
};

export const MONIT_KEY = 'config:monitoramento';

export const DEFAULT_ADDON_IMAGEM_VALOR = 32;

export const DEFAULT_MONIT_CONFIG: MonitoramentoConfig = {
  faixas: [
    { nome: 'Residencial', base: 170, minimo: 150 },
    { nome: 'Comercial Pequeno', base: 200, minimo: 180 },
    { nome: 'Comercial Médio', base: 250, minimo: 220 },
    { nome: 'Comercial Grande', base: 300, minimo: 270 },
    { nome: 'Condomínio / Industrial', base: 400, minimo: 350 },
  ],
  maoDeObra: {
    'Residencial': 250, 'Comercial Pequeno': 400, 'Comercial Médio': 600,
    'Comercial Grande': 900, 'Condomínio / Industrial': 1500,
  },
  addonImagemValor: DEFAULT_ADDON_IMAGEM_VALOR,
};

/** Map tipoLocal to best-match faixa index */
export function faixaIdxFromTipoLocal(tipoLocal: string, faixas: FaixaMonitoramento[]): number {
  const map: Record<string, string> = {
    'Residencial': 'Residencial',
    'Comercial': 'Comercial Pequeno',
    'Condomínio': 'Condomínio / Industrial',
    'Industrial': 'Condomínio / Industrial',
  };
  const target = map[tipoLocal] ?? 'Residencial';
  const idx = faixas.findIndex((f) => f.nome === target);
  return idx >= 0 ? idx : 0;
}

/* ---- Mão de Obra config (markup por tipo de equipamento) ---- */
export type MaoDeObraConfig = {
  markupPorBloco: Record<string, number>;
  acrescimoPorFaixa: Record<string, number>;
};

export const MAO_DE_OBRA_KEY = 'config:mao_de_obra';

export const DEFAULT_MAO_DE_OBRA_CONFIG: MaoDeObraConfig = {
  markupPorBloco: {
    sensor_externo: 25,
    sensor_interno: 20,
    sensor_porta_janela: 15,
    camera_analogica: 40,
    camera_ip: 50,
    camera_ia: 60,
    dvr_nvr: 30,
    central_alarme: 30,
    modulo_comunicacao: 15,
    acessorio: 5,
  },
  acrescimoPorFaixa: {
    'Residencial': 0,
    'Comercial Pequeno': 100,
    'Comercial Médio': 200,
    'Comercial Grande': 400,
    'Condomínio / Industrial': 600,
  },
};

/* ---- Taxa de Instalação config ---- */
export type InstalacaoConfig = {
  percentual: number;
  minimo: number;
};

export const INSTALACAO_KEY = 'config:instalacao';

export const DEFAULT_INSTALACAO_CONFIG: InstalacaoConfig = {
  percentual: 0.10,
  minimo: 200,
};

/** Taxa de instalação = max(subtotalEquipamentos × percentual, minimo). Aplica em venda e comodato. */
export function calcTaxaInstalacao(subtotalEquipamentos: number, config: InstalacaoConfig): number {
  const calculada = subtotalEquipamentos * config.percentual;
  return Math.max(calculada, config.minimo);
}

/* ---- Atribuição de Técnico config ---- */
export type AtribuicaoTecnicoModo = 'manual' | 'auto_round_robin';
export type AtribuicaoTecnicoConfig = {
  modo: AtribuicaoTecnicoModo;
  tecnicosAtivos: string[];
};

export const ATRIBUICAO_TECNICO_KEY = 'config:atribuicao_tecnico';

export const DEFAULT_ATRIBUICAO_TECNICO_CONFIG: AtribuicaoTecnicoConfig = {
  modo: 'manual',
  tecnicosAtivos: [],
};

/** Round-robin: escolhe técnico com menos OS ativas (pendente/agendada/em_andamento/semi_concluida). Empate → alfabético. */
export function escolherTecnicoRoundRobin(
  tecnicosAtivos: string[],
  ordensExistentes: { tecnicoId: string; status: string }[],
): string {
  if (tecnicosAtivos.length === 0) return '';
  const ativos = new Set(['pendente', 'agendada', 'em_andamento', 'semi_concluida']);
  const cargaPorTecnico = new Map<string, number>(tecnicosAtivos.map((t) => [t, 0]));
  for (const os of ordensExistentes) {
    if (os.tecnicoId && ativos.has(os.status) && cargaPorTecnico.has(os.tecnicoId)) {
      cargaPorTecnico.set(os.tecnicoId, (cargaPorTecnico.get(os.tecnicoId) ?? 0) + 1);
    }
  }
  const ordenado = [...tecnicosAtivos].sort((a, b) => {
    const ca = cargaPorTecnico.get(a) ?? 0;
    const cb = cargaPorTecnico.get(b) ?? 0;
    if (ca !== cb) return ca - cb;
    return a.localeCompare(b);
  });
  return ordenado[0] ?? '';
}

/** Calculate mão de obra = base (faixa) + acréscimo (faixa) + sum of markup × qty per bloco */
export function calcMaoDeObra(
  baseFaixa: number,
  faixaNome: string,
  blocos: { categoria: string; quantidade: number }[],
  config: MaoDeObraConfig,
): { total: number; base: number; acrescimo: number; markup: number; detalhes: { bloco: string; qtd: number; valor: number }[] } {
  const acrescimo = config.acrescimoPorFaixa[faixaNome] ?? 0;
  const detalhes: { bloco: string; qtd: number; valor: number }[] = [];
  let markup = 0;
  for (const b of blocos) {
    const rate = config.markupPorBloco[b.categoria] ?? 0;
    if (b.quantidade > 0 && rate > 0) {
      const valor = rate * b.quantidade;
      markup += valor;
      detalhes.push({ bloco: b.categoria, qtd: b.quantidade, valor });
    }
  }
  return { total: baseFaixa + acrescimo + markup, base: baseFaixa, acrescimo, markup, detalhes };
}
