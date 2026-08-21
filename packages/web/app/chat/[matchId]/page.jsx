'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/authContext'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { connectSocket } from '@/lib/connectSocket'
import { Button } from '@/components/user_interface/Button'
import { ActionMenu, ActionMenuItem } from '@/components/ActionMenu'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ReportModal } from '@/components/ReportModal'
import { LocationShareModal } from '@/components/LocationShareModal'
import { VerifiedLayout } from '@/components/VerifiedLayout'


const TYPING_DEBOUNCE_MS = 1500

function ChatPageContent() {
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
    const [confirmBlock, setConfirmBlock] = useState(false)
    const [confirmUnmatch, setConfirmUnmatch] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [locationShareOpen, setLocationShareOpen] = useState(false)




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

        api.get(`/matches/${matchId}`).then((match) => setOtherUser(match?.otherUser ?? null))

        api.get(`/matches/${matchId}/messages`).then((data) => {
            setMessages(data.messages)
            setHasMoreHistory(data.hasMore)
            // the message we get is in order of older to newer. so we set the older message id so that we can even get message above this id
            if (data.messages.length > 0) setOldestLoadedId(data.messages[0].id)

        })
        api.get(`/matches/${matchId}/icebreaker`).then((data) => {
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
            setMessages((prev) => prev.map((m) =>
            (m.senderId === user.id ?
                { ...m, readAt: m.readAt ?? new Date().toISOString() } : m)))
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

    const loadOlderMessages = useCallback(async function () {
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
        setInput(iceBreaker);
        setIceBreaker(null);
    };


    /* Handle Block */
    const handleBlock = async () => {
        /* When Blocked it ends the match also from backend side */
        await api.post('/safety/block', { userId: otherUser.userId })
        router.push('/matches')
    }

    /* Handle Unmatch */
    const handleUnmatch = async () => {
        await api.post(`/matches/${matchId}/unmatch`, {})
        router.push('/matches')
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-ink">
            <header className="flex items-center gap-3 border-b border-cream/8 px-5 py-4">
                <Link href="/matches" className="text-cream-dim hover:text-cream" aria-label="Back to matches">
                    ←
                </Link>
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-dusk-light">
                    {otherUser?.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={otherUser.photos[0].url} alt={otherUser.displayName} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-cream-dim">
                            {otherUser?.displayName?.[0] ?? '?'}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-display text-[16px] text-cream">{otherUser?.displayName ?? 'Loading…'}</p>
                    <p className="font-mono text-[11px] text-cream-dim">
                        {partnerTyping ? 'typing…' : partnerOnline ? 'online' : ''}
                    </p>
                </div>

                <ActionMenu
                    trigger={
                        <button aria-label="More options" className="flex h-9 w-9 items-center justify-center rounded-full text-cream-dim hover:text-cream">
                            ⋯
                        </button>
                    }
                >
                    <ActionMenuItem onClick={() => setLocationShareOpen(true)}>Share my location</ActionMenuItem>
                    <ActionMenuItem onClick={() => setReportOpen(true)}>Report</ActionMenuItem>
                    <ActionMenuItem onClick={() => setConfirmBlock(true)} danger>Block</ActionMenuItem>
                    <ActionMenuItem onClick={() => setConfirmUnmatch(true)} danger>Unmatch</ActionMenuItem>
                </ActionMenu>
            </header>

            {connectionError && (
                <p className="bg-sindoor/10 px-5 py-2 text-center text-[13px] text-sindoor-light">{connectionError}</p>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">
                {hasMoreHistory && (
                    <button onClick={loadOlderMessages} className="mb-4 w-full text-center font-mono text-[11px] uppercase tracking-wide text-cream-dim hover:text-marigold">
                        Load earlier messages
                    </button>
                )}

                <div className="flex flex-col gap-2">
                    {messages.map((message) => {
                        const mine = message.senderId === user.id;
                        return (
                            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[15px] ${mine ? 'bg-gradient-to-r from-sindoor to-marigold text-ink' : 'bg-dusk-light text-cream'
                                        }`}
                                >
                                    {message.content}
                                    {mine && (
                                        <span className="ml-2 font-mono text-[10px] opacity-60">{message.readAt ? '✓✓' : '✓'}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messageEndRef} />
            </div>

            {icebreaker && (
                <button
                    onClick={useIcebreaker}
                    className="mx-5 mb-3 rounded-2xl border border-marigold/30 bg-marigold/10 px-4 py-3 text-left text-[14px] text-cream-dim transition-colors hover:border-marigold/60"
                >
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-marigold">Suggested opener</span>
                    {icebreaker}
                </button>
            )}

            <form onSubmit={sendMessage} className="flex items-center gap-3 border-t border-cream/8 px-5 py-4">
                <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Write something…"
                    className="flex-1 rounded-full border border-cream/10 bg-dusk-light px-5 py-3 text-[15px] text-cream outline-none focus:border-marigold/60"
                />
                <Button type="submit" variant="primary" disabled={!input.trim() || sending}>
                    Send
                </Button>
            </form>

            <ConfirmModal
                open={confirmBlock}
                title={`Block ${otherUser?.displayName ?? 'this person'}?`}
                description="They won't be able to see your profile or message you again. This also ends your current match."
                confirmLabel="Block"
                onConfirm={() => { setConfirmBlock(false); handleBlock(); }}
                onCancel={() => setConfirmBlock(false)}
            />
            <ConfirmModal
                open={confirmUnmatch}
                title="Unmatch?"
                description="This ends your conversation. You won't see each other in Discover again."
                confirmLabel="Unmatch"
                onConfirm={() => { setConfirmUnmatch(false); handleUnmatch(); }}
                onCancel={() => setConfirmUnmatch(false)}
            />
            <ReportModal
                open={reportOpen}
                reportedUserId={otherUser?.userId}
                onClose={() => setReportOpen(false)}
            />
            <LocationShareModal open={locationShareOpen} onClose={() => setLocationShareOpen(false)} />
        </main>
    );
}

export default function ChatPage() {
    return (
        <VerifiedLayout>
            <ChatPageContent />
        </VerifiedLayout>
    )
}