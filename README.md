# Security24h Monorepo (Inside Sistemas Legado)

Monorepo com backend NestJS + mobile React Native CLI + web admin Next.js, com identidade visual Security24h (preto/dourado/cinza).

## Estrutura

```txt
apps/
  backend/
  mobile/
  web/
    app/
    src/
      components/
      mocks/
      modules/
      services/
packages/
  shared/
```

## Como rodar

### 1) Instalar dependências
```bash
npm install
```

### 2) Backend
```bash
npm run dev:backend
```

### 3) Mobile
```bash
npm run dev:mobile
```

### 4) Web Admin (Security24h Admin)
```bash
npm run dev:web
```
Acesse `http://localhost:3000`.

## Modo Mock do Frontend Admin

O frontend web está em MVP funcional, **sem backend real**. Todos os módulos usam mocks + persistência no `localStorage`:

- `src/mocks/dashboard.ts`: dados dos gráficos.
- `src/mocks/data.ts`: entidades de leads, usuários, missões, instalações, equipamentos e kits.
- `src/services/mockStorage.ts`: leitura/escrita de estado mock no navegador.

### Módulos disponíveis no Admin
- **Dashboard**: funil, linha semanal, barra por vendedor e donut por origem.
- **Kanban**: drag and drop, filtros, cards completos e drawer de detalhe (timeline/notas/anexos/edição rápida).
- **Usuários**: CRUD mock com roles e status.
- **Missões**: lista + board por status.
- **Instalações**: lista e detalhe com pontos de instalação, fluxo vendedor/técnico e upload mock de fotos com preview.
- **Equipamentos**: catálogo por categorias.
- **Kits**: montagem de kit e vínculo com lead/venda.

### Resetar dados mock
No browser, limpe o `localStorage` para voltar ao estado inicial dos mocks.
