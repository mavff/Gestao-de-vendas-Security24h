# Security24h Monorepo (Inside Sistemas Legado)

Monorepo com backend NestJS + mobile React Native CLI + web admin Next.js, com identidade visual Security24h (preto/dourado/cinza).

## Resumo do mapeamento do legado (`tabelas.md`)
- **Auth**: tabela `Senhas` (`IDUsuário`, `Usuário`, `Senhasis`, `Identificação`, `UsuárioInativo`).
- **Leads**: tabela `Prospects` (`CodProspect`, `Nome`, `Email`, `Fone1`, `Cidade`, `Estado`, `Origem`, `Status`, `DataCadastro`, `Usuário`).
- **Timeline**: tabela `ProspectsAçãoVendas` (`CodAção`, `CodProspect`, `Data`, `Hora`, `Descrição`, `Ação`, `Vendedor`).
- **Orçamentos**: tabela `Orçamentos` (`CodInterno`, `ClienteNome`, `Prospect`, `Status`, `Emissão`, `Usuário`, `Observações`, `TotalProdutos`, `TotalServiços`).
- **Itens de orçamento**: tabela `OrçamentosProdutos` (`CodInterno`, `Planílha`, `CodProduto`, `Descrição`, `Quantidade`, `Unitário`, `Total`).

> Não há migrations alterando schema legado (`synchronize: false`).

## Estrutura

```txt
apps/
  backend/
  mobile/
  web/
packages/
  shared/
```

## Segurança
- SQL Server legado **não é exposto na internet**; apenas API Nest acessa o banco.
- Usar VPN/Zero Trust para acesso interno ao SQL Server.
- JWT Access + Refresh implementado.
- RBAC com perfis: `ADMIN`, `SDR`, `VENDEDOR`, `TECNICO`, `INFRA`, `MONITOR`.
- Helmet, rate limit, validação DTO e logs estruturados JSON.

## Variáveis de ambiente

### Backend (`apps/backend/.env`)
Copie de `apps/backend/.env.example` e configure credenciais reais on-prem.

### Mobile (`apps/mobile/.env`)
Copie de `apps/mobile/.env.example` e ajuste `API_BASE_URL`.

## Como rodar

### 1) Instalar dependências
```bash
npm install
```

### 2) Backend
```bash
npm run dev:backend
```

### 3) Mobile Android
```bash
npm run dev:mobile
npm --workspace @security24h/mobile run android
```

### 4) Mobile iOS
```bash
npm --workspace @security24h/mobile run ios
```

### 5) Web admin
```bash
npm run dev:web
```

### 6) Docker Compose (backend)
```bash
docker compose up backend
```

## Endpoints MVP
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /me`
- `POST /leads`
- `GET /leads`
- `GET /leads/:id`
- `POST /leads/:id/timeline`
- `POST /quotes`
- `POST /quotes/:id/items`
- `GET /quotes/:id`
