'use client';

import Image from 'next/image';
import { ScrollReveal } from '@/components/ScrollReveal';

const TESTIMONIALS = [
  {
    names: 'Aarav & Meera',
    location: 'Mumbai & Pune',
    tag: 'Matched over 2 AM Momo Debate 🥟',
    quote:
      'I was so tired of dry "Hey" messages on other apps. Aarav sent an AI icebreaker about why butter chicken is overrated, and we ended up talking until 4 AM. 10 months later, we’re planning our first roadtrip!',
    avatar1: '/profile-2.jpg',
    avatar2: '/profile-1.jpg',
  },
  {
    names: 'Dev & Ananya',
    location: 'Bengaluru',
    tag: 'Date Safe Live Location Feature 🛡️',
    quote:
      'As a girl dating in a new city, safety is non-negotiable. The 1-click live location share let me share my date status with my roommate in 5 seconds. Dev turned out to be amazing, but having that peace of mind was everything.',
    avatar1: '/profile-4.jpg',
    avatar2: '/profile-3.jpg',
  },
];

export function Testimonials() {
  return (
    <section id="stories" className="relative px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-saffron">
              Real Stories, Real Connections
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-pearl sm:text-5xl">
              Matched on vibes, not <span className="text-gold italic font-normal">rishta algorithms</span>.
            </h2>
            <p className="mt-4 text-base text-pearl-dim">
              Hear from couples who found their person on Melodis.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.names} delay={i * 150}>
              <div className="group relative overflow-hidden rounded-[2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-saffron/50">
                {/* Avatars */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center -space-x-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-plum-surface shadow-md">
                      <Image src={t.avatar1} alt={t.names} fill className="object-cover" />
                    </div>
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-plum-surface shadow-md">
                      <Image src={t.avatar2} alt={t.names} fill className="object-cover" />
                    </div>
                  </div>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-xs font-bold text-gold">
                    {t.tag}
                  </span>
                </div>

                {/* Quote */}
                <blockquote className="mt-6 text-sm leading-relaxed text-pearl italic">
                  "{t.quote}"
                </blockquote>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-plum-border/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-pearl text-base">{t.names}</h4>
                    <p className="font-mono text-xs text-pearl-dim">{t.location}</p>
                  </div>
                  <span className="text-saffron text-lg">♥</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
