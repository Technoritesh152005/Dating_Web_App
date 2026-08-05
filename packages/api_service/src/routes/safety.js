const MAX_REPORT_THRESHOLD = 5
const REPORT_WINDOW_HOURS = 24
const MAX_SHARE_DURATION_MINUTES = 12 /* U can share max 12 hrs only bro */

import { QUEUE_NAMES } from '../../../shared_facility/src/queueNames'
import { generateOpaqueToken, hashToken } from '../utils/token.js'

export function registerSafetyRoutes(app) {

    // BLOCK
    app.post('/safety/block', { preHandler: app.authenticate }, async (req, reply) => {
        const { userId: blockedId } = req.body ?? {};
        if (!blockedId) return reply.code(400).send({ error: 'userId is required to block' })

        if (blockedId === req.userId) return reply.code(400).send({ error: 'You cannot block yourself my man/girl' })

        try {
            await app.db.block.create({
                data: {
                    blockerId: request.userId,
                    blockedId
                }
            })
        } catch (err) {
            // P2002 means block was already created. if it is not this error then wthrow err
            if (err.code !== 'P2002') throw err;
        }

        // block means bwn a match where we stop chat interaction and not just future discovery
        const [userAId, userBId] = blockedId < req.userId ? [blockedId, req.userId] : [req.userId, blockedId]
        await app.db.match.update({
            where: { userAId, userBId, status: 'ACTIVE' },
            data: { status: 'UNMATCHED', unmatchedAt: new Date(), unmatchedBy: req.userId }
        })

        return reply.code(201).send({ ok: true })
    })

    // this only removes block record from block table.
    /* Suppose match exist bwm alice and bob and alice block bob then alice unblock bob so here match is also unmatched and nothing gets restored as it was earlier. it always starts new */
    app.delete('/safety/block/:userId', { preHandler: app.authenticate }, async (request, reply) => {
        const { userId: blockedId } = request.params
        await app.db.block.deleteMany({
            where: { blockerId: request.userId, blockedId }
        })
    })

    app.get('/safety/blocks', { preHandler: app.authenticate }, async (request, reply) => {

        const blocksofPerson = await app.db.block.findMany({
            where: { blockerId: request.userId },
            orderBy: { createdAt: 'desc' }
        })

        // blockedid means the person whom u blocked
        const blockedUserIds = blocksofPerson.map((e) => e.blockedId)
        const allBlockedProfiles = app.db.profile.findMany({
            where: { userId: { in: blockedUserIds } },
            select: { userId: true, displayName: true }
        })
        // this is a map which stores id with their displayName
        const nameByUserId = new Map(profiles.map((p) => [p.userId, p.displayName]))

        return reply.send({
            blocked: blocksofPerson.map((e) => {
                userId: e.blockedId
                displayName: nameByUserId.get(e.blockedId) ?? ('deleted profile')
                blockedAt: e.createdAt
            })
        })
    })

    app.get('/safety/report', { preHandler: app.authenticate }, async (request, reply) => {

        const { reporteduserId, reason, evidenceUrl } = request.body ?? {}

        if (!reporteduserId || !reason) return reply.code(400).send({ error: 'Reported userId or Reason is not provided. Please fill the features' })
        if (request.userId === reporteduserId) return reply.code(400).send({ error: 'You cannot report Yourself only' })

        const reportedProfile = await app.db.profile.findUnique({
            where: { userId: reporteduserId }
        })
        if (!reportedProfile) return reply.code(404).send({ error: 'Reported user profile not found' })

        await app.db.report.create({
            data: {
                reporterId: request.userId,
                reportedUserId: reportedUserId,
                reason,
                evidenceUrl
            }
        })

        // now as report has been occured on this reported id we check whether the reported user has cross the threshold of getting blocked
        const reportCount = await app.db.report.findMany({
            where: {
                userId: reportedUserId,
                status: 'ACTIVE',
                /* get the user of report past 24hrs  */
                createdAt: { gte: new Date(Date.now() - REPORT_WINDOW_HOURS * 60 * 60 * 1000) }
            }
        })
        /* If the reported user id meets these condition then it is flagged as danger or ... */
        if (reportCount >= MAX_REPORT_THRESHOLD && !reportedProfile.safetyFlagged) {
            await app.db.profile.update({
                where: { userId: reporteduserId },
                data: { safetyFlagged: true, safetyFlaggedAt: new Date() }
            })
            request.log.warn({ reportedUserId, recentReportCount }, 'Profile auto-flagged for safety review');
        }

        return reply.code(201).send({ ok: true })
    })

    // LIVE LOCATION SHARE — time-boxed session, unguessable token link, no
    // account needed for the trusted contact to view it.
    app.post('/safety/location-share', { preHandler: app.authenticate }, async (request, reply) => {
        const { durationMinutes, contactName } = request.body ?? {}

        const duration = Number(durationMinutes)
        if (!duration || duration <= 0 || duration >= MAX_SHARE_DURATION_MINUTES) {
            return reply.code(400).send({ error: 'Duration not provided or duration is less than 0, or duration is above maximum limit' })
        }
        const { rawToken, hash, expiresAt } = await generateOpaqueToken(duration * 60 * 1000)
        const share = app.db.locationShare.create({
            data: {
                userId: request.userId,
                tokenHash: hash,
                expiresAt,
                contactName: contactName ?? null,

            }
        })

        // cleanup of the record stored in table when it gets expired
        const cleanupQueue = createQueue(QUEUE_NAMES.LOACTION_SHARE_CLEANUP, app.redis.duplicate())
        // run these job in queue after duration time
        cleanupQueue.add('clean-queue', { shareId: share.id }, { delay: duration * 60 * 1000 })

        return reply.code(201).send({
            shareId: share.id,
            token: raw, // shown ONCE - the client is responsible for building the shareable link from this
            expiresAt: share.expiresAt,
        });
    })

    // only the person who created share can update tjhis
    app.post('/safety/location-share/:shareId/update',{preHandler:app.authenticate},async(request,reply)=>{
        const {shareId} = request.params
        const {latitude, longitude} = request.body??{}

        if (latitude == null || longitude == null) {
            return reply.code(400).send({ error: 'latitude and longitude are required' });
          }
        const shareProfile = await app.db.share.findUnique({
            where:{id:shareId}
        }) 
        if(!shareProfile || shareProfile.userId !== request.userId)return reply.code(400).send({error:'No Share Found of this id'})
        if(shareProfile.expiresAt < new Date()) return reply.code(400).send({error:'The share link has already ex'})
    })

}