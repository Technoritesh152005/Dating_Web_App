# Build context MUST be the repo root - see packages/api/Dockerfile's
# comment for why (npm workspaces resolution).

FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/realtime/package.json ./packages/realtime/
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY packages/realtime ./packages/realtime
RUN npx prisma generate --schema=packages/shared/prisma/schema.prisma

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nodejs:nodejs /app/packages/realtime ./packages/realtime
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
USER nodejs
EXPOSE 4001
CMD ["node", "packages/realtime/src/server.js"]