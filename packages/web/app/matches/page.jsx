'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { calculateAge } from '@/lib/calculateAge';
import { formatLastSeen } from '@/lib/formatLastSeen';
import { VerifiedLayout } from '@/components/VerifiedLayout';

function MatchesPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);

  const loadMatches = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get('/matches');
      setMatches(data.matches ?? []);
    } catch (requestError) {
      setError(requestError.message || 'Could not load your matches.');
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadMatches();
  }, [loading, user, router, loadMatches]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#918781]">Loading your connections…</p>
      </main>
    );
  }

  const displayName = user.profile?.displayName || user.email?.split('@')[0] || 'Your profile';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_24%_18%,rgba(237,89,100,0.10),transparent_38%),radial-gradient(ellipse_at_78%_75%,rgba(244,196,48,0.13),transparent_34%),linear-gradient(135deg,#fcfaf7_0%,#f7f1ec_100%)] text-[#292321]">
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-[#f8dede]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-[#f5e8ce]/70 blur-3xl" />

      <header className="relative z-10 border-b border-[#eadfd8]/80 bg-white/70 px-4 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/discover" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f1] text-[#ed5964]">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <span className="font-display text-xl text-[#292321] sm:text-2xl">Melodis</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-2xl border border-[#eee5df] bg-white/70 p-1 sm:flex">
            <Link href="/discover" className="rounded-xl px-4 py-2 text-sm font-semibold text-[#655d58] transition hover:bg-[#f8f4f0]">
              Discover
            </Link>
            <Link href="/matches" aria-current="page" className="rounded-xl bg-[#fff0f1] px-4 py-2 text-sm font-semibold text-[#e95161]">
              Matches
            </Link>
          </nav>

          <Link
            href="/profile"
            aria-label={`Open ${displayName}'s profile`}
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#f7dedf] font-semibold text-[#9d4c50] shadow-sm"
          >
            {user.profile?.photos?.[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile.photos[0].url} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName[0]?.toUpperCase()
            )}
          </Link>
        </div>
        <nav aria-label="Mobile navigation" className="mx-auto mt-3 flex max-w-7xl gap-2 sm:hidden">
          <Link href="/discover" className="rounded-xl px-3 py-2 text-xs font-semibold text-[#655d58]">Discover</Link>
          <Link href="/matches" aria-current="page" className="rounded-xl bg-[#fff0f1] px-3 py-2 text-xs font-semibold text-[#e95161]">Matches</Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e95161]">
              <Sparkles className="h-4 w-4" />
              Your connections
            </p>
            <h1 className="font-display text-4xl text-[#292321] sm:text-5xl">Matches</h1>
            <p className="mt-2 text-sm text-[#827871]">A good conversation starts with one small hello.</p>
          </div>
          {matches?.length > 0 && (
            <span className="rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-semibold text-[#655d58] shadow-sm">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {matches === null && !error && (
          <div className="rounded-[28px] border border-white/80 bg-white/75 px-6 py-16 text-center shadow-[0_24px_70px_-45px_rgba(74,49,39,0.3)]">
            <p className="font-display text-2xl text-[#332d29]">Gathering your matches…</p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-[28px] border border-[#f1c7c9] bg-white/85 px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-[#a33c48]">{error}</p>
            <button type="button" onClick={loadMatches} className="mt-4 rounded-full bg-[#e95161] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d94355]">
              Try again
            </button>
          </div>
        )}

        {matches?.length === 0 && !error && (
          <div className="rounded-[28px] border border-white/80 bg-white/75 px-6 py-16 text-center shadow-[0_24px_70px_-45px_rgba(74,49,39,0.3)]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f1] text-[#ed5964]">
              <Heart className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-2xl text-[#332d29]">Your next hello is out there</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#827871]">
              Keep discovering profiles. When you both like each other, you’ll find them here.
            </p>
            <Link href="/discover" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e95161] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#d94355]">
              Explore profiles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {matches?.length > 0 && !error && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matches.map((match) => {
              const profile = match.otherUser;
              const photo = profile?.photos?.[0];
              const age = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;

              return (
                <Link
                  key={match.matchId}
                  href={`/chat/${match.matchId}`}
                  className="group overflow-hidden rounded-[26px] border border-white/80 bg-white/85 shadow-[0_20px_55px_-38px_rgba(74,49,39,0.4)] transition duration-300 hover:-translate-y-1 hover:border-[#edc0c3] hover:shadow-[0_28px_60px_-34px_rgba(224,83,98,0.28)]"
                >
                  <div className="relative aspect-[4/4.2] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#fff5ee_0%,#f0d8d2_45%,#e6c6c6_100%)]">
                    {photo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.url} alt={profile?.displayName ?? 'Your match'} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-7xl text-[#d57b7b]">
                        {profile?.displayName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#655d58] shadow-sm backdrop-blur">
                      Matched {timeAgo(match.matchedAt)}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <h2 className="font-display text-2xl drop-shadow-sm">
                        {profile?.displayName ?? 'Someone'}{age ? `, ${age}` : ''}
                      </h2>
                      {profile?.profession && (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
                          {profile.profession.replaceAll('_', ' ').toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="flex items-center gap-2 text-xs font-medium text-[#827871]">
                      <span className="h-2 w-2 rounded-full bg-[#e5b3b4]" />
                      {formatLastSeen(match.lastSeenAt)}
                    </p>
                    {profile?.interests?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {profile.interests.slice(0, 3).map((interest) => (
                          <span key={interest} className="rounded-full bg-[#f8f4f0] px-2.5 py-1 text-[10px] font-medium text-[#655d58]">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-[#eee5df] pt-3">
                      <span className="text-sm font-semibold text-[#e95161]">
                        {match.icebreakerSuggestion || 'Say hello'}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0f1] text-[#e95161] transition group-hover:bg-[#e95161] group-hover:text-white">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function timeAgo(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'recently';
  const elapsedHours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (elapsedHours < 1) return 'just now';
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const days = Math.floor(elapsedHours / 24);
  return `${days}d ago`;
}

export default function MatchesPage() {
  return (
    <VerifiedLayout>
      <MatchesPageContent />
    </VerifiedLayout>
  );
}
