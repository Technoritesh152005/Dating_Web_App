import redis from 'ioredis'
function seenFilterKey(userId){
    retrun `seen:${userId}`
}

export async function addToSeenFilter(redis , userId , targetUserId){
    // new redis is just a object creation where u send object data inside the existing connection
    await redis.sendCommand(new Redis.Command('BF.ADD' , [seenFilterKey(userId), targetUserId]))
}

export async function isInSeenFilter(redis , userId , targetUserId){

    const result = await redis.sendCommand(new Redis.Command('BF.EXISTS', [seenFilterKey(userId), targetUserId]))

    return result ===1;
}

// this is when u need to check a batch of ids whether they exist in bloom filter
export async function filterOutSeen(userId , targetUserId, redis){
    if(targetUserId.length === 0) return []

    const result = 
    await redis.sendCommand(new Redis.Command('BF.MEXISTS', [seenFilterKey(userId) , ...targetUserId]))

    // return the ids which have been not seen
    return targetUserIds.filter((_, index) => results[index] === 0);
}