
import { verifyAccessToken } from '../utils/token.js'
import { createVerificationGuard } from '../plugins/verificationGuard.js'

export function registerAuthDecorator(app, config) {

    app.decorate('authenticate', async (request, reply) => {
        const token = request.cookies?.accessToken

        if (!token) {
            return reply.code(401).send({ error: 'Not Authenticated. Please log in.' })
        }

        try {

            const payload = verifyAccessToken(token, config.jwtSecrets)
            request.userId = payload.sub
        } catch (error) {
            return reply.code(401).send({ error: 'Invalid or expired token' });
        }
    })

    // Middleware that requires user to be VERIFIED (or UNDER_REVIEW) for core dating features
    // Uses the shared verificationGuard with default allowed statuses ['VERIFIED', 'UNDER_REVIEW']
    app.decorate('requireVerification', createVerificationGuard(app))
}
//it is a middleware where we put request id to user
//token ke andar hi user ka maal hota hai yani (userId)