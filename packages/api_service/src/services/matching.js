import { QUEUE_NAMES, createQueue } from '@dating-app/shared';

function orderedPair(userId1, userId2) {
    return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]
}

export function recordSwipeAndCheckMatch(db, redis, { fromUserId, toUserId, action }) {

    // first we try to record the swipe created
    // if already exist the swipe bwn usera to userb we defined in schema that \
    // @@unique([userAId, userBId]) means only 1 record of swipe uniqueneess is of usera to b
    // so if duplicate swipe occurs it send P2002

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
            const [userAid, userBid] = orderedPair(fromUserId, toUserId)
            const existingMatch = await db.match.findUnique({
                where: {
                    userA_userB: { userAid, userBid }
                }
            })
            if (existingMatch) {
                return {
                    matched: true,
                    existingMatch: existingMatch,
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
            fromUserB_to_USerA: { fromUserId: toUserId, toUserId: fromUserId }
        }
    })

    //   this means user a swiped b and we see there is a reverse like bwn b to a lso so we create a match
    // we already know user a swiped but now we see user b
    const isMutualLike = reverseLike && (reverseLike.action === 'LIKE' || reverseLike.action === 'SUPER_LIKE')

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

    const match = await db.match.create({
        data: { userAId, userBId, status: 'ACTIVE' },
    });

    //   seperate bullmq / redis conn
    const matchQueue = createQueue(QUEUE_NAMES.MATCH_NOTIFICATIONS, redis.duplicate())
    await queue.add('notify-match', { matchId: match.id, userAId, userBId });

    return { matched: true, match, alreadySwiped: false };
}