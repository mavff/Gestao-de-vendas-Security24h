/* ---- Monitoramento config ---- */
export type FaixaMonitoramento = { nome: string; base: number; minimo: number };
export type MonitoramentoConfig = { faixas: FaixaMonitoramento[]; maoDeObra: Record<string, number> };

export const MONIT_KEY = 'config:monitoramento';

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
