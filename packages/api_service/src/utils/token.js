import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const ACCESS_TOKEN_LIFE = '15m'
const REFRESH_TOKEN_LIFE_DAYS = 7

// sub mens subject which is identity of user
export function signAccessToken(userId, secret) {
    if (!secret) throw new Error('JWT secret is required for signing')
    return jwt.sign({ sub: userId }, secret, { expiresIn: ACCESS_TOKEN_LIFE })
}
/* These dont return boolean value but a payload where it have userid */
export function verifyAccessToken(token, secrets) {
    if (!secrets) throw new Error('JWT secret(s) are required for verification')

    // Support secret rotation: try each available secret version
    const secretList = typeof secrets === 'string' ? [secrets] : Object.values(secrets)
    let lastError
    for (const secret of secretList) {
        try {
            return jwt.verify(token, secret)
        } catch (err) {
            lastError = err
        }
    }
    throw lastError || new Error('Token verification failed')
}

export function generateRefreshToken() {
    const raw = crypto.randomBytes(40).toString('hex')
    const hash = hashToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFE_DAYS * 24 * 60 * 60 * 1000)
    return { raw, hash, expiresAt }
}

export function hashToken(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex')
}

export function generateOpaqueToken(ttl) {
    const raw = crypto.randomBytes(32).toString('hex')
    const hash = generateHash(raw);
    const expiresAt = new Date(Date.now() + ttl)
    return { rawToken: raw, hash, expiresAt }
}
function generateHash(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
}
