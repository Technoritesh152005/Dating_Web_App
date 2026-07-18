import Fastify from "fastify"
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rateLimit'
import {loadConfig , createLogger, prisma , connectDb , disconnectDb , createredisClient} from '@dating-app/shared'
import { registerAuthDecorator } from "./plugins/authenticator_middleware"
import { registerAuthRoutes } from "./routes/auth"
import { registerProfileRoutes } from "./routes/profile"
import { generateMediaRoutes} from './routes/media.js'
import { registerVerificationRoutes } from "./routes/verification_selfie"

const logger = createLogger('api')
const apiconfig = loadConfig('api')

async function main (){
    const app = Fastify({
        // fastify also has its own built in logger which we dont need
        logger:false,
    })

    await app.register(cors,{
        credentials:true
    })
    await app.register(helmet)

    await app.register(rateLimit,{
        max:80,
        timeWindow:'1 minute',
    })

    // starting the app connection
    await connectDb(logger)
    const redis = createRedisClient()

    // decorate usually add ur instance server with a method
    app.decorate('redis',redis)
    app.decorate('db',prisma)

    // like a middleware
    registerAuthDecorator(app,config)

    registerAuthRoutes(app,config)
    registerAuthRoutes(app,config)
    generateMediaRoutes(app,config)
    registerVerificationRoutes(app,config)

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