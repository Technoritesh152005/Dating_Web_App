'use client';

import { ScrollReveal } from '@/components/ScrollReveal';

const STEPS = [
  {
    number: '01',
    badge: 'Verification',
    title: 'Selfie Identity Check',
    description:
      'A 3-second live selfie check verifies your photos before your profile goes live. Zero fake profiles, zero sketchy surprises.',
  },
  {
    number: '02',
    badge: 'Vector Match',
    title: 'Discover Real Vibe Compatibility',
    description:
      'Our system matches you based on your bio embeddings, music tastes, lifestyle preferences, and conversation intent.',
  },
  {
    number: '03',
    badge: 'Date & Connect',
    title: 'Spark the Chat & Date Safe',
    description:
      'Eliminate dry initial messages using automated icebreakers, and share 1-Click live location security with your trusted contact.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <div className="text-center">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Simple 3-Step Journey
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-pearl sm:text-5xl">
              Three steps. <span className="text-saffron italic font-normal">Zero awkwardness.</span>
            </h2>
            <p className="mt-4 text-base text-pearl-dim">
              From selfie verification to your first authentic conversation in 3 easy steps.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative mt-20">
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-saffron via-gold to-plum-border sm:left-10" />

          <div className="flex flex-col gap-12">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 120}>
                <div className="relative flex items-start gap-6 pl-14 sm:gap-10 sm:pl-24 group">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-saffron/40 bg-plum-surface shadow-saffron-glow font-mono text-sm font-bold text-gold transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14">
                    {step.number}
                  </div>

                  <div className="flex-1 rounded-2xl border border-plum-border/60 bg-plum-surface/70 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:border-saffron/40">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-xl font-bold text-pearl sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-pearl-dim sm:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
