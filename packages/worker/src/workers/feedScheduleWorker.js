import {Worker} from 'bullmq'
import {QUEUE_NAMES, createRedisClient, createQueue, prisma} from '@dating-app/shared'

const ACTIVE_WINDOW_HOURS = 24

// this file has a logic which makes ur feed whenever ur app is closed so that whenever u open a app it already has precomputed feed list rather than creating when the user opens the app
export function startFeedSchedulerWorker(logger){

    const connection = createRedisClient(logger, 'worker-feed-scheduler')
    const enqueueConnection = createRedisClient(logger, 'worker-feed-scheduler')
    const refillQueue = createQueue(QUEUE_NAMES.FEED_REFILL, enqueueConnection)

    const worker = new Worker()
}