'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SidebarNav } from '@/components/SidebarNav';
import { ProfileCard } from '@/components/ProfileCard';
import { SwipeableCard } from '@/components/SwipeableCard';
import { ProfileDetailModal } from '@/components/ProfileDetailModel';
import { MatchCelebration as MatchBanner } from '@/components/MatchCelebration';
import { VerifiedLayout } from '@/components/VerifiedLayout';
import { calculateAge } from '@/lib/calculateAge';
import {
  HeartIcon,
  SuperLikeIcon,
  PassIcon,
  SparklesIcon,
  VerifiedIcon,
  LocationIcon,
} from '@/components/user_interface/Icons';

const EXPLORE_CATEGORIES = [
  {
    value: 'LONG_TERM',
    title: 'Long-term',
    description: 'Find people looking for a lasting relationship.',
    gradient: 'from-pink-500/20 via-rose-500/10 to-transparent border-pink-500/30',
    activeGlow: 'border-pink-500 shadow-[0_0_20px_rgba(244,114,182,0.3)]',
    iconColor: 'text-pink-400',
  },
  {
    value: 'CASUAL_DATING',
    title: 'Casual',
    description: 'Meet people open to something relaxed and fun.',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30',
    activeGlow: 'border-saffron shadow-saffron-glow',
    iconColor: 'text-saffron',
  },
  {
    value: 'SERIOUS_RELATIONSHIP',
    title: 'Serious',
    description: 'Connect with people ready for a committed relationship.',
    gradient: 'from-rose-600/20 via-red-500/10 to-transparent border-rose-500/30',
    activeGlow: 'border-sindoor shadow-[0_0_20px_rgba(230,57,80,0.3)]',
    iconColor: 'text-sindoor-light',
  },
  {
    value: 'COFFEE_DATE',
    title: 'Coffee Date',
    description: 'Meet someone for a casual coffee and conversation.',
    gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent border-yellow-500/30',
    activeGlow: 'border-gold shadow-gold-glow',
    iconColor: 'text-gold',
  },
  {
    value: 'FREE_TONIGHT',
    title: 'Free Tonight',
    description: 'See people who are available to meet this evening.',
    gradient: 'from-emerald-500/20 via-green-500/10 to-transparent border-emerald-500/30',
    activeGlow: 'border-mehendi shadow-[0_0_20px_rgba(46,204,113,0.3)]',
    iconColor: 'text-mehendi-light',
  },
  {
    value: 'GAMING_BUDDY',
    title: 'Gamers',
    description: 'Connect with people who love gaming and esports.',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent border-purple-500/30',
    activeGlow: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    iconColor: 'text-purple-400',
  },
  {
    value: 'TRAVEL_BUDDY',
    title: 'Travel Buddies',
    description: 'Meet people who are always up for an adventure.',
    gradient: 'from-sky-500/20 via-blue-500/10 to-transparent border-sky-500/30',
    activeGlow: 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]',
    iconColor: 'text-sky-400',
  },
  {
    value: 'NEW_CONNECTIONS',
    title: 'New Connections',
    description: 'Meet interesting people and see where it goes.',
    gradient: 'from-fuchsia-500/20 via-pink-500/10 to-transparent border-fuchsia-500/30',
    activeGlow: 'border-fuchsia-400 shadow-[0_0_20px_rgba(232,121,249,0.3)]',
    iconColor: 'text-fuchsia-400',
  },
  {
    value: 'FRIENDSHIP',
    title: 'Friendship',
    description: 'Find people looking to make genuine new friends.',
    gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent border-teal-500/30',
    activeGlow: 'border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)]',
    iconColor: 'text-teal-400',
  },
  {
    value: 'OPEN_TO_ANYTHING',
    title: 'Open to Anything',
    description: 'Let the connection decide where it goes.',
    gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-500/30',
    activeGlow: 'border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.3)]',
    iconColor: 'text-indigo-400',
  },
];

export function Explore() {
  const [selectedCategory, setSelectedCategory] = useState('LONG_TERM');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'deck'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [celebrating, setCelebrating] = useState(null);

  const loadProfiles = async (category) => {
    setSelectedCategory(category);
    setProfiles([]);
    setError(null);
    setLoading(true);

    try {
      const result = await api.get(`/discovery/explore?mode=${encodeURIComponent(category)}`);
      setProfiles(result.profiles ?? []);
    } catch (err) {
      setError(err.message || 'Could not load profiles for this explore vibe.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (targetProfile, action) => {
    if (!targetProfile || swiping) return;

    setSwiping(true);
    try {
      const result = await api.post('/swipe', {
        toUserId: targetProfile.userId,
        action,
      });
      if (result.isMatched && result.match) {
        setCelebrating({
          id: result.match.id,
          profile: targetProfile,
        });
      }
      setProfiles((current) => current.filter((p) => p.id !== targetProfile.id));
      if (selectedProfile?.id === targetProfile.id) {
        setSelectedProfile(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to send swipe');
    } finally {
      setSwiping(false);
    }
  };

  useEffect(() => {
    loadProfiles('LONG_TERM');
  }, []);

  const activeCategoryObj = EXPLORE_CATEGORIES.find((c) => c.value === selectedCategory) ?? EXPLORE_CATEGORIES[0];
  const topDeckCard = profiles[0];

  return (
    <div className="flex min-h-screen bg-plum-night text-pearl">
      {/* 25% Left Sidebar Navigation */}
      <SidebarNav />

      {celebrating && <MatchBanner match={celebrating} onDismiss={() => setCelebrating(null)} />}

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-saffron">
              <SparklesIcon className="h-5 w-5" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">Explore Vibe Hub</span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold text-pearl">
              Find your kind of connection
            </h1>
            <p className="mt-1.5 text-sm text-pearl-dim">
              Browse profiles filtered by what people are looking for.
            </p>
          </div>

          {/* Vibe Category Cards Grid */}
          <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {EXPLORE_CATEGORIES.map((category) => {
              const active = selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => loadProfiles(category.value)}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:scale-[1.03] bg-gradient-to-br ${category.gradient} ${
                    active ? category.activeGlow : 'hover:border-pearl/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <SparklesIcon className={`h-6 w-6 ${category.iconColor}`} />
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-saffron shadow-saffron-glow" />
                      )}
                    </div>
                    <h3 className="mt-4 font-sans text-base font-bold text-pearl group-hover:text-saffron transition">
                      {category.title}
                    </h3>
                    <p className="mt-1 text-xs text-pearl-dim line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </section>

          {/* Results Section with Loading Bar & View Switcher */}
          <section className="pt-4 border-t border-plum-border/40 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-pearl">
                  {activeCategoryObj.title}
                </h2>
                {!loading && (
                  <p className="text-xs text-pearl-dim mt-0.5">
                    Showing {profiles.length} profiles looking for {activeCategoryObj.title.toLowerCase()}
                  </p>
                )}
              </div>

              {/* View Switcher: Grid View vs Deck View */}
              {!loading && profiles.length > 0 && (
                <div className="flex items-center gap-1 rounded-full border border-plum-border bg-plum-surface p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                      viewMode === 'grid'
                        ? 'bg-saffron-gradient text-pearl font-bold shadow-saffron-glow'
                        : 'text-pearl-dim hover:text-pearl'
                    }`}
                  >
                    Grid View
                  </button>
                  <button
                    onClick={() => setViewMode('deck')}
                    className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                      viewMode === 'deck'
                        ? 'bg-saffron-gradient text-pearl font-bold shadow-saffron-glow'
                        : 'text-pearl-dim hover:text-pearl'
                    }`}
                  >
                    Swipe Deck
                  </button>
                </div>
              )}
            </div>

            {/* Loading Bar & Pulse Skeleton */}
            {loading && (
              <div className="space-y-6 py-8">
                {/* Sleek Loading Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-plum-surface">
                  <div className="h-full w-1/2 animate-[pulse_1s_infinite] rounded-full bg-saffron-gradient" />
                </div>
                <p className="text-center font-mono text-xs uppercase tracking-widest text-pearl-dim">
                  Finding profiles for {activeCategoryObj.title}...
                </p>

                {/* Skeleton Grid */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[3/4] rounded-3xl bg-plum-surface animate-pulse border border-plum-border/40" />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-3xl border border-dashed border-sindoor/40 bg-plum-surface/60 p-8 text-center">
                <p className="text-sm text-sindoor-light font-mono">{error}</p>
              </div>
            )}

            {!loading && !error && profiles.length === 0 && (
              <div className="rounded-3xl border border-dashed border-plum-border bg-plum-surface/60 p-12 text-center">
                <h3 className="font-display text-2xl font-bold text-pearl">No profiles found</h3>
                <p className="mt-2 text-xs text-pearl-dim max-w-sm mx-auto leading-relaxed">
                  No one is currently listed under {activeCategoryObj.title}. Try selecting another vibe category above!
                </p>
              </div>
            )}

            {/* Option 1 View A: Responsive Profile Grid */}
            {!loading && !error && profiles.length > 0 && viewMode === 'grid' && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile) => {
                  const photo = profile.photos?.[0];

                  return (
                    <div
                      key={profile.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-plum-border bg-plum-surface shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 cursor-pointer"
                      onClick={() => setSelectedProfile(profile)}
                    >
                      {/* Photo Image */}
                      <div className="relative aspect-[3/4] w-full bg-plum-night overflow-hidden">
                        {photo?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.url}
                            alt={profile.displayName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center font-display text-6xl text-pearl-dim">
                            {profile.displayName?.[0]}
                          </div>
                        )}

                        {/* Top Gradient Overlay */}
                        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-plum-night/70 to-transparent pointer-events-none" />

                        {/* Verified Badge */}
                        {profile.verificationStatus === 'VERIFIED' && (
                          <div className="absolute right-3.5 top-3.5 z-10">
                            <VerifiedIcon className="h-6 w-6" />
                          </div>
                        )}

                        {/* Bottom Gradient Overlay & Name */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-night via-plum-night/80 to-transparent p-5">
                          <div className="flex items-baseline gap-2">
                            <h3 className="font-sans text-2xl font-extrabold text-pearl">
                              {profile.displayName}
                            </h3>
                            {profile.dateOfBirth && (
                              <span className="font-mono text-base text-pearl-dim">
                                {calculateAge(profile.dateOfBirth)}
                              </span>
                            )}
                          </div>
                          {profile.profession && (
                            <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-wider text-saffron">
                              {profile.profession}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Content & Action Buttons */}
                      <div className="p-4 bg-plum-surface flex items-center justify-between gap-3 border-t border-plum-border/40">
                        <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-7">
                          {(profile.interests ?? []).slice(0, 2).map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full border border-pearl/20 bg-plum-night/80 px-3 py-1 font-sans text-xs font-semibold text-pearl"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>

                        {/* Pass and Like Quick Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwipe(profile, 'PASS');
                            }}
                            disabled={swiping}
                            aria-label="Pass"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-sindoor/30 bg-plum-night text-sindoor-light transition hover:bg-sindoor/10 hover:scale-110"
                          >
                            <PassIcon className="h-5 w-5" stroke="currentColor" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwipe(profile, 'LIKE');
                            }}
                            disabled={swiping}
                            aria-label="Like"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-gradient text-pearl shadow-saffron-glow transition hover:scale-110"
                          >
                            <HeartIcon fill="currentColor" className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Option 1 View B: One-by-One Swipe Deck View */}
            {!loading && !error && profiles.length > 0 && viewMode === 'deck' && topDeckCard && (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative h-[680px] w-full max-w-[500px]">
                  {profiles[1] && (
                    <div className="absolute inset-0 pointer-events-none scale-[0.95] translate-y-3 opacity-60 transition-all duration-300">
                      <ProfileCard profile={profiles[1]} />
                    </div>
                  )}
                  <SwipeableCard
                    key={topDeckCard.id}
                    profile={topDeckCard}
                    onSwipe={(action) => handleSwipe(topDeckCard, action)}
                    onTap={() => setSelectedProfile(topDeckCard)}
                    disabled={swiping}
                  />
                </div>

                <div className="mt-6 flex items-center justify-center gap-5">
                  <button
                    onClick={() => handleSwipe(topDeckCard, 'PASS')}
                    disabled={swiping}
                    aria-label="Pass"
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-sindoor/30 bg-plum-surface text-sindoor-light shadow-lg transition-all hover:scale-110 hover:bg-sindoor/10 active:scale-95 disabled:opacity-50"
                  >
                    <PassIcon className="h-7 w-7" stroke="currentColor" />
                  </button>
                  <button
                    onClick={() => handleSwipe(topDeckCard, 'FIRE_LIKE')}
                    disabled={swiping}
                    aria-label="Super Like"
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-gold-glow transition-all hover:scale-110 hover:bg-gold/20 active:scale-95 disabled:opacity-50"
                  >
                    <SuperLikeIcon fill="currentColor" className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleSwipe(topDeckCard, 'LIKE')}
                    disabled={swiping}
                    aria-label="Like"
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-saffron-gradient text-pearl shadow-saffron-glow transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                  >
                    <HeartIcon fill="currentColor" className="h-9 w-9" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedProfile && (
        <ProfileDetailModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onLike={() => handleSwipe(selectedProfile, 'LIKE')}
          onPass={() => handleSwipe(selectedProfile, 'PASS')}
        />
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <VerifiedLayout>
      <Explore />
    </VerifiedLayout>
  );
}