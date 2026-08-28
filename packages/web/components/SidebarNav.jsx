'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { SparklesIcon } from './user_interface/Icons';

export function SidebarNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    async function fetchMatches() {
      setLoadingMatches(true);
      try {
        const res = await api.get('/swipe/matches');
        setMatches(res.matches || res || []);
      } catch {
        // Silently fail
      } finally {
        setLoadingMatches(false);
      }
    }
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const userAvatar = user?.profile?.photos?.[0]?.url || null;
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || 'You';

  return (
    <aside className="hidden md:flex w-80 lg:w-[320px] shrink-0 flex-col h-screen sticky top-0 border-r border-plum-border/50 bg-plum-surface/90 backdrop-blur-xl z-30">
      {/* Sidebar Header with User Avatar */}
      <div className="flex items-center justify-between border-b border-plum-border/50 bg-saffron-gradient p-4 text-pearl shadow-sm">
        <Link href="/profile" className="flex items-center gap-3 group">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-pearl/40 bg-plum-night">
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-lg text-pearl">
                {displayName[0]}
              </div>
            )}
          </div>
          <div>
            <p className="font-display font-bold text-sm text-pearl leading-tight group-hover:underline">
              {displayName}
            </p>
            <p className="font-mono text-[10px] uppercase text-pearl-dim">My Profile</p>
          </div>
        </Link>

        {/* Quick Nav Action Icons */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            title="Search"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-plum-night/40 text-pearl hover:bg-plum-night transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link
            href="/explore"
            title="Explore"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-plum-night/40 text-pearl hover:bg-plum-night transition"
          >
            <SparklesIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="grid grid-cols-3 border-b border-plum-border/40 bg-plum-night/50 p-1 text-center font-mono text-[11px] uppercase tracking-wider text-pearl-dim">
        <Link
          href="/discover"
          className={`py-2 rounded-lg transition ${
            pathname === '/discover' ? 'bg-saffron/20 text-saffron font-bold' : 'hover:text-pearl'
          }`}
        >
          Discover
        </Link>
        <Link
          href="/explore"
          className={`py-2 rounded-lg transition ${
            pathname === '/explore' ? 'bg-saffron/20 text-saffron font-bold' : 'hover:text-pearl'
          }`}
        >
          Explore
        </Link>
        <Link
          href="/matches"
          className={`py-2 rounded-lg transition ${
            pathname === '/matches' ? 'bg-saffron/20 text-saffron font-bold' : 'hover:text-pearl'
          }`}
        >
          Matches
        </Link>
      </div>

      {/* Tinder-style Matches / Messages Tabs */}
      <div className="flex border-b border-plum-border/50 bg-plum-surface">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'matches'
              ? 'border-b-2 border-saffron text-saffron'
              : 'text-pearl-dim hover:text-pearl'
          }`}
        >
          Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'messages'
              ? 'border-b-2 border-saffron text-saffron'
              : 'text-pearl-dim hover:text-pearl'
          }`}
        >
          Messages
        </button>
      </div>

      {/* Sidebar List Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingMatches ? (
          <p className="text-center font-mono text-xs text-pearl-dim py-6">Loading matches...</p>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 text-pearl-dim">
            <div className="h-12 w-12 rounded-full border border-plum-border bg-plum-night flex items-center justify-center mb-3">
              <SparklesIcon className="h-6 w-6 text-saffron" />
            </div>
            <p className="font-mono text-xs font-semibold text-pearl">No Matches Yet</p>
            <p className="text-xs text-pearl-dim mt-1 max-w-[200px]">
              Keep swiping on Discover to find your matches!
            </p>
          </div>
        ) : activeTab === 'matches' ? (
          <div className="grid grid-cols-3 gap-3">
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => router.push(`/chat/${match.id}`)}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-plum-border bg-plum-night cursor-pointer transition hover:scale-105"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={match.profile?.photos?.[0]?.url}
                  alt={match.profile?.displayName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-night p-1.5 text-center">
                  <p className="truncate font-mono text-[10px] font-bold text-pearl">
                    {match.profile?.displayName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => router.push(`/chat/${match.id}`)}
                className="flex items-center gap-3 rounded-2xl border border-plum-border/60 bg-plum-night/50 p-2.5 cursor-pointer transition hover:bg-plum-night"
              >
                <div className="h-11 w-11 overflow-hidden rounded-full border border-saffron/40 shrink-0">
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
                  <p className="truncate text-xs text-pearl-dim">Tap to open chat</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
