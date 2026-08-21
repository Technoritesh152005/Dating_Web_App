// this only helps to mark whether user is online or not

const TTL = 60

export async function markOnline(redis, userId, socketId) {
    // use SET NX to avoid overwriting existing presence from another tab
    // if key exists, keep the first socket; still refresh TTL
    const existing = await redis.get(`presence:${userId}`)
    if (existing) {
        await redis.expire(`presence:${userId}`, TTL)
        return
    }
    await redis.set(`presence:${userId}`, socketId, 'EX', TTL)
}

export async function markOffline(redis, userId, socketId) {
  const key = `presence:${userId}`
  if (!socketId || await redis.get(key) === socketId) {
    await redis.del(key)
  }
  }
  
  export async function isOnline(redis, userId) {
    const value = await redis.get(`presence:${userId}`);
    return value !== null;
  }
  