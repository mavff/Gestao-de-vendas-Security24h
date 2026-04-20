import type { BlocoCategoria, BlocoTecnico, Kit, KitCategoria, Marca, TipoLocal, TipoSolucao } from '../../../types';
import type { PreOrcamentoApiDto } from '../../../lib/dataSource/types';

/** Tipos de local com ícone visível pro vendedor (pills na etapa Cliente). */
export const TIPOS_LOCAL: { value: TipoLocal; icon: string; label: string }[] = [
  { value: 'Residencial',      icon: '🏠', label: 'Residencial' },
  { value: 'Comercial',        icon: '🏪', label: 'Comercial' },
  { value: 'Galpão',           icon: '🏭', label: 'Galpão/Indústria' },
  { value: 'Industrial',       icon: '⚙️', label: 'Industrial' },
  { value: 'Condomínio',       icon: '🏢', label: 'Condomínio' },
  { value: 'Escola/Creche',    icon: '🏫', label: 'Escola/Creche' },
  { value: 'Clínica',          icon: '🏥', label: 'Clínica' },
  { value: 'Posto',            icon: '⛽', label: 'Posto' },
  { value: 'Rural/Fazenda',    icon: '🌾', label: 'Rural/Fazenda' },
  { value: 'Outro',            icon: '📍', label: 'Outro' },
];

/** Pré-diagnóstico: tipo de solução que o cliente precisa. */
export const TIPOS_SOLUCAO: { value: TipoSolucao; icon: string; label: string; hint: string }[] = [
  { value: 'alarme',       icon: '🚨', label: 'Alarme',          hint: 'Central + sensores' },
  { value: 'cftv',         icon: '📹', label: 'CFTV / Câmeras',  hint: 'Câmeras + gravador' },
  { value: 'alarme_cftv',  icon: '🛡️', label: 'Alarme + CFTV',   hint: 'Solução completa' },
];

/** Kit categorias associadas a cada tipo de solução (pra filtrar kits exibidos). */
export const CATEGORIAS_POR_TIPO_SOLUCAO: Record<TipoSolucao, KitCategoria[]> = {
  alarme: ['alarme_residencial', 'alarme_comercial'],
  cftv: ['cftv_analogico', 'cftv_ip', 'cftv_inteligente'],
  alarme_cftv: ['alarme_cftv'],
};

/**
 * Palavras-chave para classificar um ITEM individual do kit.
 * Evitam marcas ambíguas (Hikvision, Hilook, Ezviz, Intelbras fabricam alarme E CFTV).
 */
const ALARME_ITEM_KW = [
  'alarme', 'central alarme', 'central de alarme', 'amt',
  'ivp', 'xas', 'xar', 'xep', 'xe ',
  'sirene', 'discadora', 'comunicador', 'gsm',
  'magnético', 'magnetico', 'teclado',
  'infravermelho', 'infra ativo', 'infra passivo',
  'pânico', 'panico', 'viaweb',
];
const CFTV_ITEM_KW = [
  'câmera', 'camera', 'cameras', 'câmeras', 'cftv',
  'dvr', 'nvr', 'mhdx', 'vhd', 'vhl', 'vip', 'ipc', 'hdcvi',
  'dome', 'bullet', 'ptz', 'speed dome',
  'poe', 'switch poe', 'cabo lan', 'cabo utp', 'rj45', 'coaxial',
  'gravador nvr', 'gravador dvr', 'gravador digital',
];
/** Keywords mais fracas — só usados se classificação por itens não der resultado. */
const ALARME_NAME_FALLBACK = ['alarme', 'central', 'sensor'];
const CFTV_NAME_FALLBACK = ['cftv', 'câmera', 'camera', 'monitoramento imagem', 'vigilância', 'vigilancia'];

function matchAny(text: string, kws: string[]): boolean {
  const s = text.toLowerCase();
  return kws.some((kw) => s.includes(kw));
}

/**
 * Dado um kit, infere o tipo de solução que ele atende.
 *
 * Ordem de prioridade:
 * 1. `kit.categoria` explícita (escolhida pelo admin em /kits)
 * 2. Classificação item-a-item (mais confiável — produtos revelam a função real)
 * 3. Fallback no nome do kit com keywords não-ambíguas
 */
export function inferKitTipoSolucao(kit: Kit): TipoSolucao | null {
  if (kit.categoria) {
    for (const [tipo, categorias] of Object.entries(CATEGORIAS_POR_TIPO_SOLUCAO) as [TipoSolucao, KitCategoria[]][]) {
      if (categorias.includes(kit.categoria)) return tipo;
    }
  }

  // Classificação por itens — cada item vota alarme/cftv (ou nada).
  let countAlarme = 0;
  let countCftv = 0;
  for (const item of kit.items) {
    const nome = item.itemName ?? '';
    if (matchAny(nome, CFTV_ITEM_KW)) countCftv++;
    else if (matchAny(nome, ALARME_ITEM_KW)) countAlarme++;
  }
  if (countAlarme > 0 && countCftv > 0) return 'alarme_cftv';
  if (countAlarme > 0) return 'alarme';
  if (countCftv > 0) return 'cftv';

  // Fallback: olhar o nome do kit.
  const nome = `${kit.name} ${kit.descricao ?? ''}`;
  const hasAlarme = matchAny(nome, ALARME_NAME_FALLBACK);
  const hasCftv = matchAny(nome, CFTV_NAME_FALLBACK);
  if (hasAlarme && hasCftv) return 'alarme_cftv';
  if (hasAlarme) return 'alarme';
  if (hasCftv) return 'cftv';
  return null;
}

export const marcas: Marca[] = ['Intelbras', 'Hikvision', 'Hilook', 'Ezviz', 'DSC', 'JFL', 'PPA', 'Viaweb', 'Genérico'];

/** Infer brand from pre-orcamento name or majority product brand */
export const BRAND_KEYWORDS_KIT: Array<{ kw: string; brand: Marca }> = [
  { kw: 'intelbras', brand: 'Intelbras' }, { kw: 'smart', brand: 'Intelbras' },
  { kw: 'hikvision', brand: 'Hikvision' }, { kw: 'hilook', brand: 'Hilook' },
  { kw: 'ezviz', brand: 'Ezviz' }, { kw: 'dsc', brand: 'DSC' },
  { kw: 'jfl', brand: 'JFL' }, { kw: 'ppa', brand: 'PPA' }, { kw: 'viaweb', brand: 'Viaweb' },
];

export const MARCA_CODE: Record<number, Marca> = {
  2397: 'Intelbras', 12166: 'Hikvision', 40022: 'Hikvision', 12011: 'Hilook',
  36629: 'Ezviz', 2401: 'DSC', 2410: 'JFL', 11930: 'PPA', 26139: 'Viaweb',
};

export function inferKitMarca(m: PreOrcamentoApiDto): Marca {
  const nameLower = (m.descricao || '').toLowerCase();
  const fromName = BRAND_KEYWORDS_KIT.find((b) => nameLower.includes(b.kw));
  if (fromName) return fromName.brand;
  const counts = new Map<Marca, number>();
  for (const p of m.produtos) {
    const raw = p.produto as Record<string, unknown> | undefined;
    const codMarca = typeof raw?.codMarca === 'number' ? raw.codMarca : undefined;
    if (codMarca && codMarca in MARCA_CODE) {
      const brand = MARCA_CODE[codMarca];
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
  }
  let best: Marca = 'Genérico';
  let bestCount = 0;
  for (const [brand, count] of counts) {
    if (count > bestCount) { best = brand; bestCount = count; }
  }
  return best;
}

/** Convert pre-orcamento (modelo) to Kit for unified display */
export function preOrcToKit(m: PreOrcamentoApiDto): Kit {
  return {
    id: `modelo_${m.codInterno}`,
    name: m.descricao,
    marca: inferKitMarca(m),
    items: m.produtos.map((p) => ({
      equipmentId: String(p.produto?.codProduto ?? p.codProduto ?? 0),
      quantity: Number(p.quantidade) || 1,
      itemName: p.produto?.descricao ?? p.descricao ?? '?',
      unitPrice: p.produto?.preco != null ? Number(p.produto.preco) : undefined,
    })),
  };
}

export const allBlocos: BlocoCategoria[] = [
  'sensor_externo', 'sensor_interno', 'sensor_porta_janela',
  'camera_analogica', 'camera_ip', 'camera_ia',
  'dvr_nvr', 'central_alarme', 'modulo_comunicacao', 'acessorio',
];

export const blocoLabels: Record<BlocoCategoria, string> = {
  sensor_externo: 'Sensores Externos',
  sensor_interno: 'Sensores Internos',
  sensor_porta_janela: 'Sensores Porta/Janela',
  camera_analogica: 'Câmeras Analógicas',
  camera_ip: 'Câmeras IP',
  camera_ia: 'Câmeras com IA',
  dvr_nvr: 'DVR / NVR',
  modulo_comunicacao: 'Módulo de Comunicação',
  central_alarme: 'Central de Alarme',
  acessorio: 'Acessórios',
};

export type WizardStep = { label: string; blocos: BlocoCategoria[] };

export const wizardSteps: WizardStep[] = [
  { label: 'Marca', blocos: [] },
  { label: 'Sensores', blocos: ['sensor_externo', 'sensor_interno', 'sensor_porta_janela'] },
  { label: 'Câmeras', blocos: ['camera_analogica', 'camera_ip', 'camera_ia'] },
  { label: 'Gravação / Central', blocos: ['dvr_nvr', 'central_alarme'] },
  { label: 'Comunicação', blocos: ['modulo_comunicacao'] },
  { label: 'Acessórios', blocos: ['acessorio'] },
  { label: 'Resumo', blocos: [] },
];

export const STEP_LABELS = ['Cliente', 'Solução', 'Proposta', '1ª Visita', 'Entrega', 'Resumo'] as const;
export type StepName = (typeof STEP_LABELS)[number];

export function emptyBlocos(): BlocoTecnico[] {
  return allBlocos.map((cat) => ({ categoria: cat, itens: [] }));
}

export function fmtCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(iso: string): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; }
}

export function fmtDateTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
