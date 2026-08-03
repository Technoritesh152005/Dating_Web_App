import {Worker} from 'bullmq'
import{
    createRedisClient,
    QUEUE_NAMES,
    prisma,
    resolveEffectivePreference,
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
        const {userId} = job.data

        // check whether profile exist of user before building the feed
        const profile = await prisma.profile.findUnique({
            where:{userId}
        })
        if(!profile) {logger.warn({userId}, 'Feed Refilled not worked as user profile dont exist')
        return {skipped:true}
        }

        const prefs = await removeuserPreference(prisma,userId , profile)
        const { candidates, relaxed, relaxedFields } = await buildCandidateFeedWithRelaxation(prisma , {
            userId ,
            prefs,
            profile,
            page:1,
            pageSize:FEED_BATCH
        })

        // this returns an array of candidates
        const candidateIds = candidates.map((c)=>c.id)
        if(candidateIds.length > 0){
            // it adds the list of ids from right of redis
            await listRedis.rpush(feedListKey(userId) , ...candidateIds)
            // if size exceed than feed list max size then trim and keep latest size
            await listRedis.ltrim(feedListKey(userId) , -FEED_LIST_MAX_SIZE , -1)
        }

        logger.info({userId , count:candidateIds.length, relaxed, relaxedFields},'Fields refilled')
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