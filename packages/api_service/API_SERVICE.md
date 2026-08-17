# API Service

The API service is the HTTP boundary for the dating app. It owns account access, profile management, media upload handoffs, discovery, swipes, matches, safety actions, message history, and a small metrics endpoint.

It is built on Fastify and uses the shared package for configuration, logging, database access, Redis, queue names, queue creation, and S3-compatible storage signing.

## Runtime Role

This service should be the only public HTTP API used by the client for normal product actions. It does not handle long-running work directly. Expensive or slow operations are pushed into BullMQ queues and processed by the worker service.

Main responsibilities:

- Create and authenticate users.
- Store and return the signed-in user's profile.
- Issue presigned upload URLs for profile photos and verification selfies.
- Save uploaded photo metadata after the client confirms upload success.
- Submit selfie verification jobs.
- Build and return discovery feeds.
- Record swipes and create matches when likes are mutual.
- Return matches and paginated message history.
- Manage safety features such as blocks, reports, and live location sharing.
- Expose basic Prometheus-style metrics.

## Entry Point

The service starts from:

```text
packages/api_service/src/server.js
```

Workspace scripts:

```bash
npm run dev --workspace=@dating-app/api
npm run start --workspace=@dating-app/api
```

Root shortcuts:

```bash
npm run dev:api
```

By default the API listens on `API_PORT`, falling back to port `4000`.

## Dependencies

Required infrastructure:

- PostgreSQL, accessed through Prisma.
- Redis, used for caching, metrics counters, queues, and discovery feed lists.
- S3-compatible object storage for media uploads.

Important environment variables:

- `DATABASE_URL`
- `REDIS_URL`
- `API_PORT`
- `JWT_SECRET`
- `S3_BUCKET_NAME`
- `S3_REGION` or `AWS_REGION`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_URL`

The shared config loader currently requires `DATABASE_URL` and `REDIS_URL` before the service can boot.

## Request Lifecycle

At startup the API:

1. Creates a Fastify server.
2. Registers CORS, Helmet, and rate limiting.
3. Connects Prisma to Postgres.
4. Creates a Redis client.
5. Decorates the Fastify app with `db` and `redis`.
6. Adds an `X-Request-Id` response header.
7. Registers the metrics hook.
8. Registers authentication, profile, media, verification, discovery, swipe, message, and metrics routes.

Every request gets a request id. If the client sends `x-request-id`, that value is reused. Otherwise the API creates a UUID. This is useful when tracing a request across logs and queued background work.

## Authentication

Authentication is cookie-based.

The intended token pair is:

- `accessToken`: short-lived JWT used for authenticated routes.
- `refreshToken`: longer-lived opaque token stored as a hash in Postgres.

Relevant routes:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Authenticated routes use the Fastify decorator registered in:

```text
src/plugins/authenticator_middleware.js
```

The decorator reads the `accessToken` cookie, verifies it with `JWT_SECRET`, and attaches `request.userId`.

## Profile Flow

Relevant routes:

- `PUT /profile`
- `GET /profile/me`

The profile route creates or updates the user's public profile. It stores core fields such as display name, date of birth, gender, bio, interests, profession, optional religion/caste fields, and approximate location.

When latitude and longitude are provided, the API also updates the PostGIS geography column through raw SQL because Prisma does not natively support the geography type used by the schema.

After a profile update, the API invalidates the Redis profile cache and enqueues follow-up work:

- `EMBEDDING_UPDATE`: rebuilds the profile bio/interests embedding.
- `FEED_REFILL`: refreshes the user's candidate feed.

`GET /profile/me` reads from Redis first and falls back to Postgres. The cache is short-lived and intended to reduce repeated reads for the signed-in user's own profile.

## Media Uploads

Relevant routes:

- `POST /media/photo/presign`
- `POST /media/photos/confirm`

The API does not receive image bytes directly. Instead, it creates a short-lived presigned upload URL. The client uploads the file directly to S3 or an S3-compatible provider, then confirms the upload so the API can create the `Photo` row.

Allowed profile photo extensions:

- `jpg`
- `jpeg`
- `png`
- `webp`

This keeps large uploads away from the API process and lets storage handle the actual file transfer.

## Verification Flow

Relevant routes:

- `POST /verification/selfie`
- `GET /verification/status`

The selfie endpoint creates a verification request and queues face comparison work for the worker service. The API immediately moves the profile into an under-review state so the client can show progress without waiting for the external face comparison provider.

Queue used:

- `VERIFICATION_STATUS`

The worker later updates both `verification_requests` and `profiles.verificationStatus`.

## Discovery Feed

Relevant route:

- `GET /discovery/feed`

Discovery is designed around precomputed Redis lists backed by Postgres filtering.

The API first tries to pop candidate profile ids from:

```text
feed:{userId}
```

If the list is low or empty, it queues a refill and can fall back to building candidates directly from the database. The shared discovery code applies filters at database level, including age, gender, profession, religion/caste opt-in, block exclusions, previous swipes, and distance when location is available.

Queue used:

- `FEED_REFILL`

The response sanitizes candidate profiles before returning them. Religion and caste fields are only returned when the profile owner opted into showing them.

## Swipe And Match Flow

Relevant routes:

- `POST /swipe`
- `GET /matches`
- `POST /matches/:matchId/unmatch`

A swipe stores one action from the signed-in user to another user. Duplicate swipes are blocked by a database uniqueness constraint. When a like-like or fire-like relationship is mutual, the API creates an active match using a stable ordered user pair.

When a match is created, the API enqueues:

- `MATCH_NOTIFICATION`: sends match notification emails.
- `ICEBREAKER_GENERATION`: creates a one-time conversation starter.

The swipe target is also added to the user's seen filter so discovery does not keep returning the same person.

## Messages

Relevant route:

- `GET /matches/:matchId/messages`

This route returns paginated message history for a match. Before returning messages, the API checks that the signed-in user belongs to the match. Realtime message creation and broadcasting are handled by the realtime service; the API route is for history and backfill.

## Safety

Safety routes include:

- Block a user.
- Unblock a user.
- List blocked users.
- Report a user.
- Create a live location share.
- Update a live location share.
- Stop a live location share.
- Read a public live location link by token.

Live location shares are intentionally separate from profile location. Profile location supports discovery, while location sharing is time-boxed, token-based, and intended for trusted contacts who may not have an account.

Queue used:

- `LOCATION_SHARE_CLEANUP`

Note: the queue name currently contains the spelling `LOACTION` in code and should be treated as the active constant name until it is renamed consistently across services.

## Metrics

Relevant route:

- `GET /metrics`

The API increments Redis counters for total HTTP responses and 5xx responses. The metrics route also checks BullMQ queue counts for all known queues and returns plain text in Prometheus exposition format.

## Data Touched

Primary Prisma models used by this service:

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

Redis usage:

- Profile cache.
- Discovery feed lists.
- Seen filters.
- Metrics counters.
- BullMQ queue connections.

## Operational Notes

Start Postgres and Redis locally with:

```bash
docker compose up -d
```

Generate Prisma client from the root with:

```bash
npm run prisma:generate
```

Run migrations from the root with:

```bash
npm run prisma:migrate
```

The API expects the worker service to be running for verification, embeddings, match notifications, feed refill, icebreaker generation, and location cleanup. If the worker is down, the API can still accept many requests, but queued side effects will not complete.

## Current Implementation Notes

There are a few naming and import inconsistencies in the current codebase that should be reviewed before production use. Examples include route filenames versus imports, duplicated auth route registration, and several local variable name mismatches in handlers. These notes are documented here because they affect service operation, but this document does not change code.

