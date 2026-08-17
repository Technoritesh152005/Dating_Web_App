# Build context MUST be the repo root - see packages/api/Dockerfile's
# comment for why (npm workspaces resolution).

FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/worker/package.json ./packages/worker/
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY packages/worker ./packages/worker
RUN npx prisma generate --schema=packages/shared/prisma/schema.prisma

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nodejs:nodejs /app/packages/worker ./packages/worker
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
USER nodejs
# No EXPOSE - the worker process doesn't listen on any port, it only
# consumes queues. Including EXPOSE here would be misleading.
CMD ["node", "packages/worker/src/index.js"]