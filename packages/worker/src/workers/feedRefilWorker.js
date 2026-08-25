import {Worker} from 'bullmq'
import{
    createRedisClient,
    QUEUE_NAMES,
    prisma,
    removeuserPreference,
    buildCandidateFeedWithRelaxation
} from '@dating-app/shared'

const FEED_BATCH = 100;
const FEED_LIST_MAX_SIZE = 200;

function feedListKey(userId){
    return `feed:${userId}`
}

export function startFeedRefilWorker(logger){

    const connection = createRedisClient(logger,'worker-feed-refil')
    const listRedis = createRedisClient(logger, 'create-worker-feed-list')

    const worker = new Worker(
    QUEUE_NAMES.FEED_REFILL,
    async(job)=>{
        const {userId, requestId} = job.data
        const log = logger.child({requestId})
        const listKey = feedListKey(userId)
        const lockKey = `feed-refill-lock:${userId}`
        const lockAcquired = await listRedis.set(lockKey, job.id, 'EX', 30, 'NX')

        if (!lockAcquired) {
            return { skipped: true, reason: 'refill-already-running' }
        }

        try {
            // check whether profile exist of user before building the feed
            const profile = await prisma.profile.findUnique({
                where:{userId}
            })
            if(!profile) {log.warn({userId}, 'Feed Refilled not worked as user profile dont exist')
            return {skipped:true}
            }

            const prefs = await removeuserPreference(prisma,userId , profile)
            const { candidates, relaxed, relaxedFields } = await buildCandidateFeedWithRelaxation(prisma , {
                userId,
                prefs,
                ownProfile: profile,
                page:1,
                pageSize:FEED_BATCH
            })

            // Append only candidates not already waiting in the user's feed.
            const existingIds = new Set(await listRedis.lrange(listKey, 0, -1))
            const candidateIds = candidates
                .map((candidate) => candidate.id)
                .filter((candidateId) => !existingIds.has(candidateId))
            if(candidateIds.length > 0){
                await listRedis.rpush(listKey , ...candidateIds)
                await listRedis.ltrim(listKey , -FEED_LIST_MAX_SIZE , -1)
            }

            log.info({userId , count:candidateIds.length, relaxed, relaxedFields},'Fields refilled')
            return { userId, count: candidateIds.length }
        } finally {
            await listRedis.del(lockKey)
        }
    },
    {
        connection,
        concurrency:5
    }
    )

    worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, err }, 'Feed refill job failed');
      });

      return { worker, connection, listRedis };
}