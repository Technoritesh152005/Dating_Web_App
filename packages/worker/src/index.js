import {Worker} from 'bullmq'
import {loadConfig , createRedisClient, createLogger, connectDb, disconnectDb} from '@dating-app/shared'
import {QUEUE_NAMES} from './queueNames.js'

const logger = createLogger('worker')
const config = loadConfig('worker')

// now we need to create seperate redis connection for bullmq cause it uses blocking commands internally
// dont try to use a redis connection which is having pub/sub or regular caching elsewhere

async function main(){

    await connectDb(logger)
    const workerConnection = createRedisClient()

    const worker = new Worker(QUEUE_NAMES.HEALTH_CHECK,
        async(job)=>{
            logger.info({jobId:job.id , data: job.data},'Processign job')
            return {processedAt:new Date().toISOString()}
        },
        {
            connection: workerConnection,
            concurrency : 5
        }
    )

    worker.on('completed',(job )=>{
        logger.info('Job Completed')
    })
    worker.on('failed', (job,err)=>{
        logger.error('Job Failed')
    })

    const shutdown = async (signal) =>{
        logger.info({ signal }, 'Received shutdown signal from worker')
        await worker.close()
        await workerConnection.quit()
        await disconnectDb()
        process.exit(0)
    }
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err)=>{
    logger.error({ err }, 'Fatal error occured during starting worker process')
    process.exit(1)
})
