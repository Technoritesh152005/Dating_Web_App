'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { api } from '@/lib/api'
import { ProfileCard } from '@/components/ProfileCard'
import { MatchCelebration as MatchBanner } from '@/components/MatchCelebration'
import { Button } from '@/components/user_interface/Button'
import { NavBar } from '@/components/Navbar'
import { ActionMenu, ActionMenuItem } from '@/components/ActionMenu'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ReportModal } from '@/components/ReportModal'
import { ProfileDetailModal } from '@/components/ProfileDetailModel'
import { LocationShareModal } from '@/components/LocationShareModal'
import { VerifiedLayout } from '@/components/VerifiedLayout'
import { SwipeableCard } from '@/components/SwipeableCard'
import { HeartIcon, SuperLikeIcon, PassIcon, ShieldIcon, SparklesIcon } from '@/components/user_interface/Icons'

const LOW_STACK_THRESHOLD = 3

function DiscoverPageContent() {
    const { user, loading } = useAuth()
    const [stack, setStack] = useState([])
    const [matches, setMatches] = useState([])
    const router = useRouter()
    const [fetching, setFetching] = useState(false)
    const [celebrating, setCelebrating] = useState(null)
    const [swiping, setSwiping] = useState(false)
    const [confirmBlock, setConfirmBlock] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [locationShareOpen, setLocationShareOpen] = useState(false)
    const [viewingDetail, setViewingDetail] = useState(false)
    const [feedError, setFeedError] = useState(null)

    const fetchFeed = useCallback(async () => {
        setFetching(true)
        setFeedError(null)
        try {
            const { profiles } = await api.get('/discovery/feed')
            setStack((prev) => [...prev, ...profiles.filter((p) => !prev.some((existing) => existing.id === p.id))])
        } catch (error) {
            setFeedError(error.message || 'Failed to load profiles')
        } finally {
            setFetching(false)
        }
    }, [])

    const fetchActiveMatches = useCallback(async () => {
        try {
            const res = await api.get('/swipe/matches')
            setMatches(res.matches || res || [])
        } catch {
            // Silently fail if matches fail to fetch
        }
    }, [])

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }
        fetchFeed()
        fetchActiveMatches()
    }, [user, loading, router, fetchFeed, fetchActiveMatches])

    useEffect(() => {
        if (stack.length > 0 && stack.length <= LOW_STACK_THRESHOLD && !fetching) {
            fetchFeed()
        }
    }, [stack.length, fetching, fetchFeed])

    const handleSwipe = async (action) => {
        const current = stack[0]
        if (!current || swiping) return

        setSwiping(true)
        setStack((prev) => prev.slice(1))
        try {
            const result = await api.post('/swipe', { toUserId: current.userId, action })
            if (result.isMatched && result.match) {
                setCelebrating({
                    id: result.match.id,
                    profile: current,
                })
                fetchActiveMatches()
            }
        } catch (error) {
            console.error('Swipe Failed', error)
        } finally {
            setSwiping(false)
        }
    }

    const triggerLoveBurst = (action) => {
        if (action === 'FIRE_LIKE') {
            setCelebrating((prev) => prev ?? { id: 'superlike', profile: stack[0] })
        }
    }

    const handleBlock = async function () {
        const current = stack[0]
        if (!current) return
        await api.post('/safety/block', { userId: current.userId })
        setStack((prev) => prev.slice(1))
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-plum-night">
                <p className="font-mono text-xs uppercase tracking-widest text-pearl-dim">Loading matches...</p>
            </main>
        )
    }

    const topCard = stack[0]
    const nextCard = stack[1]

    return (
        <div className="min-h-screen bg-plum-night text-pearl">
            {/* Top Full-Width Navbar */}
            <NavBar onOpenLocationShare={() => setLocationShareOpen(true)} />

            {celebrating && <MatchBanner match={celebrating} onDismiss={() => setCelebrating(null)} />}

            {/* Main Dual-Wing Container */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr_300px] items-start">

                    {/* LEFT WING: Match Compatibility Insights */}
                    <aside className="hidden lg:flex flex-col gap-5 sticky top-24">
                        {topCard ? (
                            <>
                                <div className="rounded-3xl border border-plum-border bg-plum-surface/90 p-5 shadow-xl backdrop-blur-md">
                                    <div className="flex items-center gap-2 text-saffron">
                                        <SparklesIcon className="h-4 w-4" />
                                        <span className="font-mono text-xs font-bold uppercase tracking-wider">Vibe Match</span>
                                    </div>
                                    <div className="mt-3 flex items-baseline gap-2">
                                        <span className="font-display text-4xl font-bold text-pearl">94%</span>
                                        <span className="font-mono text-xs text-pearl-dim">Compatibility</span>
                                    </div>
                                    <p className="mt-2 text-xs text-pearl-dim leading-relaxed">
                                        High correlation in interests & communication preferences.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-plum-border bg-plum-surface/90 p-5 shadow-xl backdrop-blur-md">
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold">Shared Signals</span>
                                    {topCard.interests?.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {topCard.interests.map((interest) => (
                                                <span key={interest} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-xs text-gold">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-xs text-pearl-dim">Explore common ground together.</p>
                                    )}
                                </div>

                                <div className="rounded-3xl border border-plum-border bg-plum-surface/90 p-5 shadow-xl backdrop-blur-md">
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-mehendi-light">Conversation Starter</span>
                                    <p className="mt-2 text-xs italic text-pearl leading-relaxed bg-plum-night/60 p-3 rounded-2xl border border-plum-border">
                                        "Hey {topCard.displayName}, saw you like {topCard.interests?.[0] || 'exploring'} — what's your favorite spot for it?"
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-3xl border border-plum-border bg-plum-surface/60 p-6 text-center text-xs text-pearl-dim">
                                Select matches to view detailed insights.
                            </div>
                        )}
                    </aside>

                    {/* CENTER COLUMN: Hero Card Stack & Controls */}
                    <section className="flex flex-col items-center justify-center">
                        <div className="relative h-[600px] w-full max-w-md">
                            {feedError && (
                                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-sindoor/40 bg-plum-surface/60 p-6 text-center">
                                    <p className="text-sm text-sindoor-light">{feedError}</p>
                                    <Button variant="secondary" className="mt-4" onClick={fetchFeed}>
                                        Try again
                                    </Button>
                                </div>
                            )}

                            {!topCard && !fetching && (
                                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-plum-border bg-plum-surface/60 p-8 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron/10 text-saffron mb-3">
                                        <SparklesIcon className="h-7 w-7" />
                                    </div>
                                    <h3 className="font-display text-2xl font-bold text-pearl">You're all caught up</h3>
                                    <p className="mt-2 text-xs text-pearl-dim max-w-xs leading-relaxed">
                                        You've reviewed today's stack. Check back soon for fresh recommendations.
                                    </p>
                                </div>
                            )}

                            {nextCard && (
                                <ProfileCard
                                    profile={nextCard}
                                    className="scale-[0.96] translate-y-3 opacity-60 pointer-events-none"
                                />
                            )}

                            {topCard && (
                                <SwipeableCard
                                    key={topCard.id}
                                    profile={topCard}
                                    onSwipe={handleSwipe}
                                    onTap={() => setViewingDetail(true)}
                                    disabled={swiping}
                                    topRightSlot={
                                        <ActionMenu
                                            trigger={
                                                <button
                                                    aria-label="More options"
                                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-pearl/20 bg-plum-night/60 text-pearl backdrop-blur-md hover:bg-plum-night"
                                                >
                                                    ⋯
                                                </button>
                                            }
                                        >
                                            <ActionMenuItem onClick={() => setReportOpen(true)}>Report</ActionMenuItem>
                                            <ActionMenuItem onClick={() => setConfirmBlock(true)} danger>Block</ActionMenuItem>
                                        </ActionMenu>
                                    }
                                />
                            )}
                        </div>

                        {/* Bottom 5-Button Action Control Bar */}
                        {topCard && (
                            <div className="mt-6 flex items-center justify-center gap-4 sm:gap-5">
                                {/* Info Button */}
                                <button
                                    onClick={() => setViewingDetail(true)}
                                    disabled={swiping}
                                    aria-label="Profile Info"
                                    className="flex h-12 w-12 items-center justify-center rounded-full border border-plum-border bg-plum-surface text-pearl-dim transition-all duration-200 hover:scale-110 hover:border-gold/50 hover:text-pearl active:scale-95 disabled:opacity-50"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>

                                {/* Pass Button (Cross X) */}
                                <button
                                    onClick={() => handleSwipe('PASS')}
                                    disabled={swiping}
                                    aria-label="Pass"
                                    className="flex h-16 w-16 items-center justify-center rounded-full border border-sindoor/30 bg-plum-surface text-sindoor-light shadow-lg transition-all duration-200 hover:scale-110 hover:border-sindoor hover:bg-sindoor/10 active:scale-95 disabled:opacity-50"
                                >
                                    <PassIcon className="h-7 w-7" stroke="currentColor" />
                                </button>

                                {/* Super Like Button (Star) */}
                                <button
                                    onClick={() => {
                                        triggerLoveBurst('FIRE_LIKE')
                                        handleSwipe('FIRE_LIKE')
                                    }}
                                    disabled={swiping}
                                    aria-label="Super like"
                                    className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-gold-glow transition-all duration-200 hover:scale-110 hover:bg-gold/20 active:scale-95 disabled:opacity-50"
                                >
                                    <SuperLikeIcon fill="currentColor" className="h-6 w-6" />
                                </button>

                                {/* Like Button (Vibrant Gradient Heart) */}
                                <button
                                    onClick={() => handleSwipe('LIKE')}
                                    disabled={swiping}
                                    aria-label="Like"
                                    className="flex h-20 w-20 items-center justify-center rounded-full bg-saffron-gradient text-pearl shadow-saffron-glow transition-all duration-250 hover:scale-110 active:scale-95 disabled:opacity-50"
                                >
                                    <HeartIcon fill="currentColor" className="h-9 w-9" />
                                </button>

                                {/* Safety Action Button */}
                                <button
                                    onClick={() => setLocationShareOpen(true)}
                                    disabled={swiping}
                                    aria-label="Location Safety"
                                    className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold transition-all duration-200 hover:scale-110 hover:bg-gold/20 active:scale-95 disabled:opacity-50"
                                >
                                    <ShieldIcon className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </section>

                    {/* RIGHT WING: Active Matches & Date Safety Tray */}
                    <aside className="hidden lg:flex flex-col gap-5 sticky top-24">
                        {/* Active Matches Section */}
                        <div className="rounded-3xl border border-plum-border bg-plum-surface/90 p-5 shadow-xl backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold uppercase tracking-wider text-pearl">Active Matches</span>
                                <span className="rounded-full bg-saffron/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-saffron">
                                    {matches.length}
                                </span>
                            </div>

                            {matches.length > 0 ? (
                                <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                                    {matches.slice(0, 4).map((match) => (
                                        <div
                                            key={match.id}
                                            onClick={() => router.push(`/chat/${match.id}`)}
                                            className="flex items-center gap-3 rounded-2xl border border-plum-border bg-plum-night/60 p-2.5 transition-all hover:bg-plum-night cursor-pointer"
                                        >
                                            <div className="h-10 w-10 overflow-hidden rounded-full border border-saffron/40">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={match.profile?.photos?.[0]?.url}
                                                    alt={match.profile?.displayName}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="truncate font-mono text-xs font-bold text-pearl">
                                                    {match.profile?.displayName}
                                                </p>
                                                <p className="truncate text-[11px] text-pearl-dim">Tap to chat</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 text-xs text-pearl-dim">
                                    Swipe right on profiles to discover your matches!
                                </p>
                            )}
                        </div>

                        {/* Date Safety Shortcut */}
                        <div className="rounded-3xl border border-gold/40 bg-gold/5 p-5 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-2 text-gold">
                                <ShieldIcon className="h-4 w-4" />
                                <span className="font-mono text-xs font-bold uppercase tracking-wider">Date Safety</span>
                            </div>
                            <p className="mt-2 text-xs text-pearl-dim leading-relaxed">
                                Going on a date? Share your live location with a trusted contact safely.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => setLocationShareOpen(true)}
                                className="mt-4 w-full border-gold/40 text-gold hover:bg-gold/10 text-xs"
                            >
                                Launch Location Share
                            </Button>
                        </div>
                    </aside>

                </div>
            </main>

            {/* Modals */}
            <ConfirmModal
                open={confirmBlock}
                title="Block this profile?"
                description="You won't see them again, and they won't see you."
                confirmLabel="Block"
                onConfirm={() => {
                    setConfirmBlock(false)
                    handleBlock()
                }}
                onCancel={() => setConfirmBlock(false)}
            />

            <ReportModal
                open={reportOpen}
                reportedUserId={topCard?.userId}
                onClose={() => setReportOpen(false)}
            />

            <LocationShareModal
                open={locationShareOpen}
                onClose={() => setLocationShareOpen(false)}
            />

            {viewingDetail && topCard && (
                <ProfileDetailModal
                    profile={topCard}
                    onClose={() => setViewingDetail(false)}
                    onLike={() => {
                        setViewingDetail(false)
                        handleSwipe('LIKE')
                    }}
                    onPass={() => {
                        setViewingDetail(false)
                        handleSwipe('PASS')
                    }}
                />
            )}
        </div>
    )
}

export default function discoverPage() {
    return (
        <VerifiedLayout>
            <DiscoverPageContent />
        </VerifiedLayout>
    )
}