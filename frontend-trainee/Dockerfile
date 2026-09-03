# SOIS Trainee — Next.js :3000 (Member 1/6)
# Owned by: Member 6 (Architecture) — M6-01 (was missing, added for compose)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=12 CMD wget -qO- http://localhost:3000/api/v1/health || wget -qO- http://localhost:3000/ || exit 1
CMD ["npm", "start", "--", "-p", "3000"]
