'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/authContext'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCheck, Heart, ImagePlus, MapPin, MoreVertical, Send, Sparkles, Volume2, X } from 'lucide-react'
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
import { formatLastSeen } from '@/lib/formatLastSeen'

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
    const [lastSeenAt, setLastSeenAt] = useState(null)
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
    const [icebreakerSpeaking, setIcebreakerSpeaking] = useState(false)




    // Keep the same socket instance available across renders without causing renders.
    const socketRef = useRef(null)
    /* u add this ref of last message to dom so that when u reach this position till then u can do smooth scroll and then u stop her */
    const messageEndRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    useEffect(() => {
        const previewUrl = attachment?.previewUrl
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [attachment?.previewUrl])

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
            setLastSeenAt(match?.lastSeenAt ?? null)
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
        const presenceHeartbeat = window.setInterval(() => {
            if (socket.connected) socket.emit('presence-heartbeat')
        }, 20_000)
        //"When the Socket.IO client receives the connect event from the Socket.IO system, execute this function."
        socket.on('connect', () => {
            socket.emit('presence-heartbeat')

            //send this to sockt .io server along with dara
            socket.emit('join-match', { matchId }, (response) => {
                if (!response?.ok) {
                    setConnectionError(response?.error || 'Could not join this conversation')
                    return
                }
                // More precisely, Socket.IO server creates/uses a room identified by the matchId, and the user's socket joins that room.
                setPartnerOnline(Boolean(response.partnerOnline))
                setLastSeenAt(response.lastSeenAt ?? null)
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

        socket.on('presence-changes', ({ online, lastSeenAt: updatedLastSeenAt }) => {
            setPartnerOnline(Boolean(online))
            if (updatedLastSeenAt) setLastSeenAt(updatedLastSeenAt)
        })

        socket.on('messages-read', () => {
            setMessages((prev) => prev.map((m) =>
            (m.senderId === user.id ?
                { ...m, readAt: m.readAt ?? new Date().toISOString() } : m)))
        })

        return () => {
            window.clearInterval(presenceHeartbeat)
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
        const messageAttachment = attachment && {
            url: attachment.url,
            key: attachment.key,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
        }
        setConnectionError(null)
        /* after server processing call this callback with the result */
        socketRef.current.emit('send-message', {
            matchId,
            content,
            attachment: attachment ? messageAttachment : null,
        }, (response) => {
            setSending(false)
            if (response.ok) {
                if (response.message) {
                    setMessages((prev) => prev.some((message) => message.id === response.message.id)
                        ? prev
                        : [...prev, response.message])
                }
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
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null

        try {
            const { key, publicUrl } = await presignAndUpload({
                file,
                presignPath: '/media/chat/presign',
                allowedTypes: CHAT_FILE_TYPES,
                maxFileSize: 10 * 1024 * 1024,
            })
            setAttachment({ url: publicUrl, key, name: file.name, type: file.type, size: file.size, previewUrl })
        } catch (error) {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
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

    const speakIcebreaker = () => {
        if (!iceBreaker || !('speechSynthesis' in window)) return
        window.speechSynthesis.cancel()
        if (icebreakerSpeaking) {
            setIcebreakerSpeaking(false)
            return
        }
        const utterance = new SpeechSynthesisUtterance(iceBreaker)
        utterance.lang = 'en-IN'
        utterance.onstart = () => setIcebreakerSpeaking(true)
        utterance.onend = () => setIcebreakerSpeaking(false)
        utterance.onerror = () => setIcebreakerSpeaking(false)
        window.speechSynthesis.speak(utterance)
    }


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
            <main className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#918781]">Loading your conversation…</p>
            </main>
        );
    }

    return (
        <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(ellipse_at_24%_18%,rgba(237,89,100,0.10),transparent_38%),radial-gradient(ellipse_at_78%_75%,rgba(244,196,48,0.13),transparent_34%),linear-gradient(135deg,#fcfaf7_0%,#f7f1ec_100%)] text-[#292321]">
            <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-[#f8dede]/70 blur-3xl" />
            <header className="relative z-30 flex shrink-0 items-center gap-3 border-b border-[#eadfd8]/80 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-7">
                <Link href="/matches" className="flex h-10 shrink-0 items-center gap-2 rounded-full px-2 text-[#71655f] transition hover:bg-[#f8f4f0] hover:text-[#e95161]" aria-label="Back to matches">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="hidden text-sm font-semibold sm:inline">Matches</span>
                </Link>
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#f7dedf] shadow-sm">
                    {otherUser?.photos?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={otherUser.photos[0].url}
                            alt={otherUser.displayName}
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-[#9d4c50]">
                            {otherUser?.displayName?.[0] ?? '?'}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold text-[#292321]">{otherUser?.displayName ?? 'Loading…'}</p>
                    {partnerTyping ? (
                        <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-[#e95161]">
                            <span>typing</span>
                            <span className="flex items-center gap-0.5 pt-1">
                                <span className="h-1 w-1 animate-bounce rounded-full bg-[#e95161]" style={{ animationDelay: '0ms' }} />
                                <span className="h-1 w-1 animate-bounce rounded-full bg-[#e95161]" style={{ animationDelay: '150ms' }} />
                                <span className="h-1 w-1 animate-bounce rounded-full bg-[#e95161]" style={{ animationDelay: '300ms' }} />
                            </span>
                        </div>
                    ) : partnerOnline ? (
                        <p className="flex items-center gap-1.5 font-sans text-xs font-medium text-[#33845a]">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-[#48a875]" />
                            <span>Online now</span>
                        </p>
                    ) : (
                        <p className="text-xs text-[#918781]">{formatLastSeen(lastSeenAt)}</p>
                    )}
                </div>

                <ActionMenu
                    trigger={
                        <button type="button" aria-label="More chat options" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfd8] bg-white/80 text-[#71655f] transition hover:border-[#edc0c3] hover:bg-[#fff0f1] hover:text-[#e95161]">
                            <MoreVertical className="h-5 w-5" />
                        </button>
                    }
                >
                    <ActionMenuItem onClick={() => setLocationShareOpen(true)}><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />Share my location</span></ActionMenuItem>
                    <ActionMenuItem onClick={() => setReportOpen(true)}>Report</ActionMenuItem>
                    <ActionMenuItem onClick={() => setConfirmBlock(true)} danger>Block</ActionMenuItem>
                    <ActionMenuItem onClick={() => setConfirmUnmatch(true)} danger>Unmatch</ActionMenuItem>
                </ActionMenu>
            </header>

            {!scamConsentLoading && scamConsent === null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292321]/35 px-5 backdrop-blur-sm">
                    <section className="w-full max-w-md rounded-[28px] border border-[#eadfd8] bg-white p-6 shadow-[0_24px_80px_rgba(41,35,33,0.2)]">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#e95161]">Safety check</p>
                        <h2 className="mt-2 font-display text-2xl text-[#292321]">Help us spot scam signals</h2>
                        <p className="mt-3 text-sm leading-relaxed text-[#71655f]">
                            If both people allow it, recent text messages in this chat will be analyzed by our safety system for patterns like money requests, crypto pressure, urgency, or attempts to move off-platform. Messages are sent to Groq for this analysis and are not used to train our app models or routinely reviewed by developers. Results may be wrong.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                            <Button variant="primary" onClick={() => saveScamConsent(true)} disabled={consentSaving} className="!flex-1 !bg-[#e95161] !text-white hover:!bg-[#d94355]">
                                {consentSaving ? 'Saving…' : 'Allow safety analysis'}
                            </Button>
                            <Button variant="secondary" onClick={() => saveScamConsent(false)} disabled={consentSaving} className="!flex-1 !border-[#eadfd8] !bg-[#f8f4f0] !text-[#655d58] hover:!bg-[#f1eae4]">
                                Not now
                            </Button>
                        </div>
                    </section>
                </div>
            )}

            {scamWarning && (
                <div className="relative z-10 flex items-start gap-3 border-b border-[#ead8b2] bg-[#fff9e9] px-5 py-3 text-[13px] text-[#514944]">
                    <span className="mt-0.5 text-[#bd8a21]" aria-hidden="true">!</span>
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
                        className="rounded-full border border-[#e6d8c6] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#71655f] transition hover:border-[#cbb8a4] hover:text-[#292321]"
                    >
                        Dismiss
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmBlock(true)}
                        className="rounded-full border border-[#f1c7c9] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#b73946] transition hover:bg-[#fff0f1]"
                    >
                        Block
                    </button>
                </div>
            )}

            {connectionError && (
                <p role="status" className="relative z-10 bg-[#fff0f1] px-5 py-2 text-center text-[13px] text-[#a33c48]">{connectionError}</p>
            )}

            <div className="relative flex-1 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(237,89,100,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(244,196,48,0.10),_transparent_28%)]" />
                <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden px-4 py-4 sm:px-7">
                    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 pr-2">
                        {hasMoreHistory && (
                            <button type="button" onClick={loadOlderMessages} className="mb-5 w-full rounded-full border border-[#eadfd8] bg-white/70 py-2.5 text-center text-xs font-semibold text-[#71655f] transition hover:border-[#edc0c3] hover:text-[#e95161]">
                                Load earlier messages
                            </button>
                        )}

                        {messages.length === 0 && (
                            <div className="mx-auto my-12 max-w-xs text-center">
                                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f1] text-[#e95161]">
                                    <Heart className="h-5 w-5" />
                                </span>
                                <p className="mt-4 font-display text-xl text-[#332d29]">A lovely place to start</p>
                                <p className="mt-1 text-sm text-[#827871]">Send a hello and let the conversation unfold.</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {messages.map((message) => {
                                const mine = message.senderId === user.id;
                                return (
                                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[84%] rounded-[1.35rem] px-3.5 py-3 text-[15px] leading-relaxed shadow-[0_10px_28px_-18px_rgba(41,35,33,0.28)] sm:max-w-[72%] ${mine ? 'rounded-br-md bg-[#e95161] text-white' : 'rounded-bl-md border border-[#eadfd8] bg-white/90 text-[#332d29]'}`}
                                        >
                                            {message.attachmentUrl && (
                                                message.attachmentType?.startsWith('image/') ? (
                                                    <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={message.attachmentUrl}
                                                            alt={message.attachmentName || 'Shared image'}
                                                            loading="lazy"
                                                            className="block max-h-80 w-full min-w-32 rounded-xl object-cover"
                                                        />
                                                    </a>
                                                ) : (
                                                    <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mb-2 block max-w-[240px] truncate rounded-xl border border-current/20 bg-white/15 px-3 py-2.5 text-sm font-medium underline underline-offset-2">
                                                        {message.attachmentName || 'Shared PDF'}
                                                    </a>
                                                )
                                            )}
                                            {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                                            <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/75' : 'text-[#918781]'}`}>
                                                <time dateTime={message.createdAt}>
                                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                </time>
                                                {mine && (message.readAt ? <CheckCheck className="h-3.5 w-3.5" /> : <span aria-label="Sent">✓</span>)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div ref={messageEndRef} />
                    </div>

                    {iceBreaker && (
                        <div className="mb-3 flex items-start gap-3 rounded-[1.25rem] border border-[#f1d8ba] bg-[linear-gradient(135deg,rgba(255,244,226,0.95),rgba(255,240,241,0.75))] px-4 py-3">
                            <button type="button" onClick={useIcebreaker} className="flex-1 text-left text-sm text-[#514944] transition hover:text-[#292321]">
                                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#bd8a21]"><Sparkles className="h-3.5 w-3.5" />Suggested opener</span>
                                <span>{iceBreaker}</span>
                            </button>
                            <button type="button" onClick={speakIcebreaker} aria-label={icebreakerSpeaking ? 'Stop speaking icebreaker' : 'Speak icebreaker'} className="mt-1 rounded-full p-2 text-[#bd8a21] transition hover:bg-white/70 hover:text-[#8c6416]">
                                <Volume2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {attachmentError && <p role="alert" className="mb-2 text-center text-xs text-[#b73946]">{attachmentError}</p>}
                    {uploadingAttachment && <p className="mb-2 text-center text-xs text-[#827871]">Uploading your attachment…</p>}
                    {attachment && (
                        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-[#eadfd8] bg-white/85 p-2.5 text-xs text-[#655d58]">
                            {attachment.previewUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={attachment.previewUrl} alt="Image preview" className="h-14 w-14 rounded-xl object-cover" />
                            )}
                            <span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span>
                            <button type="button" onClick={() => setAttachment(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#827871] transition hover:bg-[#fff0f1] hover:text-[#b73946]" aria-label="Remove attachment">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <form onSubmit={sendMessage} className="mt-2 flex items-center gap-2 rounded-[1.4rem] border border-[#eadfd8] bg-white/90 p-2 shadow-[0_12px_28px_rgba(74,49,39,0.10)] backdrop-blur-sm">
                        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#eee5df] bg-[#f8f4f0] text-[#71655f] transition hover:border-[#edc0c3] hover:bg-[#fff0f1] hover:text-[#e95161]" aria-label="Attach image or PDF">
                            <ImagePlus className="h-5 w-5" />
                            <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploadingAttachment || sending} onChange={(e) => { handleAttachmentSelect(e.target.files?.[0]); e.target.value = '' }} />
                        </label>
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Write something kind…"
                            className="min-w-0 flex-1 rounded-full border border-transparent bg-[#faf7f2] px-4 py-3 text-[15px] text-[#292321] outline-none transition placeholder:text-[#a39a94] focus:border-[#edc0c3] focus:bg-white"
                        />
                        <Button type="submit" variant="primary" disabled={(!input.trim() && !attachment) || sending || uploadingAttachment} className="!h-11 !shrink-0 !bg-[#e95161] !px-4 !text-sm !text-white hover:!bg-[#d94355] sm:!px-5">
                            <span className="flex items-center gap-2"><Send className="h-4 w-4" /><span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span></span>
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