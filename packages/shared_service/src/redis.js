import Redis from "ioredis"

// we create here factory not a single instance cause multple redis can be used in 3 service differently based on their usage
// We export a FACTORY (not a single shared instance) because BullMQ and the
// Socket.io Redis adapter each want their own dedicated connection - sharing
// one ioredis instance across very different usage patterns (pub/sub vs
// blocking commands) can cause subtle bugs. Cheap to create, so we don't
// force a singleton here like we do for Prisma.
export function createRedisClient (){
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    const client = new Redis( url, {
        maxRetriesPerRequest: null, // required by BullMQ
        enableReadyCheck: true,
    })

    client.on('connect',()=>{
        console.log("Redis Connecting")
    })
    client.on('ready',()=>{
        console.log('Redis Ready')
    })
    client.on('error',()=>{
        console.log('Redis error Occured')
    })
    client.on('close',()=>{
        console.log('Redis Connection Closed')
    })

    return client
}

