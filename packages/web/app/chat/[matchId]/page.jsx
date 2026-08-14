'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/authContext'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { connectSocket } from '@/lib/conneckSocket'
import { Button } from '@/components/user_interface/Button'

const TYPINF_DEBOUNCE = 1500

export default function chatPage() {
    const { matchId } = useParams()
    const { user, loading } = useAuth()
    const router = useRouter()

    const [otherUser, setOtherUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [oldestLoadedId, setOldestLoadedId] = useState(null)
    const [hasMoreHistory, setHasMoreHistory] = useState(null)
    const [iceBreaker, setIceBreaker] = useState(null)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [partnerOnline, setPartnerOnline] = useState(false)
    const [partnerTyping, setPartnerTyping] = useState(false)
    const [connectionError, setConnectionError] = useState(null)

    // Keep the same socket instance available across renders without causing renders.
    const socketRef = useRef(null)
    /* u add this ref of last message to dom so that when u reach this position till then u can do smooth scroll and then u stop her */
    const messageEndRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    /* This useEffect handles the matches navigation like getting messages , getting other matches user profile maybe we can say profile of partner */
    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }

        const match = api.get('/matches/:matchId', matchId)
        setOtherUser(match?.otherUser ?? null)

        api, get(`/matches/${matchId}/messages`).then((data) => {
            setMessages(data.messages)
            setHasMoreHistory(data.hasMore)
            // the message we get is in order of older to newer. so we set the older message id so that we can even get message above this id
            if (data.messages.length > 0) setOldestLoadedId(data.messages[0].id)

        })
        api.get(`'/matches${matchId}/icebreaker`).then((data) => {
            if (data.ready) setIceBreaker(data.iceBreakerSuggestion)
        })
    }, [loading, user, matchId, router])

    /* this is to maintains socket lifecycle */
    useEffect(() => {
        if (loading || !user) return

        const socket = connectSocket()
        socketRef.current = socket
        //"When the Socket.IO client receives the connect event from the Socket.IO system, execute this function."
        socket.on('connect', () => {

            //send this to sockt .io server along with dara
            socket.emit('join-match', { matchId }, (response) => {
                if (!response.ok) {
                    setConnectionError(response.error)
                }
                // More precisely, Socket.IO server creates/uses a room identified by the matchId, and the user's socket joins that room.
                setPartnerOnline(response.partnerOnline)
                socket.emit('mark-read', { matchId })
            })
        })

        /* .on means listen for an event.. also these r built in event names */
        socket.on('connect_error', () => {
            setConnectionError('Could not connet to chat - check your connection')
        })

        /* this is the event listened from client to server */
        /* this listen event coming from client to server and set the new message it receives */
        /* before broadcasting to sender message, check the duplicates msg and emit the event as read the message */
        socket.on('new-messages', (message) => {
            setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
            if (message.senderId !== user.id) {
                socket.emit('mark-read', { matchId })
            }
        })

        //this listen for event where user is typing to show typing indicator
        socket.on('user-typing', ({ userId }) => {

            if (userId === user.id) return /* never show our own typing back to ourselves */
            setPartnerTyping(true)
            //if user starts tpins clear the old timoeout and add new timeout
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
        })

        socket.on('presence-changes', ({ online }) => {
            setPartnerOnline(online)
        })

        socket.on('messages-read', () => {
            //map through all message and check sender id of meesga eis it user only
            //if message is of logged in user then only show his message whether that message has been read or not 
            setMessages((prev) => prev.map((e) =>
            (e.senderId === user.id ?
                /* only update the timestamp whose message is of logged in user.. and also once check whether readAt has been updated or not */
                { ...m, readAt: m.readAt ?? new Date().toISOString() } : e)))
        })

        return () => {
            clearTimeout(typingTimeoutRef.current);
            socket.disconnect();
        };
    }, [loading, user, matchId])

    /* whenever u get  a new message its message end ref changes */
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages])

    const loadOlderMessages = usecallback(async function () {
        if (!oldestLoadedId) return
        const data = await api.get(`/matches/${matchId}/messages?before=${oldestLoadedId}`)
        /* this loads older message which we got now and then comes the remaining essage which were in stack / array */
        setMessages((prev) => [...data.messages, ...prev])
        setHasMoreHistory(data.hasMore)
        if (data.messages.length > 0) setOldestLoadedId(data.messages[0].id);
    }, [matchId, oldestLoadedId])

    /* whenever user is typing it sends an emit showing typing */
    const handleInputChange = (e) => {
        setInput(e.target.value)
        socketRef.current?.emit('typing', { matchId })
    }

    const sendMessage = (e) => {
        /* tells browser to stops its executing default builtin behaviour for a specific element when an event occurs */
        e.preventDefault()
        const content = input.trim()

        if (!content || sending || !socketRef.current) return

        setSending(true)
        /* after server processing call this callback with the result */
        socketRef.current.emit('send-message', { matchId, content }, (response) => {
            setSending(false)
            if (response.ok) {
                setInput('')
            } else {
                setConnectionError(response.error)
            }
        })
    }

    const useIcebreaker = () => {
        setInput(icebreaker);
        setIcebreaker(null);
    };
}