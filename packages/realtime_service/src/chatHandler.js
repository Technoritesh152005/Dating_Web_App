import { markOnline } from './userPresence.js'

function MatchRoom(matchId) {
    return `match:${matchId}`
}

async function verifyMatchMemberShip(db, matchId, userId) {

    const match = await db.match.findUnique({
        where: { id: matchId }
    })
    // we see if match exist
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
            // why do we verify- we verify cause only the match members should enter in match room
            const match = await verifyMatchMemberShip(db, matchId, socket.userId)
            if (!match) return callback?.({ ok: false, error: 'Not authorized to join the chat room' })

            // socket.join() means:
            // "Add this connected user (socket) to a room."
            // A room is a group of sockets. Socket.io uses rooms so you can send messages to only a specific set of users instead of everyone.
            socket.join(matchRoom(matchId))
            logger.info({ userId: socket.userId, matchId }, 'User joined match room');

            callback?.({ ok: true })

        } catch (err) {
            logger.error({ err, matchId }, 'Error joining match room');
            callback?.({ ok: false, error: 'Failed to join match room' });
        }
    })


    // now let the socket listen on send message
    socket.on('send-message', async({ matchId, content }, callback) => {

        try {
            if (!content || !content.trim()) {
                return callback?.({ ok: false, error: 'Message cannot be empty' })
            }

            // we still verify whether the match exist and the sender is auth
            const match = await verifyMatchMemberShip(db, matchId, socket.userId)
            if (!match) {
                return callback?.({ ok: false, error: 'Not authorized to message in this match' });
            }

            //   we now store the message before broadcasting
            const msg = await db.message.create({
                data: {
                    senderId: socket.userId,
                    matchId,
                    content: content.trim()
                }
            })

            // now broadcast msg to everyone // Broadcast to EVERYONE in the room (including the sender - simplest
            // way for the sender's own UI to get the server-confirmed message
            // with its real id/timestamp, rather than trusting its own optimistic copy).
            io.to(matchRoom(matchId)).emit('new-msg', {
                id: message.id,
                matchId: message.matchId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt
            })
            callback?.({ ok: true, message })
        } catch (err) {
            logger.error({ err, matchId }, 'Error sending message');
            callback?.({ ok: false, error: 'Failed to send message' });
        }
    })

    //   Send to everyone in this room EXCEPT the current socket.
    socket.on('typing', ({ matchId }) => {
        socket.to(matchRoom(matchId)).emit('user-typing', { userId: socket.userId, matchId });
    });

    //   mark the message as read
    socket.on('mark-read', async ({ matchId }, callback) => {

        try {
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
        await markOffline(redis, socket.userId);
        logger.info({ userId: socket.userId, reason }, 'User disconnected');
    });

}