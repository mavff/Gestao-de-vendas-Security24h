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

Ordem da sidebar (funil cronológico):
- **ADMIN**: Dashboard → SDR → Pipeline → Propostas → Orçamentos → Comissões → Kits → Equipamentos → Usuários
- **GESTOR**: Dashboard → Pipeline → Propostas → Orçamentos → Comissões → Kits → SDR
- **VENDEDOR**: Pipeline → Propostas → Kits → Minhas Vendas
- **SDR**: SDR → Pipeline → Dashboard
- **TECNICO**: Propostas → Equipamentos
- **INFRA**: Pipeline → Equipamentos
- **MONITOR**: Dashboard

## Autenticação

- Frontend: `apps/web/src/contexts/AuthContext.tsx`
- Backend: `apps/backend/src/auth/auth.service.ts`
- JWT com access token (15min) + refresh token (7d) + **auto-refresh transparente** no `apiClient`
- Fluxo de login: 1) Admin master `.env` → 2) SQLite `app_users` (bcrypt) → 3) SQL Server `Senhas` (ERP)
- Login master via env vars `ADMIN_FALLBACK_USER` / `ADMIN_FALLBACK_PASS` (funciona sem banco)
- Roles resolvidos do banco: `Senhas.AcessoCompleto` → GESTOR, `Clientes.Tipo` → V/Z/U
- localStorage keys: `sec24h_token`, `sec24h_refresh`, `sec24h_user`
- Auto-refresh: `apiClient` intercepta 401, renova token via `/auth/refresh` e repete a request
- Todas as chamadas API devem usar `apiClient` (não `fetch` direto) para garantir auth + refresh

### Usuários de teste (seed do .env → SQLite)

| Usuário | Senha | Nome | Role |
|---------|-------|------|------|
| `admin` | `admin123` | Administrador | ADMIN |
| `ana.gestora` | `test123` | Ana Silva | GESTOR |
| `carlos.sdr` | `test123` | Carlos Oliveira | SDR |
| `julia.vendas` | `test123` | Julia Santos | VENDEDOR |
| `pedro.tecnico` | `test123` | Pedro Lima | TECNICO |
| `lucas.infra` | `test123` | Lucas Ferreira | INFRA |
| `maria.monitor` | `test123` | Maria Costa | MONITOR |

Acesso master: definido em `ADMIN_FALLBACK_USER` / `ADMIN_FALLBACK_PASS` no `.env`
Usuários do ERP: login com senha do sistema ERP (tabela `Senhas` do SQL Server), role auto-resolvido

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
| `config:monitoramento`   | `MonitoramentoConfig`   | Faixas de preço monitoramento (admin) |
| `config:precos_custo`    | `Record<id, number>`    | Preço de custo por equipamento (admin)|
| `config:comissoes`       | `ComissaoConfig`        | Regras de comissão (prazo, qtd mensalidades, multiplicador adesão) |
| `comissoes:overrides`    | `Record<id, ComissaoOverride>` | Override individual de status/pagamento por cliente |
| `comissoes:vendedores_ativos` | `string[]`         | Lista de vendedores ativos selecionados pelo admin |

## Propostas — `/solucoes`

Fluxo simplificado para o vendedor criar propostas técnicas rapidamente.

### Fluxo
1. **Cadastro rápido do lead**: nome, telefone, endereço, tipo de local (auto-fill via pipeline `?leadId=`)
2. **Escolha de marca → kit base**: pills de marca com contagem de kits, grid filtrado por marca selecionada
3. **Personalização**: adicionar/remover equipamentos por bloco (sensor, câmera, etc.)
4. **Modalidade**: toggle Venda vs Comodato com comparativo lado a lado
5. **Gerar PDF**: proposta profissional dark com waves SVG, identidade Security24h

### Status da proposta
- `rascunho` → vendedor edita livremente
- `enviada` → aguardando aprovação (ADMIN/GESTOR)
- `aprovada` → OS criada automaticamente
- **Cancelar aprovação**: ADMIN/GESTOR pode reverter `aprovada` → `enviada`, removendo a OS vinculada

### Dados de referência (READ-ONLY do SQL Server)
- Pré-orçamentos: `GET /pre-orcamentos` — 7 modelos (LINHA SEM FIO, KIT SMART, etc.)
- Equipamentos: `GET /products` — 409 produtos com preço de venda
- Prospects: `GET /prospects` — leads existentes para vincular

### Dados do app (AppKv — SQLite)
- `config:monitoramento` — faixas de preço por tamanho do local (admin configura)
  - Cada faixa: `{ nome, base, minimo }` (ex: Residencial base=170, min=150)
  - Mão de obra por faixa (ex: Residencial=250, Comercial Grande=900)
  - Vendedor ajusta monitoramento via slider entre mínimo e base
- `config:precos_custo` — preço de custo por equipmentId (admin configura)
  - Fallback: usa preço do BD (`Equipment.price`) quando não cadastrado

### Dados locais (localStorage)
- `mock_propostas_v2` — lista de propostas criadas (`PropostaLocal[]`)
- Migração automática de `mock_solucoes` (formato antigo) para v2

### Cálculos
- **Venda**: subtotal equipamentos (preço venda × qtd) + mão de obra + acréscimo instalação + CREA
- **Comodato**: parcela = subtotalCusto ÷ prazo (24/36/48m) + monitoramento mensal
- **Taxa de Adesão**: 1ª mensalidade × `ComissaoConfig.multiplicadorAdesao` (1.25 ou 1.5, admin configura)
- **Comparativo**: custo total = taxa adesão + mensalidade × (prazo − 1) vs Compra: total + monitoramento × prazo
- **Merged equipments**: produtos de kits com `grupoOrcamento` vazio não aparecem em `/products`; o frontend cria entradas sintéticas (`mergedEquipments`) a partir dos dados do kit para que sejam exibidos corretamente

### Fluxo Pipeline → Proposta (integração)
- **Pipeline** (`/kanban`): botão "Criar Proposta" no card (hover) e painel lateral do lead
- Botão navega para `/solucoes?leadId=X&nome=X&tel=X&endereco=X&empresa=X&tipoLocal=X`
- **SolucoesPage** lê `searchParams` e auto-abre editor com dados do lead preenchidos
- Botão "Agendar Visita" no painel lateral move lead para etapa "Visita / Reunião"

### Seleção de Kit por Marca
- Seção 2 do editor: vendedor escolhe marca primeiro (pills com contagem de kits)
- Kits filtrados pela marca selecionada aparecem em grid de cards
- Kits de outras marcas ficam em `<details>` colapsável
- Ao clicar, carrega os itens do kit na proposta

### PDF de Proposta
- Componente: `apps/web/src/components/proposal/PropostaPDF.tsx`
- Função `openPropostaPDF(data)` abre nova aba com layout profissional para impressão
- Identidade visual Security24h: logo, dourado (#C8A951), marca d'água, rodapé
- Seções: cabeçalho, dados do cliente, tabela de equipamentos por bloco, investimento (compra + comodato)
- Botão "Gerar PDF" disponível na lista de propostas e dentro do editor
- Usa `window.print()` nativo (sem lib externa)

### Componentes internos (em SolucoesPage.tsx)
- `PropostaEditor` — editor single-page com 4 seções (cliente, marca/kit, equipamentos, modalidade)
- `MonitoramentoConfigModal` — modal ADMIN para editar faixas de preço e mão de obra
- `KitOption` — tipo unificado para modelos DB + kits locais

## Comissões — `/comissoes`

Gestão de comissões de vendedores sobre vendas em comodato (monitoramento).
Acesso: ADMIN, GESTOR.

### Regras de Negócio
- **Comissão** = N mensalidades do monitoramento (2 ou 3, configurável pelo admin)
- **Taxa de adesão** = 1ª mensalidade × multiplicador (1.25 ou 1.5, configurável)
- **Prazo mínimo** = 12 meses de retenção do cliente para liberar comissão
- Vendedores com taxa de retenção < 50% perdem comissão em futuras vendas
- Admin seleciona vendedores ativos (nem todos os usuários do ERP são vendedores)

### Configuração (AppKv)
- `config:comissoes` → `ComissaoConfig { prazoMinimoMeses, qtdMensalidadesComissao, multiplicadorAdesao }`
- `comissoes:vendedores_ativos` → `string[]` (lista de usuários selecionados)
- `comissoes:overrides` → `Record<codInterno, ComissaoOverride>` (override de status/pagamento)
- Default: `{ prazoMinimoMeses: 12, qtdMensalidadesComissao: 2, multiplicadorAdesao: 1.25 }`

### Backend
- Módulo: `apps/backend/src/comissoes/` (repository + controller + module)
- Raw SQL contra SQL Server (Prisma column names com acentos: `[NumOrçamento]`, `[Comissão]`, `[CGCCPF]`)
- `getOrcamentosComodato()`: orçamentos com modalidade L/C, status F/L/E
- `getClientesAtivos()`: Clientes ativos com JOIN em Senhas (vendedor/técnico) e Orçamentos (monitoramento) — inclui `dataCadastro`
- `getUsuariosDisponiveis()`: DISTINCT usuarios da tabela Senhas

### Frontend (ComissoesPage.tsx)
- **Tab 1 — Comissões por Vendedor**: vendedores filtrados, cards com clientes comodato, cálculo de comissão/retenção
- **Tab 2 — Clientes Ativos**: lista completa com filtros (busca, vendedor, modalidade, faixa de valor, cidade, ordenação)
- **ConfigModal**: admin define regras + seleciona vendedores ativos
- **OverrideModal**: admin ajusta status/pagamento de cliente individual

### Data Source
- Interface: `IComissoesDataSource` em `interfaces.ts`
- Tipos: `ComissaoConfig`, `ComissaoVendedor`, `ComissaoClienteInfo`, `ClienteAtivo`, `ComissoesVendedoresResult`, `ClientesAtivosResult`
- API: `ApiComissoesDataSource` em `apiDataSource.ts`
- Mock: `MockComissoesDataSource` em `mockDataSource.ts`

## Dashboard — `/dashboard` (5 abas)

O dashboard é organizado em 5 tabs com foco separado:

| Tab | Foco | Conteúdo principal |
|-----|------|--------------------|
| **Financeiro** | Receita e custos | KPIs receita, evolução mensal, mix receita, DRE, custos operacionais |
| **Operacional** | Performance humana | Vendedor, Técnico, OS instalação/manutenção |
| **Retenção** | Churn detalhado | Análise completa de entrada/saída de clientes, segmentado por modalidade |
| **CRM** | Pipeline e leads | Funil, leads por origem, conversão, fechamentos |
| **Prospecção** | Sheets + Marketing | Prospecção ativa (WhatsApp/IG/Visitas) + ROI tráfego pago |

### Tab pattern
- Tipo: `DashTab = 'financeiro' | 'operacional' | 'retencao' | 'crm' | 'prospeccao'`
- Cada tab renderiza condicionalmente: `{dashTab === 'x' && (<>...</>)}`
- Financeiro e Operacional compartilham o mesmo filtro de período (preset state)
- Retenção usa o mesmo filtro mas carrega dados via `getRetencao()` separado

## Retenção de Clientes — Tab Retenção

Análise de churn e retenção da base de clientes, **segmentada por modalidade**.
A Security24h tem alto fluxo (~+80 novos, ~-60 saídas/ano).

### Modalidades de Cliente
- **L/C** → Monitoramento (Comodato) — cliente paga mensalidade de monitoramento
- **V** → Venda — cliente comprou equipamento. **ATENÇÃO**: ~486 clientes V com `DiaVencimento IN (5,10,15,20,25)` pagam monitoramento mensal — são tratados como Monitoramento
- **R** → Rastreamento — cliente paga mensalidade de rastreamento
- Backend usa **modalidade efetiva** (`MOD_EFETIVA` SQL CASE): V com dia vencimento 5/10/15/20/25 → L, C → L
- Frontend filtra comodato com: `modalidade === 'L' || modalidade === 'C' || (modalidade === 'V' && [5,10,15,20,25].includes(diaVencimento))`

### Lógica de Negócio
- **Cliente ativo** = `Clientes.Cancelamento IS NULL AND Clientes.ValorNF > 0`
- **Cliente cancelado (churn)** = `Clientes.Cancelamento IS NOT NULL` (data = quando saiu)
- **Cliente novo** = `Clientes.DataCadastro` no período
- `EMPRESA_IDS = [2, 1002]`

### Backend
- Método: `DashboardRepository.getRetencao(dataInicio?, dataFim?)`
- Endpoint: `GET /dashboard/retencao?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`
- 8 queries SQL em paralelo contra tabela `Clientes`, **todas agrupadas por modalidade efetiva** (`MOD_EFETIVA`):
  1. Ativos por modalidade (total + MRR)
  2. Novos por modalidade no período (+ MRR ganho)
  3. Cancelados por modalidade no período (+ MRR perdido + tempo médio)
  4. Evolução mensal novos por modalidade (últimos 12 meses)
  5. Evolução mensal cancelados por modalidade (últimos 12 meses)
  6. Permanência por faixa por modalidade (0-6m, 6-12m, 1-2a, 2+a)
  7. Churn por vendedor (JOIN `Senhas` para nome do vendedor)
  8. Tempo médio de permanência dos clientes ATIVOS por modalidade (`AVG(DATEDIFF(month, DataCadastro, GETDATE()))`)
- `MOD_LABELS` map: `{ V: 'Venda', L: 'Monitoramento', R: 'Rastreamento', C: 'Monitoramento' }`

### Tipos (Frontend)
```typescript
type RetencaoModalidade = {
  modalidade: string; codigo: string;
  ativos: number; mrrAtivos: number;
  novos: number; mrrNovos: number;
  cancelados: number; mrrPerdido: number;
  tempoMedio: number; tempoMedioAtivos: number; churnRate: number;
};

type RetencaoDashboard = {
  totalAtivos: number; mrrAtual: number;
  novosNoPeriodo: number; canceladosNoPeriodo: number;
  mrrPerdido: number; mrrNovos: number;
  taxaRetencao: number; churnRate: number;
  tempoMedioPermanencia: number; tempoMedioPermanenciaAtivos: number;
  saldoLiquido: number; mrrLiquido: number;
  porModalidade: RetencaoModalidade[];
  evolucaoMensal: { mes; novos; cancelados; saldo; porModalidade: { modalidade; novos; cancelados }[] }[];
  permanenciaPorFaixa: { faixa; total; porModalidade: { modalidade; total }[] }[];
  churnPorVendedor: { vendedor; cancelados; mrrPerdido }[];
};
```

### Frontend — Conteúdo da Tab Retenção (7 seções)
1. **Visão Geral**: 9 KPI cards (Base Ativa, Novos, Cancelados, Saldo, Taxa Retenção, Churn Rate, Perm. Cancelados, Perm. Ativos, MRR Líquido)
2. **Segmentação por Modalidade**: Cards por tipo (Monitoramento/Venda/Rastreamento) com ativos, novos, cancelados, churn rate, MRR + permanência dos ativos
3. **Clientes Comodato**: KPIs resumidos (total, MRR, ticket médio, permanência, churn) + botão "Ver todos" → modal `ComodatoModal`
4. **Evolução Mensal**: Gráfico SVG barras +/- (`RetencaoMensalChart`) + tabela detalhada com breakdown por modalidade
5. **Análise de Churn Detalhada**: Donut churn por modalidade (`RetencaoDonutChart`) + barras de permanência por faixa (empilhadas por modalidade) + tabela churn por vendedor
6. **Insights Automáticos**: Pior/melhor modalidade, churn precoce (0-6m), vendedor com mais churn, saldo líquido

### ComodatoModal (DashboardPage.tsx)
- Modal fullscreen com lista de clientes comodato (modalidade L/C) carregados via `ds.comissoes.getClientesAtivos()`
- Filtros: busca (nome/CPF/telefone/cidade), vendedor, ordenação (nome/valor/tempo)
- Tabela: cliente, cidade, vendedor, técnico, valor mensal, data cadastro, permanência (meses), telefone
- KPIs no topo: total, MRR, ticket médio
- Usa `dataCadastro` (preferido) ou `primeiroFaturamento` para calcular permanência

### Gráficos SVG
- `RetencaoMensalChart` — barras verdes (novos) para cima, vermelhas (cancelados) para baixo, linha dourada (saldo)
- `RetencaoDonutChart` — donut com slices por modalidade, legenda lateral com barras e percentuais

### Métricas
- Taxa de Retenção: `ativos / (ativos + cancelados no período) × 100`
- Churn Rate: `cancelados / (ativos + cancelados) × 100`
- Saldo Líquido: `novos - cancelados`
- MRR Líquido: `mrrNovos - mrrPerdido`
- Tempo Médio Permanência (cancelados): `AVG(DATEDIFF(month, DataCadastro, Cancelamento))`
- Tempo Médio Permanência (ativos): `AVG(DATEDIFF(month, DataCadastro, GETDATE()))` — clientes ativos

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
| `/dashboard`    | dashboard/            | 5 tabs: Financeiro, Operacional, Retenção, CRM, Prospecção |
| `/kanban`       | kanban/               | Pipeline CRM (7 etapas, drag-drop)  |
| `/vendas`       | vendas/               | Lista de vendas do vendedor         |
| `/venda/[id]`   | venda/                | Fluxo completo de venda (steps)     |
| `/solucoes`     | solucoes/             | Propostas simplificadas (vendedor)  |
| `/orcamentos`   | orcamentos/           | Orçamentos: funil, abas status, faixa preço, materiais |
| `/instalacoes`  | installations/        | Ordens de serviço                   |
| `/equipamentos` | equipment/            | CRUD de equipamentos/produtos       |
| `/kits`         | kits/                 | Kits & modelos pré-configurados     |
| `/usuarios`     | users/                | Gestão de usuários do app (SQLite)  |
| `/missoes`      | missions/             | Board de missões/tarefas            |
| `/sdr`          | sdr/                  | CRM Unificado (Painel, Leads, Por Fonte) |
| `/comissoes`    | comissoes/            | Comissões vendedores + clientes ativos |
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
- **Criar Proposta** (quick action no card + painel lateral) → navega para `/solucoes?leadId=...` com dados preenchidos
- **Agendar Visita** (painel lateral) → move lead para etapa "Visita / Reunião"
- **Descartar lead** individual (motivo selecionável) ou em lote (por dias sem evolução)
- **Marcar como perdido** — move para seção Perdidos colapsável
- **Restaurar** — leads descartados/perdidos podem ser restaurados
- **Filtros**: busca, origem, responsável, prioridade, período (7d a todo)
- **Cards**: nome, empresa, telefone, score, prioridade, dias, origem, responsável + botão proposta
- **Detalhe**: painel lateral com todas as infos + WhatsApp/Ligar + Criar Proposta + Agendar Visita
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
| GET    | `/dashboard/retencao`         | Análise de retenção de clientes  |
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
| GET    | `/comissoes/vendedores`       | Orçamentos comodato agrupados por vendedor |
| GET    | `/comissoes/usuarios-disponiveis` | Todos os usuários do SQL Server  |
| GET    | `/comissoes/clientes-ativos`  | Clientes ativos com vendedor/técnico |

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
