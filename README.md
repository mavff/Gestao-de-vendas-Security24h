# Security24h — Gestão de Vendas

Sistema de gestão comercial para a **Security24h** (segurança eletrônica).
Monorepo com frontend Next.js e backend NestJS conectado a SQL Server real + SQLite para dados do app.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Stack](https://img.shields.io/badge/NestJS-10-red) ![Stack](https://img.shields.io/badge/TypeScript-5-blue) ![Stack](https://img.shields.io/badge/Prisma-6-purple)

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
| BD App    | SQLite (better-sqlite3 via TypeORM)            |
| Auth      | JWT (access 15min + refresh 7d), RBAC 7 roles |
| Sheets    | Google Sheets público via gviz (sem API key)   |
| Estilo    | Inline styles, tema dark (preto/dourado/cinza) |

## Módulos

| Rota            | Módulo        | Descrição                                    |
| --------------- | ------------- | -------------------------------------------- |
| `/dashboard`    | Dashboard     | KPIs financeiros, gráficos SVG, prospecção   |
| `/kanban`       | Pipeline CRM  | 7 etapas, drag-drop, criar proposta direto   |
| `/solucoes`     | Propostas     | Criação rápida com kits por marca + PDF      |
| `/orcamentos`   | Orçamentos    | Funil de vendas, filtros, materiais vendidos  |
| `/comissoes`    | Comissões     | Gestão de comissões + clientes ativos        |
| `/sdr`          | CRM Unificado | Painel, Leads, Por Fonte (10 fontes)         |
| `/vendas`       | Vendas        | Lista de vendas do vendedor                  |
| `/venda/[id]`   | Venda         | Fluxo completo de venda (steps)              |
| `/equipamentos` | Equipamentos  | Catálogo de 409 produtos do ERP              |
| `/kits`         | Kits          | Kits & modelos pré-configurados              |
| `/usuarios`     | Usuários      | CRUD completo (SQLite, bcrypt)               |
| `/login`        | Auth          | Login JWT com auto-refresh                   |

## RBAC — 7 Roles

| Role       | Acesso Principal                                           |
| ---------- | ---------------------------------------------------------- |
| `ADMIN`    | Acesso total + configurações                               |
| `GESTOR`   | Dashboard, Pipeline, Propostas, Orçamentos, Comissões      |
| `SDR`      | CRM, Pipeline, Dashboard                                   |
| `VENDEDOR` | Pipeline, Propostas, Kits, Minhas Vendas                   |
| `TECNICO`  | Propostas, Equipamentos                                    |
| `INFRA`    | Pipeline, Equipamentos                                     |
| `MONITOR`  | Dashboard (somente leitura)                                |

## Funcionalidades Principais

### Pipeline CRM (`/kanban`)
- 7 etapas do funil: Novos Leads → Tentativa de Contato → Em Conversa → Qualificado → Visita/Reunião → Orçamento Enviado → Fechado
- Drag-drop entre colunas com persistência no SQLite
- Criar proposta diretamente do card do lead
- Agendar visita com um clique
- Descartar/restaurar leads com motivo
- Filtros: busca, origem, responsável, prioridade, período

### Propostas (`/solucoes`)
- Fluxo rápido: dados do cliente → kit por marca → personalizar equipamentos → modalidade (Venda vs Comodato)
- Seleção de kits organizada por **marca** (filtro por pills)
- Comparativo lado a lado: Compra vs Comodato
- **Geração de PDF** profissional com design dark, ondas SVG e glassmorphism
- Ciclo de vida: Rascunho → Enviada → Aprovada (com opção de cancelar aprovação)

### CRM Unificado (`/sdr`)
- 10 fontes de dados (Google Sheets + Landing Pages)
- Score automático 0–100 com prioridade (alta/média/baixa)
- Deduplicação por telefone + nome
- 3 abas: Painel com KPIs, Todos os Leads, Por Fonte
- Export CSV

### Comissões (`/comissoes`)
- Cálculo automático: N mensalidades × monitoramento
- Taxa de adesão configurável (multiplicador 1.25 ou 1.5)
- Controle de retenção por vendedor
- Override individual por cliente (ADMIN)
- Seleção de vendedores ativos

### Dashboard (`/dashboard`)
- KPIs financeiros reais do SQL Server
- Gráficos SVG (sem libs externas)
- Painel de prospecção com dados do Google Sheets

## Autenticação

- JWT com **access token** (15min) + **refresh token** (7d)
- Auto-refresh transparente via interceptor no `apiClient`
- 3 camadas de login: Admin master (.env) → SQLite (`app_users`) → SQL Server ERP (`Senhas`)
- RBAC em todas as rotas (frontend + backend)

## Como Rodar

### Pré-requisitos
- Node.js 18+
- SQL Server (opcional — funciona em modo fail-soft)

### Instalação
```bash
npm install
```

### Variáveis de Ambiente

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL="sqlserver://192.168.0.4:1433;database=service;..."
ADMIN_FALLBACK_USER=admin
ADMIN_FALLBACK_PASS=***
JWT_SECRET=***
JWT_REFRESH_SECRET=***
```

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Desenvolvimento
```bash
npm run dev:backend    # Backend na porta 3001
npm run dev:web        # Frontend na porta 3000
```

### Type Check
```bash
npx tsc --noEmit --project apps/web/tsconfig.json
npx tsc --noEmit --project apps/backend/tsconfig.json
```

## Tema Visual

- Fundo: `#0B0B0B` | Painéis: `#141414` | Bordas: `#3A3A3A`
- Texto: `#F2F2F2` | Destaque: `#C8A951` (dourado)
- Sem Tailwind, sem CSS modules — tudo inline style
- Definido em `apps/web/src/components/common/theme.ts`

## Dual Mode (API / Mock)

O frontend suporta dois modos via `NEXT_PUBLIC_DATA_SOURCE`:
- **`api`** — conecta ao backend NestJS (SQL Server + SQLite)
- **`mock`** (ou omitido) — dados locais em localStorage

Abstração em `apps/web/src/lib/dataSource/` com interfaces, factories e adapters.

## Backend — Fail-soft

O backend inicia mesmo sem conexão com SQL Server:
- TypeORM com timeout de 8s na conexão
- Prisma com timeout de 6s
- Auth retorna 503 quando DB indisponível
- Demais endpoints retornam erro controlado

---

**Security24h** — Segurança Eletrônica | Sistema de Gestão Comercial
