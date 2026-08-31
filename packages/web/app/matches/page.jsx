'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/Navbar'
import { VerifiedLayout } from '@/components/VerifiedLayout'

function MatchesPageContent() {

    const { user, loading } = useAuth()
    const router = useRouter()
    const [matches, setMatches] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }
        /* set the matches data in useState */
        api.get('/matches')
            .then((data) => setMatches(data.matches))
            .catch((requestError) => setError(requestError.message || 'Failed to load matches'))

    }, [loading, user, router])


    if (loading || matches === null) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">
                    {error || 'Loading…'}
                </p>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-ink px-6 pb-10 pt-6">
            <NavBar />

            <div className="mt-8 w-full max-w-7xl">
                {matches.length === 0 ? (
                    <div className="mt-16 text-center">
                        <p className="font-display text-xl text-cream">No matches yet</p>
                        <p className="mt-2 text-[14px] text-cream-dim">Keep swiping — they're out there.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {matches.map((m) => {
                            const photo = m.otherUser?.photos?.[0];
                            return (
                                <Link
                                    key={m.matchId}
                                    href={`/chat/${m.matchId}`}
                                    className="group relative rounded-2xl border border-plum-border/60 bg-plum-night/50 overflow-hidden transition hover:border-saffron/40 hover:shadow-lg hover:shadow-saffron/20"
                                >
                                    {/* Photo Section */}
                                    <div className="relative aspect-square w-full overflow-hidden bg-plum-dark">
                                        {photo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={photo.url}
                                                alt={m.otherUser?.displayName}
                                                className="h-full w-full object-cover transition group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center font-display text-4xl text-pearl-dim">
                                                {m.otherUser?.displayName?.[0] ?? '?'}
                                            </div>
                                        )}
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-plum-night via-transparent to-transparent" />
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-3 space-y-2">
                                        <div>
                                            <p className="font-sans font-bold text-sm text-cream truncate">
                                                {m.otherUser?.displayName ?? 'Someone'}
                                            </p>
                                            <p className="font-mono text-[11px] text-cream-dim">
                                                {timeAgo(m.matchedAt)}
                                            </p>
                                        </div>
                                        <p className="font-mono text-[12px] text-cream-dim line-clamp-2 h-8">
                                            {m.icebreakerSuggestion ? m.icebreakerSuggestion : '💬 Say hello'}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}

function timeAgo(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function MatchesPage() {
    return (
        <VerifiedLayout>
            <MatchesPageContent />
        </VerifiedLayout>
    )
}