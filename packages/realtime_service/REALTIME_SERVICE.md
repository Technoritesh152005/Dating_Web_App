# Realtime Service

The realtime service owns live chat behavior for active matches. It uses Socket.io for client connections, Redis for horizontal scaling and presence state, and Postgres for durable message storage.

The service is intentionally separate from the HTTP API. The API handles request/response workflows and message history. The realtime process handles low-latency socket events after the user is already authenticated.

## Runtime Role

Main responsibilities:

- Accept authenticated Socket.io connections.
- Attach the signed-in user's id to each socket.
- Let users join rooms for matches they belong to.
- Store chat messages before broadcasting them.
- Broadcast new messages to everyone in a match room.
- Emit typing and read receipt events.
- Track online presence in Redis.
- Support multi-instance broadcasts through the Socket.io Redis adapter.

## Entry Point

The service starts from:

```text
packages/realtime_service/src/server.js
```

Workspace scripts:

```bash
npm run dev --workspace=@dating-app/realtime
npm run start --workspace=@dating-app/realtime
```

Root shortcut:

```bash
npm run dev:realtime
```

By default the realtime service should use `REALTIME_PORT`, falling back to port `4001`.

## Dependencies

Required infrastructure:

- PostgreSQL, used to verify match membership and persist messages.
- Redis, used for Socket.io pub/sub fanout and online presence.

Important environment variables:

- `DATABASE_URL`
- `REDIS_URL`
- `REALTIME_PORT`
- `JWT_SECRET`

The socket auth middleware verifies the same `accessToken` cookie issued by the API service. This keeps browser authentication consistent across HTTP and realtime traffic.

## Socket Authentication

Authentication is handled in:

```text
src/socketAuth.js
```

The middleware reads the raw cookie header from the Socket.io handshake, parses the cookie, and verifies `accessToken` with `JWT_SECRET`. If the token is valid, the middleware attaches:

```text
socket.userId
```

Connections without a cookie, without an access token, or with an invalid token are rejected.

## Rooms

A chat room is scoped to a match:

```text
match:{matchId}
```

Before a socket can join a room, the service checks:

- The match exists.
- The connected user is either `userAId` or `userBId`.
- The match status is `ACTIVE`.

This check prevents users from joining arbitrary match rooms by guessing ids.

## Events

### `join-match`

Payload:

```json
{
  "matchId": "match-id"
}
```

The service verifies membership, joins the socket to `match:{matchId}`, and calls the optional acknowledgement callback with success or failure.

### `send-message`

Payload:

```json
{
  "matchId": "match-id",
  "content": "message text"
}
```

The service trims and validates message content, verifies match membership again, writes the message to Postgres, then emits the stored message to the match room.

Broadcast event:

```text
new-msg
```

The event is emitted to the sender as well as the other participant. That lets the sender receive the server-confirmed message id and timestamp instead of trusting only an optimistic client-side copy.

### `typing`

Payload:

```json
{
  "matchId": "match-id"
}
```

The service forwards a typing event to the rest of the room.

Broadcast event:

```text
user-typing
```

### `mark-read`

Payload:

```json
{
  "matchId": "match-id"
}
```

The service verifies membership, marks unread messages from the other user as read, and broadcasts the read receipt to the room.

Broadcast event:

```text
messages-read
```

### `ping`

A basic connectivity event that returns:

```text
pong
```

with an ISO timestamp.

## Presence

Presence helpers live in:

```text
src/userPresence.js
```

When a socket connects, the service stores the user's socket id in Redis with a short TTL. On disconnect, it deletes the presence key.

Presence is intentionally transient. It is useful for online indicators but should not be treated as an audit log or a source of truth for user activity.

## Redis Adapter

The Socket.io Redis adapter is used so multiple realtime instances can run behind a load balancer. Without the adapter, a user connected to instance A would not receive room events emitted from instance B.

The service uses separate Redis connections for publish and subscribe, which is the normal Socket.io Redis adapter pattern.

## Data Touched

Primary Prisma models used by this service:

- `Match`
- `Message`

Redis usage:

- Socket.io pub/sub adapter.
- User presence keys.

## Operational Notes

The API and realtime service must share:

- The same JWT secret.
- The same database.
- The same Redis deployment.

The frontend must send the `accessToken` cookie during the Socket.io handshake. In local development, CORS currently allows the Vite default origin:

```text
http://localhost:5173
```

If the frontend runs elsewhere, update the Socket.io CORS origin accordingly.

## Current Implementation Notes

The current code contains a few naming inconsistencies that should be checked before relying on the service in production. Examples include `chatHandler.js` versus `chatHandlers.js`, `verifyMatchMemberShip` versus `verifyMatchMembership`, and local variable mismatches while broadcasting stored messages. This document records the expected service behavior and does not modify the implementation.

