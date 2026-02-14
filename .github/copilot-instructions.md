## Purpose

This file gives AI coding agents the repository-specific context and conventions needed to be productive immediately. Focus on the concrete structure, scripts, integration points, and code examples referenced below.

## Quick Start (Commands)

- **Install deps:** `npm install` at repo root (uses workspaces).
- **Run backend (dev):** `npm run dev:backend` -> runs `@security24h/backend:start:dev` (NestJS watch).
- **Run web (dev):** `npm run dev:web` -> runs `@security24h/web:dev` (Next.js app directory).
- **Run mobile (dev):** `npm run dev:mobile` -> runs `@security24h/mobile:start` (React Native CLI).

## Repo Layout (high level)

- **`apps/backend`**: NestJS API (TypeORM, MSSQL, JWT auth).
- **`apps/web`**: Next.js admin UI (app router, client-side mocks + `localStorage`).
- **`apps/mobile`**: React Native app (CLI project, uses `src/services/api.ts`).
- **`packages/shared`**: shared TS code used across apps.

## Big-picture architecture

- Backend provides real data via TypeORM + MSSQL. Look at `apps/backend/src/app.module.ts` for the TypeORM config and entity list.
- Web admin is currently mock-first: it reads/writes persistent mock state in `localStorage` via `apps/web/src/services/mockStorage.ts` and sample data in `apps/web/src/mocks/*.ts`.
- Mobile app implements a thin client UI and calls the real API via `apps/mobile/src/services/api.ts` when available.

## Important backend details

- JWT & roles: auth code lives in `apps/backend/src/auth/` (`auth.service.ts`, `jwt.strategy.ts`, `jwt.guard.ts`, `roles.decorator.ts`, `roles.guard.ts`). Use these files to understand access control and token generation.
- DB entities: see `apps/backend/src/database/*.ts` (e.g. `senha-user.entity.ts`, `prospect.entity.ts`). TypeORM `synchronize` is `false` in `app.module.ts` — expect migrations or manual schema sync.
- Environment variables used by backend: `SQL_SERVER_HOST`, `SQL_SERVER_PORT`, `SQL_SERVER_USERNAME`, `SQL_SERVER_PASSWORD`, `SQL_SERVER_DATABASE`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_USERS`, etc.
- Common middleware/interceptors: `apps/backend/src/common/json-logger.interceptor.ts` and `rate-limit.middleware.ts` — use these to trace requests and enforce basic throttling.

## Web (Next.js) specifics and mocks

- App structure uses the new `app/` router with UI modules under `apps/web/app/`.
- Persistent mock data and examples: `apps/web/src/mocks/data.ts` (leads, users, kits, etc.) and `apps/web/src/services/mockStorage.ts` (load/save helpers).
- To convert a mock endpoint to use the real backend, update the frontend service to call the backend URL and adjust types in `apps/web/src/types.ts`.

## Mobile specifics

- RN CLI project with scripts in `apps/mobile/package.json`. Token storage uses `react-native-keychain` — examine `apps/mobile/src/store/auth.ts` and `apps/mobile/src/services/api.ts` for auth flow.

## Conventions & patterns to follow

- TypeScript-first: prefer typed DTOs under `*/dto.ts` files (backend modules include `leads/dto.ts`, `quotes/dto.ts`).
- Role names: `ADMIN`, `VENDEDOR`, etc. Roles are resolved in `AuthService.resolveRole` (see `auth.service.ts`).
- Use workspace scripts from the repo root (e.g., `npm run dev:web`) rather than running nested `npm` directly — workspace scripts ensure the right package context.

## Integration points & gotchas

- Database: backend expects MSSQL. Running backend without DB env vars will fail at TypeORM initialization. For UI work prefer using the web mocks instead of spinning a DB.
- JWT secrets: defaults exist (`'dev'` fallback in `jwt.strategy.ts`) — do not hardcode production secrets; tests or local dev can use environment fallbacks.
- Migrations: `synchronize: false` means schema changes require migrations or manual DB updates.

## Where to look for examples

- Auth/login flow: `apps/backend/src/auth/auth.service.ts` and `apps/backend/src/auth/jwt.strategy.ts`.
- Mock data & UI: `apps/web/src/mocks/*.ts` and `apps/web/src/services/mockStorage.ts`.
- TypeORM + entities: `apps/backend/src/app.module.ts` and `apps/backend/src/database/*.ts`.

## Minimal instructions for common tasks

- Convert web mock to real API call: replace mock call in `apps/web/src/modules/<module>/service` with axios/fetch to backend; update `apps/web/src/config/rbac.ts` if role checks are client-side.
- Add a backend endpoint: add controller in `apps/backend/src/*/*.controller.ts`, register service in module, and add entity to `app.module.ts` if DB-backed.

## Questions for the maintainer (please answer in PR comments)

- Which environment (local/docker/migration workflow) do contributors normally use to run a full backend + DB stack?
- Any CI checks or expected lint/test commands not present in package.json?

---

If anything above is unclear or you want more detailed examples (sample requests, typical env file, or a small migration example), tell me which area to expand.
