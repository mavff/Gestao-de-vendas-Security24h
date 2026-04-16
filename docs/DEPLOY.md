# Deploy — Security24h (EasyPanel + GitLab)

Guia passo-a-passo para subir **backend NestJS + frontend Next.js + Postgres** na VPS via EasyPanel, integrando com o repositório GitLab existente.

> **Contexto de infra:** a VPS já tem EasyPanel instalado. SQL Server do ERP permanece fora do EasyPanel, acessado via IP/VPN da rede do cliente.

---

## Visão geral

```
┌──────────────────────────── VPS ────────────────────────────┐
│                                                             │
│  EasyPanel (projeto "sec24h")                               │
│  ├─ Service: postgres  (imagem oficial, volume /var/lib…)   │
│  ├─ Service: backend   (Dockerfile, volume /data/photos)    │
│  └─ Service: web       (Dockerfile, standalone)             │
│                                                             │
└─────────────────┬──────────────────────────┬────────────────┘
                  │                          │
                  ▼                          ▼
          SQL Server ERP            Internet (usuários)
          (rede do cliente,                 ↑
           read-only)                       │
                                            │ HTTPS via domínios
                                            │ do EasyPanel
```

**Bancos**:
- `postgres` (EasyPanel) — dados do app (`APP_DATABASE_URL`)
- `SQL Server` (externo) — ERP read-only (`DATABASE_URL` Prisma + `SQL_SERVER_*` TypeORM)

**Volume persistente**:
- `/data/photos` no container backend — onde as fotos das vistorias vão morar (Fase 1).

---

## 1. Preparar o repositório GitLab

A infraestrutura de deploy já está commitada em `main` (commits `d27f004`, `59f363d`, `2356dab`). Garanta que seu `main` local está sincronizado com o GitLab:

- `docker-compose.yml` na raiz (Postgres dev)
- `apps/backend/Dockerfile` e `apps/backend/.dockerignore`
- `apps/web/Dockerfile` e `apps/web/.dockerignore`
- `apps/web/next.config.js` com `output: 'standalone'`
- `apps/backend/.env.example` com `APP_DATABASE_URL` e `PHOTOS_DIR`
- Conexão TypeORM renomeada `sqlite` → `app` (dual-mode Postgres/SQLite)
- Dockerfile backend: `mkdir -p /app/apps/backend/data && chown app:app` (evita EACCES no fallback SQLite dentro do container)
- Entidades relacionais usando `simple-json` em vez de `jsonb` para funcionar em SQLite e Postgres

```bash
cd "C:/Gestão de vendas sec24h/Gestao-de-vendas-Security24h"
git status          # esperado: clean
git push origin main  # só se houver commits locais ainda não enviados
```

No EasyPanel você precisará configurar um **Deploy Token** de leitura do GitLab:

1. GitLab → Project → Settings → Repository → **Deploy tokens** → Create
2. Scopes: `read_repository`
3. Anota `username` e `token` — usados pelo EasyPanel para clonar.

---

## 2. Criar o projeto no EasyPanel

1. **Login** no EasyPanel da VPS.
2. **Create project** → nome: `sec24h`.

---

## 3. Service 1 — Postgres

Dentro do projeto `sec24h`:

1. **+ Service** → **Postgres**.
2. Preencha:
   - **Service name**: `postgres`
   - **Database name**: `sec24h_app`
   - **User**: `sec24h`
   - **Password**: *(gere uma forte — guarde)*
   - **Version**: 16
3. **Create**.

O EasyPanel mostrará a **connection string interna**, algo como:
```
postgres://sec24h:SENHA@sec24h_postgres:5432/sec24h_app
```

Anote essa URL — vai em `APP_DATABASE_URL` do backend.

> **Volume**: o EasyPanel já cria um volume persistente para o Postgres automaticamente. Não precisa configurar.

---

## 4. Service 2 — Backend (NestJS)

1. **+ Service** → **App**.
2. **Service name**: `backend`.
3. **Source**:
   - Tipo: **Git**
   - URL: `https://oauth2:<DEPLOY_TOKEN>@gitlab.com/<org>/<repo>.git`
   - (ou conecte via GitLab OAuth no EasyPanel se disponível)
   - Branch: `main`
4. **Build**:
   - Método: **Dockerfile**
   - Path: `apps/backend/Dockerfile`
   - **Build context**: `/` (raiz do monorepo — importante)
5. **Environment variables** (aba Env):
   ```
   NODE_ENV=production
   PORT=3001

   # Postgres do próprio EasyPanel (service postgres)
   APP_DATABASE_URL=postgres://sec24h:SENHA@sec24h_postgres:5432/sec24h_app

   # Fotos em volume persistente
   PHOTOS_DIR=/data/photos

   # SQL Server do ERP (rede do cliente)
   DATABASE_URL=sqlserver://IP:1433;database=ERP;user=usr;password=pwd;encrypt=true;trustServerCertificate=true
   SQL_SERVER_HOST=IP
   SQL_SERVER_PORT=1433
   SQL_SERVER_USERNAME=usr
   SQL_SERVER_PASSWORD=pwd
   SQL_SERVER_DATABASE=ERP
   SQL_SERVER_ENCRYPT=false

   # JWT
   JWT_ACCESS_SECRET=<gerar>
   JWT_REFRESH_SECRET=<gerar>
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d

   # CORS — colocar depois o domínio do frontend
   CORS_ORIGINS=https://app.seudominio.com,http://localhost:3000

   RATE_LIMIT_TTL=60
   RATE_LIMIT_LIMIT=100

   ADMIN_USERS=admin,gestor
   ```
6. **Ports**: expor `3001`.
7. **Volumes** (aba Storage):
   - **Mount path**: `/data/photos`
   - **Type**: Volume (persistente)
   - Nome sugerido: `sec24h-photos`
8. **Domain** (aba Domains): `api.seudominio.com` com SSL automático (Let's Encrypt).
9. **Deploy**.

Primeira build demora ~5 min (instala deps nativas + compila TS). Acompanhe os logs.

### Verificar

```bash
curl https://api.seudominio.com/health
```

Deve retornar `{"status":"ok"}`. Logs devem mostrar:
- `App DB: Postgres (APP_DATABASE_URL set)`
- `API running on http://localhost:3001`

---

## 5. Service 3 — Web (Next.js)

1. **+ Service** → **App**.
2. **Service name**: `web`.
3. **Source**: mesmo repositório, branch `main`.
4. **Build**:
   - Método: **Dockerfile**
   - Path: `apps/web/Dockerfile`
   - **Build context**: `/` (raiz)
   - **Build args** (passados ao `--build-arg`):
     ```
     NEXT_PUBLIC_API_BASE_URL=https://api.seudominio.com
     NEXT_PUBLIC_DATA_SOURCE=api
     NEXT_PUBLIC_USE_RELATIONAL=false
     ```
     > ⚠️ Essas variáveis precisam ser **build args**, não runtime env, porque o Next 14 as inline no bundle.
5. **Ports**: `3000`.
6. **Domain**: `app.seudominio.com`.
7. **Deploy**.

### Verificar

Abrir `https://app.seudominio.com` → login com admin do `.env`. Testar:
- Login
- Dashboard → KPIs carregam do SQL Server
- Pipeline → leads aparecem
- Minhas Vendas → cria/edita venda (persiste no Postgres app)

---

## 6. Voltar no backend: ajustar CORS

Depois que o frontend subiu com domínio definitivo:

1. EasyPanel → `backend` → Env → `CORS_ORIGINS=https://app.seudominio.com`
2. Restart.

---

## 7. CI/CD — auto-deploy no push

EasyPanel suporta **webhook de deploy**:

1. Em cada serviço (`backend`, `web`) → **Deployments** → **Auto Deploy** → enable.
2. Copie a **webhook URL**.
3. No GitLab: Project → Settings → Webhooks → Add
   - URL: webhook do EasyPanel
   - Trigger: **Push events** (branch `main`)
4. Push pra `main` = deploy automático nos 2 serviços.

---

## 8. Migração de dados (dev → prod)

### SQLite → Postgres (uma vez)

Em dev local, quando `APP_DATABASE_URL` apontar pro Postgres, o backend criará as tabelas `app_users` + `app_kv` vazias no Postgres (`synchronize: true` em dev).

Para trazer os dados do SQLite existente:

```bash
# 1. Subir Postgres local
docker compose up -d postgres

# 2. Setar APP_DATABASE_URL no apps/backend/.env
echo "APP_DATABASE_URL=postgresql://sec24h:sec24h_dev@localhost:5432/sec24h_app" >> apps/backend/.env

# 3. Reiniciar backend — cria tabelas
npm run dev:backend

# 4. Rodar script de migração (implementado na próxima fase)
npm --workspace @security24h/backend run migrate:sqlite-to-postgres
```

> O script `migrate:sqlite-to-postgres` será criado na **Fase 0b** do plano.

### Dados novos em prod

Prod começa vazio. Seed do `.env` cria automaticamente o `admin` no primeiro boot (ver `AppUsersService.onModuleInit`).

---

## 9. Backup do Postgres

EasyPanel oferece snapshots automáticos do volume Postgres. Para backup lógico:

```bash
# SSH na VPS
docker exec sec24h_postgres pg_dump -U sec24h sec24h_app > backup-$(date +%F).sql
```

Recomendado: cron semanal + upload pra S3/Google Drive.

### Backup das fotos

```bash
# SSH na VPS
tar czf photos-$(date +%F).tar.gz /var/lib/docker/volumes/sec24h-photos/_data
```

---

## 10. Troubleshooting

| Sintoma | Causa provável | Fix |
|---------|----------------|-----|
| Backend sobe mas `/health` retorna 503 | `SQL_SERVER_HOST` inacessível da VPS | Verificar VPN/firewall até a rede do cliente |
| `App DB: SQLite fallback` nos logs de prod | `APP_DATABASE_URL` não setada | Adicionar em Env e restart |
| Frontend 500 ao chamar API | CORS | `CORS_ORIGINS` precisa ter o domínio exato (https://...) |
| Fotos somem após redeploy | Volume não configurado | Confirmar mount `/data/photos` persistente |
| Build falha em `better-sqlite3` | Toolchain ausente | Já coberto pelo Dockerfile (`python3 make g++`) |
| Prisma: `Cannot find module '.prisma/client'` | `prisma generate` não rodou | O Dockerfile já roda — checar logs da stage `build` |
| Next.js: `Error: Cannot find module` em prod | Build sem `output: 'standalone'` | Confirmado no `next.config.js` desta branch |
| Backend cai com `EACCES` ao tentar criar `data/app.sqlite` | Fallback SQLite em container sem permissão | Corrigido em `59f363d` (Dockerfile cria `data/` com dono `app`). Em prod o correto é setar `APP_DATABASE_URL` e não cair no fallback |
| TypeORM: `column "blocos" is of type jsonb` ou similar ao iniciar contra Postgres | Entidades declaravam `jsonb` (Postgres-only) | Corrigido em `59f363d` com `simple-json` (cross-DB). Se reaparecer, revisar novas entidades que adicionem colunas JSON |

---

## 11. Rollback rápido

EasyPanel mantém histórico de deploys. **Revert** no painel → sobe a imagem anterior.

Para desligar a camada relacional e voltar ao `app_kv`:
```
NEXT_PUBLIC_USE_RELATIONAL=false  (build arg do web)
```
Rebuild o `web`. Backend continua servindo `app_kv` normalmente — dados antigos não são apagados.

---

## Próximos passos

Depois que o deploy estiver rodando, execute as **próximas fases** do plano `C:\Users\PC\.claude\plans\dreamy-honking-scroll.md`:

- **Fase 1** — Fotos em disco (tira base64 do JSON, reduz body limit para 5mb)
- **Fase 2** — Entidades de negócio (vendas/soluções/vistorias em tabelas)
- **Fase 3** — Logs + Pipeline em tabelas indexadas
