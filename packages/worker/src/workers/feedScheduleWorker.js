import {Worker} from 'bullmq'
import {QUEUE_NAMES, createRedisClient, createQueue, prisma} from '@dating-app/shared'

const ACTIVE_WINDOW_HOURS = 24
const BATCH_LIMIT = 200
const STAGGER_MS = 50

// this file has a logic which makes ur feed whenever ur app is closed so that whenever u open a app it already has precomputed feed list rather than creating when the user opens the app
export function startFeedSchedulerWorker(logger){

    const connection = createRedisClient(logger, 'worker-feed-scheduler')
    const enqueueConnection = createRedisClient(logger, 'worker-feed-scheduler')
    // we at each particular time we put the ids of active profile in this queue in which feed refill worker refills the feed or generate the feed
    const refillQueue = createQueue(QUEUE_NAMES.FEED_REFILL, enqueueConnection)

    // this worker performs job means at particular period of time he sense that jib has occured and searches for active profile and prepare the feed for active profiles

    const worker = new Worker(
        QUEUE_NAMES.FEED_SCHEDULER,
        async()=>{
            const activeProfiles = await prisma.profile.findMany({
                where:{
                updatedAt: {gte: new Date(Date.now() - ACTIVE_WINDOW_HOURS * 60 *60*1000)}
                },
                select:{userId:true},
                take: BATCH_LIMIT
            })

            let delay = 0
            for(const {userId} of activeProfiles){
                await refillQueue.add('scheduled-refill', {userId} , {delay})
                delay = delay+STAGGER_MS
            }
            logger.info({ scheduledCount: activeProfiles.length }, 'Feed scheduler tick complete');
            return { scheduledCount: activeProfiles.length };

        },
        {
            connection,concurrency:1
        }
    )

    worker.on('failed',(job,err)=>{
        logger.error({jobId:job.id, err}, 'Feed Scheduler job failed')
    })
    return { worker, connection, enqueueConnection };
}

export async function scheduleFeedSchedulerQueueJobRepeatable(logger){
    const connection = createRedisClient(logger,'worker-feed-scheduler-register')
const queue = createQueue(QUEUE_NAMES.FEED_SCHEDULER, connection)
await queue.add(
    'tick',
    {},
    {repeat:{every: 5*60*1000},
    jobId:'feed-scheduler-repeatbale'
    }
)
return connection
}