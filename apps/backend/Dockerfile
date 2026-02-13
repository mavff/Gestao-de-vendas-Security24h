# Security24h Backend — Multi-stage Docker build
# Usage:
#   docker build -t security24h-api -f apps/backend/Dockerfile .
#   docker run -p 3001:3001 -e PORT=3001 security24h-api

FROM node:20-slim AS builder

WORKDIR /app

# Copy root package files for workspace resolution
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN cd apps/backend && npm install

# Copy source
COPY apps/backend/ ./apps/backend/

# Generate Prisma client (needs schema, not a real DB)
RUN cd apps/backend && npx prisma generate || true

# Build NestJS
RUN cd apps/backend && npx nest build

# --- Production stage ---
FROM node:20-slim AS runner

WORKDIR /app

COPY --from=builder /app/apps/backend/package*.json ./
COPY --from=builder /app/apps/backend/dist/ ./dist/
COPY --from=builder /app/apps/backend/prisma/ ./prisma/
COPY --from=builder /app/apps/backend/node_modules/ ./node_modules/

# Prisma needs the client in node_modules
COPY --from=builder /app/node_modules/.prisma/ ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma/ ./node_modules/@prisma/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/main.js"]
