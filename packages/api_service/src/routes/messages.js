const PAGE_SIZE = 50
export function registerGetMessageRoutes(app){

    app.get('/matches/:matchId/messages', {preHandler:app.authenticate} , async(request,reply)=>{

        const {matchId} = request.params;
        const before = request.query.before //fetches all message older than this msg
        console.log(before)

        // check wheter logged in user and mathc user id are same
        const match = await app.db.match({
            where:{id:matchId}
        })
        if(!match) return reply.code(404).send({error:'No Match Found. You cant get the message'})

        if(match.userAId !== request.userId &&match.userBId != request.userId) return reply.code(403).send({error:'You are not part of this match'})
        
        let cursor_date = null
        if(before){
            // this takes the oldest message send by frontend
            const cursorMessage = await app.db.messages.findUnique({
                where:{id:before}
            })
            // extract timestamp from oldest message
             cursor_date = cursorMessage?.createdAt?? null
        }

        // now get all message before timestamp
        const message = await app.db.message.findMany({
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