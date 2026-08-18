import { QUEUE_NAMES } from '../../../shared_service/src/queueNames.js'
import { generateOpaqueToken, hashToken } from '../utils/token.js'
import { createQueue } from '@dating-app/shared/src/queue.js'

const MAX_REPORT_THRESHOLD = 5
const REPORT_WINDOW_HOURS = 24
const MAX_SHARE_DURATION_MINUTES = 12 /* U can share max 12 hrs only bro */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuid(id) {
    return UUID_REGEX.test(id)
}

export function registerSafetyRoutes(app) {

    // BLOCK
    app.post('/safety/block', { preHandler: app.authenticate, config: { authenticated: true } }, async (req, reply) => {
        const { userId: blockedId } = req.body ?? {};
        if (!blockedId || !isValidUuid(blockedId)) return reply.code(400).send({ error: 'valid userId is required to block' })

        if (blockedId === req.userId) return reply.code(400).send({ error: 'You cannot block yourself my man/girl' })

        try {
            await app.db.block.create({
                data: {
                    blockerId: req.userId,
                    blockedId
                }
            })
        } catch (err) {
            // P2002 means block was already created. if it is not this error then wthrow err
            if (err.code !== 'P2002') throw err;
        }

        // block means bwn a match where we stop chat interaction and not just future discovery
        const [userAId, userBId] = blockedId < req.userId ? [blockedId, req.userId] : [req.userId, blockedId]
        await app.db.match.updateMany({
            where: { userAId, userBId, status: 'ACTIVE' },
            data: { status: 'UNMATCHED', unmatchedAt: new Date(), unmatchedBy: req.userId }
        })

        return reply.code(201).send({ ok: true })
    })

    // this only removes block record from block table.
    /* Suppose match exist bwm alice and bob and alice block bob then alice unblock bob so here match is also unmatched and nothing gets restored as it was earlier. it always starts new */
    app.delete('/safety/block/:userId', { preHandler: app.authenticate, config: { authenticated: true } }, async (request, reply) => {
        const { userId: blockedId } = request.params
        if (!blockedId || !isValidUuid(blockedId)) return reply.code(400).send({ error: 'valid userId is required' })
        await app.db.block.deleteMany({
            where: { blockerId: request.userId, blockedId }
        })
        return reply.send({ ok: true })
    })

    app.get('/safety/blocks', { preHandler: app.authenticate }, async (request, reply) => {

        const blocksofPerson = await app.db.block.findMany({
            where: { blockerId: request.userId },
            orderBy: { createdAt: 'desc' }
        })

        // blockedid means the person whom u blocked
        const blockedUserIds = blocksofPerson.map((e) => e.blockedId)
        const allBlockedProfiles = await app.db.profile.findMany({
            where: { userId: { in: blockedUserIds } },
            select: { userId: true, displayName: true }
        })
        // this is a map which stores id with their displayName
        const nameByUserId = new Map(allBlockedProfiles.map((p) => [p.userId, p.displayName]))

        return reply.send({
            blocked: blocksofPerson.map((e) => ({
                userId: e.blockedId,
                displayName: nameByUserId.get(e.blockedId) ?? ('deleted profile'),
                blockedAt: e.createdAt
            }))
        })
    })

    app.post('/safety/report', { preHandler: app.authenticate, config: { authenticated: true } }, async (request, reply) => {

        const { reporteduserId, reason, evidenceUrl } = request.body ?? {}

        if (!reporteduserId || !isValidUuid(reporteduserId)) return reply.code(400).send({ error: 'valid Reported userId is required' })
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) return reply.code(400).send({ error: 'Reason is required to report' })
        if (request.userId === reporteduserId) return reply.code(400).send({ error: 'You cannot report Yourself only' })

        const reportedProfile = await app.db.profile.findUnique({
            where: { userId: reporteduserId }
        })
        if (!reportedProfile) return reply.code(404).send({ error: 'Reported user profile not found' })

        await app.db.report.create({
            data: {
                reporterId: request.userId,
                reportedUserId: reporteduserId,
                reason: reason.trim(),
                evidenceUrl: evidenceUrl ?? null
            }
        })

        // now as report has been occured on this reported id we check whether the reported user has cross the threshold of getting blocked
        const recentReportCount = await app.db.report.count({
            where: {
                reportedUserId: reporteduserId,
                status: 'OPEN',
                /* get the user of report past 24hrs  */
                createdAt: { gte: new Date(Date.now() - REPORT_WINDOW_HOURS * 60 * 60 * 1000) }
            }
        })
        /* If the reported user id meets these condition then it is flagged as danger or ... */
        if (recentReportCount >= MAX_REPORT_THRESHOLD && !reportedProfile.safetyFlagged) {
            await app.db.profile.update({
                where: { userId: reporteduserId },
                data: { safetyFlagged: true, safetyFlaggedAt: new Date() }
            })
            request.log.warn({ reportedUserId: reporteduserId, recentReportCount }, 'Profile auto-flagged for safety review');
        }

        return reply.code(201).send({ ok: true })
    })

    // LIVE LOCATION SHARE — time-boxed session, unguessable token link, no
    // account needed for the trusted contact to view it.
    app.post('/safety/location-share', { preHandler: app.authenticate, config: { authenticated: true } }, async (request, reply) => {
        const { durationMinutes, contactName } = request.body ?? {}

        const duration = Number(durationMinutes)
        if (!duration || !Number.isFinite(duration) || duration <= 0 || duration >= MAX_SHARE_DURATION_MINUTES) {
            return reply.code(400).send({ error: 'Duration not provided or duration is less than 0, or duration is above maximum limit' })
        }
        const { rawToken, hash, expiresAt } = await generateOpaqueToken(duration * 60 * 1000)
        const share = await app.db.locationShare.create({
            data: {
                userId: request.userId,
                tokenHash: hash,
                expiresAt,
                contactName: contactName ? String(contactName).slice(0, 100) : null,

            }
        })

        // cleanup of the record stored in table when it gets expired
        const cleanupQueue = createQueue(QUEUE_NAMES.LOCATION_SHARE_CLEANUP, app.redis.duplicate())
        // run these job in queue after duration time
        await cleanupQueue.add('clean-queue', { shareId: share.id }, { delay: duration * 60 * 1000 })

        return reply.code(201).send({
            shareId: share.id,
            token: rawToken, // shown ONCE - the client is responsible for building the shareable link from this
            expiresAt: share.expiresAt,
        });
    })

    // only the person who created share can update this
    app.post('/safety/location-share/:shareId/update', { preHandler: app.authenticate, config: { authenticated: true } }, async (request, reply) => {
        const { shareId } = request.params
        if (!shareId || !isValidUuid(shareId)) return reply.code(400).send({ error: 'valid shareId is required' })
        const { latitude, longitude } = request.body ?? {}

        if (latitude == null || longitude == null || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
            return reply.code(400).send({ error: 'valid latitude and longitude are required' });
        }
        // clamp to valid geo range
        const lat = Number(latitude)
        const lon = Number(longitude)
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return reply.code(400).send({ error: 'latitude/longitude out of range' });
        }
        const shareProfile = await app.db.locationShare.findUnique({
            where: { id: shareId }
        })
        if (!shareProfile || shareProfile.userId !== request.userId) return reply.code(404).send({ error: 'No Share Found of this id' })
        if (shareProfile.expiresAt < new Date() || shareProfile.revokedAt) return reply.code(400).send({ error: 'The share link has already expired' })

        await app.db.locationShare.update({
            where: { id: shareId },
            data: { latitude: lat, longitude: lon, lastUpdatedAt: new Date() }
        })
        return reply.send({ ok: true });
    })
    app.post('/safety/location-share/:shareId/stop', { preHandler: app.authenticate, config: { authenticated: true } }, async (request, reply) => {
        const { shareId } = request.params;
        if (!shareId || !isValidUuid(shareId)) return reply.code(400).send({ error: 'valid shareId is required' });

        const share = await app.db.locationShare.findUnique({ where: { id: shareId } });
        if (!share || share.userId !== request.userId) {
            return reply.code(404).send({ error: 'Location share not found' });
        }

        await app.db.locationShare.update({ where: { id: shareId }, data: { revokedAt: new Date() } });

        return reply.send({ ok: true });
    });

    // PUBLIC READ — deliberately NOT behind app.authenticate. The trusted
    // contact never creates an account; the unguessable token IS their
    // credential. Looked up by HASH (never store/compare the raw token),
    // same pattern as refresh token verification in Level 2.
    // -----------------------------------------------------------------------
    app.get('/safety/location/:token', async (request, reply) => {
        const { token } = request.params;
        if (!token || typeof token !== 'string') {
            return reply.code(400).send({ error: 'token is required' });
        }
        const tokenHash = hashToken(token);

        const share = await app.db.locationShare.findUnique({ where: { tokenHash } });

        if (!share || share.revokedAt || share.expiresAt < new Date()) {
            // Deliberately the same response whether the token is invalid,
            // expired, or revoked - distinguishing them would let someone probe
            // for which tokens ONCE existed, a minor but real info leak to avoid.
            return reply.code(410).send({ error: 'This location share is no longer available' });
        }

        return reply.send({
            latitude: share.latitude,
            longitude: share.longitude,
            lastUpdatedAt: share.lastUpdatedAt,
            expiresAt: share.expiresAt,
            contactName: share.contactName,
        });
    });

}