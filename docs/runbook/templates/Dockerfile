# Шаблон под Next.js (standalone). Для другого стека меняется стадия builder
# и команда запуска — принципы те же: многоступенчатость, non-root, chmod на статику.
#
# syntax=docker/dockerfile:1

# ---- deps: только зависимости, кэшируется отдельным слоем ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: сборка проекта ----
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: минимальный рантайм ----
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

# ВАЖНО: рантайм работает под non-root. Файлы с правами 600 (например, фото из
# мессенджера) иначе будут нечитаемы и отдадут 500 вместо картинки.
RUN chmod -R a+rX ./public ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
