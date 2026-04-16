# syntax=docker/dockerfile:1.7
# ============================================================
# Backend (NestJS) — multi-stage build
# Build context: MONOREPO ROOT (to resolve npm workspaces)
#   docker build -f apps/backend/Dockerfile -t sec24h-backend .
# ============================================================

# ---------- deps (dev + build) ----------
FROM node:20-alpine AS deps
WORKDIR /repo

# Toolchain para módulos nativos (better-sqlite3, bcryptjs fallback)
RUN apk add --no-cache python3 make g++ libc6-compat

# Manifests primeiro — camada cacheável
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/

RUN npm ci --include=dev

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /repo
RUN apk add --no-cache python3 make g++ libc6-compat

COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY apps/backend ./apps/backend

# Prisma client precisa ser gerado antes do nest build
RUN npm --workspace @security24h/backend run prisma:generate
RUN npm --workspace @security24h/backend run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV PHOTOS_DIR=/data/photos

RUN apk add --no-cache libc6-compat \
 && addgroup -S app && adduser -S app -G app \
 && mkdir -p /data/photos && chown -R app:app /data

# Manifests para instalar só prod deps
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/

RUN npm ci --omit=dev --workspace @security24h/backend \
 && npm cache clean --force

# Artefatos do build
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist
COPY --from=build /repo/apps/backend/prisma ./apps/backend/prisma
# Prisma client gerado (pode estar em node_modules raiz ou do workspace)
COPY --from=build /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /repo/node_modules/@prisma/client ./node_modules/@prisma/client

USER app
WORKDIR /app/apps/backend

EXPOSE 3001
VOLUME ["/data/photos"]

CMD ["node", "dist/main.js"]
