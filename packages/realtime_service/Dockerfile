FROM node:20-alpine AS base

RUN apk add --no-cache openssl
 
FROM base AS deps 
WORKDIR /app 

COPY package.json package-lock.json* ./ 

COPY packages/shared_service/package.json ./packages/shared_service/ 
COPY packages/realtime_service/package.json ./packages/realtime_service/ 

RUN npm install 
 
FROM base AS builder 
WORKDIR /app 

COPY --from=deps /app/node_modules ./node_modules 

COPY package.json package-lock.json* ./ 

COPY packages/shared_service ./packages/shared_service 
COPY packages/realtime_service ./packages/realtime_service 

RUN npx prisma generate --schema=packages/shared_service/prisma/schema.prisma 
 
FROM base AS runner 
WORKDIR /app 

ENV NODE_ENV=production 
 
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs 

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules 

COPY --from=builder --chown=nodejs:nodejs /app/packages/shared_service ./packages/shared_service 

COPY --from=builder --chown=nodejs:nodejs /app/packages/realtime_service ./packages/realtime_service 

COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json 

USER nodejs 

EXPOSE 4001 

CMD ["node", "packages/realtime_service/src/server.js"] 