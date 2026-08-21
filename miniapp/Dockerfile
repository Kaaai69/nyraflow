# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Локфайла пока нет (Node на машине разработчика не установлен, сборка идёт
# на сервере). Как только он появится — используется npm ci.
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

# ---- builder ----
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# next.config.ts включает output: "standalone" только при DOCKER=true.
ENV DOCKER=true
RUN npm run build

# ---- runner ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Миграции и раннер не попадают в standalone-трейс — копируем явно.
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod -R a+rX ./public ./.next/static ./migrations ./scripts
USER nextjs
EXPOSE 3000
# Миграции применяются до старта: если схема не накатилась, контейнер не
# поднимется вовсе — лучше, чем приложение на неизвестной схеме.
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
