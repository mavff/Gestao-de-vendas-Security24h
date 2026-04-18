import { BlocoCategoria, Equipment, EquipmentCategory, Marca } from '../../../types';
import { ProductApiDto } from '../types';

// Códigos reais da tabela DadosEntidades (codEntidade=2 = Marcas)
const BRAND_CODE_MAP: Record<number, Marca> = {
  2397: 'Intelbras',
  12166: 'Hikvision',  // HIKIVISION no banco
  12011: 'Hilook',
  36629: 'Ezviz',      // EZEVIZ no banco
  2401:  'DSC',
  2410:  'JFL',
  11930: 'PPA',
  26139: 'Viaweb',
  28:    'Genérico',   // Marca Geral
};

const BRAND_KEYWORDS: Array<{ keyword: string; brand: Marca }> = [
  { keyword: 'intelbras', brand: 'Intelbras' },
  { keyword: 'hikvision', brand: 'Hikvision' },
  { keyword: 'hikivision', brand: 'Hikvision' },
  { keyword: 'hilook', brand: 'Hilook' },
  { keyword: 'ezviz', brand: 'Ezviz' },
  { keyword: 'ezeviz', brand: 'Ezviz' },
  { keyword: 'jfl', brand: 'JFL' },
  { keyword: 'dsc', brand: 'DSC' },
  { keyword: 'viaweb', brand: 'Viaweb' },
  { keyword: 'ppa', brand: 'PPA' },
];

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    if (Number.isFinite(normalized)) return normalized;
  }
  return 0;
}

export function inferBrand(product: ProductApiDto): Marca {
  if (typeof product.codMarca === 'number' && product.codMarca in BRAND_CODE_MAP) {
    return BRAND_CODE_MAP[product.codMarca];
  }

  const text = `${product.descricao} ${product.codFabricante || ''}`.toLowerCase();
  const fromText = BRAND_KEYWORDS.find((item) => text.includes(item.keyword));
  return fromText?.brand ?? 'Genérico';
}

function inferCategory(product: ProductApiDto): EquipmentCategory {
  const grupo = (product.grupoOrcamento || '').toUpperCase().trim();

  if (grupo === 'CFTV') return 'Câmera';

  if (grupo === 'ALARME') {
    const text = product.descricao.toLowerCase();
    if (text.includes('sensor') || text.includes('ivp') || text.includes('pir') || text.includes('detector')) return 'Sensor';
    if (text.includes('central') || text.includes('módulo') || text.includes('modulo') || text.includes('ethernet') || text.includes('gprs')) return 'Central';
    return 'Central';
  }

  // Fallback por descrição para grupos vazios ou outros (CERCA ELÉTRICA, RASTREAMENTO, etc.)
  const text = product.descricao.toLowerCase();
  if (text.includes('camera') || text.includes('câmera') || text.includes('dvr') || text.includes('nvr')) return 'Câmera';
  if (text.includes('sensor') || text.includes('detector') || text.includes('pir')) return 'Sensor';
  if (text.includes('central') || text.includes('modulo') || text.includes('módulo')) return 'Central';
  return 'Acessório';
}

function defaultBloco(category: EquipmentCategory): BlocoCategoria {
  switch (category) {
    case 'Câmera':
      return 'camera_ip';
    case 'Sensor':
      return 'sensor_interno';
    case 'Central':
      return 'central_alarme';
    default:
      return 'acessorio';
  }
}

function inferBloco(product: ProductApiDto, category: EquipmentCategory): BlocoCategoria {
  const text = product.descricao.toLowerCase();

  if (category === 'Câmera') {
    if (text.includes('ia')) return 'camera_ia';
    if (text.includes('dvr') || text.includes('nvr')) return 'dvr_nvr';
    if (text.includes('anal') || text.includes('vhd')) return 'camera_analogica';
    return 'camera_ip';
  }

  if (category === 'Sensor') {
    if (text.includes('porta') || text.includes('janela') || text.includes('magn')) return 'sensor_porta_janela';
    if (text.includes('extern')) return 'sensor_externo';
    return 'sensor_interno';
  }

  if (category === 'Central') {
    if (text.includes('dvr') || text.includes('nvr')) return 'dvr_nvr';
    if (text.includes('comunic') || text.includes('ethernet') || text.includes('gprs')) return 'modulo_comunicacao';
    return 'central_alarme';
  }

  return defaultBloco(category);
}

export function mapProductToEquipment(product: ProductApiDto): Equipment {
  const category = inferCategory(product);
  const bloco = inferBloco(product, category);

  return {
    id: String(product.codProduto),
    name: product.descricao || `Produto ${product.codProduto}`,
    sku: product.codFabricante || String(product.codProduto),
    category,
    marca: inferBrand(product),
    bloco,
    price: toNumber(product.preco),
    estoque: 0,
    descricao: product.descricao || '',
    pontos: toNumber(product.pontos) || undefined,
    acrescimoMensal: toNumber(product.acrescimoMensal) || undefined,
    acrescimoInstalacao: toNumber(product.acrescimoInstalacao) || undefined,
    estoquePadrao: typeof product.estoquePadrao === 'number' ? product.estoquePadrao : undefined,
  };
}

export function mapProductsToEquipments(products: ProductApiDto[]): Equipment[] {
  return products.map(mapProductToEquipment);
}

