import Fastify from "fastify"
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import cookie from '@fastify/cookie'
import csrf from '@fastify/csrf-protection'
import { loadConfig, createLogger, prisma, connectDb, disconnectDb, createRedisClient } from '@dating-app/shared'
import { registerAuthDecorator } from "./plugins/authenticator_middleware.js"
import { registerValidationMiddleware } from "./plugins/validation_middleware.js"
import { registerAuthRoutes } from "./routes/auth.js"
import { registerProfileRoutes } from "./routes/profile.js"
import { generateMediaRoutes } from './routes/media.js'
import { registerVerificationRoutes } from "./routes/verification_selfie.js"
import { registerPreferencesRoutes } from './routes/prefernces.js';
import { registerDiscoveryRoutes } from './routes/discoveryUser.js';
import { registerSwipesRoutes } from './routes/swipe.js'
import { registerSafetyRoutes } from './routes/safety.js'
import { registerGetMessageRoutes } from './routes/messages.js'
import { registerMetricsHook, registerMetricsRoutes } from './routes/metrics.js'

const logger = createLogger('api')
const config = loadConfig('api')

async function main() {
  const app = Fastify({
    // fastify also has its own built in logger which we dont need
    // if user dont send id explicitly then we make a random uuid for each request to unquey identify gobally
    genReqId: (request)=> request.headers['x-request-id'] || crypto.randomUUID(),
    logger: false,
  })

  app.get('/health', async () => {
  return { status: 'ok' }
})

  const allowedOrigins = config.corsOrigin
    ? config.corsOrigin.split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'https://melodis.in', 'https://www.melodis.in'];

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      try {
        const hostname = new URL(origin).hostname
        const allowedHostnames = new Set(['localhost', 'melodis.in', 'www.melodis.in'])
        if (hostname === 'localhost' || hostname.endsWith('.localhost') || allowedHostnames.has(hostname)) {
          callback(null, true)
          return
        }
      } catch {
        // ignore malformed origins and block them
      }

      logger.warn({ origin }, 'Rejected API CORS origin')
      callback(new Error(`Origin not allowed: ${origin}`), false)
    },
    credentials: true
  })
  await app.register(helmet)
  await app.register(cookie)
await app.register(csrf, {
  cookieOpts: {
    signed: false,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    path: '/'
  }
})
  app.get('/csrf-token', async (request, reply) => {
  const token = await reply.generateCsrf()

  return {
    csrfToken: token
  }
})
  // CSRF protection for state-changing operations
  // Uses double-submit cookie pattern: csrf token in cookie + header


  // Global rate limit (applies to all routes)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    errorMessage: 'Too many requests, please try again later'
  })

  // starting the app connection
  await connectDb(logger)
  const redis = createRedisClient()

  // decorate usually add ur instance server with a method
  app.decorate('redis', redis)
  app.decorate('db', prisma)

  // Echo the request id back so a client (or someone debugging with curl)
  // can see exactly what id to search for in logs.
  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Request-Id', request.id);
  });
  registerMetricsHook(app)

  // like a middleware
  registerAuthDecorator(app, config)
  registerProfileRoutes(app)

  // Input validation and sanitization middleware (runs on all routes)
  registerValidationMiddleware(app)

  // CSRF protection hook - skip for public auth endpoints, require for authenticated state-changing
app.addHook('preHandler', (request, reply, done) => {
  // Safe methods don't need CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    done()
    return
  }

  // Public auth endpoints don't need CSRF
  const publicAuthPaths = [
    '/auth/signup',
    '/auth/login',
    '/auth/google',
    '/auth/google/callback',
    '/auth/refresh',
    '/auth/logout'
  ]

  if (
    publicAuthPaths.some(path =>
      request.url.startsWith(path)
    )
  ) {
    done()
    return
  }

  // Only authenticated state-changing routes
  if (
    request.routeOptions?.config?.authenticated
  ) {
    return app.csrfProtection(request, reply, done)
  }

  done()
})

  registerAuthRoutes(app, config)
  generateMediaRoutes(app, config)
  registerVerificationRoutes(app, config)
  registerPreferencesRoutes(app)
  registerDiscoveryRoutes(app)
  registerSwipesRoutes(app);
  registerSafetyRoutes(app)
  registerGetMessageRoutes(app)
  registerMetricsRoutes(app)

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    await redis.quit();
    await disconnectDb();
    process.exit(0);
  };
  //   whenever app is running it is running in nodejs process 
  // process is nodejs running nodejs process
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await app.listen({ port: config.apiPort, host: '0.0.0.0' });
  logger.info(`API server listening on port ${config.apiPort}`);
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error starting API server');
  process.exit(1);
});
