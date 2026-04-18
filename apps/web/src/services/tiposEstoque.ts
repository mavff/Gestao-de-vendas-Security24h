import { apiClient } from '../lib/apiClient';
import { TipoEstoqueApiDto } from '../lib/dataSource/types';

export type TipoEstoque = TipoEstoqueApiDto;

let cache: { data: TipoEstoque[]; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function loadTiposEstoque(force = false): Promise<TipoEstoque[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.data;
  }
  try {
    const { data } = await apiClient.get<TipoEstoque[]>('/tipos-estoque');
    const list = Array.isArray(data) ? data : [];
    cache = { data: list, at: Date.now() };
    return list;
  } catch {
    return cache?.data ?? [];
  }
}
