# Redeploy — Fix de Segurança (JWT + Guards)

**Data:** 2026-04-19
**Escopo:** backend apenas

## O que mudou

### 1. JWT secret sem fallback inseguro
- `apps/backend/src/auth/jwt.strategy.ts` — removido fallback `|| 'dev'`. Backend agora crasha no boot se `JWT_ACCESS_SECRET` faltar.

### 2. `@UseGuards(JwtGuard)` adicionado a 10 controllers
Endpoints de dados de negócio antes públicos, agora exigem JWT:
- `/orcamentos/*` — `orcamentos.controller.ts`
- `/comissoes/*` — `comissoes.controller.ts`
- `/dashboard/*` — `dashboard.controller.ts`
- `/crm/*` — `crm.controller.ts`
- `/lookups/*` — `lookups.controller.ts`
- `/kits/*` — `kits.controller.ts`
- `/products/*` — `products.controller.ts`
- `/pre-orcamentos/*` — `pre-orcamentos.controller.ts`
- `/sheets/*` — `sheets.controller.ts`
- `/prospects/*` — `prospects.controller.ts`

**Impacto no frontend:** nenhum. Todas as chamadas já usam `apiClient` (verificado — nenhum `fetch` direto a esses endpoints). Login continua público (`/auth/login`, `/auth/refresh`) e `/health` também.

### 3. `/photos/:id` agora exige JWT
- `jwt.strategy.ts` aceita token via header **OU** `?token=` (query param — necessário para `<img src>`)
- `photos.controller.ts`: `GET /photos/:id` ganhou `@UseGuards(JwtGuard)`
- `photoService.ts` (`photoSrc`) anexa `?token=<jwt>` ao montar a URL

**Impacto:** nenhum no UX. Imagens continuam carregando normalmente (frontend passa o token).

### 4. Rate limit dedicado para `/auth/login`
`rate-limit.middleware.ts` agora tem bucket separado para brute-force no login:
- Default: **5 tentativas / 60s por IP** (configurável via `RATE_LIMIT_LOGIN_LIMIT` e `RATE_LIMIT_LOGIN_TTL`)
- Resto da API mantém 100/60s (como antes)

**Atenção:** se o EasyPanel estiver atrás de proxy reverso (Traefik/Cloudflare), confira que `req.ip` está resolvendo o IP real do cliente e não o IP do proxy. Se estiver agrupando tudo num IP só, um usuário legítimo pode travar outro. Solução: habilitar `app.set('trust proxy', 1)` no `main.ts` (não incluído neste PR).

### 5. XSS no PDF da proposta
`PropostaPDF.tsx` agora escapa HTML em todos os campos controláveis pelo vendedor (`clienteNome`, `clienteTel`, `clienteEndereco`, `tipoLocal`, `marca`, `observacoes`, `vendedorNome`, nomes de itens, CPF, assinatura). Assinatura valida que é `data:image/...` antes de ir pro `<img src>`.

## Envs adicionais (opcionais)
```
RATE_LIMIT_LOGIN_LIMIT=5     # default
RATE_LIMIT_LOGIN_TTL=60      # default (segundos)
```

## ⚠️ ANTES DE FAZER O REDEPLOY

Verifique no **EasyPanel → serviço backend → Environment** que estas variáveis existem e têm valor forte:

- `JWT_ACCESS_SECRET` (obrigatório — sem isso o container não sobe)
- `JWT_REFRESH_SECRET` (obrigatório para refresh funcionar)

Se alguma estiver faltando, gere uma chave forte (mínimo 32 bytes aleatórios):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Cole o valor gerado no EasyPanel antes de subir.

## Como fazer o redeploy

1. **Confirme as envs** (passo acima) — isso é o mais importante.
2. Push para os 2 remotes (EasyPanel lê do GitLab):
   ```bash
   git push origin main && git push gitlab main
   ```
3. No EasyPanel, clique **Deploy** (ou espere o webhook se configurado).
4. Acompanhe o log do container. Se subir normalmente e responder `/health`, deu certo.

## Se o container não subir

Log vai mostrar:
```
Error: JWT_ACCESS_SECRET is not set. Refusing to start with insecure default.
```
→ significa que a env var não está setada no EasyPanel. Volte ao passo "Antes de fazer o redeploy".

## Impacto para usuários

- **Nenhum** se as envs estiverem corretas. Tokens já emitidos continuam válidos (mesmo secret).
- Se por acaso você trocar o valor do `JWT_ACCESS_SECRET`, todos os usuários serão deslogados (precisarão fazer login de novo). Só trocar o secret se quiser invalidar todas as sessões.
