# Build — mesmo Debian que o runner para os binários do Prisma (glibc) funcionarem
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Produção — Debian + OpenSSL 3 para o Prisma (query engine debian-openssl-3.0.x)
FROM node:20-bookworm-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Migrations rodam na inicialização; use "prisma migrate deploy" em produção
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
