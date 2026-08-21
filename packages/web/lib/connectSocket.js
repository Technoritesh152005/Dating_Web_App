import { io } from 'socket.io-client'
/* io is the main instance of the socket server */

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:4001'

export function connectSocket() {
    if (!REALTIME_URL) {
        throw new Error('NEXT_PUBLIC_REALTIME_URL is not configured')
    }

    return io(REALTIME_URL, {
        /* it takes credentials from user browser where it takes cookies and establishes a connection */
        withCredentials: true,
        autoConnect: true,
        // Reconnection configuration for production reliability
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    })
}