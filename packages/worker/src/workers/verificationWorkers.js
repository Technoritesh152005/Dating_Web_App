import { createRedisClient, QUEUE_NAMES, prisma, circuitBreaker } from '@dating-app/shared'
import { Worker } from 'bullmq'
import { compareFaces } from '../services/faceMatch.js'

export function startVerificationWorker(logger) {
    const connection = createRedisClient(logger, 'worker-verification')
    const breakerRedisConnection = createRedisClient(logger, 'worker-verification-broker')

    const worker = new Worker(
        QUEUE_NAMES.VERIFICATION_STATUS,
        async (job) => {
            const { selfieKey, userId, profilePhotoKey, verificationRequestId } = job.data
                if (!selfieKey || !profilePhotoKey || !verificationRequestId || !userId) {
                    throw new Error('Verification job is missing required keys')
                }

            logger.info({ verificationRequestId }, 'Processing verification job')

            let comparison
            try {
                comparison = await circuitBreaker(
                    breakerRedisConnection,
                    'rekognition',
                    () => compareFaces(selfieKey, profilePhotoKey)
                )
            } catch (error) {
                await prisma.$transaction([
                    prisma.verificationRequest.update({
                        where: { id: verificationRequestId },
                        data: {
                            faceMatchScore: 0,
                            status: 'REJECTED',
                            rejectionReason: 'Verification could not be completed. Please submit a new selfie.',
                            reviewedAt: new Date()
                        }
                    }),
                    prisma.profile.update({
                        where: { userId },
                        data: { verificationStatus: 'REJECTED' }
                    })
                ])
                logger.error({ err: error, verificationRequestId }, 'Verification processing failed')
                return { matchScore: 0, status: 'REJECTED' }
            }

            const { matchScore, noFaceDetected } = comparison

            const VERIFY_THRESHOLD = 0.90
            const REVIEW_THRESHOLD = 0.80

            let status
            let rejectionReason = null

            if (noFaceDetected) {
                status = 'REJECTED'
                rejectionReason = 'Selfie did not sufficiently match with your Profile Photo'
            } else if (matchScore >= VERIFY_THRESHOLD) {
                status = 'VERIFIED'
            } else if (matchScore >= REVIEW_THRESHOLD) {
                status = 'UNDER_REVIEW'
            } else {
                status = 'REJECTED'
                rejectionReason = 'Face match score was too low'
            }

            await prisma.$transaction([
                prisma.verificationRequest.update({
                    where: { id: verificationRequestId },
                    data: {
                        faceMatchScore: matchScore,
                        status,
                        rejectionReason,
                        reviewedAt: new Date()
                    }
                }),
                prisma.profile.update({
                    where: { userId },
                    data: {
                        verificationStatus: status
                    }
                })
            ])

            logger.info(
                { verificationRequestId, matchScore, status },
                'Verification decision performed and recorded'
            )

            return { matchScore, status }
        },
        {
            connection,
            concurrency: 3
        }
    )
        connection.on('ready', () => {
            logger.info({ queue: QUEUE_NAMES.VERIFICATION_STATUS }, 'Verification worker Redis connection ready')
        })
        connection.on('error', (err) => {
            logger.error({ err, queue: QUEUE_NAMES.VERIFICATION_STATUS }, 'Verification worker Redis connection error')
        })
        worker.on('error', (err) => {
            logger.error({ err, queue: QUEUE_NAMES.VERIFICATION_STATUS }, 'Verification worker error')
        })

    worker.on('completed', (job, result) => {
        logger.info(
            { jobId: job?.id, result },
            'Verification Job Completed'
        )
    })

    worker.on('failed', (job, err) => {
        logger.error(
            { jobId: job?.id, err },
            'Verification Job Failed'
        )
    })

    return {
        worker,
        connection,
        breakerRedisConnection
    }
}