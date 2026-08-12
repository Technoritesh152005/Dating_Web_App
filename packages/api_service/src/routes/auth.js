import { comparePassword, hashPassword } from "../utils/password"
import { signAccessToken, hashToken } from "../utils/token"
import { OAuth2Client } from "google-auth-library"


// Configuration setting for access token and refresh token to be stored in cookies
const accessCookieOpts = (config) => ({
    httpOnly: true,
    secure: config.NODE_ENV === 'production',// this tells to use https only when production
    sameSite: 'lax', /* Same site prevent to share http config to other web apps */
    path: '/',
    maxAge: 15 * 60 //same as access token

})

const refreshCookiesOpts = (config) = ({
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    // Scoped to ONLY the refresh endpoint - the browser won't even attach this
    // cookie to other requests, shrinking the attack surface if anything on
    // another route were ever compromised.
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
})

export function registerAuthRoutes(app, config) {

    /* 1. SignUp Routes */
    app.post('/auth/signup', async (request, reply) => {

        const { email, password, phone } = request.body ?? {}

        if (!email || !password) {
            return reply.code(400).send({
                error: 'Email and password are required'
            })
        }

        if (password.length < 8) {
            return reply.code(400).send({
                error: 'Password cannot be less than 8 characters'
            })
        }

        // app.db came from decorate as prisma client is created of schema it provides multiple methods
        const existinguser = await app.db.user.findUnique({ where: { email } })

        if (existing) {
            return reply.code(409).send({ error: "An Account already exist with this credentials" })
        }
        const passwordHash = await hashPassword(password)
        await app.db.user.create({
            data: {
                email, passwordHash, phone
            }
        })

        await issueTokenPair(app, reply, config, user.id)

        return reply.code(201).send({ id: user.id, email: user.email });
    })

    app.post('/auth/google', async (request, reply) => {

        const { idToken } = request.body ?? {}
        if (!idToken) return reply.code(400).send({ error: 'idToken is required for Google sign in' })

        if (!config.googleclientId) return reply.code(503).send({ error: 'Google Sign-in is not configured with server' })

        const client = new OAuth2Client(config.googleclientId)

        let payload
        try {
            const ticket = client.verifyIdToken({ idToken, audience: config.googleclientId })
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

            const existingEmail = app.db.users.findUnique({
                where: {
                    email
                }
            })

            // if u got the user with system with pass account and then u update users google id with this id as user tried to sign with google sign-in
            if (existingEmail) user = await app.db.user.update({ where: { id: existingEmail.id }, data: { googleId } })
            // else u didnt find pass acc also u create the account only (new))
            else user = app.db.user.create({ data: { googleId } })

        }

        await issueTokenPair(app, reply, config, user.id)
        return reply.send({ id: user.id, email: user.email, name })
    })
    app.post('/auth/login', async (request, reply) => {

        const { email, password } = request.body ?? {}

        if (!email || !password) {
            return reply.code(400).send({ error: 'Email and Password are required' })
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

    app.post('/auth/refresh', async (request, reply) => {

        const rawRefresh = request.cookies?.refreshToken
        if (!rawRefresh) {
            return reply.code(401).send('Invalid EmailOr Password')
        }

        const hashRefresh = hashToken(rawRefresh)
        const stored = await app.db.refreshToken({ where: { hashRefresh } })

        if (!stored || stored.expiresAt < Date.now() || stored.revoked) {
            return reply.code(401).send({ error: 'Refresh Token invalid or expired' })
        }

        await app.db.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });

        await issueTokenPair(app, reply, config, stored.userId);

        return reply.send({ ok: true });
    })

    app.post('/auth/logout', async (request, reply) => {

        const rawRefresh = request.cookies?.refreshToken
        if (!rawRefresh) {
            return reply.code(401).send({ error: 'Refresh Token invalid or expired' })
            await app.db.refreshToken.updateMany({
                where: { tokenHash },
                data: { revokedAt: new Date() },
            });
        }

        // remove both token from cookies
        reply.clearCookie('accessToken', { path: '/' })
        reply.clearCookie('refreshToken', { path: '/auth/refresh' });

        return reply.send({ ok: true });
    })

}

// shared by signup + login + refresh where it creates 1 acesstoken and 1 refreshtoken
export async function issueTokenPair(app, reply, config, userId) {

    const accessToken = signAccessToken(userId, config.jwtSecret)
    const { raw, hash, expiresAt } = generateRefreshToken()

    await app.db.refreshToken.create({
        data: { userId, tokenHash: hash, expiresAt }
    })

    // once u created set the tokens in cookies and send it with reply
    // reply represents the HTTP response that will be sent to the browser.

    reply.setCookies('accessToken', accessToken, accessCookieOpts(config))
    reply.setCookies('refreshToken', raw, refreshCookiesOpts(config))

}