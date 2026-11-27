'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Images served from packages/web/public/first/
// Add or replace images inside public/first/ and update this list anytime.
const HERO_IMAGES = [
  {
    src: '/first/images (1).jpg',
    alt: 'Couple laughing together while cooking in the kitchen',
    caption: 'Unscripted Sunday mornings',
  },
  {
    src: '/first/images (3).jpg',
    alt: 'Couple smiling outdoors in warm daylight',
    caption: 'Easy laughs, zero small talk',
  },
  {
    src: '/first/today.jpg',
    alt: 'Couple enjoying sunset by the sea',
    caption: 'Moments worth showing up for',
  },
];

const SLIDE_INTERVAL_MS = 3000;

function GooglePlayLogo({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M3.61 1.814L13.793 12 3.61 22.186a1.76 1.76 0 0 1-.61-1.34V3.154c0-.52.226-.994.61-1.34z" />
      <path fill="#34A853" d="M17.114 8.678L13.793 12l3.321 3.322 3.748-2.13c.72-.41.72-1.974 0-2.384l-3.748-2.13z" />
      <path fill="#FBBC05" d="M17.114 15.322L13.793 12 3.61 22.186c.385.344.93.45 1.462.148l12.042-6.812v-.2z" />
      <path fill="#EA4335" d="M3.61 1.814L13.793 12l3.321-3.322L5.072 1.666c-.532-.302-1.077-.196-1.462.148z" />
    </svg>
  );
}

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const currentSlide = HERO_IMAGES[activeIndex];

  return (
    <section className="relative flex min-h-screen items-center bg-linen px-5 pt-24 pb-14 sm:px-10 lg:pt-24 lg:pb-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Mobile: image first, then text. Desktop: text left, image right */}
        <div className="flex flex-col-reverse gap-10 lg:grid lg:grid-cols-12 lg:items-center lg:gap-14">
          {/* Left Column: Text */}
          <div className="lg:col-span-6">
            <p className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-taupe">
              Thoughtful dating, built for real life
            </p>

            <h1 className="mt-4 font-display text-4xl font-normal leading-[1.05] tracking-[-0.025em] text-espresso sm:text-5xl lg:text-[4.25rem]">
              One swipe,{' '}
              <span className="block italic text-rosewood">
                a thousand possibilities.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-taupe sm:text-lg">
              Meet people who are verified by selfie, start conversations that feel natural, and head out with private date safety built right in.
            </p>

            {/* Primary Actions — full-width stack on mobile, inline on sm+ */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-linen transition-colors duration-200 hover:bg-rosewood sm:w-auto"
              >
                <span>Create your profile</span>
                <span aria-hidden="true" className="text-base leading-none">→</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-sand bg-paper px-6 py-3.5 text-sm font-medium text-espresso transition-colors duration-200 hover:border-espresso/40 sm:w-auto"
              >
                Sign in
              </Link>
            </div>

            {/* Coming soon on Google Play Store */}
            <div className="mt-8 border-t border-sand pt-6">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-sand bg-paper px-4 py-2.5 shadow-[0_1px_2px_rgba(24,20,18,0.04)]">
                <GooglePlayLogo className="h-6 w-6 shrink-0" />
                <div className="leading-tight">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-taupe">Coming soon on</p>
                  <p className="text-sm font-semibold tracking-tight text-espresso">Google Play</p>
                </div>
                <span className="ml-1 rounded-full bg-oat px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-taupe">
                  Android
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Rotating Photo Showcase */}
          <div className="lg:col-span-6">
            <div className="mx-auto w-full max-w-sm sm:max-w-[400px] lg:ml-auto lg:mr-0 lg:max-w-[440px]">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] border border-sand bg-oat lg:aspect-[4/5]">
                {HERO_IMAGES.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={item.src}
                      aria-hidden={!isActive}
                      className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isActive
                          ? 'z-10 opacity-100 scale-100'
                          : 'z-0 opacity-0 scale-[1.05] pointer-events-none'
                      }`}
                    >
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 400px, 440px"
                        priority={idx === 0}
                        className="object-cover"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Caption & Progress Controls */}
              <div className="mt-4 flex items-center justify-between gap-4 px-1">
                <p className="text-xs text-taupe transition-opacity duration-500">
                  <span className="font-mono text-espresso">0{activeIndex + 1}</span>
                  <span className="mx-2 text-sand">/</span>
                  <span>{currentSlide.caption}</span>
                </p>

                <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero showcase slides">
                  {HERO_IMAGES.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={item.src}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`View photo ${idx + 1}`}
                        aria-selected={isActive}
                        className="group py-2"
                      >
                        <span className="relative block h-[2px] w-7 overflow-hidden rounded-full bg-sand">
                          {isActive && (
                            <span
                              key={`bar-${activeIndex}`}
                              className="absolute inset-0 origin-left bg-espresso animate-progress-fill"
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
