import { createQueue, QUEUE_NAMES , objectExists} from '@dating-app/shared'

export function registerVerificationRoutes(app) {

    // we submit a live selfie this just make a entry of lsfie in db and put the job in worker
    app.post('/verification/selfie', { preHandler: app.authenticate }, async (request, reply) => {
        const { selfieKey } = request.body ?? {}

        if (!selfieKey) return reply.code(400).send({ error: "Please send the SelfieKey" })

        const exist = await objectExists(selfieKey)
        if(!exist) return reply.code(400).send({ error: "Selfie not found in S3" })
        // check whether verifying user has a profile
        const profile = await app.db.profile.findUnique({
            where: { userId: request.userId },
            include: { photos: { where: { isPrimary: true }, take: 1 } }
        })
        if (!profile) return reply.code(404).send({ error: 'Create profile first before verifying your account' })
        if (profile.photos.length === 0) return reply.code(400).send({ error: 'Upload atleast one profile photo before verifying' })

        const verificationRequest = await app.db.verificationRequest.create({
            data: {
                userId: request.userId,
                selfieKey,
                comparePhotoId: profile.photos[0].id,
                status: 'PENDING'
            }
        })

        // now we have made verification status entry in db now we assign this job to workee where verification he will handle
        // we use redis duplicate client connection cause we need a seperate connection for background worker - bullmq
        // Enqueue the actual comparison work - the worker process picks this
        // up independently. Note we reuse app.redis's connection details via a
        // fresh queue handle rather than reusing app.redis directly - BullMQ
        // wants its own dedicated connection (same reasoning as Level 0's redis.js).

        const verificationQueue = await createQueue(QUEUE_NAMES.VERIFICATION_STATUS, app.redis.duplicate(),)
        await verificationQueue.add('check-selfie', {
            verificationRequestId: verificationRequest.id,
            // passing other details to reduce database query
            userId: request.userId,
            selfieKey,
            profilePhotoKey: profile.photos[0].key,
            requestId: request.id
        })

        // // Mark the profile as under review immediately - the USER-FACING state
        // flips out of "PENDING" (never verified) into "UNDER_REVIEW" (actively
        // being checked) right away, even though the actual check hasn't run yet.
        await app.db.profile.update({
            where: { id: profile.id },
            data: { verificationStatus: 'UNDER_REVIEW' },
        });

        return reply.code(202).send({
            message: "Verification submitted - you can keep using the app while this processess",
            verificationRequestId: verificationRequest.id,
        })
    })

    app.get('/verification/status', { preHandler: app.authenticate }, async (request, reply) => {
        const profile = await app.db.profile.findUnique({
            where: { userId: request.userId },
            select: { verificationStatus: true },
        });

        if (!profile) {
            return reply.code(404).send({ error: 'Profile not found' });
        }

        return reply.send({ status: profile.verificationStatus });
    });
}   