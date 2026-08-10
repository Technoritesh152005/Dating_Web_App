import { generateIceBreaker } from '../services/iceBreakerServices.js'
import { Worker } from 'bullmq'
import { QUEUE_NAMES, createRedisClient, prisma, circuitBreaker } from '@dating-app/shared-facility'

// this is only generated when a match is created . not each times and this job is enqueue in matching.js
export function startIceBreakerFunction(logger) {

    const connection = createRedisClient(logger, 'worker-icebreaker')
    const breakerRedisConnection = createRedisClient(logger, 'worker-icebreaker-breaker')

    const worker = new Worker(
        QUEUE_NAMES.ICEBREAKER_GENERATION,
        // whenever u get a job in this queue follow the below working operations
        async (job) => {
            const { matchId, userAId, userBId } = job.data
            logger.info({ matchId }, 'Started icebreaker suggestion for '`${matchId}`)

            const [profileA, profileB] = await Promise.all([
                await prisma.profile.findUnique({ where: { userId: userAId }, select: { bio: true, interests: true } }),
                await prisma.profile.findUnique({ where: { userId: userAId }, select: { bio: true, interests: true } }),
            ])
            if (!profileA || !profileB) {
                logger.warn({ matchId }, 'Icebreaker skipped- one or both profile may be not found')
                return { skipped: true }
            }

           const {suggestion} = await circuitBrekaer(breakerRedisConnection, 'groq-icebreaker', () =>

                generateIceBreaker({
                    userABio: profileA.bio,
                    userBBio: profileB.bio,
                    userAInterest: profileA.interests,
                    userBInterest: profileB.interests
                })

            )


            await primsa.match.update({
                where: { matchId: matchId },
                data: {
                    iceBreakerSuggestion: suggestion
                }
            })
            logger.info({ matchId }, 'Icebreaker suggestion cached');
            return { matchId, suggestion };
        }, {
        connection: connection,
        concurrency: 5
    }
    )
    worker.on('completed', (job, result) => {
        logger.info({ jobId: job.id, result }, 'Icebreaker job completed')
    })
    worker.on('failed', (job, err) => {
        // if the worker failed it should not stop the matching flow between the user
        logger.info({ jobId: job.id, err }, `Icebreaker job failed`)
    })
    return { worker, connection , breakerRedisConnection }
}