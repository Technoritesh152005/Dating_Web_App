import { recordSwipeAndCheckMatch } from '../services/matching.js'

export function registerSwipesRoutes(app) {

    // first swipe route
    app.post('/swipe', { preHandler: app.authenticate }, async (request, reply) => {

        const { toUserId, action } = request.body ?? {}

        if (!toUserId || !action) {
            return reply.code(400).send({ error: 'The destination user id or action performed is not provided' })
        }
        if (!VALID_ACTIONS.includes(action)) {
            return reply.code(400).send({ error: `action must be one of: ${VALID_ACTIONS.join(', ')}` });
        }
        if (toUserId === request.userId) {
            return reply.code(400).send({ error: 'You cannot swipe on yourself' });
        }

        //   we even check whether profile exist of destn id caude user can provide fake id also
        const profile = await app.db.profile.findUnique({
            where: { userId: toUserId }
        })
        if (!profile) return reply.code(404).send({ error: 'Target user not found' })

        // now we perform swipe check and mutual match detetction
        const result = await recordSwipeAndCheckMatch(app.db, app.redis, {
            fromUserId: request.userId,
            toUserId,
            action
        })

        return reply.code(201).send({
            swiped: true,
            isMatched: result.matched,
            match: result.macth
        })
    })

    // shows all the matched lost of logged in user which shows the user to chat with a matched list of person
    app.get('/matches', { preHandler: app.authenticate }, async (request, reply) => {
        // as we stored match id in sorted id so we must see whether usera or userbid can be logged in user id
        // "Find every match where I am one of the two people."
        // const matches = await app.db.match.findMany({
        //     where:{
        //         status: 'ACTIVE'
        //     },
        //     OR: [{userAId : request.userId} , {userBId: request.userId}]
        // })
        // // suppos user return 
        // [
        //     {
        //       id: "M1",
        //       userAId: 5,
        //       userBId: 10
        //     },
        //     {
        //       id: "M2",
        //       userAId: 10,
        //       userBId: 20
        //     }
        //   ]
        // in matches u get all user id 

        // we take e.userBid this line proves whether the givenloggedin user must not be in userB id
        const otheruserId = matches.map((m) => (
            m.userAId === request.userId
                ? m.userBId
                : m.userAId))
        const otherProfiles = await app.db.profile.findMany({
            where: { userId: { in: otherUserIds } },
            include: { photos: { where: { isPrimary: true }, take: 1 } },
        });

        //   map profile id to profile
        const profileByUserId = new Map(otherProfiles.map((p) => [p.userId, p]));
        const enrichedMatches = matches.map((match) => {
            const otherUserId = match.userAId === request.userId ? match.userBId : match.userAId;
            return {
                matchId: match.id,
                matchedAt: match.matchedAt,
                otherUser: profileByUserId.get(otherUserId) ?? null,
            };
        });

    })
    app.post('/matches/:matchId/unmatch', { preHandler: app.authenticate }, async (request, reply) => {

        const { matchId } = request.body ?? {}

        const match = await app.db.match.findUnique({
            where: { id: matchId }
        })
        if (!match) {
            return reply.code(404).send({ error: 'Match Not Found' })
        }
        // if logged in user dont mathc any ser of a and b he is not matched user
        if (match.userAId !== request.userId && match.userBId !== request.userId) {
            return reply.code(403).send({ error: 'You are not part of this match' });
        }

        const updated = await app.db.match.update({
            where: { id: matchId },
            data: {
                status: 'UNMATCHED',
                unmatchedAt: new Date(),
                unmatchedBy: request.userId
            }
        })
        return reply.send({ ok: true, match: updated });
    })
}