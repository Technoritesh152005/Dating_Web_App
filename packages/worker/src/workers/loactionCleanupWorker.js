import { Worker } from 'bullmq'
import { createRedisClient } from '@dating-app/shared'
import { QUEUE_NAMES, prisma } from '@dating-app/shared/src/queueNames'


export function startLocationCleanUpWorker(logger) {

    const connection = createRedisClient(logger, 'worker-location-clean')
    const worker = new Worker(
        QUEUE_NAMES.LOACTION_SHARE_CLEANUP,
        async (job) => {
            console.log(job)
            const { shareId } = job.data
            const res = await prisma.locationShare.deleteMany({
                where: {
                    id: shareId
                }
            })
            logger.info({ shareId: shareId }, 'All logs of location share is deleted')
            return { deleted: res.count > 0 }

        }, {
        connection,
        concurrency: 5
    }
    )
    worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, err }, 'Location share cleanup job failed');
    });

    return { connection, worker }
}