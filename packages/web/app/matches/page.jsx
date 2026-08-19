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

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }
        /* set the matches data  in useState */
        api.get('/matches').then((data) => setMatches(data.matches))

    }, [loading, user, router])


    if (loading || matches === null) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-ink px-6 pb-10 pt-6">
            <NavBar />

            <div className="mt-8 w-full max-w-sm">
                {matches.length === 0 ? (
                    <div className="mt-16 text-center">
                        <p className="font-display text-xl text-cream">No matches yet</p>
                        <p className="mt-2 text-[14px] text-cream-dim">Keep swiping — they're out there.</p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {matches.map((m) => {
                            const photo = m.otherUser?.photos?.[0];
                            return (
                                <li key={m.matchId}>
                                    <Link
                                        href={`/chat/${m.matchId}`}
                                        className="flex items-center gap-4 rounded-2xl border border-cream/8 bg-dusk p-3 transition-colors hover:border-marigold/40"
                                    >
                                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-dusk-light">
                                            {photo ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={photo.url} alt={m.otherUser.displayName} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center font-display text-lg text-cream-dim">
                                                    {m.otherUser?.displayName?.[0] ?? '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-display text-[16px] text-cream">{m.otherUser?.displayName ?? 'Someone'}</p>
                                            <p className="truncate text-[13px] text-cream-dim">
                                                {m.icebreakerSuggestion ? m.icebreakerSuggestion : 'Say hello'}
                                            </p>
                                        </div>
                                        <span className="flex-shrink-0 font-mono text-[11px] text-cream-dim">{timeAgo(m.matchedAt)}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
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