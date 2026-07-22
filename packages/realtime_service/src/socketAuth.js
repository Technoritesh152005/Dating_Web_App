import jwt from 'jsonwebtoken'
import cookie from 'cookie'

// it verifies the auth jwt and if verified then attach userId to socket 
export function createSocketAuthMiddleware(config, logger) {

    // we return another fxn
    return (socket, next) => {

        try {
            const rawcookie = socket.handshake.headers.cookie
            console.log(rawcookie)
            if (!rawcookie) {
                return next(new Error('Authentication required - no cookies sent'))
            }

            const cookie = cookie.parse(rawcookie)
            console.log(cookie)
            const token = cookie.accessToken

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