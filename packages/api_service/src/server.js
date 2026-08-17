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

  const allowedOrigins = config.corsOrigin
    ? config.corsOrigin.split(',').map(o => o.trim())
    : ['http://localhost:5174'];

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true
  })
  await app.register(helmet)
  await app.register(cookie)

  // CSRF protection for state-changing operations
  // Uses double-submit cookie pattern: csrf token in cookie + header
  await app.register(csrf, {
    sessionPlugin: '@fastify/cookie',
    cookieOpts: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      path: '/'
    },
    cookieKey: 'csrf_token',
    headerName: 'x-csrf-token'
  })

  // Global rate limit (applies to all routes)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    errorMessage: 'Too many requests, please try again later'
  })

  // Stricter rate limit for auth endpoints
  await app.register(rateLimit, {
    max: 10,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    errorMessage: 'Too many authentication attempts, please try again later',
    skipOnError: true
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

  // Input validation and sanitization middleware (runs on all routes)
  registerValidationMiddleware(app)

  // CSRF protection hook - skip for public auth endpoints, require for authenticated state-changing
  app.addHook('preHandler', async (request, reply) => {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

    // Skip CSRF for public auth endpoints (signup, login, google, refresh, logout)
    const publicAuthPaths = ['/auth/signup', '/auth/login', '/auth/google', '/auth/refresh', '/auth/logout'];
    if (publicAuthPaths.some(path => request.url.startsWith(path))) return;

    // For authenticated endpoints, require CSRF token
    if (request.routeOptions && request.routeOptions.config && request.routeOptions.config.authenticated) {
      await reply.csrfProtection(); // This will throw if CSRF validation fails
    }
  });

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
