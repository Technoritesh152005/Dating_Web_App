import { markOnline, isOnline, markOffline } from './userPresence.js'

const MAX_MESSAGE_LENGTH = 4000
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function matchRoom(matchId) {
    return `match:${matchId}`
}

function isValidUuid(id) {
    return UUID_REGEX.test(id)
}

function sanitizeContent(content) {
    return content
        .replace(/[<>]/g, (c) => (c === '<' ? '<' : '>'))
        .trim()
}

async function verifyMatchMembership(db, matchId, userId) {
    if (!isValidUuid(matchId)) return null

    const match = await db.match.findUnique({
        where: { id: matchId }
    })
    if (!match) return null
    if (match.userAId !== userId && match.userBId !== userId) return null
    if (match.status !== 'ACTIVE') return null
    return match
}

export function registerChatHandlers(io, socket, { db, redis, logger }) {

    // first mark the user online
    // this routes start only when middleware comes in place so that anyone should not emit message
    markOnline(redis, socket.userId, socket.id)

    // when match is created , suppors alice opens chat we need to create a matchRoom now so that msg gets broadcast to this room only and not to others
    socket.on('join-match', async ({ matchId }, callback) => {

        try {
            if (!matchId || !isValidUuid(matchId)) {
                return callback?.({ ok: false, error: 'Invalid match ID' })
            }
            // why do we verify- we verify cause only the match members should enter in match room
            const match = await verifyMatchMembership(db, matchId, socket.userId)
            if (!match) return callback?.({ ok: false, error: 'Not authorized to join the chat room' })

            socket.join(matchRoom(matchId))
            logger.info({ userId: socket.userId, matchId }, 'User joined match room');

            const otherUserId = match.userAId === socket.userId ? match.userBId : match.userAId;
            const partnerOnline = await isOnline(redis, otherUserId);

            callback?.({ ok: true, partnerOnline })

        } catch (err) {
            logger.error({ err, matchId }, 'Error joining match room');
            callback?.({ ok: false, error: 'Failed to join match room' });
        }
    })


    // now let the socket listen on send message
    socket.on('send-message', async ({ matchId, content }, callback) => {

        try {
            if (!matchId || !isValidUuid(matchId)) {
                return callback?.({ ok: false, error: 'Invalid match ID' })
            }

            if (!content || !content.trim()) {
                return callback?.({ ok: false, error: 'Message cannot be empty' })
            }

            const sanitized = sanitizeContent(content)
            if (sanitized.length === 0) {
                return callback?.({ ok: false, error: 'Message cannot be empty' })
            }
            if (sanitized.length > MAX_MESSAGE_LENGTH) {
                return callback?.({ ok: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH}` })
            }

            // we still verify whether the match exist and the sender is auth
            // re-verify match status at send time to catch race condition (match unmatched between join and send)
            const match = await verifyMatchMembership(db, matchId, socket.userId)
            if (!match) {
                return callback?.({ ok: false, error: 'Not authorized to message in this match' });
            }

            //   we now store the message before broadcasting
            const msg = await db.message.create({
                data: {
                    senderId: socket.userId,
                    matchId,
                    content: sanitized
                }
            })

            // now broadcast msg to everyone // Broadcast to EVERYONE in the room (including the sender - simplest
            // way for the sender's own UI to get the server-confirmed message
            // with its real id/timestamp, rather than trusting its own optimistic copy).
            io.to(matchRoom(matchId)).emit('new-msg', {
                id: msg.id,
                matchId: msg.matchId,
                senderId: msg.senderId,
                content: msg.content,
                createdAt: msg.createdAt
            })
            callback?.({ ok: true, message: msg })
        } catch (err) {
            logger.error({ err, matchId }, 'Error sending message');
            callback?.({ ok: false, error: 'Failed to send message' });
        }
    })

    //   Send to everyone in this room EXCEPT the current socket.
    socket.on('typing', async ({ matchId }) => {
        if (!matchId || !isValidUuid(matchId)) return
        // verify membership before forwarding typing event
        const match = await verifyMatchMembership(db, matchId, socket.userId)
        if (!match) return
        socket.to(matchRoom(matchId)).emit('user-typing', { userId: socket.userId, matchId });
    });

    //   mark the message as read
    socket.on('mark-read', async ({ matchId }, callback) => {

        try {
            if (!matchId || !isValidUuid(matchId)) {
                return callback?.({ ok: false, error: 'Invalid match ID' })
            }
            const match = await verifyMatchMembership(db, matchId, socket.userId);
            if (!match) {
                return callback?.({ ok: false, error: 'Not authorized' });
            }

            await db.message.updateMany({
                // update the read msg of match id where it must not be of sender and also whose readat is null
                where: { matchId, senderId: { not: socket.userId }, readAt: null },
                data: {
                    readAt: new Date()
                }
            })
            socket.to(matchRoom(matchId)).emit('messages-read', { matchId, readBy: socket.userId });
            callback?.({ ok: true });
        } catch (err) {
            logger.error({ err, matchId }, 'Error marking messages read');
            callback?.({ ok: false, error: 'Failed to mark messages read' });
        }
    })

    socket.on('disconnect', async (reason) => {
        await markOffline(redis, socket.userId, socket.id);
        // leave all rooms to clean up stale memberships
        socket.rooms.forEach(room => {
            if (room !== socket.id) socket.leave(room)
        })
        logger.info({ userId: socket.userId, reason }, 'User disconnected');
    });

}