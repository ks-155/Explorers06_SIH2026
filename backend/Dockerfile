# SOIS Backend — NestJS (Member 5/6)
# Owned by: Member 6 (Architecture) + Member 5 (Database) — M6-01/02
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=5s --retries=12 CMD wget -qO- http://localhost:3001/api/v1/health | grep -q '"status":"ok"' || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed || true && node dist/src/main"]
