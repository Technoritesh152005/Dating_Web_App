'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-linen/90 backdrop-blur-md border-b border-sand py-3.5'
          : 'bg-linen/0 py-5'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-10">
        {/* Brand Wordmark */}
        <Link href="/" className="group flex items-baseline gap-0.5">
          <span className="font-display text-2xl font-medium tracking-[-0.03em] text-espresso">
            Melodis
          </span>
          <span className="font-display text-2xl font-medium text-rosewood">.</span>
        </Link>

        {/* Quiet Navigation Links */}
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-normal text-taupe transition-colors hover:text-espresso"
          >
            Features
          </a>
          <a
            href="#explore"
            className="text-sm font-normal text-taupe transition-colors hover:text-espresso"
          >
            Explore
          </a>
          <a
            href="#journey"
            className="text-sm font-normal text-taupe transition-colors hover:text-espresso"
          >
            Journey
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-taupe transition-colors hover:text-espresso sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-espresso px-5 py-2.5 text-xs font-medium tracking-wide text-linen transition-colors duration-200 hover:bg-rosewood"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
