# Web Admin (Smoke Test)

## Configuracao de ambiente

Crie `apps/web/.env.local` com:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_DATA_SOURCE=api
```

## Smoke test do apiClient

Este teste chama `GET /health` sem depender de UI:

```bash
npm --workspace @security24h/web run smoke:api
```

Saida esperada:

```json
{
  "ok": true,
  "endpoint": "/health",
  "baseUrl": "http://localhost:3001",
  "elapsedMs": 12,
  "response": {
    "status": "ok",
    "timestamp": "2026-02-14T00:00:00.000Z",
    "uptime": 100,
    "database": "configured"
  }
}
```

