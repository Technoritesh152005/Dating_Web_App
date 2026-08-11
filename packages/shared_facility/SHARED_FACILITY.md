# Shared Facility

The shared facility package contains the common infrastructure code used by the API, realtime, and worker services. It is packaged as `@dating-app/shared` and is imported by the other workspace packages.

Although it does not expose an HTTP server, it is a core internal service dependency. It owns configuration loading, Prisma access, Redis client creation, queue setup, logging, storage signing, discovery feed helpers, metrics helpers, embeddings input formatting, Bloom filter helpers, and circuit breaker behavior.

## Runtime Role

Main responsibilities:

- Load environment configuration consistently across services.
- Provide a shared Prisma client and database connect/disconnect helpers.
- Create Redis clients for app, queue, pub/sub, cache, and worker use cases.
- Centralize BullMQ queue names and default job options.
- Provide structured logging.
- Generate presigned S3-compatible upload and read URLs.
- Build discovery candidate feeds with database-level filtering.
- Track seen candidates with Redis Bloom filter commands.
- Expose lightweight metrics counter helpers.
- Protect external provider calls with a Redis-backed circuit breaker.
- Build the text input used for profile embeddings.

## Package Entry Point

The public export file is:

```text
packages/shared_facility/src/index.js
```

Package name:

```text
@dating-app/shared
```

Prisma schema:

```text
packages/shared_facility/prisma/schema.prisma
```

Workspace scripts:

```bash
npm run prisma:generate --workspace=@dating-app/shared
npm run prisma:migrate --workspace=@dating-app/shared
npm run prisma:studio --workspace=@dating-app/shared
```

Root shortcuts:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Configuration

Configuration is loaded from:

```text
src/loadConfig.js
```

The loader searches upward from the current working directory until it finds a `.env` file. It then verifies required variables and returns a normalized config object.

Required variables:

- `DATABASE_URL`
- `REDIS_URL`

Returned values include:

- `nodeEnv`
- `databaseUrl`
- `redisUrl`
- `apiPort`
- `realtimePort`
- `jwtSecret`

This keeps the package scripts flexible because services can be started from the repo root or from a package directory.

## Database

Database helpers live in:

```text
src/db.js
```

The package exports:

- `prisma`
- `connectDb`
- `disconnectDb`

The Prisma client is kept as a development singleton on `globalThis` so Node watch mode does not create a new client and connection pool on every reload.

## Prisma Schema

The schema models the main dating app domain:

- `User`
- `RefreshTokens`
- `Profile`
- `Photo`
- `Preference`
- `Swipe`
- `Match`
- `Message`
- `VerificationRequest`
- `Report`
- `Block`
- `LocationShare`

Important implementation details:

- `Profile.location` uses PostGIS `geography(Point, 4326)` through Prisma's `Unsupported` type.
- `Profile.bioEmbedding` uses a vector column through Prisma's `Unsupported` type.
- `Swipe` prevents duplicate swipes from the same user to the same target.
- `Match` stores a stable ordered pair for two users and can hold one cached icebreaker suggestion.
- `LocationShare` is separate from profile location and is designed to expire.

Because Prisma cannot fully model PostGIS geography or vector columns, code that touches those fields uses raw SQL.

## Redis

Redis helpers live in:

```text
src/redis.js
```

The package exports a factory instead of a singleton:

```text
createRedisClient()
```

That is deliberate. The services use Redis for different patterns:

- Normal commands.
- BullMQ blocking commands.
- Socket.io pub/sub.
- Presence keys.
- Metrics counters.
- Circuit breaker state.

These use cases should not all share one connection.

## Queues

Queue names live in:

```text
src/queueNames.js
```

Queue creation lives in:

```text
src/queue.js
```

The queue factory applies default job behavior:

- Three attempts.
- Exponential backoff.
- Completed job retention capped by age and count.
- Failed job retention kept longer for debugging.

Known queues:

- `health-check`
- `verification-check`
- `match-notification`
- `embedding-update`
- `feed-refill`
- `feed-scheduler`
- `icebreaker-generation`
- `location-share-cleanup`

Producers and consumers should always import queue constants instead of hardcoding names.

## Logging

Logging lives in:

```text
src/logger.js
```

The logger uses Pino. Development mode uses `pino-pretty`; production emits structured JSON. Every service passes its own service name so logs can be filtered by process.

## Storage

Storage helpers live in:

```text
src/storage.js
```

The storage helper creates an S3 client from environment variables and signs short-lived upload or read URLs.

Upload flow:

1. The API asks shared storage for a presigned upload URL.
2. The client uploads the file directly to S3 or an S3-compatible provider.
3. The API stores only the object key and public URL after client confirmation.

This keeps file bytes out of the API process.

## Discovery Feed Helpers

Discovery feed logic lives in:

```text
src/discoveryFeed.js
```

The important design decision is to filter candidates in Postgres, not by loading all profiles into application memory.

Filters include:

- Excluding the current user.
- Excluding already swiped users.
- Excluding blocked users in either direction.
- Age range.
- Gender preference.
- Profession filter.
- Religion and caste filters only when the candidate opted into showing those fields.
- Distance filtering through PostGIS when the current profile has location.
- Embedding-based ordering when a profile embedding exists.

The helper can relax filters when a strict candidate pool is too small. It first widens distance, then widens age.

## Seen Filter

Seen filter helpers live in:

```text
src/bloom.js
```

The intended design uses Redis Bloom commands:

- `BF.ADD`
- `BF.EXISTS`
- `BF.MEXISTS`

This lets the app cheaply avoid showing the same candidate repeatedly without storing a large explicit set for every user.

Redis must support the Bloom commands for this feature to work. A plain Redis image does not include RedisBloom unless the module is installed or a Redis provider includes it.

## Metrics

Metrics helpers live in:

```text
src/metrics.js
```

They provide simple Redis-backed counters. The API service uses them to expose HTTP request and error counts, and it also reads BullMQ queue counts for operational visibility.

## Circuit Breaker

Circuit breaker logic lives in:

```text
src/circuitBreaker.js
```

The helper stores provider failure state in Redis. After repeated failures, it opens the breaker for a cooldown window and fails fast. A successful call clears the breaker.

This is meant for external providers used by workers:

- Face comparison.
- Email delivery.
- Embeddings.
- Icebreaker generation.

## Embedding Input

Embedding input formatting lives in:

```text
src/buildEmbeddingInput.js
```

The helper turns profile bio and interests into a stable text block. That text is later sent to the embedding provider by the worker.

Keeping this formatting shared ensures profile updates and future reindexing jobs produce comparable embeddings.

## Current Implementation Notes

The package exports only a subset of the helper modules from `src/index.js` at the moment. Some services import deeper files directly, and a few modules reference names that are not currently imported in the file where they are used. Those should be cleaned up in a separate code pass. This document is limited to service documentation and does not modify runtime code.

