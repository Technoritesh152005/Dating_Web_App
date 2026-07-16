import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

ACCESS_TOKEN_LIFE='15m'
REFRESH_TOKEN_LIFE='7d'

// sub mens subject which is identity of user
export function signAccessToken (userId , secret){
    return jwt.sign({sub:userId} ,secret, {expiresIn: ACCESS_TOKEN_LIFE})
}

export function verifyAccessToken(token , secret){
    return jwt.verify(token,secret)
}

export function generateRefreshToken (){
    const raw = crypto.randomBytes(40).toString('hex')
    const hash = hashToken(raw);
const expiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFE * 24*60*60*1000)
return {raw,hash,expiresAt}
}

export function hashToken (raw){
    return crypto.createHash('sha256').update(raw).digest('hex')
}