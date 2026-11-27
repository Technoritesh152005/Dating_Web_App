'use client';

import { useState } from 'react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { ShieldIcon, LocationIcon, UserCheckIcon, SparklesIcon } from '@/components/user_interface/Icons';

const CHECKIN_DURATIONS = ['30 min', '1 hour', '2 hours'];

export function Features() {
  const [selectedDuration, setSelectedDuration] = useState('1 hour');

  return (
    <section id="features" className="border-t border-sand bg-linen px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-taupe">
              Why Melodis feels different
            </p>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.12] tracking-[-0.02em] text-espresso sm:text-5xl">
              Built for real conversations,{' '}
              <span className="italic text-rosewood">safe first dates</span>, and genuine people.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-taupe sm:text-lg">
              Every part of the experience is designed to remove guesswork—from confirming who you are talking to, to getting home safely after you meet.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* Card 1: Face-Recognition Verification */}
          <ScrollReveal delay={60}>
            <article className="flex h-full flex-col justify-between rounded-[20px] border border-sand bg-paper p-8 transition-colors duration-200 hover:border-espresso/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-oat text-espresso">
                    <UserCheckIcon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-taupe">
                    Verified Profiles
                  </span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-espresso">
                  Real people, confirmed by selfie
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-taupe sm:text-[15px]">
                  Before a profile goes live, a quick live selfie is compared against their profile photos. You always know the person you matched with is genuinely the person you will meet.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between rounded-xl border border-sand bg-linen px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-rosewood" />
                  <span className="text-xs font-medium text-espresso">
                    Photo &amp; live selfie matched
                  </span>
                </div>
                <span className="font-mono text-[11px] text-taupe">Verified badge</span>
              </div>
            </article>
          </ScrollReveal>

          {/* Card 2: Chatting, Voice Intros & Natural Openers */}
          <ScrollReveal delay={120}>
            <article className="flex h-full flex-col justify-between rounded-[20px] border border-sand bg-paper p-8 transition-colors duration-200 hover:border-espresso/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-oat text-espresso">
                    <SparklesIcon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-taupe">
                    Messaging &amp; Voice
                  </span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-espresso">
                  Conversations that actually go somewhere
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-taupe sm:text-[15px]">
                  Hear someone’s voice intro before you match, then chat in real time with typing cues, photo sharing, and thoughtful openers inspired by what you both enjoy—plus quiet scam protection in the background.
                </p>
              </div>

              <div className="mt-8 space-y-2 rounded-xl border border-sand bg-linen p-4">
                <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-sm bg-paper px-3.5 py-2 text-xs text-espresso border border-sand">
                  You both love late-night filter coffee—favorite spot in town?
                </div>
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-espresso px-3.5 py-2 text-xs text-linen">
                  The corner roastery on 12th. Friday at 6?
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* Card 3: Live Location Date Safety */}
          <ScrollReveal delay={180}>
            <article className="flex h-full flex-col justify-between rounded-[20px] border border-sand bg-paper p-8 transition-colors duration-200 hover:border-espresso/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-oat text-espresso">
                    <LocationIcon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-taupe">
                    Date Safety
                  </span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-espresso">
                  Share your live date location in one tap
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-taupe sm:text-[15px]">
                  Heading out for a first meet? Send a private, temporary link to a trusted friend or family member—they can check you’re safe with no app needed, and the link clears itself once your date ends.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand bg-linen px-4 py-3">
                <span className="text-xs font-medium text-espresso">Auto-expires in</span>
                <div className="flex items-center gap-1.5">
                  {CHECKIN_DURATIONS.map((duration) => {
                    const active = selectedDuration === duration;
                    return (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setSelectedDuration(duration)}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
                          active
                            ? 'bg-espresso text-linen'
                            : 'bg-paper text-taupe border border-sand hover:text-espresso'
                        }`}
                      >
                        {duration}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* Card 4: Compatibility-First Discovery */}
          <ScrollReveal delay={240}>
            <article className="flex h-full flex-col justify-between rounded-[20px] border border-sand bg-paper p-8 transition-colors duration-200 hover:border-espresso/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-oat text-espresso">
                    <ShieldIcon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-taupe">
                    Smart Matching
                  </span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-espresso">
                  Matched on lifestyle, not just looks
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-taupe sm:text-[15px]">
                  Instead of showing everyone in random order, Melodis looks at your bio, habits, and what you’re seeking—surfacing people who actually fit your rhythm and intentions.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {['Shared interests', 'Aligned intentions', 'Respectful community'].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-sand bg-linen px-3.5 py-1.5 text-xs text-taupe"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </article>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
