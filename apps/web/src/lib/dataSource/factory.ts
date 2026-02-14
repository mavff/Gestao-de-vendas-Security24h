import { DataSourceRegistry } from './interfaces';
import { DataSourceMode } from './types';
import { createApiDataSource } from './apiDataSource';
import { createMockDataSource } from './mockDataSource';

function parseMode(value: string | undefined): DataSourceMode {
  return value?.trim().toLowerCase() === 'mock' ? 'mock' : 'api';
}

export function getDataSourceMode(): DataSourceMode {
  return parseMode(process.env.NEXT_PUBLIC_DATA_SOURCE);
}

let cachedRegistry: DataSourceRegistry | null = null;

export function createDataSource(mode: DataSourceMode = getDataSourceMode()): DataSourceRegistry {
  if (cachedRegistry && cachedRegistry.mode === mode) return cachedRegistry;

  cachedRegistry = mode === 'mock' ? createMockDataSource() : createApiDataSource();
  return cachedRegistry;
}

