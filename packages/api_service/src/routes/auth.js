import { comparePassword, hashPassword } from "../utils/password.js"
import { signAccessToken, hashToken, generateRefreshToken } from "../utils/token.js"
import { OAuth2Client } from "google-auth-library"
import { isValidEmail, sanitizePhone } from "../plugins/validation_middleware.js"


// Configuration setting for access token and refresh token to be stored in cookies
const accessCookieOpts = (config) => ({
    httpOnly: true,
    secure: config.nodeEnv === 'production',// this tells to use https only when production
    sameSite: 'lax', /* Same site prevent to share http config to other web apps */
    path: '/',
    maxAge: 15 * 60 //same as access token

})

const refreshCookiesOpts = (config) => ({
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    // Scoped to ONLY the refresh endpoint - the browser won't even attach this
    // cookie to other requests, shrinking the attack surface if anything on
    // another route were ever compromised.
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
})

export function registerAuthRoutes(app, config) {

    // GET /auth/me - returns current user's profile including verification status
    app.get('/auth/me', { preHandler: app.authenticate, config: { authenticated: true } }, async (request, reply) => {
        const user = await app.db.user.findUnique({
            where: { id: request.userId },
            select: {
                id: true,
                email: true,
                phone: true,
                googleId: true,
                createdAt: true,
                profile: {
                    select: {
                        id: true,
                        displayName: true,
                        dateOfBirth: true,
                        gender: true,
                        bio: true,
                        interests: true,
                        profession: true,
                        religion: true,
                        caste: true,
                        showReligionCaste: true,
                        latitude: true,
                        longitude: true,
                        verificationStatus: true,
                        safetyFlagged: true,
                        photos: {
                            where: { isPrimary: true },
                            take: 1,
                            select: { id: true, url: true, key: true, isPrimary: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send(user);
    });

    /* 1. SignUp Routes */
    app.post('/auth/signup', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {

        const { email, password, phone } = request.body ?? {}

        if (!email || !password) {
            return reply.code(400).send({
                error: 'Email and password are required'
            })
        }

        if (!isValidEmail(email)) {
            return reply.code(400).send({
                error: 'Invalid email format'
            })
        }

        if (password.length < 8) {
            return reply.code(400).send({
                error: 'Password cannot be less than 8 characters'
            })
        }
        if(phone){
            const sanitizedPhone = sanitizePhone(phone)
            if (!sanitizedPhone || sanitizedPhone.length !== 10) {
                return reply.code(400).send({error:'Phone number must be 10 digits'})
            }
        }

        // app.db came from decorate as prisma client is created of schema it provides multiple methods
        const existinguser = await app.db.user.findUnique({ where: { email } })

        if (existinguser) {
            return reply.code(409).send({ error: "An Account already exist with this credentials" })
        }
        const passwordHash = await hashPassword(password)
        const user = await app.db.user.create({
            data: {
                email, passwordHash, phone
            }
        })

        await issueTokenPair(app, reply, config, user.id)

        return reply.code(201).send({ id: user.id, email: user.email });
    })

    //google based login / signup
    app.post('/auth/google', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {

        const { idToken } = request.body ?? {}
        if (!idToken) return reply.code(400).send({ error: 'idToken is required for Google sign in' })

        if (!config.googleClientId) return reply.code(503).send({ error: 'Google Sign-in is not configured with server' })

        const client = new OAuth2Client(config.googleClientId)

        let payload
        try {
            const ticket = await client.verifyIdToken({ idToken, audience: config.googleClientId })
            payload = ticket.getPayload()
        } catch (err) {
            return reply.code(401).send({ error: 'Invalid Google token' });
        }

        if (!payload.email_verified) {
            return reply.code(401).send({ error: 'Google account email is not verified' })
        }

        const { sub: googleId, email, name } = payload

        let user = await app.db.user.findUnique({
            where: {
                googleId
            }
        })
        // no google account sign in linked... now check whether pass - email acc exist in our system
        if (!user) {

            const existingEmail = await app.db.user.findUnique({
                where: {
                    email
                }
            })

            // if u got the user with system with pass account and then u update users google id with this id as user tried to sign with google sign-in
            if (existingEmail) user = await app.db.user.update({ where: { id: existingEmail.id }, data: { googleId } })
            // else u didnt find pass acc also u create the account only (new))
            else user = await app.db.user.create({ data: { googleId, email } })

        }

        await issueTokenPair(app, reply, config, user.id)
        return reply.send({ id: user.id, email: user.email, name })
    })
    /* login through email and password */
    app.post('/auth/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {

        const { email, password } = request.body ?? {}

        if (!email || !password) {
            return reply.code(400).send({ error: 'Email and Password are required' })
        }

        if (!isValidEmail(email)) {
            return reply.code(400).send({ error: 'Invalid email format' })
        }

        const user = await app.db.user.findUnique({ where: { email } })

        if (!user) {
            return reply.code(400).send({ error: 'Invalid email or password' })
        }

        /* If u didnt get the user hash password means users once login using hashpassword and now ur trying with pass, eo tell them to login with google sign-in instead */
        if (!user.passwordHash) return reply.code(401).send({ error: 'This acc uses Google-sign in options. Please use that instead' })
        const passwordvalid = await comparePassword(password, user.passwordHash)
        if (!passwordvalid) {
            return reply.code(400).send({ error: 'Invalid Email or password' })
        }

        await issueTokenPair(app, reply, config, user.id)

        return reply.send({ id: user.id, email: user.email })
    })

    app.post('/auth/refresh', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {

        const rawRefresh = request.cookies?.refreshToken
        if (!rawRefresh) {
            return reply.code(401).send('Refresh Token is not provided')
        }

        const hashRefresh = hashToken(rawRefresh)
        const stored = await app.db.refreshTokens.findUnique({ where: { tokenHash: hashRefresh } })

        if (!stored || stored.expiresAt < new Date() || stored.revokedAt) {
            return reply.code(401).send({ error: 'Refresh Token invalid or expired' })
        }

        await app.db.refreshTokens.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });

        await issueTokenPair(app, reply, config, stored.userId);

        return reply.send({ ok: true });
    })

    app.post('/auth/logout', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {

        const rawRefresh = request.cookies?.refreshToken
        if (rawRefresh) {
            const tokenHash = hashToken(rawRefresh)
            await app.db.refreshTokens.updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }

        // remove both token from cookies
        reply.clearCookie('accessToken', { path: '/', httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax' })
        reply.clearCookie('refreshToken', { path: '/auth/refresh', httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'strict' });

        return reply.send({ ok: true });
    })

}

// shared by signup + login + refresh where it creates 1 acesstoken and 1 refreshtoken
export async function issueTokenPair(app, reply, config, userId) {

    const accessToken = signAccessToken(userId, config.jwtSecret)
    const { raw, hash, expiresAt } = generateRefreshToken()

    await app.db.refreshTokens.create({
        data: { userId, tokenHash: hash, expiresAt }
    })

    // once u created set the tokens in cookies and send it with reply
    // reply represents the HTTP response that will be sent to the browser.

    reply.setCookie('accessToken', accessToken, accessCookieOpts(config))
    reply.setCookie('refreshToken', raw, refreshCookiesOpts(config))

}
