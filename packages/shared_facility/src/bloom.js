import Redis from 'ioredis'

function seenFilterKey(userId) {
    return `seen:${userId}`
}

export async function addToSeenFilter(redis, userId, targetUserId) {
    // new redis is just a object creation where u send object data inside the existing connection
    await redis.sendCommand(new Redis.Command('BF.ADD', [seenFilterKey(userId), targetUserId]))
}

export async function isInSeenFilter(redis, userId, targetUserId) {

    const result = await redis.sendCommand(new Redis.Command('BF.EXISTS', [seenFilterKey(userId), targetUserId]))

    return result === 1;
}

// this is when u need to check a batch of ids whether they exist in bloom filter
export async function filterOutSeen(userId, targetUserIds, redis) {
    if (targetUserIds.length === 0) return []

    const results =
        await redis.sendCommand(new Redis.Command('BF.MEXISTS', [seenFilterKey(userId), ...targetUserIds]))

    // return the ids which have been not seen
    return targetUserIds.filter((_, index) => results[index] === 0);
}
