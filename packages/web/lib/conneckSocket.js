import {io} from 'socket.io-client'
/* io is the main instance of the socket server */

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL
export function connectSocket (){
    return io(REALTIME_URL, {
        /*it takes credentials from user browser where it takes cookies and establishes a conneciton   */
        withCredentials:true,
        autoConnect:true
    })
}