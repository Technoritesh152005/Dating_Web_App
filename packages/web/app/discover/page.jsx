'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Home, Info, MessageCircle, Settings, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { ProfileCard } from '@/components/ProfileCard';
import { MatchCelebration as MatchBanner } from '@/components/MatchCelebration';
import { Button } from '@/components/user_interface/Button';
import { ActionMenu, ActionMenuItem } from '@/components/ActionMenu';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ReportModal } from '@/components/ReportModal';
import { ProfileDetailModal } from '@/components/ProfileDetailModel';
import { VerifiedLayout } from '@/components/VerifiedLayout';
import { SwipeableCard } from '@/components/SwipeableCard';
import { HeartIcon, SuperLikeIcon, PassIcon } from '@/components/user_interface/Icons';
import { ProfileMessageModal } from '@/components/ProfileMessageModal';

const LOW_STACK_THRESHOLD = 3;

function DiscoverSidebar({ user }) {
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || 'Your profile';
  const avatarUrl = user?.profile?.photos?.[0]?.url;

  const itemClass =
    'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200';

  return (
    <aside className="hidden h-screen w-[224px] shrink-0 flex-col border-r border-[#eadfd8] bg-white/80 px-4 py-6 backdrop-blur-xl md:flex">
      <Link href="/discover" className="mb-12 flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0f1] text-[#ed5964]">
          <Heart className="h-6 w-6 fill-current" />
        </span>
        <span className="font-display text-2xl text-[#292321]">Melodis</span>
      </Link>

      <nav aria-label="Main navigation" className="space-y-2">
        <div className={`${itemClass} cursor-not-allowed text-[#aaa19c]`} title="Dashboard coming soon">
          <Home className="h-5 w-5" />
          <span className="flex-1">Dashboard</span>
          <span className="text-[9px] font-bold uppercase tracking-wider">Soon</span>
        </div>
        <Link
          href="/discover"
          aria-current="page"
          className={`${itemClass} bg-[#fff0f1] text-[#e95161] shadow-sm shadow-rose-100`}
        >
          <Sparkles className="h-5 w-5" />
          Discover
        </Link>
        <Link href="/matches" className={`${itemClass} text-[#655d58] hover:bg-[#f8f4f0] hover:text-[#282320]`}>
          <MessageCircle className="h-5 w-5" />
          Messages
        </Link>
        <Link href="/profile" className={`${itemClass} text-[#655d58] hover:bg-[#f8f4f0] hover:text-[#282320]`}>
          <UserRound className="h-5 w-5" />
          Profile
        </Link>
        <Link href="/profile" className={`${itemClass} text-[#655d58] hover:bg-[#f8f4f0] hover:text-[#282320]`}>
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </nav>

      <Link
        href="/profile"
        className="mt-auto flex items-center gap-3 rounded-2xl border border-[#eee5df] bg-[#fbf8f5] p-3 transition hover:border-[#edc8c8]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f7dedf] font-semibold text-[#9d4c50]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            displayName[0]?.toUpperCase()
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#332d29]">{displayName}</span>
          <span className="block text-xs text-[#918781]">View profile</span>
        </span>
      </Link>
    </aside>
  );
}

function DiscoverPageContent() {
  const { user, loading } = useAuth();
  const [stack, setStack] = useState([]);
  const router = useRouter();
  const [fetching, setFetching] = useState(false);
  const [celebrating, setCelebrating] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [buttonAction, setButtonAction] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewingDetail, setViewingDetail] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [selectedLikeUser, setSelectedLikeUser] = useState(null);
  const [heartAnimating, setHeartAnimating] = useState(false);

  const handleHeartClick = () => {
    if (!topCard || !!buttonAction) return;
    setHeartAnimating(true);
    setButtonAction('LIKE');
    setTimeout(() => {
      setHeartAnimating(false);
    }, 750);
  };

  const fetchFeed = useCallback(async () => {
    setFetching(true);
    setFeedError(null);
    try {
      const { profiles } = await api.get('/discovery/feed');
      setStack((prev) => [
        ...prev,
        ...profiles.filter((p) => !prev.some((existing) => existing.id === p.id)),
      ]);
    } catch (error) {
      setFeedError(error.message || 'Failed to load profiles');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchFeed();
  }, [user, loading, router, fetchFeed]);

  useEffect(() => {
    if (stack.length > 0 && stack.length <= LOW_STACK_THRESHOLD && !fetching) {
      fetchFeed();
    }
  }, [stack.length, fetching, fetchFeed]);

  const handleSwipe = async (action) => {
    const current = stack[0];
    if (!current) return;

    setButtonAction(null);
    setStack((prev) => prev.filter((p) => p.id !== current.id));

    try {
      const result = await api.post('/swipe', { toUserId: current.userId, action });
      if (result.isMatched && result.match) {
        setCelebrating({
          id: result.match.id,
          profile: current,
        });
      }
    } catch (error) {
      console.error('Swipe Failed', error);
    }
  };

  const triggerLoveBurst = (action) => {
    if (action === 'FIRE_LIKE') {
      setCelebrating((prev) => prev ?? { id: 'superlike', profile: stack[0] });
    }
  };

  const handleBlock = async function () {
    const current = stack[0];
    if (!current) return;
    await api.post('/safety/block', { userId: current.userId });
    setStack((prev) => prev.slice(1));
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
        <p className="font-mono text-xs uppercase tracking-widest text-[#918781]">Loading your feed...</p>
      </main>
    );
  }

  const topCard = stack[0];
  const nextCard = stack[1];

  return (
    <div className="flex min-h-screen bg-[#faf7f2] text-[#292321]">
      <DiscoverSidebar user={user} />

      {celebrating && <MatchBanner match={celebrating} onDismiss={() => setCelebrating(null)} />}

      <main className="relative flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_24%_18%,rgba(237,89,100,0.10),transparent_38%),radial-gradient(ellipse_at_78%_75%,rgba(244,196,48,0.13),transparent_34%),linear-gradient(135deg,#fcfaf7_0%,#f7f1ec_100%)]">
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-[#f8dede]/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-[#f5e8ce]/70 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between px-5 pb-3 pt-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f1] text-[#ed5964] md:hidden">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <div>
              <h1 className="font-sans text-2xl font-extrabold tracking-tight text-[#292321] sm:text-3xl">Discover</h1>
              <p className="mt-0.5 hidden text-sm text-[#827871] sm:block">A little closer to someone wonderful.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-semibold text-[#6e625d] shadow-sm sm:flex">
              <Sparkles className="h-4 w-4 text-[#e75a67]" />
              Made for you
            </span>
            <Link
              href="/profile"
              aria-label="Open your profile"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#f7dedf] font-semibold text-[#9d4c50] shadow-sm transition hover:scale-105"
            >
              {user?.profile?.photos?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile.photos[0].url} alt="" className="h-full w-full object-cover" />
              ) : (
                (user?.profile?.displayName || user?.email || 'Y')[0]?.toUpperCase()
              )}
            </Link>
          </div>
        </header>

        <nav aria-label="Mobile navigation" className="relative z-10 flex items-center gap-1 overflow-x-auto border-y border-[#eadfd8]/70 bg-white/45 px-3 py-2 md:hidden">
          <span className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#aaa19c]" title="Dashboard coming soon">
            <Home className="h-4 w-4" />
            Dashboard
          </span>
          <Link href="/discover" aria-current="page" className="flex shrink-0 items-center gap-2 rounded-xl bg-[#fff0f1] px-3 py-2 text-xs font-semibold text-[#e95161]">
            <Sparkles className="h-4 w-4" />
            Discover
          </Link>
          <Link href="/matches" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#655d58]">
            <MessageCircle className="h-4 w-4" />
            Messages
          </Link>
          <Link href="/profile" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#655d58]">
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
        </nav>

        <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-7 pt-2 sm:pb-10">
          <div className="relative h-[min(56vh,480px)] min-h-[330px] w-[min(88vw,410px)] sm:h-[min(66vh,560px)] sm:min-h-[370px]">
            <div className="pointer-events-none absolute inset-0 translate-x-4 translate-y-3 rotate-3 rounded-[30px] border border-white/80 bg-white/65 shadow-[0_20px_50px_-28px_rgba(74,49,39,0.28)]" />
            <div className="pointer-events-none absolute inset-0 -translate-x-3 translate-y-2 -rotate-2 rounded-[30px] border border-white/80 bg-white/80 shadow-[0_20px_50px_-28px_rgba(74,49,39,0.25)]" />

          {fetching && stack.length === 0 && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[30px] border border-white/80 bg-white/90 p-8 text-center shadow-xl backdrop-blur-xl">
              <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-[#ed5964]/30 animate-ping" />
                <div className="absolute inset-3 rounded-full border border-[#ed5964]/30 animate-pulse" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#ed5964] text-white shadow-[0_8px_24px_rgba(237,89,100,0.28)]">
                  <Heart className="h-5 w-5 fill-current" />
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#332d29]">Finding your people</h3>
              <p className="mt-2 text-sm text-[#827871]">Curating profiles just for you...</p>
            </div>
          )}

          {feedError && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[30px] border border-dashed border-[#ed5964]/30 bg-white/90 p-8 text-center shadow-xl">
              <p className="text-sm text-[#a33c48]">{feedError}</p>
              <Button variant="secondary" className="mt-4" onClick={fetchFeed}>
                Try again
              </Button>
            </div>
          )}

          {!topCard && !fetching && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[30px] border border-white/80 bg-white/85 p-8 text-center shadow-xl backdrop-blur-lg">
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f1] text-[#ed5964]">
                <Heart className="h-6 w-6" />
              </span>
              <h3 className="font-display text-2xl font-bold text-[#332d29]">You're all caught up</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#827871]">
                You've reviewed your current stack. Check back soon for new profiles in your area.
              </p>
            </div>
          )}

          {nextCard && (
            <div className="pointer-events-none absolute inset-0 scale-[0.97] translate-y-2 opacity-70 transition-all duration-500">
              <ProfileCard key={nextCard.id} profile={nextCard} />
            </div>
          )}

          {topCard && (
            <SwipeableCard
              key={topCard.id}
              profile={topCard}
              onSwipe={handleSwipe}
              onTap={() => setViewingDetail(true)}
              disabled={swiping}
              triggerAction={buttonAction}
              topRightSlot={
                <ActionMenu
                  trigger={
                    <button
                      aria-label="More options"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/25 text-white shadow-sm backdrop-blur-md transition hover:bg-black/40"
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

          {topCard && (
            <>
            <div className="mt-7 flex items-center justify-center gap-4 sm:gap-5">
            <button
              onClick={() => setViewingDetail(true)}
              disabled={swiping}
              aria-label="Profile Info"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e6ddd6] bg-white/80 text-[#71655f] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#edc0c3] hover:text-[#e95161] hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              <Info className="h-5 w-5" />
            </button>

            <button
              onClick={() => setButtonAction('PASS')}
              disabled={!topCard || !!buttonAction}
              aria-label="Pass"
              className="group flex h-[60px] w-[60px] items-center justify-center rounded-full border border-[#f1c7c9] bg-white text-[#e95161] shadow-[0_8px_22px_rgba(135,67,61,0.10)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-[#ed5964] hover:bg-[#fff3f3] hover:shadow-[0_12px_28px_rgba(224,83,98,0.18)] active:scale-95 disabled:opacity-50"
            >
              <PassIcon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" stroke="currentColor" />
            </button>

            <button
              onClick={() => {
                triggerLoveBurst('FIRE_LIKE');
                setButtonAction('FIRE_LIKE');
              }}
              disabled={!topCard || !!buttonAction}
              aria-label="Super like"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#f0dfb6] bg-white/85 text-[#bd8a21] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-[#fff9e9] hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              <SuperLikeIcon fill="currentColor" className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            </button>

            <div className="relative">
              {heartAnimating && (
                <>
                  {[0, 90, 180, 270].map((angle, idx) => (
                    <div
                      key={idx}
                      className="absolute inset-0 pointer-events-none flex items-center justify-center animate-heart-orbit z-30"
                      style={{ animationDelay: `${idx * 0.12}s` }}
                    >
                      <HeartIcon fill="#ed5964" className="h-6 w-6 text-[#ed5964] drop-shadow-[0_0_12px_rgba(237,89,100,0.7)]" />
                    </div>
                  ))}
                  <div className="absolute -inset-3 rounded-full border-2 border-[#ed5964]/60 animate-ping pointer-events-none" />
                </>
              )}
              <button
                onClick={handleHeartClick}
                disabled={!topCard || !!buttonAction}
                aria-label="Like"
                className={`group flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#ff7379] via-[#f05268] to-[#dc4059] text-white shadow-[0_12px_30px_rgba(224,68,88,0.32)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_16px_34px_rgba(224,68,88,0.4)] active:scale-95 disabled:opacity-50 ${
                  heartAnimating ? 'animate-heart-pulse-orbit' : ''
                }`}
              >
                <HeartIcon fill="currentColor" className={`h-8 w-8 transition-transform duration-300 ${heartAnimating ? 'scale-125' : 'group-hover:scale-110'}`} />
              </button>
            </div>
          </div>
            <p className="mt-4 text-center text-xs font-medium text-[#968b85]">
              Swipe left to pass <span className="mx-1.5 text-[#c8bcb4]">·</span> Swipe right to like
            </p>
            </>
          )}
        </section>
      </main>

      {/* Modals */}
      <ConfirmModal
        open={confirmBlock}
        title="Block this profile?"
        description="You won't see them again, and they won't see you."
        confirmLabel="Block"
        onConfirm={() => {
          setConfirmBlock(false);
          handleBlock();
        }}
        onCancel={() => setConfirmBlock(false)}
      />

      <ReportModal
        open={reportOpen}
        reportedUserId={topCard?.userId}
        onClose={() => setReportOpen(false)}
      />

      {viewingDetail && topCard && (
        <ProfileDetailModal
          profile={topCard}
          onClose={() => setViewingDetail(false)}
          onLike={() => {
            setViewingDetail(false);
            handleSwipe('LIKE');
          }}
          onPass={() => {
            setViewingDetail(false);
            handleSwipe('PASS');
          }}
        />
      )}

      {selectedLikeUser && topCard && (
        <ProfileMessageModal
          recipientUserId={selectedLikeUser}
          recipientName={topCard.displayName}
          onClose={() => setSelectedLikeUser(null)}
          onSent={() => {
            setSelectedLikeUser(null);
            setFeedError('Message sent!');
            setTimeout(() => setFeedError(null), 3000);
          }}
        />
      )}
    </div>
  );
}

export default function discoverPage() {
  return (
    <VerifiedLayout>
      <DiscoverPageContent />
    </VerifiedLayout>
  );
}