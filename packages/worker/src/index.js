import { Worker } from 'bullmq'
import { loadConfig, createRedisClient, createLogger, connectDb, disconnectDb } from '@dating-app/shared'
import { QUEUE_NAMES } from '@dating-app/shared'
import { startVerificationWorker } from './workers/verificationWorkers.js'
import { startMatchNotificationWorker } from './workers/matchNotifications.js';
import { startFeedRefilWorker } from './workers/feedRefilWorker.js'
import { startFeedSchedulerWorker, scheduleFeedSchedulerQueueJobRepeatable } from './workers/feedScheduleWorker.js'
import { startIceBreakerFunction } from './workers/iceBreakerWorker.js'
import { startLocationCleanUpWorker } from './workers/loactionCleanupWorker.js'
import { startEmbeddingWorkerForProfile } from './workers/embeddingWorker.js'


const logger = createLogger('worker')
const config = loadConfig('worker')

// now we need to create seperate redis connection for bullmq cause it uses blocking commands internally
// dont try to use a redis connection which is having pub/sub or regular caching elsewhere

async function main() {

    await connectDb(logger)
    const workerConnection = createRedisClient()

    const healthCheckWorker = new Worker(QUEUE_NAMES.HEALTH_CHECK,
        async (job) => {
            logger.info({ jobId: job.id, data: job.data }, 'Processing job')
            return { processedAt: new Date().toISOString() }
        },
        {
            connection: workerConnection,
            concurrency: 5
        }
    )

    // during shutdown we need to even close their worker and prisma redis connection
    const { worker: verificationWorker, connection: verificationConnection, breakerRedisConnection: verificationBreakerRedis } = startVerificationWorker(logger);
    const { worker: matchNotificationWorker, connection: matchNotificationConnection, breakerRedisConnection: matchNotificationBreakerRedis } =
        startMatchNotificationWorker(logger);
    const { worker: feedRefillWorker, connection: feedRefillConnection, listRedis: feedListRedis } = await startFeedRefilWorker(logger)
    const { worker: feedSchedulerWorker, connection: feedSchedulerConnection, enqueueConnection } = await startFeedSchedulerWorker(logger)
    const { worker: iceBreakerWorker, connection: iceBreakConnection } = await startIceBreakerFunction(logger)
    const { worker: locationShareCleanupWorker, connection: locationShareCleanupConnection } = startLocationCleanUpWorker(logger);
    const { worker: embeddingWorker, connection: embeddingConnection, breakerRedisConnection: embeddingBreakerRedis } = startEmbeddingWorkerForProfile(logger)
    const schedulerRegistrationConnection = await scheduleFeedSchedulerQueueJobRepeatable(logger)
    logger.info('Worker process started, listening for jobs on: health-check, verification-check');

    healthCheckWorker.on('completed', (job) => {
        logger.info('Job Completed')
    })
    healthCheckWorker.on('failed', (job, err) => {
        logger.error('Job Failed')
    })

    const shutdown = async (signal) => {
        logger.info({ signal }, 'Received shutdown signal from worker')
        await healthCheckWorker.close()
        await workerConnection.quit()
        await verificationWorker.close();
        await verificationConnection.quit();
        await matchNotificationConnection.quit();
        await iceBreakConnection.quit()
        await feedRefillWorker.close();
        await feedRefillConnection.quit();
        await feedSchedulerWorker.close();
        await feedSchedulerConnection.quit();
        await feedRefillConnection.quit();
        await locationShareCleanupWorker.close();
        await locationShareCleanupConnection.quit();
        await embeddingWorker.close();
        await embeddingConnection.quit();
        await embeddingBreakerRedis.quit();
        await schedulerRegistrationConnection.quit();

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
