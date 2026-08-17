'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import { api } from '../../lib/api'
import { ProfileCard } from '../../components/ProfileCard'
import { MatchBanner } from '../../components/MatchCelebration'
import { Button } from '../../components/user_interface/Button'
import { FiltersDrawer } from '@/components/FiltersDrawer';
import { NavBar } from '@/components/NavBar';
import { ActionMenu, ActionMenuItem } from '@/components/ActionMenu';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ReportModal } from '@/components/ReportModal';
import {ProfileDetailModal} from '@/components/ProfileDetailModel'


const LOW_STACK_THRESHOLD = 3

export default function discoverPage() {

    /* only discover the feed when user is logged in */
    const { user, loading } = useAuth()
    const [stack, setStack] = useState([])
    const router = useRouter()
    const [fetching, setFetching] = useState(false)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [celebrating , setCelebrating] = useState(null)
    const [swiping, setSwiping] = useState(false)
    const [confirmBlock , setConfrimBlock] = useState(false)
    const [reportOpen , setReportOpen] = useState(false)
    const [viewingDetail , setViewingDetail] = useState(false)



    const fetchFeed = useCallback(async () => {

        setFetching(true)
        try {
            const { profiles } = await api.get('/discovery/feed')
            /* set the profile elements in stack  */
            /* at each stage it checks one element of profiles with existing profiles in stack. if both id found duplocate it send true and !true becomes false
            so this element is not kept in setStack... Filters requires boolean condition to keep the current element
            */
            setStack((prev) => [...prev, ...profiles.filter((p) => !prev.some((existing) => existing.id === p.id))])
        } finally {
            setFetching(false)
        }

    }, [])

    /* if any one of the dependencies changed run useffect */
    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return;
        }
        fetchFeed()
    }, [user, loading, router, fetchFeed])

    /* when the stack list has only threshold amount of profiles , it fetch the fetchFeed */
    useEffect(() => {
        /* at each stage user scrolls this useEffect runs. so at each stage u check this threshold limit */
        if (stack.length <= LOW_STACK_THRESHOLD && !fetching) {
            fetchFeed()
        }
    }, [stack.length])

    const handleSwipe = async (action) => {
        //current profile
        const current = stack[0]
        if (!current || swiping) return

        setSwiping(true)
        /* keep other right side part of profile */
        setStack((prev) => prev.slice(1))
        try {
            const result = await api.post('/swipe', { toUserId: current.userId, action })
            if (result.matched) {
                setCelebrating({ name: current.displayName })
            }
        } catch (error) {
            console.error('Swipe Failed', err)
        } finally {
            setSwiping(false)
        }

    }


    const handleBlock = async function(){
        const current = stack[0]
        if(!current) return 
        await api.post('/safety/block', {userId:current.userId})
        setStack((prev)=> prev.slice(1))

    }
    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        );
    }

    const topCard = stack[0];
    const nextCard = stack[1];

    return (
        <main className="relative flex min-h-screen flex-col items-center bg-ink px-6 pb-10 pt-6">
          {celebrating && <MatchCelebration match={celebrating} onDismiss={() => setCelebrating(null)} />}
    
          <div className="flex w-full max-w-sm items-center justify-between">
            <NavBar />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            aria-label="Filters"
            className="mt-3 flex h-9 w-9 self-end items-center justify-center rounded-full border border-cream/15 text-cream-dim hover:border-marigold/50 hover:text-marigold sm:absolute sm:right-6 sm:top-6 sm:mt-0"
          >
            <span className="font-mono text-[13px]">⚙</span>
          </button>
    
          <div className="relative mt-6 h-[560px] w-full max-w-sm">
            {!topCard && !fetching && (
              <div className="flex h-full flex-col items-center justify-center rounded-card border border-dashed border-cream/15 text-center">
                <p className="font-display text-xl text-cream">You're all caught up</p>
                <p className="mt-2 max-w-[220px] text-[14px] text-cream-dim">
                  Check back soon, or widen your filters to see more people.
                </p>
                <Button variant="secondary" className="mt-4" onClick={() => setFiltersOpen(true)}>
                  Adjust filters
                </Button>
              </div>
            )}
    
            {nextCard && <ProfileCard profile={nextCard} style={{ transform: 'scale(0.96) translateY(10px)', opacity: 0.6 }} />}
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
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/40 text-cream backdrop-blur-sm"
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
            <div className="mt-6 flex items-center gap-6">
              <button
                onClick={() => handleSwipe('PASS')}
                disabled={swiping}
                aria-label="Pass"
                className="flex h-16 w-16 items-center justify-center rounded-full border border-cream/15 bg-dusk text-2xl text-cream-dim transition-transform hover:scale-105 hover:border-cream/30 disabled:opacity-50"
              >
                ✕
              </button>
              <button
                onClick={() => handleSwipe('LIKE')}
                disabled={swiping}
                aria-label="Like"
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-sindoor to-marigold text-3xl text-ink shadow-[0_12px_32px_-8px_rgba(230,57,80,0.6)] transition-transform hover:scale-105 disabled:opacity-50"
              >
                ♥
              </button>
            </div>
          )}
    
          <FiltersDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} onSaved={() => { setStack([]); fetchFeed(); }} />
    
          <ConfirmModal
            open={confirmBlock}
            title="Block this profile?"
            description="You won't see them again, and they won't see you."
            confirmLabel="Block"
            onConfirm={() => { setConfirmBlock(false); handleBlock(); }}
            onCancel={() => setConfirmBlock(false)}
          />
          <ReportModal open={reportOpen} reportedUserId={topCard?.userId} onClose={() => setReportOpen(false)} />
    
          {viewingDetail && topCard && (
            <ProfileDetailModal
              profile={topCard}
              onClose={() => setViewingDetail(false)}
              onLike={() => { setViewingDetail(false); handleSwipe('LIKE'); }}
              onPass={() => { setViewingDetail(false); handleSwipe('PASS'); }}
            />
          )}
        </main>
      );

}