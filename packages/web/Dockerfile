# Build context MUST be the repo root - see packages/api/Dockerfile's
# comment for why (npm workspaces resolution).

FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/web/package.json ./packages/web/
RUN npm install

#So the builder has everything needed to build the frontend.
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY packages/web ./packages/web

# CRITICAL DETAIL: NEXT_PUBLIC_* variables are inlined into the JavaScript
# bundle AT BUILD TIME, not read at container startup like a normal env
# var. Passing them only via docker-compose's `environment:` at runtime
# would silently do nothing - the values baked into the bundle during
# `next build` (right below) are what actually ship. They MUST arrive as
# build ARGs, set here as ENV so the build step can see them, and passed
# via `--build-arg` / docker-compose's `build.args:` (see docker-compose.prod.yml).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_REALTIME_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_REALTIME_URL=$NEXT_PUBLIC_REALTIME_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

RUN npm run build --workspace=@dating-app/web

# --- Runtime layer - the whole point of `output: 'standalone'`
# (next.config.js): Next.js traces exactly which node_modules the app
# actually uses and copies only those, plus a minimal server.js. This
# image ends up dramatically smaller than copying the full monorepo
# node_modules the way the other 3 Dockerfiles do. ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --from=builder --chown=nodejs:nodejs /app/packages/web/public ./packages/web/public
COPY --from=builder --chown=nodejs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/packages/web/.next/static ./packages/web/.next/static
USER nodejs
EXPOSE 3000
# Standalone output's server.js lives wherever the app sat in the monorepo
# tree, relative to the lockfile root - verify this path with `docker
# build` locally; if the traced output structure differs, adjust here.
CMD ["node", "packages/web/server.js"]

#Install dependencies
        #↓
#uild Next.js
       # ↓
#Create small production image
       # ↓
#Run Next.js server on :3000