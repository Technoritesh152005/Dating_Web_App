'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ScrollReveal';

// Images served from packages/web/public/usecase/
// Add or update use cases and their images here anytime.
const USE_CASES = [
  {
    id: 'LONG_TERM',
    index: '01',
    title: 'Long-term',
    summary: 'For something steady and meant to grow.',
    meaning:
      'Meet people who want to build a real life together—shared values, unhurried conversations, and someone who shows up consistently.',
    image: '/usecase/long_term.jpg',
    alt: 'Couple dancing together at sunset representing long-term relationships',
    tag: 'Steady & intentional',
  },
  {
    id: 'SERIOUS_RELATIONSHIP',
    index: '02',
    title: 'Serious',
    summary: 'Clear expectations from the very first chat.',
    meaning:
      'Skip the guessing games. Connect with people who know what they are looking for and are ready to invest time into a committed relationship.',
    image: '/usecase/serious.jpg',
    alt: 'Couple smiling closely together in black and white portrait',
    tag: 'Committed mindset',
  },
  {
    id: 'CASUAL_DATING',
    index: '03',
    title: 'Casual',
    summary: 'Relaxed, honest, and zero pressure.',
    meaning:
      'Enjoy great company, spontaneous plans, and light-hearted dates where both of you are transparent and completely on the same page.',
    image: '/usecase/casual.jpg',
    alt: 'Couple laughing over drinks at an outdoor cafe',
    tag: 'Easygoing & open',
  },
  {
    id: 'COFFEE_DATE',
    index: '04',
    title: 'Coffee Date',
    summary: 'Trade endless texting for 30 real minutes.',
    meaning:
      'Find people nearby who would rather meet for an afternoon coffee or quick walk this week than spend a month stuck in small talk.',
    image: '/usecase/cofee.jpg',
    alt: 'Two people having coffee together across a cafe table',
    tag: 'Meet in person',
  },
];

export function UseCases() {
  const [hoveredId, setHoveredId] = useState(null);
  const [mobileOpenId, setMobileOpenId] = useState(null);

  const activeCase = USE_CASES.find((item) => item.id === hoveredId) ?? null;

  return (
    <section id="explore" className="border-t border-sand bg-oat/55 px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <p className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-taupe">
                Explore by intention
              </p>
              <h2 className="mt-4 font-display text-3xl font-normal leading-[1.12] tracking-[-0.02em] text-espresso sm:text-5xl">
                Everyone arrives with a{' '}
                <span className="italic text-rosewood">different chapter</span> in mind.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-taupe">
              Inside Explore, switch modes anytime to meet people looking for the exact same pace you are.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-12">
          {/* Left: Clean Minimalist Intention List */}
          <div
            className="divide-y divide-sand border-y border-sand lg:col-span-6"
            onMouseLeave={() => setHoveredId(null)}
          >
            {USE_CASES.map((item) => {
              const isHovered = hoveredId === item.id;
              const isMobileOpen = mobileOpenId === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onFocus={() => setHoveredId(item.id)}
                  onBlur={() => setHoveredId(null)}
                  className="group"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMobileOpenId((prev) => (prev === item.id ? null : item.id))
                    }
                    className="flex w-full items-center justify-between gap-4 py-6 text-left transition-colors focus-visible:outline-none"
                  >
                    <div className="flex items-baseline gap-5">
                      <span
                        className={`font-mono text-xs transition-colors ${
                          isHovered ? 'text-rosewood' : 'text-taupe'
                        }`}
                      >
                        {item.index}
                      </span>
                      <div>
                        <h3
                          className={`font-display text-2xl font-normal tracking-[-0.015em] transition-colors sm:text-3xl ${
                            isHovered ? 'text-rosewood italic' : 'text-espresso'
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-taupe">{item.summary}</p>
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`text-lg transition-transform duration-200 ${
                        isHovered
                          ? 'translate-x-1 text-rosewood'
                          : 'text-taupe/70'
                      }`}
                    >
                      →
                    </span>
                  </button>

                  {/* Mobile / Touch Card (shown on tap below row on < lg screens) */}
                  {isMobileOpen && (
                    <div className="mb-6 overflow-hidden rounded-2xl border border-sand bg-paper p-4 animate-card-reveal lg:hidden">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-oat">
                        <Image
                          src={item.image}
                          alt={item.alt}
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="mt-4">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-rosewood">
                          {item.tag}
                        </span>
                        <p className="mt-1.5 text-sm leading-relaxed text-taupe">
                          {item.meaning}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Hover-Only Floating Card Stage (Desktop) */}
          <div className="hidden lg:col-span-6 lg:flex lg:min-h-[430px] lg:items-center lg:justify-center">
            {activeCase ? (
              <div
                key={activeCase.id}
                className="w-full max-w-md overflow-hidden rounded-[22px] border border-sand bg-paper p-5 shadow-[0_20px_50px_-24px_rgba(24,20,18,0.18)] animate-card-reveal"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-oat">
                  <Image
                    src={activeCase.image}
                    alt={activeCase.alt}
                    fill
                    sizes="420px"
                    className="object-cover"
                  />
                </div>

                <div className="mt-5 px-1 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-rosewood">
                      {activeCase.tag}
                    </span>
                    <span className="font-mono text-[11px] text-taupe">
                      {activeCase.index} / 0{USE_CASES.length}
                    </span>
                  </div>

                  <h4 className="mt-2 font-display text-2xl font-normal text-espresso">
                    {activeCase.title}
                  </h4>

                  <p className="mt-2 text-sm leading-relaxed text-taupe">
                    {activeCase.meaning}
                  </p>

                  <div className="mt-4 border-t border-sand pt-3.5">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-espresso transition-colors hover:text-rosewood"
                    >
                      <span>Explore {activeCase.title} matches</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[380px] w-full max-w-md flex-col items-center justify-center px-8 text-center">
                <p className="font-display text-xl italic text-taupe/75">
                  Hover an intention to preview
                </p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-taupe/65">
                  Move over any option on the left to see what it stands for.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
