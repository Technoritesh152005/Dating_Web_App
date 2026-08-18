FROM node:20-alpine AS base

RUN apk add --no-cache openssl
  
#download dependencies from node  
FROM base AS deps  
#inside container /app becomes workdir  
WORKDIR /app  
  
COPY package.json package-lock.json* ./  
  
#also has access to other as api requires other monorepo services  
COPY packages/shared_service/package.json ./packages/shared_service/  
COPY packages/api_service/package.json ./packages/api_service/  
  
#install dependencies. for the above packages they used  
RUN npm install  
  
#prepare the application  
FROM base AS builder  

WORKDIR /app
  
#Take the node_modules from the deps stage and copy them into the builder stage.  
COPY --from=deps /app/node_modules ./node_modules  
  
COPY package.json package-lock.json* ./  
  
COPY packages/shared_service ./packages/shared_service  
COPY packages/api_service ./packages/api_service  
  
#generate prisma client based on this schema  
RUN npx prisma generate --schema=packages/shared_service/prisma/schema.prisma  
  
FROM base AS runner  

WORKDIR /app

#deps    → install things  
#builder → prepare things  
#runner  → actually run the app(container)  
ENV NODE_ENV=production  
  
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs  
  
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules  
  
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared_service ./packages/shared_service  
  
COPY --from=builder --chown=nodejs:nodejs /app/packages/api_service ./packages/api_service  
  
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json  
  
USER nodejs  
EXPOSE 4000  
  
CMD ["node", "packages/api_service/src/server.js"]  
  
# Multi-stage Docker build for the API:  
# 1. deps   → installs npm workspace dependencies (API + shared).  
# 2. builder → copies source code and generates the Prisma Client.  
# 3. runner  → creates a smaller production image with only what the API needs.  
# The build context must be the repo root because the API depends on packages/shared  
# through the root npm workspace.# Build context MUST be the repo root - see packages/api/Dockerfile's  
# comment for why (npm workspaces resolution). 