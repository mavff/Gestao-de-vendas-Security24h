import type { BlocoCategoria, BlocoTecnico, Kit, Marca } from '../../../types';
import type { PreOrcamentoApiDto } from '../../../lib/dataSource/types';

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
