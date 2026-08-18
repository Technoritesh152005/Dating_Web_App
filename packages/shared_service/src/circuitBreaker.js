// CIRCUIT BREAKER — protects against a slow/down external provider
// (Rekognition, Gemini, Groq, Resend) taking down job processing with it.
// Without this, a provider outage means every job retries, times out slowly,
// retries again - burning worker concurrency slots on calls that are going
// to fail anyway, while healthy jobs queue up behind them.

const FAILURE_THRESHOLD = 5
const COOLDOWN_MS = 30_000

// each provider gets its own breaker
function breakerKey(name) {
    return `circuit:${name}`
}

export async function circuitBreaker(redis, name, fn) {
    const key = breakerKey(name)
    const stateofProvider = await redis.hgetall(key)

    const failures = Number(stateofProvider.failures || 0)
    const openedAt = stateofProvider.openedAt ? Number(stateofProvider.openedAt) : null

    // the circuit is opened. we check is still the circuit under cooldown period
    if (openedAt) {
        const duration = Date.now() - openedAt
        if (duration < COOLDOWN_MS) {
            const error = new Error(`Circuit breaker open for ${name} - failing fast(retry in ${Math.ceil((COOLDOWN_MS - duration) / 1000)}s)`)
            error.circuitOpen = true
            throw error
        }
    }

    // now circuit time has been finished now we try runnong the function.
    // if provider run we removed break else again apply break with time to cool
    try {
        const result = await fn()

        // if u reached here means u r success
        await redis.del(key)
        return result
    } catch (err) {
        const newFailure = failures + 1;
        const update = { failures: newFailure }

        // if the cuurrent new failure exceeda the threshold error retry then we reupdate tje count and change time of that key
        if (newFailure > FAILURE_THRESHOLD) {
            update.openedAt = Date.now()
        }
        await redis.hset(key, update)
        await redis.expire(key, Math.ceil(COOLDOWN_MS / 1000) * 4); // safety-net TTL so a breaker can never get permanently stuck

        throw err;
    }

}