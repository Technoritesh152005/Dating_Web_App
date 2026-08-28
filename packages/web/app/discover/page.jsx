'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { SidebarNav } from '@/components/SidebarNav';
import { HeartIcon, SuperLikeIcon, PassIcon } from '@/components/user_interface/Icons';

const LOW_STACK_THRESHOLD = 3;

function DiscoverPageContent() {
  const { user, loading } = useAuth();
  const [stack, setStack] = useState([]);
  const router = useRouter();
  const [fetching, setFetching] = useState(false);
  const [celebrating, setCelebrating] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewingDetail, setViewingDetail] = useState(false);
  const [feedError, setFeedError] = useState(null);

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
    if (!current || swiping) return;

    setSwiping(true);
    setStack((prev) => prev.slice(1));
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
    } finally {
      setSwiping(false);
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
      <main className="flex min-h-screen items-center justify-center bg-plum-night">
        <p className="font-mono text-xs uppercase tracking-widest text-pearl-dim">Loading matches...</p>
      </main>
    );
  }

  const topCard = stack[0];
  const nextCard = stack[1];

  return (
    <div className="flex min-h-screen bg-plum-night text-pearl">
      {/* Left 25% Sidebar Navigation */}
      <SidebarNav />

      {celebrating && <MatchBanner match={celebrating} onDismiss={() => setCelebrating(null)} />}

      {/* Main Swipeable Profile Area */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        <div className="relative h-[620px] w-full max-w-md">
          {feedError && (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-sindoor/40 bg-plum-surface/60 p-8 text-center">
              <p className="text-sm text-sindoor-light font-mono">{feedError}</p>
              <Button variant="secondary" className="mt-4" onClick={fetchFeed}>
                Try again
              </Button>
            </div>
          )}

          {!topCard && !fetching && (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-plum-border bg-plum-surface/60 p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-pearl">You're all caught up</h3>
              <p className="mt-2 text-xs text-pearl-dim max-w-xs leading-relaxed font-sans">
                You've reviewed your current stack. Check back soon for new profiles in your area.
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

        {/* Action Controls Bar */}
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
                triggerLoveBurst('FIRE_LIKE');
                handleSwipe('FIRE_LIKE');
              }}
              disabled={swiping}
              aria-label="Super like"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-gold-glow transition-all duration-200 hover:scale-110 hover:bg-gold/20 active:scale-95 disabled:opacity-50"
            >
              <SuperLikeIcon fill="currentColor" className="h-6 w-6" />
            </button>

            {/* Like Button (Vibrant Saffron Heart) */}
            <button
              onClick={() => handleSwipe('LIKE')}
              disabled={swiping}
              aria-label="Like"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-saffron-gradient text-pearl shadow-saffron-glow transition-all duration-250 hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              <HeartIcon fill="currentColor" className="h-9 w-9" />
            </button>
          </div>
        )}
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