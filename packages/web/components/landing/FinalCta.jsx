'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/ScrollReveal';

export function FinalCta() {
  return (
    <section className="relative px-6 py-28 sm:px-10 overflow-hidden">
      {/* Background Radial Sunset Glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[40rem] w-[40rem] rounded-full bg-saffron/20 blur-[150px] animate-pulse-glow" />
      </div>

      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-saffron/40 bg-gradient-to-b from-plum-surface/90 to-plum-night/95 p-10 text-center shadow-2xl backdrop-blur-2xl sm:p-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 font-mono text-xs font-bold text-gold">
              Verified Profiles & Authentic Connections
            </span>

            <h2 className="mt-6 font-display text-3xl font-bold text-pearl sm:text-5xl lg:text-6xl leading-tight">
              Ready to meet someone worth the <br className="hidden sm:inline" />
              <span className="bg-saffron-gradient bg-clip-text text-transparent italic font-normal">
                late night chai break?
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-base text-pearl-dim sm:text-lg">
              Join verified singles finding real vibe chemistry every day.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-saffron-gradient px-9 py-4 font-display text-base font-bold text-pearl shadow-saffron-glow transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto"
              >
                <span>Create Your Free Profile</span>
                <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
