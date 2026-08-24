import { createServer } from "node:http";
import {createSocketAuthMiddleware, createVerificationSocketMiddleware} from "./socketAuth.js";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import {
  loadConfig,
  createLogger,
  createRedisClient,
  connectDb,
  prisma,
} from "@dating-app/shared";
import { registerChatHandlers } from "./chatHandler.js";

const logger = createLogger("realtime");
const config = loadConfig("realtime");

// for socket connection we need http server connection where socket connection gets attach to http server connection
// http server connection is always required cause browser wot be able direct;y to communicate with the socket

async function main() {
  // creating a http server for socket.io connection
  // this file only maintain socket connection

  const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 200, service: "Everything good" }));
    return;
  }

  res.statusCode = 404;
  res.end("not found");
});

  const allowedOrigins = config.corsOrigin
    ? config.corsOrigin.split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'https://melodis.in', 'https://www.melodis.in'];

  const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;

    try {
      const hostname = new URL(origin).hostname;
      return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === 'melodis.in' || hostname === 'www.melodis.in';
    } catch {
      return false;
    }
  };

  // Creating socket.io server
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        logger.warn({ origin }, 'Rejected Socket.IO CORS origin');
        callback(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  await connectDb(logger);
  // we use adapter for scaling
  // we use redis pub sub adapter cause this help us realtime server to communicate with each other
  // Without this, if you run 2+ realtime server instances behind a load
  // balancer, a message sent by a user connected to instance A would never
  // reach a user connected to instance B. The adapter uses Redis pub/sub
  // so every instance broadcasts through Redis, and all instances receive
  // and relay events correctly regardless of which one a user is attached to.

  //   publisher is a redisclient cause u get a normal redis connection
  // Redis says always to use two redis connection one is for publishing and one is for subscribing
  const pubclient = createRedisClient(logger, "realtime-pub");
  const subclient = createRedisClient(logger, "realtime-sub");

  io.adapter(createAdapter(pubclient, subclient));

  const presenceRedis = createRedisClient(logger, "realtime-presence");
  // / --- Auth: every connection must present a valid accessToken cookie ---
  io.use(createSocketAuthMiddleware(config, logger));
  // --- Verification: only VERIFIED or UNDER_REVIEW users can access chat ---
  io.use(createVerificationSocketMiddleware(prisma, logger));
  // on connection
  // when a new client enters socket is created

  io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected");

  registerChatHandlers(io, socket, {
    db: prisma,
    redis: presenceRedis,
    logger,
  });

  socket.on("ping", () => {
    socket.emit("pong", { at: new Date().toISOString() });
  });

  socket.on("disconnect", (reason) => {
    logger.info({ socketId: socket.id }, "Client disconnected");
  });
});

// START SERVER HERE
server.listen(config.realtimePort, () => {
  logger.info(`Realtime server listening on port ${config.realtimePort}`);
});
}

main().catch((err) => {
  logger.error({ err }, "Failed to start realtime server");
  process.exit(1);
});