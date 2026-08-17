const PAGE_SIZE = 50
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuid(id) {
    return UUID_REGEX.test(id)
}

export function registerGetMessageRoutes(app){

    app.get('/matches/:matchId/messages', {preHandler:app.authenticate} , async(request,reply)=>{

        const {matchId} = request.params;
        const before = request.query.before //fetches all message older than this msg

        // validate matchId format
        if (!matchId || !isValidUuid(matchId)) {
            return reply.code(400).send({error: 'Invalid match ID'})
        }

        // check wheter logged in user and match user id are same
        const match = await app.db.match.findUnique({
            where:{id:matchId}
        })
        if(!match) return reply.code(404).send({error:'No Match Found. You cant get the message'})

        if(match.userAId !== request.userId && match.userBId !== request.userId) return reply.code(403).send({error:'You are not part of this match'})

        let cursor_date = null
        if(before){
            if (!isValidUuid(before)) {
                return reply.code(400).send({error: 'Invalid cursor message ID'})
            }
            // validate that the cursor message belongs to this match
            const cursorMessage = await app.db.message.findUnique({
                where:{id:before}
            })
            if (!cursorMessage || cursorMessage.matchId !== matchId) {
                return reply.code(400).send({error: 'Invalid cursor message'})
            }
            // extract timestamp from oldest message
            cursor_date = cursorMessage.createdAt
        }

        // now get all message before timestamp
        const messages = await app.db.message.findMany({
            where:{
                matchId,
                ...(cursor_date && {createdAt:{ lt: cursor_date}})
            },
            orderBy : {createdAt :'desc'},
            take:PAGE_SIZE,
        })

        return reply.code(200).send({
            messages:messages.reverse(),
            hasMore: messages.length === PAGE_SIZE,
        })
    })
}
// these gets the message in desc time of timestamp