# Security24h — Gestão de Vendas

Sistema de gestão comercial (segurança eletrônica). Monorepo Next.js + NestJS conectado a SQL Server real.

## Arquitetura
```
apps/web/          Next.js 14 (App Router) — porta 3000
apps/backend/      NestJS 10 + Prisma + TypeORM — porta 3001
packages/shared/   Types compartilhados
```

| Camada   | Tecnologia                                    |
| -------- | --------------------------------------------- |
| Frontend | Next.js 14, React 18, TS 5                    |
| Backend  | NestJS 10, Prisma 6, TypeORM 0.3              |
| BD ERP   | SQL Server (Prisma + TypeORM) — READ-ONLY     |
| BD App   | SQLite (better-sqlite3 via TypeORM)           |
| Auth     | JWT (access 15min + refresh 7d), RBAC 7 roles |
| Sheets   | Google Sheets público via gviz (sem API key)  |
| Estilo   | Inline styles, tema dark (preto/dourado/cinza)|

### Tema visual — `apps/web/src/components/common/theme.ts`
- Fundo `#0B0B0B` / Painéis `#141414` / Bordas `#3A3A3A`
- Texto `#F2F2F2` / Destaque `#C8A951` (dourado)
- Sem Tailwind, sem CSS modules — tudo inline style

## Comandos
```bash
npm run dev:web        # Frontend 3000
npm run dev:backend    # Backend 3001
```
TypeScript check obrigatório antes de declarar tarefa concluída:
```bash
npx tsc --noEmit --project apps/web/tsconfig.json
npx tsc --noEmit --project apps/backend/tsconfig.json
```

## RBAC — 5 Roles
`ADMIN` · `GESTOR` · `SDR` · `VENDEDOR` · `TECNICO`

Definido em `apps/web/src/config/rbac.ts`. Funções:
- `canAccess(role, pathname)` / `getNavForRole(role)` / `getFallbackRouteForRole(role)`

Ordem da sidebar (funil cronológico):
- **ADMIN**: Dashboard → SDR → Pipeline → Propostas → Orçamentos → Comissões → Kits → Equipamentos → Usuários
- **GESTOR**: Dashboard → Pipeline → Propostas → Orçamentos → Comissões → Kits → SDR
- **VENDEDOR**: Pipeline → Kits → Minhas Vendas
- **SDR**: SDR → Pipeline
- **TECNICO**: Propostas → Equipamentos

## Autenticação
- Frontend: `apps/web/src/contexts/AuthContext.tsx`
- Backend: `apps/backend/src/auth/auth.service.ts`
- Fluxo: 1) Admin master `.env` → 2) SQLite `app_users` (bcrypt) → 3) SQL Server `Senhas` (ERP)
- Master via `ADMIN_FALLBACK_USER` / `ADMIN_FALLBACK_PASS` (funciona sem banco)
- Auto-refresh transparente: `apiClient` intercepta 401, renova via `/auth/refresh`
- **Todas as chamadas API devem usar `apiClient`** (não `fetch`) para auth + refresh
- localStorage: `sec24h_token`, `sec24h_refresh`, `sec24h_user`

### Usuários de teste (seed .env → SQLite)
`admin/admin123` (ADMIN), `ana.gestora` (GESTOR), `carlos.sdr` (SDR), `julia.vendas` (VENDEDOR), `pedro.tecnico` (TECNICO) — todos senha `test123` exceto admin.

## SQLite — Dados do App
Arquivo: `apps/backend/data/app.sqlite` (TypeORM `synchronize: true`, conexão `'sqlite'`)

| Tabela      | Descrição                                   | Entity                         |
| ----------- | ------------------------------------------- | ------------------------------ |
| `app_users` | Usuários da plataforma (bcrypt, CRUD)       | `app-users/app-user.entity.ts` |
| `app_kv`    | Key-value store genérico                    | `app-users/app-kv.entity.ts`   |

### AppUsers — gestão de usuários do app
- Endpoints `GET/POST/PUT/DELETE /app-users` — JWT + ADMIN
- Frontend `/usuarios` — CRUD completo (bcrypt, seed automático do .env)
- Separado dos usuários ERP (tabela `Senhas`)

### AppKv — key-value store
- Endpoints `GET/PUT/DELETE /app-state/:key` — JWT
- Frontend: `apps/web/src/services/appState.ts` → `loadState(key)` / `saveState(key, value)`
- API mode: SQLite + localStorage como cache (30s em memória)
- Mock mode: localStorage puro

#### Chaves usadas
| Chave                          | Tipo                             | Descrição                                   |
| ------------------------------ | -------------------------------- | ------------------------------------------- |
| `kits_custom`                  | `Kit[]`                          | Kits criados no app (ERP é read-only)       |
| `equipments_custom`            | `Equipment[]`                    | Equipamentos criados no app (ERP read-only) |
| `config:monitoramento`         | `MonitoramentoConfig`            | Faixas de preço monitoramento (admin)       |
| `config:mao_de_obra`           | `MaoDeObraConfig`                | Markup por equipamento + acréscimo por porte|
| `config:precos_custo`          | `Record<id, number>`             | Preço de custo por equipamento (admin)      |
| `config:comissoes`             | `ComissaoConfig`                 | Regras de comissão                          |
| `comissoes:overrides`          | `Record<id, ComissaoOverride>`   | Override individual de cliente              |
| `comissoes:vendedores_ativos`  | `string[]`                       | Vendedores ativos (admin)                   |
| `propostas`                    | `PropostaLocal[]`                | Propostas técnicas (SolucoesPage)           |
| `propostas_legacy`             | `Proposta[]`                     | Propostas formato antigo                    |
| `ordens_servico`               | `OrdemDeServico[]`               | OS vinculadas a propostas                   |
| `solucoes`                     | `SolucaoTecnica[]`               | Soluções técnicas                           |
| `vistorias` / `entregas`       | `Vistoria[]`                     | 1ª visita / 2ª visita                       |
| `orcamentos_local`             | `Orcamento[]`                    | Orçamentos criados localmente               |
| `vendedor_vendas`              | `VendaLocal[]`                   | Vendas do vendedor (Mini CRM)               |
| `vendedor_logs`                | `ActivityLog[]`                  | Timeline de atividades                      |

**Dados de negócio sempre via `saveState`/`loadState`** — nunca `saveLocalCache`/`loadLocalCache` (esses são cache puro de localStorage, usado só para migração ou fallback de leitura do ERP).

### Padrão: auto-save via useEffect + `loadedRef`
Módulos que usam `useEffect(() => saveState(k, arr), [arr])` precisam de um `loadedRef` pra evitar salvar `[]` em cima do BD antes do `loadState` inicial resolver. **Não use `if (arr.length) saveState(...)`** — isso impede salvar a exclusão do último item (data loss bug). Padrão correto:
```tsx
const loadedRef = useRef(false);
useEffect(() => { loadState('k', []).then((s) => { setArr(s); loadedRef.current = true; }); }, []);
useEffect(() => { if (loadedRef.current) saveState('k', arr); }, [arr]);
```

### ERP vs Custom (split pattern)
`Equipment` e `Kit` vêm do ERP (SQL Server read-only). Itens criados no app são salvos separados em `equipments_custom` / `kits_custom`. Split de state:
```tsx
const [xErp, setXErp] = useState<T[]>([]);   // do ERP via API
const [xCustom, setXCustom] = useState<T[]>([]); // do AppKv
const items = useMemo(() => [...xErp, ...xCustom], [xErp, xCustom]);
const isCustomId = (id: string) => id.startsWith('E'); // ou 'K' para kits
```
Editar/excluir item do ERP → toast warning. Só custom persiste via `saveState`.

### Refetch on focus — `useRefreshOnFocus`
Hook em `apps/web/src/hooks/useRefreshOnFocus.ts`. Aplicado em KitsPage, SolucoesPage, VendaPage — refaz `createDataSource().kits/equipment/preOrcamentos.list()` quando a aba volta a foco (debounce 500ms). Preços do ERP podem ter mudado.

## Propostas — `/solucoes` (vendedor)
Fluxo simplificado. Lead (pipeline) → proposta → PDF.

1. Cadastro rápido (auto-fill via `?leadId=`)
2. Marca → kit base (pills de marca, grid filtrado)
3. Personalização por bloco
4. Modalidade Venda vs Comodato (comparativo lado a lado)
5. Gerar PDF dark profissional (`PropostaPDF.tsx` + `openPropostaPDF`)

### Status
`rascunho` → `enviada` → `aprovada` (cria OS). ADMIN/GESTOR pode cancelar `aprovada` → `enviada`.

### Dados de referência (READ-ONLY SQL Server)
- `GET /pre-orcamentos` — 8 modelos (LINHA SEM FIO, KIT SMART, etc.)
- `GET /products` — catálogo completo ERP (~1.965 não-cancelados). Default `apenasOrcamento=false`. `?apenasOrcamento=true` filtra pelos ~4 com `GrupoOrçamento` preenchido (campo pouco usado no ERP atual).
- `GET /kits` — produtos com `produtoKit=true` (~1 no ERP atual; frontend complementa com `/pre-orcamentos` + `kits_custom`)
- `GET /prospects` — leads ERP (~2.696)

### Configs de cálculo (AppKv)
- `config:monitoramento` — faixas `{ nome, base, minimo }` por porte + mão de obra base por faixa
- `config:mao_de_obra` — `{ markupPorBloco, acrescimoPorFaixa }` — ADMIN/GESTOR configura padronizado
- `config:precos_custo` — preço de custo por `equipmentId` (fallback: `Equipment.price`)

### Cálculos
- **Venda**: subtotalEquip + mão de obra (sem CREA, sem acréscimo manual)
- **Mão de obra**: `base(faixa) + acrescimoPorFaixa + Σ(markupPorBloco × qtd)` — padronizado, sem input vago no vendedor
- **Comodato**: `parcela = subtotalCusto/prazo(24/36/48) + monitoramento mensal`
- **Taxa de Adesão = mão de obra** — 1ª mensalidade paga na assinatura do contrato (para pagar o técnico). Após 30 dias o cliente paga monitoramento normal. **NÃO é** `mensalidade × multiplicador`.
- **Custo total comodato**: `taxaAdesao + mensalidadeComodato × prazo`
- **Merged equipments**: mantido por segurança — se algum consumidor passar `apenasOrcamento=true`, produtos de kits fora desse filtro são completados via entradas sintéticas no frontend (`SolucoesPage.mergedEquipments`).

### Pipeline → Minhas Vendas
- `/kanban` botão "Iniciar Venda" → `/vendas?leadId=X&nome=X&tel=X&...` — auto-cria `VendaLocal`
- Botão "Agendar Visita" → move lead para etapa "Visita / Reunião"

## Mini CRM do Vendedor — `/vendas` + `/venda/:id`
Hub pessoal do vendedor (6 etapas).

### `/vendas` (VendasListPage)
Nova Venda, auto-criação via pipeline, KPIs, filtros status/busca, excluir por card.

### `/venda/:id` (VendaPage) — 6 etapas
1. **Cliente** — dados + tipo de local
2. **Solução** — marca → kit → ajuste (modo kit ou wizard avançado)
3. **Proposta** — modalidade, slider monitoramento (mín/máx por faixa), prazo, mão de obra auto-calculada (breakdown colapsável + override + "Restaurar"), PDF, "Cliente Aprovou"
4. **1ª Visita** — ambientes + pontos + fotos com marcação X obrigatória (ver "Fotos + PhotoAnnotator" abaixo)
5. **Entrega** — timeline visual (1ª ✓ → Instalação → 2ª) + vistoria de entrega (`entregas` AppKv), sem marcação
6. **Resumo** — dashboard completo + galeria + timeline

### Kits na Solução (Etapa 2)
- Fonte unificada: `/pre-orcamentos` + `/kits` como `Kit[]`
- Marca inferida por keyword no nome + fallback `codMarca`
- Kits da marca selecionada em destaque; outras em `<details>` colapsável
- `KitGrid` reutilizável

### Timeline de Atividades
- Logs automáticos (`venda_criada`, `foto_adicionada`, `solucao_aprovada`, etc.) em `vendedor_logs`
- Tipos em `types.ts` (`ActivityLogType`)

### Usabilidade Mobile/Tablet
Vendedores usam no celular — toda UI touch-first:
- Botões CTA com `minHeight: 44` (iOS HIG), `fontSize ≥ 13`, full-width
- Pills (marca, tipo local, faixa, modalidade) com `flex: 1 1 auto` + wrap
- Step bar com scroll horizontal
- Forms: `type="tel"/"email"` + `autoComplete` para teclados mobile
- Painéis comparativos (Compra vs Comodato) stacked verticalmente
- Timeline 1ª/Inst/2ª wrap com `minWidth: 100`
- Fotos: câmera com cascata de fallbacks (ver "Fotos + PhotoAnnotator")

### Fotos + PhotoAnnotator (1ª Visita)
Fluxo: câmera ou upload → `compressImage` (1200px, JPEG 0.75) → **`PhotoAnnotator`** (obrigatório) → foto anotada salva.

- Componente: `apps/web/src/modules/venda/shared/PhotoAnnotator.tsx`
- Usuário toca/clica na foto para colocar 1 ou vários X vermelhos (outline branco por cima pra visibilidade). "Desfazer" remove o último, "Limpar tudo" zera.
- Ao salvar, os X são **queimados na imagem via canvas** (stroke branco + stroke vermelho, ~9% do menor lado), exportados como JPEG 0.82. O técnico vê os locais abrindo a foto normalmente, sem viewer especial.
- Armazenamento: base64 dentro de `InstallationPoint.photos[]` → `Vistoria.ambientes[]` → `saveState('vistorias', ...)` → AppKv.
- `CameraModal`: `getUserMedia` em cascata (`facingMode: environment` → qualquer câmera → `{video:true}`). Detecta `isSecureContext`, traduz `NotAllowedError`/`NotFoundError`/`NotReadableError`/`OverconstrainedError`/`SecurityError` em mensagens acionáveis. Stream guardada em `useRef` (strict-mode safe).
- Prop `annotate` em `StepVistoria` (default `true`). `StepEntrega` (2ª visita) usa fluxo direto sem marcação — fotos lá são comprovação, não instrução.

### Backend — body limit 50mb
`apps/backend/src/main.ts` desabilita o bodyParser padrão do NestJS e usa `bodyParser.json({ limit: '50mb' })` + `urlencoded({ limit: '50mb' })` porque payloads de `/app-state/vistorias` carregam base64 de várias fotos e estouravam o default (~100kb). Sem isso, `saveState` falhava silenciosamente em 413 e as fotos sumiam entre devices.

## Comissões — `/comissoes`
Acesso: ADMIN, GESTOR. Gestão sobre vendas em comodato.

### Regras
- **Comissão** = N mensalidades do monitoramento (2 ou 3, configurável)
- **Taxa de adesão** (neste módulo) = 1ª mensalidade × multiplicador (1.25 ou 1.5)
- **Prazo mínimo** = 12 meses de retenção
- Vendedores com retenção < 50% perdem comissão futura
- Admin seleciona vendedores ativos

### Configs (AppKv)
- `config:comissoes` — default `{ prazoMinimoMeses: 12, qtdMensalidadesComissao: 2, multiplicadorAdesao: 1.25 }`
- `comissoes:vendedores_ativos`, `comissoes:overrides`

### Backend — `apps/backend/src/comissoes/`
Raw SQL SQL Server (acentos Prisma: `[NumOrçamento]`, `[Comissão]`, `[CGCCPF]`).
- `getOrcamentosComodato()` — modalidade L/C, status F/L/E
- `getClientesAtivos()` — JOIN Senhas + Orçamentos + `dataCadastro`
- `getUsuariosDisponiveis()` — DISTINCT da tabela Senhas

### Frontend
- Tab 1 — Comissões por Vendedor (cards com clientes comodato, cálculo)
- Tab 2 — Clientes Ativos (filtros busca/vendedor/modalidade/valor/cidade/ordenação)
- `ConfigModal` (admin) + `OverrideModal` (admin)

## Dashboard — `/dashboard`
Acesso **ADMIN** e **GESTOR**. 5 tabs.

| Tab            | Foco               | Conteúdo principal                                     |
| -------------- | ------------------ | ------------------------------------------------------ |
| **Financeiro** | Receita e custos   | KPIs, evolução mensal, DRE, custos, faturamento anual  |
| **Operacional**| Performance humana | Vendedor, Técnico, OS instalação/manutenção            |
| **Retenção**   | Churn detalhado    | Entrada/saída por modalidade (7 seções)                |
| **CRM**        | Pipeline e leads   | Funil, origem, conversão                               |
| **Prospecção** | Sheets + Marketing | WhatsApp/IG/Visitas + ROI tráfego pago                 |

Tipo `DashTab = 'financeiro' | 'operacional' | 'retencao' | 'crm' | 'prospeccao'`. Financeiro/Operacional compartilham filtro de período.

### Faturamento Anual (seção da tab Financeiro)
- `DashboardRepository.getFaturamentoAnual()` → `GET /dashboard/faturamento-anual`
- Orçamentos status `'F'` (Faturado) agrupados por ano pela **data de Fechamento**
- JOIN com `Clientes` para **modalidade efetiva** (`MOD_EFETIVA_ORC`):
  - `o.[Modalidade]` tem prioridade
  - Fallback `c.[Modalidade]` + `c.[DiaVencimento]`
  - V com DiaVencimento 5/10/15/20/25 → Monitoramento (L)
- Segmentado por Monitoramento/Venda/Rastreamento + `ValorMonitoramento` separado
- `crescimentoMedio`: variação % média YoY
- Frontend: filtro pills, 4 KPIs, `FaturamentoAnualChart.tsx` (barras empilhadas + linha + %YoY), tabela detalhada
- Cores: Monitoramento `#43C17B`, Venda `#C8A951`, Rastreamento `#5B9BD5`

### Retenção — tab Retenção
Security24h tem alto fluxo (~+80 novos, ~-60 saídas/ano).

#### Modalidades (efetiva)
- **L/C** → Monitoramento (Comodato)
- **V** → Venda (mas ~486 clientes V com `DiaVencimento IN (5,10,15,20,25)` pagam mensal → tratados como Monitoramento)
- **R** → Rastreamento
- Backend SQL CASE `MOD_EFETIVA` + labels `{ V:'Venda', L:'Monitoramento', R:'Rastreamento', C:'Monitoramento' }`

#### Lógica
- Ativo = `Cancelamento IS NULL AND ValorNF > 0`
- Churn = `Cancelamento IS NOT NULL`
- Novo = `DataCadastro` no período
- `EMPRESA_IDS = [2, 1002]`

#### Backend
- `DashboardRepository.getRetencao(dataInicio?, dataFim?)` → `GET /dashboard/retencao`
- 8 queries paralelas agrupadas por modalidade efetiva (ativos, novos, cancelados, evolução mensal, permanência por faixa, churn por vendedor, tempo médio ativos)

#### Frontend (7 seções)
1. 9 KPI cards (Base, Novos, Cancelados, Saldo, Retenção, Churn, Perm. Cancelados/Ativos, MRR Líquido)
2. Segmentação por Modalidade
3. Clientes Comodato (KPIs + modal `ComodatoModal` fullscreen)
4. Evolução Mensal (`RetencaoMensalChart` barras +/- + linha saldo)
5. Análise de Churn (`RetencaoDonutChart` + permanência + tabela por vendedor)
6. Insights automáticos

Métricas:
- Retenção: `ativos / (ativos + cancelados) × 100`
- Churn: `cancelados / (ativos + cancelados) × 100`
- Perm. ativos: `AVG(DATEDIFF(month, DataCadastro, GETDATE()))`
- Perm. cancelados: `AVG(DATEDIFF(month, DataCadastro, Cancelamento))`

Tipos: `RetencaoModalidade`, `RetencaoDashboard`, `FaturamentoAnualItem`, `FaturamentoAnualData` — ver `apps/web/src/lib/dataSource/types.ts`.

## Data Source (dual mode)
Env `NEXT_PUBLIC_DATA_SOURCE`:
- `api` → backend NestJS (`NEXT_PUBLIC_API_BASE_URL`)
- `mock` → localStorage

Abstração em `apps/web/src/lib/dataSource/`:
`interfaces.ts` · `types.ts` · `apiDataSource.ts` · `mockDataSource.ts` · `factory.ts` · `adapters/`

## Módulos do Frontend
| Rota            | Módulo           | Descrição                                 |
| --------------- | ---------------- | ----------------------------------------- |
| `/dashboard`    | dashboard/       | 5 tabs (ADMIN/GESTOR)                     |
| `/kanban`       | kanban/          | Pipeline CRM (7 etapas, drag-drop)        |
| `/vendas`       | vendas/          | Hub do Vendedor                           |
| `/venda/[id]`   | venda/           | Fluxo de 6 etapas                         |
| `/solucoes`     | solucoes/        | Propostas simplificadas                   |
| `/orcamentos`   | orcamentos/      | Funil, abas status, materiais             |
| `/instalacoes`  | installations/   | Ordens de serviço                         |
| `/equipamentos` | equipment/       | CRUD produtos                             |
| `/kits`         | kits/            | Kits pré-configurados                     |
| `/usuarios`     | users/           | CRUD de app_users                         |
| `/missoes`      | missions/        | Board de missões                          |
| `/sdr`          | sdr/             | CRM Unificado (3 tabs)                    |
| `/comissoes`    | comissoes/       | Comissões + clientes ativos               |
| `/login`        | (AuthContext)    | Login                                     |

Páginas App Router: `apps/web/app/<rota>/page.tsx` (thin wrappers).

## Pipeline / Kanban — `/kanban`
Fonte: `GET /crm/leads` (leads reais das planilhas).

### 7 etapas
| Etapa                 | StatusNorm match      | Cor       |
| --------------------- | --------------------- | --------- |
| Novos Leads           | Novo, (vazio)         | `#5B9BD5` |
| Tentativa de Contato  | Primeiro contato      | `#FF9800` |
| Em Conversa           | Conversando           | `#C077DB` |
| Qualificado           | Qualificado           | `#43C17B` |
| Visita / Reunião      | Agendado              | `#E3B341` |
| Orçamento Enviado     | Orçamento enviado     | `#E8875B` |
| Fechado               | Fechado + fechou=SIM  | `#2ECC71` |

### Funcionalidades
- Estágios derivam do próprio `VendaLocal.status` (não há tabela separada de posição)
- Iniciar Venda, Agendar Visita, Descartar (individual/lote + motivo), Marcar Perdido, Restaurar
- Filtros (busca, origem, responsável, prioridade, período)
- Painel lateral com WhatsApp/Ligar + ações
- Acesso: ADMIN/GESTOR/SDR/VENDEDOR · Ações: ADMIN/GESTOR/SDR/VENDEDOR

## Backend — Endpoints principais
| Método | Rota                              | Descrição                        |
| ------ | --------------------------------- | -------------------------------- |
| GET    | `/health`                         | Health check                     |
| POST   | `/auth/login` · `/auth/refresh`   | JWT                              |
| GET    | `/me`                             | Usuário autenticado              |
| CRUD   | `/app-users`                      | Gestão de usuários (ADMIN)       |
| CRUD   | `/app-state/:key`                 | AppKv                            |
| GET    | `/dashboard/stats?period=`        | KPIs                             |
| GET    | `/dashboard/financeiro`           | Painel financeiro                |
| GET    | `/dashboard/faturamento-anual`    | Histórico por ano                |
| GET    | `/dashboard/retencao`             | Retenção detalhada               |
| GET    | `/products` · `/kits`             | Produtos / kits                  |
| GET    | `/prospects`                      | Leads ERP                        |
| GET    | `/orcamentos` · `/funnel` · `/materiais-vendidos` | Orçamentos |
| GET    | `/pre-orcamentos`                 | Modelos                          |
| GET    | `/sheets/leads` · `/sdr-log` · `/health` | Google Sheets prospecção  |
| GET    | `/crm/leads` · `/stats` · `/sources` | CRM unificado                 |
| GET    | `/comissoes/vendedores` · `/usuarios-disponiveis` · `/clientes-ativos` | Comissões |

## Prisma Schema — Nullable
SQL Server legado tem muitos NULLs. Campos opcionais no schema:
`Produto.cancelado`, `Produto.descricao`, `Prospect.acompanhaPipe`, `ProspectAcaoVenda.descricao/.data`, `DadoEntidade.descreve/.inativa`, `EtapaOrcamento.etapa`, `PreOrcamento.descricao`.

Se aparecer `"found incompatible value of null"` → tornar campo opcional + `npx prisma generate`.

## Backend — Fail-soft
Sobe mesmo sem conexão SQL Server:
- **TypeORM**: `dataSourceFactory` com `Promise.race(8s)` — finge `isInitialized`
- **Prisma**: `onModuleInit` com `Promise.race(6s)` — modo fail-soft
- Auth retorna 503 quando DB indisponível
- Demais endpoints: erro controlado via `ensureConnection()`

## Google Sheets (Prospecção)
Planilha: `1mnYYS2-cPMld0pzsVRqNth5JanKSvjV46hYch33oatY`
- Backend: `apps/backend/src/sheets/`
- `gviz/tq?tqx=out:json` (sem API key), cache 60s
- 3 abas: WhatsApp (162), Instagram (136), Visitas marcadas (22)

## CRM Unificado — `apps/backend/src/crm/`

### Fontes (10 tabs em 3 planilhas)
| Fonte                         | Planilha   | Tab     | Status              |
| ----------------------------- | ---------- | ------- | ------------------- |
| LP (Segurança/Empresas/Residencial/Geral/Outro) | `1PQ6w...` | 5 gids | Vazias (Google Ads) |
| Site                          | `1T4F3...` | gid=0   | Com dados           |
| Form. Instagram               | `1JSkH...` | gid=0   | Com dados           |
| SDR WhatsApp/Instagram/Visitas| `1mnYY...` | 3 tabs  | Com dados           |

### Arquitetura
- **SQL Server READ-ONLY** — normalização/dedup em memória
- Cache 120s (`CRM_CACHE_TTL_MS`)
- Dedup por telefone + nome
- Score 0–100 (urgência, status, origem, valor, produto)
- Prioridade: alta (≥60) / média (≥35) / baixa (<35)
- Visitas com `Fechou? = SIM` → status "Fechado"

### Status normalizados
`Novo` → `Primeiro contato` → `Conversando` → `Qualificado` → `Agendado` → `Orçamento enviado` → `Fechado`/`Perdido` (map em `CrmService.STATUS_NORM`)

### Modelo `CrmLead`
30+ campos: nome, telefone, email, endereco, cidade, bairro, empresa, origem, origemLabel, produtoInteresse, tipoLocal, urgencia, valorPretendido, status, statusNorm, responsavel, dataEntrada, fontes[], score, prioridade, observacoes, duplicatas, fechou, motivoPerda, valorOrcamento, instagramHandle.

### Frontend `/sdr` (3 tabs)
1. **Painel CRM** — 6 KPIs, pipeline visual, distribuição por origem/produto/responsável, evolução
2. **Todos os Leads** — tabela unificada com filtros + CSV export + modal detalhe
3. **Por Fonte** — sidebar agrupada (SDR + Site/LP)

### Produto Interesse (inferência)
"alarme e câmera"→Alarme e Câmeras · "alarme"→Alarme Monitorado · "câmera"→Câmeras Monitoradas · "cerca/concertina"→Cerca Elétrica · "totem"→Totem · "portaria/acesso"→Controle de Acesso

### Integrações futuras (fase 2)
Evolution API (WhatsApp remarketing), N8N (formulários), templates editáveis, automação por status.

## Banco de Dados ERP (Prisma)
Modelos: `Produto`, `ProdutoKit`, `Prospect`, `ProspectAcaoVenda`, `Orcamento`, `OrcamentoProduto`, `OrcamentoServicoAdicional`, `Cliente`, `OrdemServico`, `PreOrcamento`, `PreOrcamentoProduto`, `SenhaUser`, `DadoEntidade`, `EtapaOrcamento`.

Schema: `apps/backend/prisma/schema.prisma` · Mapeamento: `docs/DB_MAPPING.md`

## Orçamentos — Status do BD
| Código | Label              | Cor       | Significado             |
| ------ | ------------------ | --------- | ----------------------- |
| A      | Aberto             | warning   | Em negociação           |
| P      | Aguard. Aprovação  | `#5B9BD5` | Pendente                |
| L      | Liberado           | success   | Aprovado                |
| E      | Em Instalação      | gold      | Instalação              |
| F      | Faturado           | `#43C17B` | Fechado/faturado        |
| C      | Cancelado          | danger    | Cancelado               |

- Materiais vendidos (`/orcamentos/materiais-vendidos`): agrega F+L+E
- Funil: `avancados = F + L + E`
- Filtro período: presets (7d/30d/90d/ano) diretos; custom via botão "Consultar"
- Filtro faixa de preço: 0–300, 300–800, 800–1.200, 1.200–2.500, 2.500–5.000, 5.000+, Personalizado

## Convenções

### Código
- Acentos em strings visíveis (Serviço, Técnico, Descrição)
- Nomes de tipos sem acento (OrdemDeServico, PropostaServico)
- RBAC: `const canWrite = role === 'ADMIN';`
- Toast: `const { showToast } = useToast();`
- Persistence: `loadState(key, fallback)` / `saveState(key, value)` em `services/appState.ts`
- **Dados de negócio → sempre `saveState`/`loadState`** (nunca `saveLocalCache`/`loadLocalCache` — esses são só cache de localStorage em `services/localCache.ts`)
- Vendor custom (recharts, dnd-kit) em `apps/web/src/vendor/` — sem libs externas
- Helpers reutilizáveis do módulo `venda/` ficam em `apps/web/src/modules/venda/shared/` (`constants.ts`, `configs.ts`, `styles.ts`, `PhotoAnnotator.tsx`) — `VendaPage.tsx` importa de lá

### Arquivos críticos (não reverter sem pedir)
- `apps/web/src/config/rbac.ts`
- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/layout/ProtectedRoute.tsx`

### Ambiente
- Windows 11 — paths com espaços precisam de aspas no bash
- Dev: `npm run dev:web` (3000) + `npm run dev:backend` (3001)
- `.env` backend: `apps/backend/.env`
- `.env.local` frontend: `apps/web/.env.local`
- SQLite: `apps/backend/data/app.sqlite`
