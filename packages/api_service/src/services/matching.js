import { QUEUE_NAMES, connectDb, createQueue } from '@dating-app/shared'
import { addToSeenFilter } from '@dating-app/shared'

// we always pair the order in linear ascending order
function orderedPair(userId1, userId2) {
    return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]
}

export async function recordSwipeAndCheckMatch(db, redis, { fromUserId, toUserId, targetProfileId, action }) {

    // first we try to record the swipe created
    // if already exist the swipe bwn usera to userb we defined in schema that \
    // @@unique([userAId, userBId]) means only 1 record of swipe uniqueneess is of usera to b
    // so if duplicate swipe occurs it send P2002

    // Add to seen filter regardless of whether swipe is new or duplicate
    await addToSeenFilter(redis, fromUserId, targetProfileId)

    try {
        await db.swipe.create({
            data: {
                fromUserId,
                toUserId,
                action
            }
        })
    } catch (err) {
        if (err.code === 'P2002') {
            // already swiped down to this person
            // now we check whether match already exist from person a to b
            const [userAId, userBId] = orderedPair(fromUserId, toUserId)
            const existingMatch = await db.match.findUnique({
                where: {
                    userAId_userBId: { userAId, userBId }
                }
            })
            if (existingMatch) {
                return {
                    matched: true,
                    match: existingMatch,
                    alreadySwiped: true,
                }
            }
            else {
                return {
                    matched: false,
                    match: null,
                    alreadySwiped: true,
                };
            }
        }
        throw err;
    }

    if (action === 'PASS') {
        return { matched: false, match: null, alreadySwiped: false };
    }

    const reverseLike = await db.swipe.findUnique({
        where: {
            fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId }
        }
    })

    //   this means user a swiped b and we see there is a reverse like bwn b to a lso so we create a match
    // we already know user a swiped but now we see user b
    const isMutualLike = reverseLike && (reverseLike.action === 'LIKE' || reverseLike.action === 'FIRE_LIKE')

    if (!isMutualLike) {
        // Common case: no match yet. This is exactly the "A likes B, B is
        // offline / hasn't swiped yet" scenario we discussed - nothing more
        // happens right now. If B later swipes right on A, THAT request is
        // the one that will find THIS swipe as the reverse-like and create
        // the match. Nothing is lost by waiting.
        return { matched: false, match: null, alreadySwiped: false }
    }

    // if u reached here means mutual like confirmed
    // Mutual like confirmed - create the match.
    const [userAId, userBId] = orderedPair(fromUserId, toUserId);

    // the below avoids race condition
    let match;
    try {
        match = await db.match.create({ data: { userAId, userBId, status: 'ACTIVE' } })
    } catch (err) {
        if (err.code === 'P2002') {
            match = await db.match.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
            return { matched: true, match, alreadySwiped: false }
        }
        throw err
    }

    /* Get their emails to send a match notification */
    const users = await db.user.findMany({
        where: { id: { in: [userAId, userBId] } },
        select: { id: true, email: true },
    });
    const userA = users.find((u) => u.id === userAId)
    const userB = users.find((u) => u.id === userBId)

    const userAEmail = userA?.email
    const userBEmail = userB?.email
    const userADisplayName = userA?.profile?.displayName
    const userBDisplayName = userB?.profile?.displayName

    //   seperate bullmq / redis conn
    const matchQueue = createQueue(QUEUE_NAMES.MATCH_NOTIFICATION, redis.duplicate())
    await matchQueue.add('notify-match', { matchId: match.id, userAId, userBId, userAEmail, userBEmail, userADisplayName, userBDisplayName }).catch((err) => {
        console.error('Failed to enqueue match motification', err)
    })

    const iceBreakerQueue = createQueue(QUEUE_NAMES.ICEBREAKER_GENERATION, redis.duplicate())
    await iceBreakerQueue.add('generate.iceBreak', { matchId: match.id, userAId, userBId }).catch((err) => {
        console.error('Failed to enqueue icebreaker generation', err)
    })

    return { matched: true, match, alreadySwiped: false };
}