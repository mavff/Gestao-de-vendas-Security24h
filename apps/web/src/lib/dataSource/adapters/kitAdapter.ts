import { Kit } from '../../../types';
import { KitApiDto, ProductKitItemApiDto } from '../types';

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    if (Number.isFinite(normalized)) return normalized;
  }
  return 0;
}

function mapKitItem(item: ProductKitItemApiDto): { equipmentId: string; quantity: number } | null {
  const equipmentId = item.itemProduto?.codProduto ?? item.codProdutoAgregado;
  if (!equipmentId) return null;

  const quantity = Math.max(0, toNumber(item.quantidade));
  if (!quantity) return null;

  return {
    equipmentId: String(equipmentId),
    quantity,
  };
}

export function mapKitToUi(kit: KitApiDto): Kit {
  const aggregatedItems = new Map<string, number>();
  const sourceItems = kit.kitItens || [];

  for (const rawItem of sourceItems) {
    const mapped = mapKitItem(rawItem);
    if (!mapped) continue;
    aggregatedItems.set(mapped.equipmentId, (aggregatedItems.get(mapped.equipmentId) || 0) + mapped.quantity);
  }

  return {
    id: String(kit.codProduto),
    name: kit.descricao || `Kit ${kit.codProduto}`,
    items: Array.from(aggregatedItems.entries()).map(([equipmentId, quantity]) => ({ equipmentId, quantity })),
  };
}

export function mapKitsToUi(kits: KitApiDto[]): Kit[] {
  return kits.map(mapKitToUi);
}

