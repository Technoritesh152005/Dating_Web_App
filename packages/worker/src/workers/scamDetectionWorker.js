import { Worker } from 'bullmq'
import { QUEUE_NAMES,
    createRedisClient,
        prisma,
        circuitBreaker
} from '@dating-app/shared'
import { detectScamRisk } from '../services/scamDetetctionService.js'

export function startScamDetectionWorker(logger){

    const connection = createRedisClient(logger, 'worker-scam-detection')
    const breakerRedisConnection = createRedisClient(
        logger,
        'scam-detection=breaker-connection'
    )

    const worker = new Worker(
        QUEUE_NAMES.SCAM_ANALYSIS,
        async(job)=>{

            const {matchId} = job.data

            const matchProfile = await prisma.match.findUnique({
                where:{
                    id:matchId
                },
                select:{
                    id:true,
                    userAId:true,
                    userBId:true
                }
            })

            if(!matchProfile){
                return {skipped:true,
                    reason:'Match Not found..'
                }
            }
            //it gets the message of sender and receiver of latest 20 message
            const recentMessage = await prisma.message.findMany({
                where:{
                    matchId,
                    content: {not: ''},
                },
                //get latest to oldest message
                orderBy:{createdAt:'desc'},
                take:20,
                select:{
                    senderId:true,
                    content:true
                }
            })

            if(recentMessage.length <2){
                return {
                    skipped:true,
                    reason:'Not-Enough-Message'
                }
            }

            //message is a array with mutliple objects
            const messages = recentMessage.map((message)=>({
                speaker: message.senderId === matchProfile.userAId? 'Person A' : 'Person B',
                content:message.content
            }))

            const result = await circuitBreaker(
                breakerRedisConnection, 'groq-scam-detection',
                () => detectScamRisk(messages)
            )

            if(result.risk !=='HIGH' || result.signals.length <2){
                return {matchId, risk:'NONE'}
            }
            //if found that g**ndu is risk have HIGH flag update in database
            const flag = await prisma.scamRiskFlag.upsert({
                where:{
                    matchId
                },
                create:{
                    matchId,
                    risk:'HIGH',
                    confidence:result.confidence,
                    signals:result.signals,
                    explanation : result.explanation
                },
                update:{
                    risk:'HIGH',
                    confidence: result.confidence,
                    signals: result.signals,
                    explanation: result.explanation,
                    analyzedAt: new Date(),
                }
            })

             logger.warn(
                { matchId, flagId: flag.id, signals: result.signals },
                'Conversation flagged for scam warning',
            )

            return {matchId , flag:flag.id, risk:'HIGH'}
        }, {
            connection,
            concurrency:3
        }
    )

    worker.on('failed',(job,error)=>{
        logger.error(
            {
                jobId:job?.id,
                error
            },
            'Scam detection job failed'
        )
    })

    return {connection, worker, breakerRedisConnection}
}
