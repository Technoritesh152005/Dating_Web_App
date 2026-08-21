import { Worker } from 'bullmq'
import { Prisma } from '@prisma/client'
import { QUEUE_NAMES, createRedisClient, circuitBreaker, prisma } from '@dating-app/shared'
import { generateEmbedding } from '../services/embeddingService.js'

export function startEmbeddingWorkerForProfile(logger) {

    const connection = createRedisClient(logger, 'embedding-worker')
    const breakerRedisConnection = createRedisClient(logger, 'embedding-worker-breaker')

    const worker = new Worker(
        QUEUE_NAMES.EMBEDDING_UPDATE,
        async (job) => {
            const { profileId, embeddingInput } = job.data
            logger.info({ profileId }, 'Processing embedding job');

            const { embedding } = await circuitBreaker(breakerRedisConnection, 'gemini-embedding', () =>
                generateEmbedding(embeddingInput)
            )

            const vectorLiteral = `[${embedding.join(',')}]`;

            await prisma.$executeRaw(Prisma.sql
                `
        UPDATE profiles
        set "bioEmbedding" = ${vectorLiteral}::vector
        WHERE id = ${profileId}::uuid
        `)
            logger.info({ profileId }, 'Embedding stored');
            return { profileId, dimensions: embedding.length };

        },
        {
            connection,
            concurrency: 5,
        }
    )

    worker.on('completed', (job, result) => {
        logger.info({ jobId: job.id, result }, 'Embedding job completed');
    });

    worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, err }, 'Embedding job failed');
    });

    return { worker, connection , breakerRedisConnection};
}
