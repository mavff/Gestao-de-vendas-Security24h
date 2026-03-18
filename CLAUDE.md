# Security24h — Gestão de Vendas

Sistema de gestão comercial para a empresa Security24h (segurança eletrônica).
Monorepo com frontend Next.js e backend NestJS conectado a SQL Server real.

## Arquitetura

```
├── apps/
│   ├── web/          Next.js 14 (App Router) — porta 3000
│   └── backend/      NestJS 10 + Prisma + TypeORM — porta 3001
├── packages/
│   └── shared/       Types compartilhados (DTOs)
└── docker-compose.yml
```

### Stack

| Camada    | Tecnologia                                    |
| --------- | --------------------------------------------- |
| Frontend  | Next.js 14, React 18, TypeScript 5            |
| Backend   | NestJS 10, Prisma 6, TypeORM 0.3              |
| BD ERP    | SQL Server (Prisma + TypeORM) — READ-ONLY     |
| BD App    | SQLite (better-sqlite3 via TypeORM) — app data|
| Auth      | JWT (access + refresh), RBAC com 7 roles      |
| Sheets    | Google Sheets público via gviz (sem API key)  |
| Estilo    | Inline styles, tema dark (preto/dourado/cinza)|

### Tema visual

Arquivo: `apps/web/src/components/common/theme.ts`
- Fundo: `#0B0B0B` / Painéis: `#141414` / Bordas: `#3A3A3A`
- Texto: `#F2F2F2` / Destaque: `#C8A951` (dourado)
- Sem Tailwind, sem CSS modules — tudo inline style

## Comandos

```bash
npm run dev:web        # Frontend na porta 3000
npm run dev:backend    # Backend na porta 3001
```

TypeScript check (rodar antes de considerar qualquer tarefa concluída):
```bash
npx tsc --noEmit --project apps/web/tsconfig.json
npx tsc --noEmit --project apps/backend/tsconfig.json
```

## RBAC — 7 Roles

`ADMIN` · `GESTOR` · `SDR` · `VENDEDOR` · `TECNICO` · `INFRA` · `MONITOR`

Definido em `apps/web/src/config/rbac.ts`. Cada rota declara quais roles têm acesso
e quais aparecem na sidebar. Funções exportadas:
- `canAccess(role, pathname)` — check de permissão
- `getNavForRole(role)` — itens da sidebar
- `getFallbackRouteForRole(role)` — redirect padrão

## Autenticação

- Frontend: `apps/web/src/contexts/AuthContext.tsx`
- Backend: `apps/backend/src/auth/auth.service.ts`
- JWT com access token (15min) + refresh token (7d)
- Fluxo de login: 1) Admin master `.env` → 2) SQLite `app_users` (bcrypt) → 3) SQL Server `Senhas` (ERP)
- Login master via env vars `ADMIN_FALLBACK_USER` / `ADMIN_FALLBACK_PASS` (funciona sem banco)
- Roles resolvidos do banco: `Senhas.AcessoCompleto` → GESTOR, `Clientes.Tipo` → V/Z/U
- localStorage keys: `sec24h_token`, `sec24h_refresh`, `sec24h_user`

## SQLite — Dados do App

Arquivo: `apps/backend/data/app.sqlite` (criado automaticamente via TypeORM `synchronize: true`)
Conexão nomeada `'sqlite'` no TypeORM.

### Tabelas

| Tabela      | Descrição                                      | Entity                     |
| ----------- | ---------------------------------------------- | -------------------------- |
| `app_users` | Usuários da plataforma (bcrypt, CRUD, roles)   | `app-users/app-user.entity.ts` |
| `app_kv`    | Key-value store genérico (pipeline state, etc.) | `app-users/app-kv.entity.ts`   |

### AppUsers (gestão de usuários do app)

- Módulo: `apps/backend/src/app-users/` (entity + service + controller + module)
- Endpoints: `GET/POST/PUT/DELETE /app-users` — protegidos por JWT, apenas ADMIN
- Senhas em bcrypt (não plain text)
- Seed automático na primeira execução: migra usuários do `.env` para SQLite
- Frontend: `/usuarios` — CRUD completo (criar, editar, excluir, ativar/desativar)
- Separado dos usuários do ERP (tabela `Senhas` do SQL Server)

### AppKv (key-value store)

- Endpoints: `GET/PUT/DELETE /app-state/:key` — protegidos por JWT
- Armazena qualquer dado JSON por chave
- Usado pelo pipeline/kanban para persistir: stage overrides, dismissed leads, lost leads
- Frontend: `apps/web/src/services/appState.ts` — `loadState(key)` / `saveState(key, value)`
  - API mode: salva no SQLite via backend + localStorage como cache
  - Mock mode: fallback para localStorage puro
  - Cache em memória 30s para evitar chamadas repetidas

#### Chaves usadas

| Chave                    | Tipo                    | Descrição                         |
| ------------------------ | ----------------------- | --------------------------------- |
| `crm_pipeline_stages`    | `Record<id, StageId>`   | Posição dos leads no kanban       |
| `crm_pipeline_dismissed` | `Record<id, motivo>`    | Leads descartados + motivo        |
| `crm_pipeline_lost`      | `string[]`              | IDs de leads marcados como perdidos|

## Data Source (dual mode)

Env var `NEXT_PUBLIC_DATA_SOURCE`:
- `api` → chama o backend NestJS (`NEXT_PUBLIC_API_BASE_URL`)
- `mock` (ou omitido) → dados locais em localStorage

Abstração em `apps/web/src/lib/dataSource/`:
- `interfaces.ts` — interfaces (`IEquipmentDataSource`, `IDashboardDataSource`, etc.)
- `types.ts` — DTOs, queries, paginação
- `apiDataSource.ts` / `mockDataSource.ts` — implementações
- `factory.ts` — cria o registry baseado no env
- `adapters/` — mapeia DTOs da API para tipos do frontend

## Módulos do Frontend

| Rota            | Módulo                | Descrição                           |
| --------------- | --------------------- | ----------------------------------- |
| `/dashboard`    | dashboard/            | KPIs, gráficos SVG, financeiro      |
| `/kanban`       | kanban/               | Pipeline CRM (7 etapas, drag-drop)  |
| `/vendas`       | vendas/               | Lista de vendas do vendedor         |
| `/venda/[id]`   | venda/                | Fluxo completo de venda (steps)     |
| `/solucoes`     | solucoes/             | Soluções técnicas / propostas       |
| `/orcamentos`   | orcamentos/           | Orçamentos: funil, abas status, faixa preço, materiais |
| `/instalacoes`  | installations/        | Ordens de serviço                   |
| `/equipamentos` | equipment/            | CRUD de equipamentos/produtos       |
| `/kits`         | kits/                 | Kits & modelos pré-configurados     |
| `/usuarios`     | users/                | Gestão de usuários do app (SQLite)  |
| `/missoes`      | missions/             | Board de missões/tarefas            |
| `/sdr`          | sdr/                  | CRM Unificado (Painel, Leads, Por Fonte) |
| `/login`        | (AuthContext)         | Tela de login                       |

Cada módulo vive em `apps/web/src/modules/<nome>/`.
Páginas App Router em `apps/web/app/<rota>/page.tsx` (thin wrappers).

## Pipeline / Kanban — `/kanban`

Fonte de dados: CRM unificado (`GET /crm/leads`) — leads reais das planilhas Google Sheets.

### 7 Etapas do funil

| Etapa                  | StatusNorm match        | Cor      |
| ---------------------- | ----------------------- | -------- |
| Novos Leads            | Novo, (vazio)           | #5B9BD5  |
| Tentativa de Contato   | Primeiro contato        | #FF9800  |
| Em Conversa            | Conversando             | #C077DB  |
| Qualificado            | Qualificado             | #43C17B  |
| Visita / Reunião       | Agendado                | #E3B341  |
| Orçamento Enviado      | Orçamento enviado       | #E8875B  |
| Fechado                | Fechado + fechou=SIM    | #2ECC71  |

### Funcionalidades

- **Drag-drop** entre colunas (persiste no SQLite via `crm_pipeline_stages`)
- **Descartar lead** individual (motivo selecionável) ou em lote (por dias sem evolução)
- **Marcar como perdido** — move para seção Perdidos colapsável
- **Restaurar** — leads descartados/perdidos podem ser restaurados
- **Filtros**: busca, origem, responsável, prioridade, período (7d a todo)
- **Cards**: nome, empresa, telefone, score, prioridade, dias, origem, responsável
- **Detalhe**: painel lateral com todas as infos + botões WhatsApp/Ligar
- Acesso: ADMIN, GESTOR, SDR, VENDEDOR, INFRA
- Permissão de ações: ADMIN, GESTOR, SDR, VENDEDOR

## Backend — Endpoints

| Método | Rota                          | Descrição                        |
| ------ | ----------------------------- | -------------------------------- |
| GET    | `/health`                     | Health check                     |
| POST   | `/auth/login`                 | Login (JWT)                      |
| POST   | `/auth/refresh`               | Refresh token                    |
| GET    | `/me`                         | Usuário autenticado              |
| GET    | `/users`                      | Lista usuários (legado, SQLite)  |
| CRUD   | `/app-users`                  | Gestão de usuários do app        |
| CRUD   | `/app-state/:key`             | Key-value store (pipeline state) |
| GET    | `/dashboard/stats?period=`    | KPIs do dashboard                |
| GET    | `/dashboard/financeiro`       | Painel financeiro detalhado      |
| GET    | `/products`                   | Produtos/equipamentos            |
| GET    | `/kits`                       | Kits                             |
| GET    | `/prospects`                  | Prospects/leads                  |
| GET    | `/orcamentos`                 | Orçamentos                       |
| GET    | `/orcamentos/funnel`          | Funil de vendas                  |
| GET    | `/orcamentos/materiais-vendidos` | Produtos agregados dos aprovados |
| GET    | `/pre-orcamentos`             | Pré-orçamentos/modelos           |
| GET    | `/lookups/pipeline-stages`    | Etapas do pipeline               |
| GET    | `/sheets/leads`               | Google Sheets — KPIs prospecção   |
| GET    | `/sheets/sdr-log?tab=`        | SDR por aba (whatsapp/ig/visitas)|
| GET    | `/sheets/health`              | Health check do Google Sheets    |
| GET    | `/crm/leads`                  | Leads normalizados (10 fontes)   |
| GET    | `/crm/stats`                  | KPIs agregados do CRM            |
| GET    | `/crm/sources`                | Lista de fontes disponíveis      |

## Backend — Fail-soft

O backend sobe mesmo sem conexão com SQL Server:
- **TypeORM**: `dataSourceFactory` com `Promise.race(8s)` — captura erro, finge `isInitialized`
- **Prisma**: `onModuleInit` com `Promise.race(6s)` — captura erro, modo fail-soft
- Auth retorna 503 quando DB indisponível
- Demais endpoints retornam erro controlado via `ensureConnection()`

## Google Sheets (Prospecção)

Planilha pública: `1mnYYS2-cPMld0pzsVRqNth5JanKSvjV46hYch33oatY`
- Backend: `apps/backend/src/sheets/` (service + controller + module)
- Usa `gviz/tq?tqx=out:json` (sem API key)
- Cache 60s no SheetsService
- 3 abas: WhatsApp (162 leads), Instagram (136 leads), Visitas marcadas (22)

## CRM Unificado

Backend: `apps/backend/src/crm/` (CrmService + CrmController + CrmModule)

### Fontes de Dados (10 tabs em 3 planilhas)

| Fonte           | Planilha ID                                    | Tab/GID         | Status        |
| --------------- | ---------------------------------------------- | --------------- | ------------- |
| LP Segurança    | `1PQ6waKBq275qD59TW0lLMa2-7jYNOiYkfnuVyPM6c78` | gid=91662513   | Vazia (Google Ads) |
| LP Empresas     | mesma                                          | gid=1947091908  | Vazia         |
| LP Residencial  | mesma                                          | gid=248543358   | Vazia         |
| LP Geral        | mesma                                          | gid=0           | Vazia         |
| LP Outro        | mesma                                          | gid=524968067   | Vazia         |
| Site            | `1T4F3U6AaoW6Qc7R3tSYNU9CPh9iLXNkSDhYme7eRCKM` | gid=0          | Com dados     |
| Form. Instagram | `1JSkHEwSH5Aj9RfUVgFdigF9mqDAL6fXnO7Zb_qBQKEY` | gid=0          | Com dados     |
| SDR WhatsApp    | `1mnYYS2-cPMld0pzsVRqNth5JanKSvjV46hYch33oatY` | SDR Log        | Com dados     |
| SDR Instagram   | mesma                                          | Instagram       | Com dados     |
| SDR Visitas     | mesma                                          | Visitas marcadas| Com dados     |

### Arquitetura CRM

- **SQL Server é READ-ONLY** — normalização e dedup em memória no backend
- Cache 120s (`CRM_CACHE_TTL_MS` env var)
- Deduplicação por telefone normalizado + nome
- Score automático 0–100 (urgência, status, origem, valor, produto)
- Prioridade: alta (≥60), media (≥35), baixa (<35)
- Leads de Visitas com `Fechou? = SIM` são normalizados como status "Fechado"

### Status Normalizados do CRM

`Novo` → `Primeiro contato` → `Conversando` → `Qualificado` → `Agendado` → `Orçamento enviado` → `Fechado` / `Perdido`

Mapeamento de status brutos das planilhas para status normalizados em `CrmService.STATUS_NORM`.

### Modelo Canônico: `CrmLead`

30+ campos incluindo: nome, telefone, email, endereco, cidade, bairro, empresa,
origem, origemLabel, produtoInteresse, tipoLocal, urgencia, valorPretendido,
status, statusNorm, responsavel, dataEntrada, fontes[], score, prioridade,
observacoes, duplicatas, fechou, motivoPerda, valorOrcamento, instagramHandle.

### Frontend CRM — `/sdr` (3 tabs)

1. **Painel CRM**: 6 KPIs, pipeline visual (barras), distribuição por origem/produto/responsável, evolução mensal
2. **Todos os Leads**: tabela unificada com filtros (origem, status, prioridade, busca), score visual, CSV export, modal de detalhe
3. **Por Fonte**: sidebar com todas as 10 fontes agrupadas (SDR + Site/LP), contagem por fonte, tabela normalizada, modal de detalhe

### Data Source CRM

- Interface: `ICrmDataSource` em `interfaces.ts`
- Tipos: `CrmLead`, `CrmStats`, `CrmQuery`, `CrmLeadsResult`, `CrmSource` em `types.ts`
- API: `ApiCrmDataSource` em `apiDataSource.ts`
- Mock: `MockCrmDataSource` em `mockDataSource.ts`
- Endpoints: `GET /crm/leads?search=&origem=&status=&prioridade=&period=`, `GET /crm/stats`, `GET /crm/sources`

### Produto Interesse — Inferência automática

O CRM infere o produto de interesse a partir dos textos das planilhas:
- "alarme e câmera" → Alarme e Câmeras
- "alarme" → Alarme Monitorado
- "câmera/camera" → Câmeras Monitoradas
- "cerca/concertina" → Cerca Elétrica
- "totem" → Totem de Segurança
- "portaria/controle de acesso" → Controle de Acesso

### Integrações futuras (fase 2)

- Evolution API para disparo de mensagens WhatsApp (remarketing)
- N8N para receber dados de formulários (site e landing pages)
- Templates de mensagem editáveis no painel
- Automação de nutrição por status/etapa

## Banco de Dados ERP (Prisma schema)

Modelos principais: `Produto`, `ProdutoKit`, `Prospect`, `ProspectAcaoVenda`,
`Orcamento`, `OrcamentoProduto`, `OrcamentoServicoAdicional`, `Cliente`,
`OrdemServico`, `PreOrcamento`, `PreOrcamentoProduto`, `SenhaUser`,
`DadoEntidade`, `EtapaOrcamento`

Schema: `apps/backend/prisma/schema.prisma`
Mapeamento completo: `docs/DB_MAPPING.md`

## Orçamentos — Status do BD

| Código | Label              | Cor      | Significado                |
| ------ | ------------------ | -------- | -------------------------- |
| A      | Aberto             | warning  | Em negociação              |
| P      | Aguard. Aprovação  | #5B9BD5  | Pendente de aprovação      |
| L      | Liberado           | success  | Aprovado/liberado          |
| E      | Em Instalação      | gold     | Instalação em andamento    |
| F      | Faturado           | #43C17B  | Fechado/faturado (venda)   |
| C      | Cancelado          | danger   | Cancelado                  |

- **Materiais vendidos** (`/orcamentos/materiais-vendidos`): agrega produtos de status F+L+E
- **Funil**: `avancados` = F + L + E
- **Filtro período**: presets (7d/30d/90d/ano) disparam direto; custom usa botão "Consultar"
- **Filtro faixa de preço**: 0–300, 300–800, 800–1.200, 1.200–2.500, 2.500–5.000, 5.000+, Personalizado (com contagem)

## Convenções

### Código
- Acentos em strings visíveis ao usuário (Serviço, Técnico, Descrição)
- Nomes de tipos sem acento (OrdemDeServico, PropostaServico)
- RBAC pattern: `const canWrite = role === 'ADMIN' || role === 'INFRA';`
- Toast pattern: `const { showToast } = useToast();`
- State persistence: `loadState(key, fallback)` / `saveState(key, value)` em `services/appState.ts`
- Vendor custom: recharts e dnd-kit em `apps/web/src/vendor/` (sem libs externas)

### Arquivos importantes (não reverter sem pedir)
- `apps/web/src/config/rbac.ts` — RouteConfig (user rewrote)
- `apps/web/src/components/layout/AppShell.tsx` — SVG icons, mobile responsive
- `apps/web/src/components/layout/ProtectedRoute.tsx` — uses getFallbackRouteForRole

### Ambiente
- Windows 11 — paths com espaços precisam de aspas no bash
- Dev servers: `npm run dev:web` (3000) + `npm run dev:backend` (3001)
- `.env` do backend: `apps/backend/.env`
- `.env` do frontend: `apps/web/.env.local`
- SQLite do app: `apps/backend/data/app.sqlite`
