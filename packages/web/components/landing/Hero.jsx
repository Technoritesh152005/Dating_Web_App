'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HERO_PROFILES = [
  {
    id: 1,
    name: 'Aanya',
    age: 24,
    city: 'South Delhi',
    profession: 'Architect',
    image: '/profile-1.jpg',
    tags: ['Filter Coffee ☕', 'Indie Music 🎵', 'Late Night Drives 🚗'],
    bio: 'Looking for someone who won’t judge my 2 AM Maggi recipes.',
    matchVibe: '98% Vibe Match',
  },
  {
    id: 2,
    name: 'Rohan',
    age: 26,
    city: 'Bengaluru',
    profession: 'Tech Founder',
    image: '/profile-2.jpg',
    tags: ['Momo Connoisseur 🥟', 'Stand-up Fan 🎙️', 'Treks 🏔️'],
    bio: 'Can debate North vs South food for hours. Coffee on me?',
    matchVibe: '95% Vibe Match',
  },
  {
    id: 3,
    name: 'Priya',
    age: 25,
    city: 'Mumbai',
    profession: 'UX Designer',
    image: '/profile-3.jpg',
    tags: ['Kathak Dancer 💃', 'Sunset Lover 🌅', 'Chai > Tea 🫖'],
    bio: 'Design nerd by day, karaoke superstar by night.',
    matchVibe: '99% Vibe Match',
  },
  {
    id: 4,
    name: 'Kabir',
    age: 27,
    city: 'Gurgaon',
    profession: 'Product Lead',
    image: '/profile-4.jpg',
    tags: ['Himachal Trips 🏔️', 'Dog Lover 🐶', 'Vinyl Collector 📻'],
    bio: 'Always down for live music gigs & street food hunting.',
    matchVibe: '94% Vibe Match',
  },
];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState(null); // 'like', 'pass', 'super'
  const [showMatchToast, setShowMatchToast] = useState(false);

  const activeProfile = HERO_PROFILES[currentIndex];

  const handleAction = (type) => {
    setSwipeState(type);
    if (type === 'like' || type === 'super') {
      setShowMatchToast(true);
      setTimeout(() => setShowMatchToast(false), 3000);
    }
    setTimeout(() => {
      setSwipeState(null);
      setCurrentIndex((prev) => (prev + 1) % HERO_PROFILES.length);
    }, 400);
  };

  return (
    <section className="relative min-h-[92vh] overflow-hidden px-6 pt-32 pb-20 sm:px-10 lg:pt-36">
      {/* Background Animated Glowing Orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-20 h-[32rem] w-[32rem] rounded-full bg-saffron/20 blur-[130px] animate-pulse-glow" />
        <div
          className="absolute -right-32 top-40 h-[36rem] w-[36rem] rounded-full bg-plum/40 blur-[140px] animate-float-slow"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute left-1/3 bottom-10 h-80 w-80 rounded-full bg-gold/15 blur-[120px] animate-pulse-glow"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Hero Text Column */}
          <div className="text-center lg:col-span-7 lg:text-left">
            {/* Main Professional Headline */}
            <h1 className="font-display text-4xl leading-[1.08] font-bold text-pearl sm:text-6xl lg:text-6xl">
              Connect on Compatibility.{' '}
              <span className="bg-saffron-gradient bg-clip-text text-transparent font-semibold">
                Date with Complete Confidence.
              </span>
            </h1>

            {/* Professional Subheadline */}
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pearl-dim sm:text-xl">
              AI-powered identity verification, automated icebreakers, and real-time live location security engineered for authentic relationships.
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-saffron-gradient px-8 py-4 text-base font-semibold text-pearl shadow-saffron-glow transition-all duration-300 hover:shadow-saffron-glow/90 hover:scale-[1.02] active:scale-98 sm:w-auto"
              >
                <span>Create Free Account</span>
                <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-2xl border border-plum-border bg-plum-surface/40 px-7 py-4 font-mono text-sm uppercase tracking-wider text-pearl-dim backdrop-blur-md transition-all duration-300 hover:border-saffron/50 hover:text-pearl sm:w-auto"
              >
                Log in
              </Link>
            </div>

            {/* Social Trust Highlights */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-pearl-muted lg:justify-start font-mono">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mehendi/20 text-mehendi font-bold">✓</span>
                <span>AWS Rekognition Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold font-bold">★</span>
                <span>Vector Embedding Compatibility</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-saffron/20 text-saffron font-bold">🛡️</span>
                <span>Tokenized Date Safety</span>
              </div>
            </div>
          </div>


          {/* Right Interactive Profile Card Stack Column */}
          <div className="relative flex justify-center lg:col-span-5">
            {/* Floating Match Celebration Toast */}
            {showMatchToast && (
              <div className="absolute -top-12 z-30 flex items-center gap-3 rounded-2xl border border-gold/40 bg-plum-surface/95 px-5 py-3 shadow-gold-glow backdrop-blur-xl animate-heart-pop">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-display text-sm font-bold text-gold">It's a Vibe Match!</p>
                  <p className="text-xs text-pearl-dim">AI Icebreaker generated: "Coffee or Chai debate?"</p>
                </div>
              </div>
            )}

            {/* Profile Card Container */}
            <div className="relative w-full max-w-xs sm:max-w-sm">
              {/* Back Decorative Card */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] bg-plum-dark/60 border border-plum-border/50 backdrop-blur-md" />

              {/* Main Active Card */}
              <div
                className={`relative overflow-hidden rounded-[2rem] border border-plum-border bg-plum-surface shadow-2xl transition-all duration-300 ${
                  swipeState === 'like'
                    ? 'translate-x-12 rotate-6 opacity-0'
                    : swipeState === 'pass'
                    ? '-translate-x-12 -rotate-6 opacity-0'
                    : swipeState === 'super'
                    ? '-translate-y-12 scale-105 opacity-0'
                    : 'translate-x-0 rotate-0 opacity-100'
                }`}
              >
                {/* Image Header */}
                <div className="relative h-96 w-full overflow-hidden">
                  <Image
                    src={activeProfile.image}
                    alt={activeProfile.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum-night via-transparent to-transparent" />

                  {/* Verification Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-mehendi/40 bg-plum-night/80 px-3 py-1 text-[11px] font-semibold text-mehendi-light backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-mehendi" />
                    Verified Selfie
                  </div>

                  {/* Vibe Badge */}
                  <div className="absolute top-4 right-4 rounded-full border border-gold/40 bg-plum-night/80 px-3 py-1 font-mono text-[11px] font-bold text-gold backdrop-blur-md">
                    {activeProfile.matchVibe}
                  </div>

                  {/* Profile Name & Details Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-display text-2xl font-bold text-pearl">
                      {activeProfile.name}, <span className="font-normal text-pearl-dim">{activeProfile.age}</span>
                    </h3>
                    <p className="text-xs font-mono text-gold mt-0.5">
                      {activeProfile.profession} • {activeProfile.city}
                    </p>
                  </div>
                </div>

                {/* Card Body & Interest Pills */}
                <div className="p-5">
                  <p className="text-xs leading-relaxed italic text-pearl-dim">
                    "{activeProfile.bio}"
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {activeProfile.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-plum-dark/80 px-2.5 py-1 font-mono text-[11px] text-pearl-dim border border-plum-border/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons (Pass, Super Like, Swipe Right) */}
                  <div className="mt-5 flex items-center justify-around gap-3 pt-2 border-t border-plum-border/40">
                    <button
                      onClick={() => handleAction('pass')}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-plum-border bg-plum-night/80 text-pearl-dim transition-all hover:border-saffron/60 hover:text-saffron hover:scale-110 active:scale-95"
                      title="Pass"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => handleAction('super')}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-gold/10 text-gold shadow-gold-glow transition-all hover:bg-gold/20 hover:scale-110 active:scale-95"
                      title="Super Like"
                    >
                      ★
                    </button>
                    <button
                      onClick={() => handleAction('like')}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-gradient text-pearl shadow-saffron-glow transition-all hover:scale-110 active:scale-95"
                      title="Like / Swipe Right"
                    >
                      <span className="text-xl">♥</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

