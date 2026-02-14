import { apiClient } from '../src/lib/apiClient';

async function run(): Promise<void> {
  const start = Date.now();
  const result = await apiClient.get<{ status: string; timestamp: string; uptime: number; database: string }>('/health');
  const elapsedMs = Date.now() - start;

  const status = result.data?.status;
  if (status !== 'ok') {
    throw new Error(`Health check retornou status inesperado: ${status ?? 'undefined'}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        endpoint: '/health',
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
        elapsedMs,
        response: result.data,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify(
      {
        ok: false,
        endpoint: '/health',
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
        error: message,
      },
      null,
      2
    )
  );
  process.exit(1);
});

