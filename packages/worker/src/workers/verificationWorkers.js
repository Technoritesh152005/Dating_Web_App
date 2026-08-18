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

            logger.info({ verificationRequestId }, 'Processing verification job')

            const { matchScore, noFaceDetected } = await circuitBreaker(
                breakerRedisConnection,
                'rekognition',
                () => compareFaces(selfieKey, profilePhotoKey)
            )

            const VERIFY_THRESHOLD = 0.85
            const REVIEW_THRESHOLD = 0.6

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