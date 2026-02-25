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

function mapKitItem(item: ProductKitItemApiDto): {
  equipmentId: string;
  quantity: number;
  itemName?: string;
  unitPrice?: number;
} | null {
  const equipmentId = item.itemProduto?.codProduto ?? item.codProdutoAgregado;
  if (!equipmentId) return null;

  const quantity = Math.max(0, toNumber(item.quantidade));
  if (!quantity) return null;

  return {
    equipmentId: String(equipmentId),
    quantity,
    itemName: item.itemProduto?.descricao ?? undefined,
    unitPrice: item.itemProduto?.preco != null ? toNumber(item.itemProduto.preco) : undefined,
  };
}

export function mapKitToUi(kit: KitApiDto): Kit {
  const aggregatedItems = new Map<string, { quantity: number; itemName?: string; unitPrice?: number }>();
  const sourceItems = kit.kitItens || [];

  for (const rawItem of sourceItems) {
    const mapped = mapKitItem(rawItem);
    if (!mapped) continue;
    const existing = aggregatedItems.get(mapped.equipmentId);
    if (existing) {
      aggregatedItems.set(mapped.equipmentId, { ...existing, quantity: existing.quantity + mapped.quantity });
    } else {
      aggregatedItems.set(mapped.equipmentId, {
        quantity: mapped.quantity,
        itemName: mapped.itemName,
        unitPrice: mapped.unitPrice,
      });
    }
  }

  return {
    id: String(kit.codProduto),
    name: kit.descricao || `Kit ${kit.codProduto}`,
    items: Array.from(aggregatedItems.entries()).map(([equipmentId, v]) => ({
      equipmentId,
      quantity: v.quantity,
      itemName: v.itemName,
      unitPrice: v.unitPrice,
    })),
  };
}

export function mapKitsToUi(kits: KitApiDto[]): Kit[] {
  return kits.map(mapKitToUi);
}
