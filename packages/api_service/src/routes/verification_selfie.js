import { createQueue, QUEUE_NAMES , objectExists} from '@dating-app/shared'

export function registerVerificationRoutes(app) {

    // we submit a live selfie this just make a entry of lsfie in db and put the job in worker
    app.post('/verification/selfie', { preHandler: app.authenticate, config: { authenticated: true } }, async (request, reply) => {
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

        // Check current verification state to prevent duplicate requests
        const currentStatus = profile.verificationStatus

        if (currentStatus === 'VERIFIED') {
            return reply.code(409).send({
                error: 'ALREADY_VERIFIED',
                message: 'Your profile is already verified',
                verificationStatus: 'VERIFIED'
            })
        }

        if (currentStatus === 'UNDER_REVIEW') {
            // Find the active verification request
            const activeRequest = await app.db.verificationRequest.findFirst({
                where: {
                    userId: request.userId,
                    status: { in: ['PENDING', 'UNDER_REVIEW'] }
                },
                orderBy: { createdAt: 'desc' }
            })
            return reply.code(409).send({
                error: 'VERIFICATION_IN_PROGRESS',
                message: 'Verification is already in progress',
                verificationStatus: 'UNDER_REVIEW',
                verificationRequestId: activeRequest?.id
            })
        }

        // For REJECTED or REVERIFICATION_REQUIRED or PENDING - allow new attempt
        // Use a transaction to atomically check and create to prevent race conditions
        const verificationRequest = await app.db.$transaction(async (tx) => {
            // Double-check no active request exists (race condition protection)
            const existingActive = await tx.verificationRequest.findFirst({
                where: {
                    userId: request.userId,
                    status: { in: ['PENDING', 'UNDER_REVIEW'] }
                }
            })
            if (existingActive) {
                throw new Error('VERIFICATION_IN_PROGRESS')
            }

            return tx.verificationRequest.create({
                data: {
                    userId: request.userId,
                    selfieKey,
                    comparePhotoId: profile.photos[0].id,
                    status: 'PENDING'
                }
            })
        }).catch((err) => {
            if (err.message === 'VERIFICATION_IN_PROGRESS') {
                return reply.code(409).send({
                    error: 'VERIFICATION_IN_PROGRESS',
                    message: 'Verification is already in progress',
                    verificationStatus: 'UNDER_REVIEW'
                })
            }
            throw err
        })

        if (!verificationRequest) {
            // Response already sent in catch block
            return
        }

        // Mark the profile as under review before enqueueing. This prevents a
        // fast worker result from being overwritten by this request afterward.
        await app.db.profile.update({
            where: { id: profile.id },
            data: { verificationStatus: 'UNDER_REVIEW' },
        });

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
            await verificationQueue.close()

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