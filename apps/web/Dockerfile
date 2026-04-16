# syntax=docker/dockerfile:1.7
# ============================================================
# Web (Next.js 14) — multi-stage build com output: 'standalone'
# Build context: MONOREPO ROOT
#   docker build -f apps/web/Dockerfile -t sec24h-web .
# ============================================================

# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /repo
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
COPY apps/backend/package.json apps/backend/

RUN npm ci --include=dev

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /repo
RUN apk add --no-cache libc6-compat

# API base URL é baked at build time (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ARG NEXT_PUBLIC_DATA_SOURCE=api
ARG NEXT_PUBLIC_USE_RELATIONAL=false
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_DATA_SOURCE=$NEXT_PUBLIC_DATA_SOURCE
ENV NEXT_PUBLIC_USE_RELATIONAL=$NEXT_PUBLIC_USE_RELATIONAL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY apps/web ./apps/web

RUN npm --workspace @security24h/web run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S app && adduser -S app -G app

# Output standalone traz server.js + node_modules mínimos
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /repo/apps/web/public ./apps/web/public

USER app
EXPOSE 3000

# O server.js do standalone fica dentro de apps/web/
CMD ["node", "apps/web/server.js"]
