const TTL = 60

function presenceKey(userId) {
    return `presence:${userId}`
}

async function normalizePresenceSet(redis, key) {
    const type = await redis.type(key)
    if (type !== 'none' && type !== 'set') {
        await redis.del(key)
    }
}

export async function markOnline(redis, userId, socketId) {
    const key = presenceKey(userId)
    await normalizePresenceSet(redis, key)
    await redis.sadd(key, socketId)
    await redis.expire(key, TTL)
}

export async function refreshOnline(redis, userId, socketId) {
    const key = presenceKey(userId)
    const type = await redis.type(key)

    if (type === 'set' && await redis.sismember(key, socketId)) {
        await redis.expire(key, TTL)
    } else if (type === 'string' && await redis.get(key) === socketId) {
        await redis.expire(key, TTL)
    }
}

export async function markOffline(redis, userId, socketId) {
    const key = presenceKey(userId)
    const type = await redis.type(key)

    if (type === 'string') {
        if (!socketId || await redis.get(key) === socketId) {
            await redis.del(key)
        }
        return isOnline(redis, userId)
    }

    if (type !== 'set') return false

    await redis.srem(key, socketId)
    const remainingSockets = await redis.scard(key)
    if (remainingSockets === 0) {
        await redis.del(key)
        return false
    }
    return true
}

export async function isOnline(redis, userId) {
    const key = presenceKey(userId)
    const type = await redis.type(key)
    if (type === 'set') return (await redis.scard(key)) > 0
    if (type === 'string') return (await redis.get(key)) !== null
    return false
}
