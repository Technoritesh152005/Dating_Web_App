'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-plum-night/85 backdrop-blur-xl border-b border-plum-border/40 py-4 shadow-plum-glow'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-gradient p-0.5 shadow-saffron-glow transition-transform duration-300 group-hover:scale-105">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-plum-night">
              <span className="font-display text-xl font-bold text-saffron">M</span>
            </div>
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight text-pearl">
            Melodis<span className="text-saffron font-bold">.</span>
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-pearl-dim transition-colors hover:text-saffron"
          >
            Features
          </a>
          <a
            href="#safety"
            className="text-sm font-medium text-pearl-dim transition-colors hover:text-saffron"
          >
            Date Safety
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-pearl-dim transition-colors hover:text-saffron"
          >
            How It Works
          </a>
          <a
            href="#stories"
            className="text-sm font-medium text-pearl-dim transition-colors hover:text-saffron"
          >
            Desi Stories
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden font-mono text-xs uppercase tracking-wider text-pearl-dim transition-colors hover:text-pearl sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="relative group overflow-hidden rounded-full bg-saffron-gradient px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-pearl shadow-saffron-glow transition-all duration-300 hover:shadow-saffron-glow/80 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Get App</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
          </Link>
        </div>
      </div>
    </header>
  );
}

