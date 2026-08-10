export async function incrementCounter(redis , name , labels = {}){
    const key = counterKey(name,redis)
    await redis.incr(key)
}
/* It can be said a metrics file */
// labels means of each request u want success status or failed status?
// like for swpie u need wither success count or failed count , so u oass in labels
export async function getCounter(redis , name , labels = {}){
    const value = await redis.get(counterKey(name,labels))
    return Number(value || 0)
}

function counterKey(name , labels){
    const labelStr = Object.entries(labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return labelStr ? `metrics:${name}{${labelStr}}` : `metrics:${name}`;
}