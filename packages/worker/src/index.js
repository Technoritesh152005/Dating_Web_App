import { Worker } from 'bullmq'
import { loadConfig, createRedisClient, createLogger, connectDb, disconnectDb } from '@dating-app/shared'
import { QUEUE_NAMES } from './queueNames.js'
import { startVerificationWorker } from './workers/verificationWorkers.js'
import { startMatchNotificationWorker } from './workers/matchNotificationWorker.js';
import { startFeedRefilWorker } from './workers/feedRefilWorker.js'
import { startFeedSchedulerWorker } from './workers/feedSchedulerWorker.js'
import { startIceBreakerFunction } from './workers/iceBreakerWorker.js'
import { startLocationCleanUpWorker } from './workers/locationShareCleanupWorker.js';


const logger = createLogger('worker')
const config = loadConfig('worker')

// now we need to create seperate redis connection for bullmq cause it uses blocking commands internally
// dont try to use a redis connection which is having pub/sub or regular caching elsewhere

async function main() {

    await connectDb(logger)
    const workerConnection = createRedisClient()

    const worker = new Worker(QUEUE_NAMES.HEALTH_CHECK,
        async (job) => {
            logger.info({ jobId: job.id, data: job.data }, 'Processign job')
            return { processedAt: new Date().toISOString() }
        },
        {
            connection: workerConnection,
            concurrency: 5
        }
    )

    // during shutdoen we need to even close their wrker and prisma redis cobnectiin
    const { worker: verificationWorker, connection: verificationConnection ,breakerRedisConnection: verificationBreakerRedis } = startVerificationWorker(logger);
    const { worker: matchNotificationWorker, connection: matchNotificationConnection, breakerRedisConnection:matchNotificationBreakerRedis } =
        startMatchNotificationWorker(logger);
    const { worker:feedRefillWorker, connection:feedRefillConnection, listRedis:feedListRedis } = await startFeedRefilWorker(logger)
    const { worker:worker, connection } = await startFeedSchedulerWorker
    const { worker: iceBreakerWorker, connection: iceBreakConnection } = await startIceBreakerFunction(logger)
    const { worker: locationShareCleanupWorker, connection: locationShareCleanupConnection } = startLocationCleanUpWorker(logger);
    logger.info('Worker process started, listening for jobs on: health-check, verification-check');

    worker.on('completed', (job) => {
        logger.info('Job Completed')
    })
    worker.on('failed', (job, err) => {
        logger.error('Job Failed')
    })

    const shutdown = async (signal) => {
        logger.info({ signal }, 'Received shutdown signal from worker')
        await worker.close()
        await workerConnection.quit()
        await verificationWorker.close();
        await verificationConnection.quit();
        await matchNotificationConnection.quit();
        await iceBreakConnection.quit()

        await disconnectDb()
        process.exit(0)
    }
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
    logger.error({ err }, 'Fatal error occured during starting worker process')
    process.exit(1)
})
