import {Queue} from 'bullmq'
import {loadConfig, createLogger,createRedisClient} from '@dating-app/shared'
import { QUEUE_NAMES } from './queueNames.js'

const logger = createLogger('worker-test')
loadConfig('worker-test')

async function main (){
    const connection = createRedisClient()
const queue = new Queue(QUEUE_NAMES.HEALTH_CHECK , { connection })

const job = await queue.add('job-name',{message:'This is a payload' , sentAt:new Date().toISOString()})

logger.info('Test job enqued- check the worker log')

await queue.close()
await connection.quit()

}
main()
