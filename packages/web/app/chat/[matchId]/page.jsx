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
import { presignAndUpload } from '@/lib/uploadS3'


const TYPING_DEBOUNCE_MS = 1500
const CHAT_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

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
    const [attachment, setAttachment] = useState(null)
    const [uploadingAttachment, setUploadingAttachment] = useState(false)
    const [attachmentError, setAttachmentError] = useState(null)
    const[scamWarning, setScamWarning] = useState(null)
    const [scamConsent, setScamConsent] = useState(null)
    const [scamConsentLoading, setScamConsentLoading] = useState(true)
    const [consentSaving, setConsentSaving] = useState(false)




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

        let iceBreakerPoll
        setScamConsentLoading(true)

        Promise.all([
            api.get(`/matches/${matchId}`),
            api.get(`/matches/${matchId}/messages`),
            api.get(`/matches/${matchId}/scam-consent`),
        ]).then(([match, data, consentResult]) => {
            setOtherUser(match?.otherUser ?? null)
            setMessages(data.messages)
            setHasMoreHistory(data.hasMore)
            if (data.messages.length > 0) setOldestLoadedId(data.messages[0].id)
            setScamConsent(consentResult.consent ?? null)
            if (match.iceBreakerSuggestion) {
                setIceBreaker(match.iceBreakerSuggestion)
                return
            }

            // Icebreakers are generated asynchronously after a match is created.
            iceBreakerPoll = window.setInterval(async () => {
                try {
                    const updatedMatch = await api.get(`/matches/${matchId}`)
                    if (updatedMatch.iceBreakerSuggestion) {
                        setIceBreaker(updatedMatch.iceBreakerSuggestion)
                        window.clearInterval(iceBreakerPoll)
                    }
                } catch (error) {
                    console.error('Icebreaker refresh failed:', error)
                }
            }, 5000)
        }).finally(() => setScamConsentLoading(false))

        return () => window.clearInterval(iceBreakerPoll)
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

        if ((!content && !attachment) || sending || uploadingAttachment || !socketRef.current) return

        setSending(true)
        /* after server processing call this callback with the result */
        socketRef.current.emit('send-message', { matchId, content, attachment }, (response) => {
            setSending(false)
            if (response.ok) {
                setInput('')
                setAttachment(null)
            } else {
                setConnectionError(response.error)
            }
        })
    }

    const handleAttachmentSelect = async (file) => {
        if (!file) return
        setAttachmentError(null)
        setUploadingAttachment(true)

        try {
            const { key, publicUrl } = await presignAndUpload({
                file,
                presignPath: '/media/chat/presign',
                allowedTypes: CHAT_FILE_TYPES,
                maxFileSize: 10 * 1024 * 1024,
            })
            setAttachment({ url: publicUrl, key, name: file.name, type: file.type, size: file.size })
        } catch (error) {
            setAttachmentError(error.message || 'Could not upload this file')
        } finally {
            setUploadingAttachment(false)
        }
    }

    const refreshScamWarning = async()=>{

        try{
           const response =  await api.get(`/matches/${matchId}/scam-warning`)
           setScamWarning((response.warning?? null))
        }catch(error){
            console.error('Scam warning refresh failed')
        }
    }

    const saveScamConsent = async (consent) => {
        setConsentSaving(true)
        try {
            await api.post(`/matches/${matchId}/scam-consent`, { consent })
            setScamConsent(consent)
        } catch (error) {
            setConnectionError(error.message || 'Could not save safety preference')
        } finally {
            setConsentSaving(false)
        }
    }

    useEffect(() => {
        if (loading || !user) return

        refreshScamWarning()
        const scamWarningPoll = window.setInterval(refreshScamWarning, 15000)

        return () => window.clearInterval(scamWarningPoll)
    }, [loading, user, matchId])

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

            {!scamConsentLoading && scamConsent === null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-5 backdrop-blur-sm">
                    <section className="w-full max-w-md rounded-card border border-marigold/30 bg-dusk p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">Safety check</p>
                        <h2 className="mt-2 font-display text-2xl text-cream">Help us spot scam signals</h2>
                        <p className="mt-3 text-[14px] leading-relaxed text-cream-dim">
                            If both people allow it, recent text messages in this chat will be analyzed by our safety system for patterns like money requests, crypto pressure, urgency, or attempts to move off-platform. Messages are sent to Groq for this analysis and are not used to train our app models or routinely reviewed by developers. Results may be wrong.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                            <Button variant="primary" onClick={() => saveScamConsent(true)} disabled={consentSaving} className="flex-1">
                                {consentSaving ? 'Saving…' : 'Allow safety analysis'}
                            </Button>
                            <Button variant="secondary" onClick={() => saveScamConsent(false)} disabled={consentSaving} className="flex-1">
                                Not now
                            </Button>
                        </div>
                    </section>
                </div>
            )}

            {scamWarning && (
                <div className="flex items-start gap-3 border-b border-marigold/30 bg-marigold/10 px-5 py-3 text-[13px] text-cream">
                    <span className="mt-0.5 text-marigold" aria-hidden="true">!</span>
                    <p className="flex-1">
                        Be careful. This conversation may contain scam warning signs. Never send money, crypto, gift cards, passwords, or verification codes.
                    </p>
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await api.post(`/matches/${matchId}/scam-warning/dismiss`, {})
                                setScamWarning(null)
                            } catch (error) {
                                console.error('Scam warning dismissal failed:', error)
                            }
                        }}
                        className="rounded-full border border-cream/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cream-dim transition hover:border-cream/50 hover:text-cream"
                    >
                        Dismiss
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmBlock(true)}
                        className="rounded-full border border-sindoor/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-sindoor-light transition hover:bg-sindoor/15"
                    >
                        Block
                    </button>
                </div>
            )}

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
                                            {message.attachmentUrl && (
                                                message.attachmentType?.startsWith('image/') ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={message.attachmentUrl} alt={message.attachmentName || 'Shared image'} className="mb-2 max-h-64 max-w-full rounded-xl object-cover" />
                                                ) : (
                                                    <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mb-2 block max-w-[220px] truncate rounded-lg border border-current/20 px-3 py-2 text-sm underline underline-offset-2">
                                                        {message.attachmentName || 'Shared PDF'}
                                                    </a>
                                                )
                                            )}
                                            {message.content && <span className="break-words">{message.content}</span>}
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

                    {attachmentError && <p className="mb-2 text-center text-[12px] text-sindoor-light">{attachmentError}</p>}
                    {attachment && (
                        <div className="mb-2 flex items-center justify-between rounded-xl border border-marigold/30 bg-marigold/10 px-3 py-2 text-xs text-cream-dim">
                            <span className="max-w-[80%] truncate">{attachment.name}</span>
                            <button type="button" onClick={() => setAttachment(null)} className="text-cream transition hover:text-sindoor-light" aria-label="Remove attachment">×</button>
                        </div>
                    )}
                    <form onSubmit={sendMessage} className="mt-2 flex items-center gap-2 rounded-[1.4rem] border border-white/8 bg-[#2b1620]/80 p-2 shadow-[0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                        <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-cream-dim transition hover:border-marigold/50 hover:text-marigold" aria-label="Attach image or PDF">
                            <span aria-hidden="true">+</span>
                            <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploadingAttachment || sending} onChange={(e) => { handleAttachmentSelect(e.target.files?.[0]); e.target.value = '' }} />
                        </label>
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Write something…"
                            className="flex-1 rounded-full border border-transparent bg-[#1d0d13]/70 px-4 py-3 text-[15px] text-cream placeholder:text-cream/45 outline-none transition focus:border-marigold/50"
                        />
                        <Button type="submit" variant="primary" disabled={(!input.trim() && !attachment) || sending || uploadingAttachment} className="h-11 rounded-full px-5 text-[14px]">
                            {uploadingAttachment ? 'Uploading…' : 'Send'}
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