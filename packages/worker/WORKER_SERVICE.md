# Worker Service

The worker service processes asynchronous jobs that should not block the API or realtime request path. It uses BullMQ with Redis and updates Postgres through Prisma.

The service is a single Node process that starts multiple queue consumers. Each consumer owns one background concern: health checks, selfie verification, match notifications, discovery feed preparation, feed scheduling, embeddings, icebreaker generation, and location share cleanup.

## Runtime Role

Main responsibilities:

- Process health-check jobs used to verify BullMQ wiring.
- Compare verification selfies against profile photos.
- Send match notification emails.
- Generate profile text embeddings.
- Precompute discovery feed candidates.
- Schedule feed refresh jobs for recently active profiles.
- Generate one-time icebreaker suggestions for new matches.
- Delete expired live location share records.

The worker is not part of the public API surface. It should run beside the API and realtime services in any complete environment.

## Entry Point

The service starts from:

```text
packages/worker/src/index.js
```

Workspace scripts:

```bash
npm run dev --workspace=@dating-app/worker
npm run start --workspace=@dating-app/worker
npm run test:enqueue --workspace=@dating-app/worker
```

Root shortcut:

```bash
npm run dev:worker
```

`test:enqueue` creates a basic health-check job so the worker can prove queue connectivity.

## Dependencies

Required infrastructure:

- PostgreSQL, accessed through Prisma.
- Redis, used by BullMQ and circuit breaker state.

External providers used by specific workers:

- AWS Rekognition for selfie/profile face comparison.
- Resend for match notification email.
- Gemini embedding API for profile text embeddings.
- Groq chat completions for icebreaker suggestions.

Important environment variables:

- `DATABASE_URL`
- `REDIS_URL`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `RESEND_API_KEY`
- `RESEND_MAIL_FROM`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`

Only the workers that call a given provider need that provider's key at runtime, but in practice the full worker process is easier to operate when all required keys are available.

## Queues

Queue names are centralized in the shared package.

Active queues:

- `HEALTH_CHECK`: basic smoke-test jobs.
- `VERIFICATION_STATUS`: face verification jobs.
- `MATCH_NOTIFICATION`: match email jobs.
- `EMBEDDING_UPDATE`: profile embedding updates.
- `FEED_REFILL`: candidate feed precomputation.
- `FEED_SCHEDULER`: repeatable feed scheduling ticks.
- `ICEBREAKER_GENERATION`: match icebreaker generation.
- `LOACTION_SHARE_CLEANUP`: live location share cleanup.

Note: `LOACTION_SHARE_CLEANUP` is misspelled in the current constant name. It should remain consistent across producers and consumers until renamed in one coordinated change.

## Worker Startup

At startup the worker:

1. Loads configuration.
2. Connects Prisma to Postgres.
3. Creates dedicated Redis connections for BullMQ workers.
4. Starts the health-check worker.
5. Starts the domain workers.
6. Hooks `SIGINT` and `SIGTERM` for graceful shutdown.

BullMQ workers use dedicated Redis connections because BullMQ relies on blocking Redis commands. Sharing those connections with normal cache or pub/sub usage can cause operational issues.

## Health Check Worker

Queue:

```text
health-check
```

This worker logs the job payload and returns a timestamp. It is useful for validating that Redis, BullMQ, and the worker process are connected.

Test enqueue script:

```text
src/enqueuTestJobs.js
```

## Verification Worker

Queue:

```text
verification-check
```

File:

```text
src/workers/verificationWorkers.js
```

The verification worker receives a selfie key, profile photo key, user id, and verification request id. It calls the face matching service, evaluates the score, then updates:

- `verification_requests.faceMatchScore`
- `verification_requests.status`
- `verification_requests.rejectionReason`
- `verification_requests.reviewedAt`
- `profiles.verificationStatus`

The intended thresholds are:

- `0.85` or higher: verified.
- `0.60` to `0.85`: under review.
- No face or low score: rejected.

The external face comparison call is wrapped in a Redis-backed circuit breaker so repeated provider failures do not consume all worker concurrency.

## Match Notification Worker

Queue:

```text
match-notification
```

File:

```text
src/workers/matchNotifications.js
```

This worker sends an email to both users when a match is created. The API enqueues it after mutual like detection succeeds. Resend is the intended email provider.

Provider failures are wrapped in the shared circuit breaker.

## Embedding Worker

Queue:

```text
embedding-update
```

File:

```text
src/workers/embeddingWorker.js
```

This worker turns profile bio and interests into a vector embedding using Gemini's text embedding endpoint. The embedding is written to the profile's `bioEmbedding` column using raw SQL because the Prisma schema declares the vector field as unsupported.

The discovery feed can use this embedding to rank candidates by similarity when an embedding is available.

## Feed Refill Worker

Queue:

```text
feed-refill
```

File:

```text
src/workers/feedRefilWorker.js
```

This worker precomputes candidate profile ids for a user and stores them in Redis:

```text
feed:{userId}
```

The API can then serve discovery feed pages by popping ids from Redis instead of building a fresh candidate set on every request.

The worker:

1. Loads the user's profile.
2. Resolves explicit or fallback preferences.
3. Builds a candidate pool through shared discovery code.
4. Pushes candidate ids into Redis.
5. Trims the list to a maximum size.

## Feed Scheduler Worker

Queue:

```text
feed-scheduler
```

File:

```text
src/workers/feedScheduleWorker.js
```

The scheduler finds recently active profiles and enqueues staggered feed refill jobs. The goal is to keep discovery feeds warm before users open the app.

The repeatable scheduler job is intended to run every five minutes.

## Icebreaker Worker

Queue:

```text
icebreaker-generation
```

File:

```text
src/workers/iceBreakerWorker.js
```

This worker generates one short conversation starter when a new match is created. The suggestion is stored on the match record and reused later. It is not regenerated every time chat opens.

The generation service calls Groq's OpenAI-compatible chat completions endpoint and is wrapped with the shared circuit breaker.

## Location Share Cleanup Worker

Queue:

```text
location-share-cleanup
```

File:

```text
src/workers/loactionCleanupWorker.js
```

When the API creates a live location share, it schedules a delayed cleanup job. This worker deletes the location share row after the share expires.

The design keeps live location sharing time-boxed and separate from normal profile location.

## Resilience

Provider-facing workers use the shared circuit breaker helper. It tracks repeated failures in Redis. Once a provider crosses the failure threshold, the breaker opens for a short cooldown window and fails fast instead of spending worker slots on calls likely to fail.

This protects queues during partial outages from providers such as Rekognition, Resend, Gemini, or Groq.

## Graceful Shutdown

The worker process handles `SIGINT` and `SIGTERM`. It should close BullMQ workers, quit Redis connections, disconnect Prisma, and exit cleanly.

This matters because abrupt shutdown can leave active jobs waiting for BullMQ retry handling.

## Current Implementation Notes

The worker package currently has several file and symbol naming inconsistencies that should be reviewed before production use. Examples include imports from `@dating-app/shared-facility` versus the package name in `package.json`, queue name imports from local paths, typoed filenames, repeated variable names, and provider client variable mismatches. This document captures the intended operational shape without changing code.

