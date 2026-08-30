'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/connectSocket';
import { MatchCelebration } from './MatchCelebration';
import { SparklesIcon, HeartIcon } from './user_interface/Icons';

export function SidebarNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('likes');
  const [likes, setLikes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [matches, setMatches] = useState([]);
  
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  
  const [celebratedMatch, setCelebratedMatch] = useState(null);
  const [selectedLikeUser, setSelectedLikeUser] = useState(null);

  const fetchLikes = useCallback(async () => {
    setLoadingLikes(true);
    try {
      const res = await api.get('/swipe/likes');
      setLikes(res.likes || []);
    } catch {
      setLikes([]);
    } finally {
      setLoadingLikes(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const res = await api.get('/profile-messages');
      setMessages(res.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const res = await api.get('/swipe/matches');
      setMatches(res.matches || res || []);
    } catch {
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchLikes();
      fetchMessages();
      fetchMatches();

      const socket = connectSocket();
      socket.on('match:created', (data) => {
        fetchMatches();
        if (data?.partner) {
          setCelebratedMatch({
            id: data.matchId,
            profile: data.partner,
          });
        }
      });

      // Listen for new profile messages
      socket.on('profile-message:received', () => {
        fetchMessages();
      });

      // Listen for new likes
      socket.on('swipe:like-received', () => {
        fetchLikes();
      });

      return () => {
        socket.off('match:created');
        socket.off('profile-message:received');
        socket.off('swipe:like-received');
      };
    }
  }, [user, fetchLikes, fetchMessages, fetchMatches]);

  const [avatarError, setAvatarError] = useState(false);
  const userAvatar = user?.profile?.photos?.[0]?.url || null;
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || 'You';
  const initial = displayName ? displayName[0].toUpperCase() : 'Y';

  const handleMessageSender = async (userId) => {
    // Open message composer or navigate to chat if match exists
    const existingMatch = matches.find(m => m.otherUser?.userId === userId);
    if (existingMatch) {
      router.push(`/chat/${existingMatch.matchId}`);
    } else {
      // Open profile message composer
      setSelectedLikeUser(userId);
    }
  };

  return (
    <aside className="hidden md:flex w-[360px] lg:w-[400px] shrink-0 flex-col h-screen sticky top-0 border-r border-plum-border/50 bg-plum-surface/90 backdrop-blur-xl z-30">
      {/* Sidebar Header with User Avatar */}
      <div className="flex items-center justify-between border-b border-plum-border/50 bg-saffron-gradient p-5 text-pearl shadow-md">
        <Link href="/profile" className="flex items-center gap-3.5 group">
          <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-pearl/60 bg-plum-night shadow-md shrink-0 flex items-center justify-center">
            {userAvatar && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt={displayName}
                onError={() => setAvatarError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-plum-dark to-saffron/40 font-display text-xl font-bold text-pearl">
                {initial}
              </div>
            )}
          </div>
          <div>
            <p className="font-sans font-extrabold text-base text-pearl leading-tight tracking-tight group-hover:underline">
              {displayName}
            </p>
            <p className="font-mono text-xs uppercase tracking-wider font-bold text-pearl/90 mt-0.5">MY PROFILE</p>
          </div>
        </Link>

        {/* Quick Nav Action Icons */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            title="Search Matches"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-plum-night/40 text-pearl hover:bg-plum-night/80 hover:scale-105 border border-pearl/20 transition-all shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link
            href="/explore"
            title="Explore Profiles"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-plum-night/40 text-pearl hover:bg-plum-night/80 hover:scale-105 border border-pearl/20 transition-all shadow-sm"
          >
            <SparklesIcon className="h-5 w-5" />
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

      {/* LIKES / MESSAGES / MATCHES Tabs */}
      <div className="flex border-b border-plum-border/50 bg-plum-surface">
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'likes'
              ? 'border-b-2 border-saffron text-saffron'
              : 'text-pearl-dim hover:text-pearl'
          }`}
        >
          Likes ({likes.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'messages'
              ? 'border-b-2 border-saffron text-saffron'
              : 'text-pearl-dim hover:text-pearl'
          }`}
        >
          Messages ({messages.length})
        </button>
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
      </div>

      {/* Sidebar List Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* LIKES TAB */}
        {activeTab === 'likes' && (
          <>
            {loadingLikes ? (
              <p className="text-center font-mono text-xs text-pearl-dim py-6">Loading likes...</p>
            ) : likes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 text-pearl-dim">
                <div className="h-12 w-12 rounded-full border border-plum-border bg-plum-night flex items-center justify-center mb-3">
                  <HeartIcon className="h-6 w-6 text-saffron" />
                </div>
                <p className="font-mono text-xs font-semibold text-pearl">No Likes Yet</p>
                <p className="text-xs text-pearl-dim mt-1 max-w-[200px]">
                  Keep swiping on Discover and someone will like you!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {likes.map((like) => (
                  <div
                    key={like.id}
                    className="group relative rounded-2xl border border-plum-border/60 bg-plum-night/50 p-3 cursor-pointer transition hover:bg-plum-night overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      {/* Profile Photo */}
                      <div className="h-14 w-14 overflow-hidden rounded-xl border border-saffron/40 shrink-0 flex items-center justify-center bg-plum-dark">
                        {like.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={like.photoUrl}
                            alt={like.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-xs font-bold text-saffron">
                            {like.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 overflow-hidden min-w-0">
                        <p className="truncate font-mono text-xs font-bold text-pearl">
                          {like.displayName}
                        </p>
                        <p className="truncate text-xs text-pearl-dim">
                          Liked {new Date(like.likedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Message Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageSender(like.userId);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/20 text-saffron hover:bg-saffron/40 transition shrink-0 border border-saffron/40"
                        title="Message"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <>
            {loadingMessages ? (
              <p className="text-center font-mono text-xs text-pearl-dim py-6">Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 text-pearl-dim">
                <div className="h-12 w-12 rounded-full border border-plum-border bg-plum-night flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-saffron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-mono text-xs font-semibold text-pearl">No Messages Yet</p>
                <p className="text-xs text-pearl-dim mt-1 max-w-[200px]">
                  Receive messages from people who like you!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageSender(message.userId)}
                    className="group relative rounded-2xl border border-plum-border/60 bg-plum-night/50 p-3 cursor-pointer transition hover:bg-plum-night"
                  >
                    <div className="flex items-center gap-3">
                      {/* Profile Photo */}
                      <div className="h-11 w-11 overflow-hidden rounded-full border border-saffron/40 shrink-0 flex items-center justify-center bg-plum-dark">
                        {message.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={message.photoUrl}
                            alt={message.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-xs font-bold text-saffron">
                            {message.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 overflow-hidden min-w-0">
                        <p className="truncate font-mono text-xs font-bold text-pearl">
                          {message.displayName}
                        </p>
                        <p className="truncate text-xs text-pearl-dim">
                          {message.lastMessage}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!message.readAt && (
                        <div className="h-2 w-2 rounded-full bg-saffron shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <>
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
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {matches.map((match) => (
                  <div
                    key={match.matchId || match.id}
                    onClick={() => router.push(`/chat/${match.matchId || match.id}`)}
                    className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-plum-border bg-plum-night cursor-pointer transition hover:scale-105"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={match.profile?.photos?.[0]?.url || match.otherUser?.photos?.[0]?.url}
                      alt={match.profile?.displayName || match.otherUser?.displayName}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-night p-1.5 text-center">
                      <p className="truncate font-mono text-[10px] font-bold text-pearl">
                        {match.profile?.displayName || match.otherUser?.displayName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {celebratedMatch && (
        <MatchCelebration match={celebratedMatch} onDismiss={() => setCelebratedMatch(null)} />
      )}
    </aside>
  );
}