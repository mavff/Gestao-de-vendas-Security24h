'use client';

import { apiClient } from '../lib/apiClient';

function parseFlag(v: string | undefined): boolean {
  if (!v) return false;
  const normalized = v.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export const USE_RELATIONAL =
  typeof window !== 'undefined' && parseFlag(process.env.NEXT_PUBLIC_USE_RELATIONAL);

type EntityMeta = {
  endpoint: string;
  extraFilter?: Record<string, string>;
  injectOnSave?: Record<string, unknown>;
};

const KEY_TO_ENTITY: Record<string, EntityMeta> = {
  vendedor_vendas: { endpoint: '/vendas' },
  solucoes: { endpoint: '/solucoes-tecnicas' },
  vistorias: {
    endpoint: '/vistorias',
    extraFilter: { tipoVistoria: 'vistoria' },
    injectOnSave: { tipoVistoria: 'vistoria' },
  },
  entregas: {
    endpoint: '/vistorias',
    extraFilter: { tipoVistoria: 'entrega' },
    injectOnSave: { tipoVistoria: 'entrega' },
  },
  ordens_servico: { endpoint: '/ordens-servico' },
  propostas: { endpoint: '/propostas-local' },
  orcamentos_local: { endpoint: '/orcamentos-local' },
};

export function isRelationalKey(key: string): boolean {
  return USE_RELATIONAL && key in KEY_TO_ENTITY;
}

export async function loadRelational<T extends { id: string }>(key: string): Promise<T[]> {
  const entity = KEY_TO_ENTITY[key];
  if (!entity) throw new Error(`Não é chave relacional: ${key}`);
  const results: T[] = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '200',
      ...(entity.extraFilter ?? {}),
    });
    // apiClient já desembrulha { data, meta } do backend — `data` aqui é o array direto.
    const { data, meta: pageMeta } = await apiClient.get<T[]>(
      `${entity.endpoint}?${params.toString()}`,
    );
    const rows = Array.isArray(data) ? data : [];
    results.push(...rows);
    const totalPages = pageMeta?.totalPages ?? 1;
    if (page >= totalPages || rows.length === 0) break;
    page++;
  }
  return results;
}

export async function saveRelational<T extends { id: string }>(
  key: string,
  value: T[],
  previous: T[] | null,
): Promise<void> {
  const meta = KEY_TO_ENTITY[key];
  if (!meta) throw new Error(`Não é chave relacional: ${key}`);

  const prevById = new Map(previous?.map((x) => [x.id, x]) ?? []);
  const nextIds = new Set(value.map((x) => x.id));

  const removed = previous ? previous.filter((x) => !nextIds.has(x.id)) : [];

  // Diff real: só envia itens novos ou modificados (JSON hash).
  for (const item of value) {
    const prev = prevById.get(item.id);
    const body = meta.injectOnSave ? { ...item, ...meta.injectOnSave } : item;
    const isNew = !prev;
    const isChanged = prev && JSON.stringify(prev) !== JSON.stringify(item);
    if (isNew) {
      await apiClient.post(meta.endpoint, { body, timeoutMs: 60_000 });
    } else if (isChanged) {
      await apiClient.put(`${meta.endpoint}/${encodeURIComponent(item.id)}`, { body, timeoutMs: 60_000 });
    }
  }

  for (const item of removed) {
    await apiClient.delete(`${meta.endpoint}/${encodeURIComponent(item.id)}`, { timeoutMs: 30_000 });
  }
}
