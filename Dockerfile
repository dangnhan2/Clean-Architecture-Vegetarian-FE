# =========================
# 1) Dependencies
# =========================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else npm ci; \
  fi

# =========================
# 2) Build
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_BACKEND_BASE_URI
ARG NEXT_PUBLIC_PROVINCE_URI
ARG NEXT_PUBLIC_DISTRICT_URI

ENV NEXT_PUBLIC_BACKEND_BASE_URI=$NEXT_PUBLIC_BACKEND_BASE_URI
ENV NEXT_PUBLIC_PROVINCE_URI=$NEXT_PUBLIC_PROVINCE_URI
ENV NEXT_PUBLIC_DISTRICT_URI=$NEXT_PUBLIC_DISTRICT_URI

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# =========================
# 3) Runtime
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
