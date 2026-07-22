import {createRedisClient , QUEUE_NAMES, prisma} from '@dating-app/shared'
import {Worker} from 'bullmq'

export function startMatchNotificationWorker(logger){
    const connection = createRedisClient(logger, 'worker-match-notification');

    const worker = new Worker(
        QUEUE_NAMES.MATCH_NOTIFICATION ,
        async(job)=>{

            const {matchId , userAId , userBId} = job.data
            logger.info('Processing')

            // Placeholder
              // pipeline itself is correct end to end.
            logger.info({ matchId, userAId, userBId }, 'MOCK: would send push/email notification to both users here');

        return { matchId, notifiedAt: new Date().toISOString() };
        },
        { connection, concurrency: 5 } 
    )
}

worker.on('completed',(job,result)=>{
    logger.info({jobId : job.id, result},'Match Notification job completed')
})

worker.on('failed',(job,result)=>{
    logger.error({jobId : job.id, result},'Match Notification job Failed')
})

// we return cause to close this connection 