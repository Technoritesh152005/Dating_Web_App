'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ScrollReveal';

export function FinalCta() {
  const [showQrModal, setShowQrModal] = useState(false);

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
              ⚡ Available on iOS & Android
            </span>

            <h2 className="mt-6 font-display text-3xl font-bold text-pearl sm:text-5xl lg:text-6xl leading-tight">
              Ready to meet someone worth the <br className="hidden sm:inline" />
              <span className="bg-saffron-gradient bg-clip-text text-transparent italic font-normal">
                2 AM chai break?
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-base text-pearl-dim sm:text-lg">
              Join thousands of verified singles finding real vibe chemistry every day.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-saffron-gradient px-9 py-4 font-display text-base font-bold text-pearl shadow-saffron-glow transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto"
              >
                <span>Create Your Free Profile</span>
                <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
              </Link>

              <button
                onClick={() => setShowQrModal(!showQrModal)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-plum-border bg-plum-dark/60 px-7 py-4 font-mono text-sm text-pearl-dim transition-colors hover:border-gold/50 hover:text-pearl sm:w-auto"
              >
                <span>📱 Scan QR for Mobile</span>
              </button>
            </div>

            {/* QR Code Modal Preview */}
            {showQrModal && (
              <div className="mt-8 mx-auto max-w-xs rounded-2xl border border-gold/40 bg-plum-night p-6 shadow-gold-glow animate-heart-pop">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-xs font-bold text-gold">Scan with Phone Camera</span>
                  <button onClick={() => setShowQrModal(false)} className="text-pearl-dim hover:text-pearl text-sm">✕</button>
                </div>
                <div className="flex h-36 w-36 mx-auto items-center justify-center rounded-xl bg-pearl p-2 shadow-inner">
                  {/* Simplified SVG QR Code mockup */}
                  <svg className="h-full w-full text-plum-night" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm9-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v8h-3v-8z" />
                  </svg>
                </div>
                <p className="mt-3 text-[11px] font-mono text-pearl-dim">Instant Download Link for Melodis Dating App</p>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

