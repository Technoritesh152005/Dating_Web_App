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

        Promise.all([
            api.get(`/matches/${matchId}`),
            api.get(`/matches/${matchId}/messages`),
        ]).then(([match, data]) => {
            setOtherUser(match?.otherUser ?? null)
            setMessages(data.messages)
            setHasMoreHistory(data.hasMore)
            if (data.messages.length > 0) setOldestLoadedId(data.messages[0].id)
            if (match.iceBreakerSuggestion) setIceBreaker(match.iceBreakerSuggestion)
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
        socket.on('new-msg', (message) => {
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
        <main className="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(119,58,73,0.42),_transparent_25%),linear-gradient(180deg,_#1d0d13_0%,_#140911_100%)] text-cream">
            <header className="flex items-center gap-3 border-b border-white/10 bg-black/10 px-5 py-4 backdrop-blur-sm">
                <Link href="/matches" className="text-cream-dim transition hover:text-cream" aria-label="Back to matches">
                    ←
                </Link>
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-dusk-light shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
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
                    <p className="font-display text-[17px] text-cream">{otherUser?.displayName ?? 'Loading…'}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim">
                        {partnerTyping ? 'typing…' : partnerOnline ? 'online' : 'away'}
                    </p>
                </div>

                <ActionMenu
                    trigger={
                        <button aria-label="More options" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cream-dim transition hover:border-marigold/40 hover:text-cream">
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

            <div className="relative flex-1 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(240,162,2,0.12),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(230,57,80,0.12),_transparent_24%)]" />
                <div className="relative flex h-full flex-col overflow-hidden px-5 py-4">
                    <div className="flex-1 overflow-y-auto overscroll-contain pb-2 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {hasMoreHistory && (
                            <button onClick={loadOlderMessages} className="mb-4 w-full text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim transition hover:text-marigold">
                                Load earlier messages
                            </button>
                        )}

                        <div className="flex flex-col gap-2.5">
                            {messages.map((message) => {
                                const mine = message.senderId === user.id;
                                return (
                                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[78%] rounded-[1.4rem] px-4 py-2.5 text-[15px] leading-relaxed shadow-[0_14px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm ${mine ? 'bg-gradient-to-r from-[#f04f65] via-[#e96d45] to-[#f0a202] text-[#1b0e14] shadow-[0_14px_25px_rgba(240,120,70,0.35)]' : 'border border-white/8 bg-white/5 text-cream'} `}
                                        >
                                            <span className="break-words">{message.content}</span>
                                            {mine && (
                                                <span className="ml-2 align-middle font-mono text-[9px] opacity-70">{message.readAt ? '✓✓' : '✓'}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div ref={messageEndRef} />
                    </div>

                    {iceBreaker && (
                        <button
                            onClick={useIcebreaker}
                            className="mb-3 rounded-[1.25rem] border border-marigold/40 bg-[linear-gradient(135deg,rgba(240,162,2,0.18),rgba(230,57,80,0.08))] px-4 py-3 text-left text-[14px] text-cream ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:border-marigold/70"
                        >
                            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-marigold">Suggested opener</span>
                            <span className="text-cream-dim">{iceBreaker}</span>
                        </button>
                    )}

                    <form onSubmit={sendMessage} className="mt-2 flex items-center gap-3 rounded-[1.4rem] border border-white/8 bg-[#2b1620]/80 p-2 shadow-[0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Write something…"
                            className="flex-1 rounded-full border border-transparent bg-[#1d0d13]/70 px-4 py-3 text-[15px] text-cream placeholder:text-cream/45 outline-none transition focus:border-marigold/50"
                        />
                        <Button type="submit" variant="primary" disabled={!input.trim() || sending} className="h-11 rounded-full px-5 text-[14px]">
                            Send
                        </Button>
                    </form>
                </div>
            </div>

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