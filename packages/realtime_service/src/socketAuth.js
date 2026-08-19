import jwt from 'jsonwebtoken'
import cookie from 'cookie'

// it verifies the auth jwt and if verified then attach userId to socket
export function createSocketAuthMiddleware(config, logger) {

    // we return another fxn
    return async (socket, next) => {

        try {
            const rawcookie = socket.handshake.headers.cookie
            if (!rawcookie) {
                return next(new Error('Authentication required - no cookies sent'))
            }

            const parsed = cookie.parse(rawcookie)
            const token = parsed.accessToken

            if (!token) {
                return next(new Error('Authentication required - no access token'));
            }

            //   jwt.verify() returns the decoded JWT payload if the token is valid.
            const payload = jwt.verify(token, config.jwtSecret)
            const user = payload.sub
            socket.userId = user;

            next()
        } catch (err) {
            logger.warn({ err: err.message }, 'Socket auth failed');
            next(new Error('Invalid or expired token'));
        }
    }
}

/**
 * Verification status check middleware for realtime connections
 * Ensures only VERIFIED or UNDER_REVIEW users can access chat features
 */
export function createVerificationSocketMiddleware(prisma, logger) {
    return async (socket, next) => {
        try {
            if (!socket.userId) {
                return next(new Error('User ID not found on socket'));
            }

            const profile = await prisma.profile.findUnique({
                where: { userId: socket.userId },
                select: { verificationStatus: true }
            });

            const status = profile?.verificationStatus ?? 'NO_PROFILE';

            // Attach verification status to socket for downstream handlers
            socket.verificationStatus = status;

            // Block PENDING, REJECTED, REVERIFICATION_REQUIRED, NO_PROFILE
            // Allow VERIFIED and UNDER_REVIEW
            const allowedStatuses = ['VERIFIED', 'UNDER_REVIEW'];
            if (!allowedStatuses.includes(status)) {
                return next(new Error(`VERIFICATION_REQUIRED: ${status}`));
            }

            next();
        } catch (err) {
            logger.error({ err: err.message, userId: socket.userId }, 'Verification check failed');
            next(new Error('Verification check failed'));
        }
    };
}