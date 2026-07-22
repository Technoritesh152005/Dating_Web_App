// this only helps to mark whether user is online or not

const TTL = 60

export async function markOnline(redis , userId , socketId){
    await redis.set(`presence${userId}`, socketId , 'EX', 60)
}

export async function markOffline(redis, userId) {
    await redis.del(`presence:${userId}`);
  }
  
  export async function isOnline(redis, userId) {
    const value = await redis.get(`presence:${userId}`);
    return value !== null;
  }
  