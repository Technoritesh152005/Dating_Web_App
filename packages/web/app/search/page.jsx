'use client'

import { api } from '@/lib/api.js'
import { useState } from 'react'
import { NavBar } from '@/components/Navbar'
import { SidebarNav } from '@/components/SidebarNav'
import { ProfileDetailModal } from '@/components/ProfileDetailModel'
import { MatchCelebration as MatchBanner } from '@/components/MatchCelebration'
import { Button } from '@/components/user_interface/Button'
import { HeartIcon, SuperLikeIcon } from '@/components/user_interface/Icons'

export default function SearchPage() {
    const [username, setUsername] = useState('')
    const [profile, setProfile] = useState(null)
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)
    const [error, setError] = useState(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [swiping, setSwiping] = useState(false)
    const [celebrating, setCelebrating] = useState(null)

    const search = async (event) => {
        event.preventDefault()

        const normalizedUsername = username.trim().toLowerCase()
        if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
            setError('Use a valid username')
            setProfile(null)
            setSearched(true)
            return
        }

        setSearching(true)
        setError(null)

        try {
            const result = await api.get(`/search/users?username=${encodeURIComponent(normalizedUsername)}`)
            setProfile(result.profile ?? null)
            setSearched(true)
        } catch (error) {
            setError(error.message || 'Search failed')
            setProfile(null)
        } finally {
            setSearching(false)
        }
    }

    const handleSwipeUser = async (action) => {
        if (!profile || swiping) return
        setSwiping(true)
        try {
            const result = await api.post('/swipe', { toUserId: profile.userId, action })
            if (result.isMatched && result.match) {
                setCelebrating({
                    id: result.match.id,
                    profile: profile,
                })
            }
        } catch (err) {
            setError(err.message || 'Failed to send like')
        } finally {
            setSwiping(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-plum-night text-pearl">
            <SidebarNav />

            {celebrating && <MatchBanner match={celebrating} onDismiss={() => setCelebrating(null)} />}

            <main className="flex-1 px-6 pb-16 pt-8 text-pearl sm:px-12">
                <div className="mx-auto max-w-xl">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/20 text-saffron">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-saffron font-bold">
                            Search Profiles
                        </p>
                    </div>

                    <h1 className="mt-2 font-display text-4xl font-bold text-pearl">
                        Find someone by username
                    </h1>
                    <p className="mt-1 text-sm text-pearl-dim">
                        Search for matches directly by entering their exact account username.
                    </p>

                    <form
                        onSubmit={search}
                        className="mt-6 flex gap-2 rounded-2xl border border-plum-border/80 bg-plum-surface/90 p-2 shadow-2xl backdrop-blur-xl focus-within:border-saffron/80 transition-all"
                    >
                        <div className="relative flex-1 flex items-center">
                            <svg className="absolute left-4 h-5 w-5 text-pearl-dim pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value.toLowerCase())
                                }
                                placeholder="Search by username..."
                                maxLength={20}
                                autoComplete="off"
                                className="w-full rounded-xl border border-plum-border/40 bg-plum-night/80 pl-11 pr-4 py-3 font-mono text-sm text-pearl outline-none placeholder:text-pearl-dim/60 focus:border-saffron/60 transition"
                            />
                        </div>

                        <Button type="submit" variant="primary" disabled={searching} className="px-6">
                            {searching ? 'Searching…' : 'Search'}
                        </Button>
                    </form>

                    {/* Quick Suggestion Pills */}
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="font-mono text-pearl-dim/60">Try searching:</span>
                        {['kalyani_priya'].map((sample) => (
                            <button
                                key={sample}
                                type="button"
                                onClick={() => setUsername(sample)}
                                className="font-mono text-saffron hover:underline bg-saffron/10 px-2.5 py-0.5 rounded-full border border-saffron/20"
                            >
                                @{sample}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mt-4 rounded-xl border border-sindoor/40 bg-sindoor/10 p-3 text-sm text-sindoor-light font-mono">
                            {error}
                        </div>
                    )}

                    {!error && searched && !profile && (
                        <div className="mt-8 rounded-2xl border border-dashed border-plum-border/60 bg-plum-surface/40 p-8 text-center">
                            <p className="text-sm text-pearl-dim font-sans">
                                No profile found for <span className="font-mono font-bold text-pearl">@{username}</span>.
                            </p>
                        </div>
                    )}

                    {profile && (
                        <div className="mt-8 rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-2xl space-y-5 transition-all">
                            <div
                                onClick={() => setDetailOpen(true)}
                                className="flex items-center gap-5 cursor-pointer group"
                            >
                                {profile.photos?.[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile.photos[0].url}
                                        alt={profile.displayName}
                                        className="h-22 w-22 h-20 w-20 rounded-2xl object-cover border-2 border-saffron/30 transition group-hover:scale-105 group-hover:border-saffron"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-plum-night font-display text-3xl text-saffron border border-plum-border">
                                        {profile.displayName?.[0]}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-display text-2xl font-bold text-pearl group-hover:text-saffron transition truncate">
                                            {profile.displayName}
                                        </h3>
                                        {profile.verificationStatus === 'VERIFIED' && (
                                            <span className="text-saffron" title="Verified Profile">✓</span>
                                        )}
                                    </div>
                                    <p className="font-mono text-xs text-saffron bg-plum-night/80 border border-saffron/30 px-2.5 py-0.5 rounded-full inline-block mt-1">
                                        @{profile.username}
                                    </p>
                                    {profile.profession && (
                                        <p className="mt-2 font-mono text-xs text-pearl-dim uppercase tracking-wider">
                                            {profile.profession}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons to Like or Super Like Searched User */}
                            <div className="flex items-center justify-between pt-4 border-t border-plum-border/50">
                                <button
                                    type="button"
                                    onClick={() => setDetailOpen(true)}
                                    className="font-mono text-xs text-pearl-dim hover:text-pearl transition"
                                >
                                    View Full Details →
                                </button>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSwipeUser('FIRE_LIKE')}
                                        disabled={swiping}
                                        className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 font-mono text-xs font-semibold text-gold transition hover:bg-gold/20 disabled:opacity-50"
                                    >
                                        <SuperLikeIcon fill="currentColor" className="h-4 w-4" />
                                        <span>Super Like</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwipeUser('LIKE')}
                                        disabled={swiping}
                                        className="flex items-center gap-2 rounded-xl bg-saffron-gradient px-5 py-2.5 font-mono text-xs font-bold text-pearl shadow-saffron-glow transition hover:scale-105 disabled:opacity-50"
                                    >
                                        <HeartIcon fill="currentColor" className="h-4 w-4" />
                                        <span>Like Profile</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {detailOpen && profile && (
                        <ProfileDetailModal
                            profile={profile}
                            onClose={() => setDetailOpen(false)}
                            onLike={() => {
                                setDetailOpen(false)
                                handleSwipeUser('LIKE')
                            }}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}