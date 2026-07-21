import { createRedisClient, QUEUE_NAMES } from '@dating-app/shared'
import { Worker } from 'bullmq'


export function startVerificationWorker(logger) {

    const connection = createRedisClient(logger, 'worker-verification')

    const worker = new Worker(QUEUE_NAMES.VERIFICATION_STATUS, async (job) => {

        const { selfieUrl, userId, profilePhotoUrl, verificationRequestId } = job.data
        logger.info({ verificationRequestId }, 'Processing verification job')

        const { matchScore } = await compareFace(selfieUrl, profilePhotoUrl)

        const VERIFY_THRESHOLD = 0.85;
        const REVIEW_THRESHOLD = 0.6

        let status;
        let RejectionReason = null;

        if (matchScore >= VERIFY_THRESHOLD) {
            status = 'VERIFIED'

        } else if (matchScore >= REVIEW_THRESHOLD) {
            status = 'UNDER_REVIEW'
        } else {
            status = 'REJECTED'
            RejectionReason = 'Selfie did not sufficiently match with your Profile Photo'
        }

        // update the verification status in db
        // prisma.$transaction() is a method that lets you execute multiple database operations as a single atomic unit.
        await prisma.$transaction([

            prisma.verificationRequest.update({
                where:{id:verificationRequestId},
                data:{
                    faceMatchScore: matchScore,
                    status : status,
                    rejectionReason: RejectionReason,
                    reviewedAt : new Date()
                }
            }),
            prisma.profile.update({
                where:{userId},
                data:{verificationStatus: status}
            })
        ])

        logger.info({verificationRequestId,matchScore,status},'verification Decison Performed and recorded')

        return {matchScore, status},
        { connection, concurrency: 3 } // lower than health-check's 5 - face matching is heavier per-job work
    })

    worker.on('completed',(job,result)=>{
        logger.info({jobId:job?.id , err},'Verification Job Completed')
    })
    worker.on('failed',(job,err)=>{
        logger.error({jobId:job?.id, err})
    })

    return { worker, connection };
}