# Security24h — Backend API

API REST (NestJS) para o sistema de gestao de vendas Security24h.
Conecta ao SQL Server do sistema legado via Prisma (read-only) e TypeORM (auth/CRUD).

## Quick Start

```bash
cd apps/backend
npm install

# Copiar .env.example e preencher (opcional — sem DB o servidor sobe em fail-soft)
cp .env.example .env

# Iniciar em modo dev
npm run start:dev
```

O servidor sobe na porta **3001** por padrao.

## Fail-Soft Mode

Se `DATABASE_URL` nao estiver configurado:

- O servidor **sobe normalmente**
- `GET /health` retorna `{ status: "ok", db: false }`
- Endpoints de dados retornam HTTP 503 com `{ error: "DB_NOT_CONFIGURED" }`

Isso permite desenvolver frontend sem DB real.

## Endpoints

### Health
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/health` | Status do servidor e conexao com DB |

### Products (Prisma — read-only)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/products` | Lista produtos com filtros |
| GET | `/products/:id` | Detalhe do produto + kits |

Query params: `q`, `codMarca`, `codGrupo`, `codCategoria`, `cancelado`, `page`, `pageSize`

### Kits (Prisma — read-only)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/kits` | Lista kits (ProdutoKit=true) |
| GET | `/kits/:id` | Kit com composicao |

Query params: `q`, `codMarca`, `page`, `pageSize`

### Prospects (Prisma — read-only)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/prospects` | Lista prospects/leads |
| GET | `/prospects/:id` | Prospect + ultimas 50 acoes |

Query params: `q`, `status`, `vendedor`, `origem`, `page`, `pageSize`

### Orcamentos (Prisma — read-only)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/orcamentos` | Lista orcamentos |
| GET | `/orcamentos/:id` | Orcamento + produtos + servicos |

Query params: `q`, `status`, `vendedor`, `prospect`, `modalidade`, `page`, `pageSize`

### Lookups (Prisma — read-only)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/lookups/pipeline-stages` | Etapas do pipeline |
| GET | `/lookups/entities/:codEntidade` | Lookup por tipo (marcas, origens, etc) |

### Auth (TypeORM — requer SQL_SERVER_HOST)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/auth/login` | Login com usuario/senha |
| POST | `/auth/refresh` | Renovar token |
| GET | `/me` | Usuario atual (JWT) |

### Leads (TypeORM — requer SQL_SERVER_HOST)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/leads` | Criar lead |
| GET | `/leads` | Listar leads |
| GET | `/leads/:id` | Lead + timeline |
| POST | `/leads/:id/timeline` | Adicionar evento |

### Quotes (TypeORM — requer SQL_SERVER_HOST)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/quotes` | Criar orcamento |
| POST | `/quotes/:id/items` | Adicionar itens |
| GET | `/quotes/:id` | Orcamento + itens |

## Resposta Paginada

Todos os endpoints de listagem retornam:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Configuracao do Banco

### Prisma (endpoints read-only)

```env
DATABASE_URL=sqlserver://HOST:PORT;database=DBNAME;user=USER;password=PASS;encrypt=true;trustServerCertificate=true
```

### TypeORM (auth, leads, quotes — legado)

```env
SQL_SERVER_HOST=192.168.1.100
SQL_SERVER_PORT=1433
SQL_SERVER_USERNAME=sa
SQL_SERVER_PASSWORD=secret
SQL_SERVER_DATABASE=security24h
```

## Prisma

```bash
# Validar schema
npm run prisma:validate

# Gerar client
npm run prisma:generate
```

> O schema Prisma (`prisma/schema.prisma`) mapeia as tabelas SQL Server com
> acentos nos nomes (`Orçamentos`, `Descriçao`, `Planílha`) via `@map` e `@@map`.
> Veja `docs/DB_MAPPING.md` para o mapeamento completo.

## Docker (opcional)

```bash
docker build -t security24h-api -f apps/backend/Dockerfile .
docker run -p 3001:3001 -e PORT=3001 security24h-api
```

## Estrutura

```
apps/backend/
  prisma/schema.prisma       # Modelos Prisma (SQL Server)
  src/
    main.ts                  # Bootstrap NestJS
    app.module.ts            # Root module
    common/                  # Interceptors, middleware
    database/                # PrismaService, TypeORM entities
    shared/                  # Pagination helpers, DB guard
    auth/                    # JWT auth (TypeORM)
    health/                  # Health check
    products/                # Produtos (Prisma)
    kits/                    # Kits (Prisma)
    prospects/               # Prospects/Leads (Prisma)
    orcamentos/              # Orcamentos (Prisma)
    lookups/                 # DadosEntidades + EtapasOrcamento (Prisma)
    leads/                   # Leads CRUD (TypeORM)
    quotes/                  # Quotes CRUD (TypeORM)
```
