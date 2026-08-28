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
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-saffron font-bold">
                        Search Profiles
                    </p>

                    <h1 className="mt-2 font-display text-4xl font-bold text-pearl">
                        Find someone by username
                    </h1>

                    <form
                        onSubmit={search}
                        className="mt-8 flex gap-2 rounded-2xl border border-plum-border bg-plum-surface p-2 shadow-xl"
                    >
                        <input
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value.toLowerCase())
                            }
                            placeholder="username (e.g. riteshk)"
                            maxLength={20}
                            autoComplete="off"
                            className="min-w-0 flex-1 rounded-xl border border-plum-border bg-plum-night/60 px-4 py-3 font-mono text-sm text-pearl outline-none placeholder:text-pearl-dim focus:border-saffron"
                        />

                        <Button type="submit" variant="primary" disabled={searching}>
                            {searching ? 'Searching…' : 'Search'}
                        </Button>
                    </form>

                    {error && (
                        <p className="mt-4 text-sm text-sindoor-light font-mono">
                            {error}
                        </p>
                    )}

                    {!error && searched && !profile && (
                        <p className="mt-8 text-center text-sm text-pearl-dim font-sans">
                            No profile found for that username.
                        </p>
                    )}

                    {profile && (
                        <div className="mt-8 rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-2xl space-y-5">
                            <div
                                onClick={() => setDetailOpen(true)}
                                className="flex items-center gap-4 cursor-pointer group"
                            >
                                {profile.photos?.[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile.photos[0].url}
                                        alt={profile.displayName}
                                        className="h-20 w-20 rounded-2xl object-cover border border-plum-border transition group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-plum-night font-display text-3xl text-pearl-dim">
                                        {profile.displayName?.[0]}
                                    </div>
                                )}

                                <div className="flex-1">
                                    <h3 className="font-display text-2xl font-bold text-pearl group-hover:text-saffron transition">
                                        {profile.displayName}
                                    </h3>
                                    <p className="font-mono text-xs text-pearl-dim">
                                        @{profile.username}
                                    </p>
                                    {profile.profession && (
                                        <p className="mt-1 font-mono text-xs text-saffron uppercase">
                                            {profile.profession}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons to Like or Super Like Searched User */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-plum-border/50">
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