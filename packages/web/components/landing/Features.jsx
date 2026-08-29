'use client';

import { useState } from 'react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { ShieldIcon, SparklesIcon, LocationIcon } from '@/components/user_interface/Icons';

const SIMULATOR_INTERESTS = [
  'Filter Coffee',
  'Late Night Drives',
  'Kathak & Dance',
  'Goa Roadtrips',
  'Street Food',
  'Stand-up Comedy',
];

const ICEBREAKER_OUTPUTS = {
  'Filter Coffee+Late Night Drives': 'So... late night drives paired with South Indian filter coffee: culinary genius or sheer chaotic vibe?',
  'Kathak & Dance+Goa Roadtrips': 'Imagine listening to great tunes while planning a roadtrip. Are we booking the car yet?',
  'Street Food+Stand-up Comedy': 'I will judge you strictly by your favorite food spot and your worst joke. Deal?',
};

export function Features() {
  const [selectedTags, setSelectedTags] = useState(['Filter Coffee', 'Late Night Drives']);
  const [generatedIcebreaker, setGeneratedIcebreaker] = useState(
    'So... late night drives paired with South Indian filter coffee: culinary genius or sheer chaotic vibe?'
  );

  const [locationShared, setLocationShared] = useState(true);

  const toggleInterestTag = (tag) => {
    let nextTags = [...selectedTags];
    if (nextTags.includes(tag)) {
      if (nextTags.length > 1) nextTags = nextTags.filter((t) => t !== tag);
    } else {
      if (nextTags.length >= 2) nextTags.shift();
      nextTags.push(tag);
    }
    setSelectedTags(nextTags);

    const key = `${nextTags[0]}+${nextTags[1]}`;
    const keyAlt = `${nextTags[1]}+${nextTags[0]}`;
    if (ICEBREAKER_OUTPUTS[key]) {
      setGeneratedIcebreaker(ICEBREAKER_OUTPUTS[key]);
    } else if (ICEBREAKER_OUTPUTS[keyAlt]) {
      setGeneratedIcebreaker(ICEBREAKER_OUTPUTS[keyAlt]);
    } else {
      setGeneratedIcebreaker(
        `AI Icebreaker: "I noticed you love ${nextTags[0]} and ${nextTags[1]}. Are we planning our first date around both or picking a winner?"`
      );
    }
  };

  return (
    <section id="features" className="relative px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto">
          <ScrollReveal>
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-saffron">
              Dating Safety & Core Capabilities
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-pearl sm:text-5xl">
              Designed for safety, intelligence, and <span className="text-gold font-normal">real-time chemistry</span>.
            </h2>
            <p className="mt-4 text-base text-pearl-dim sm:text-lg">
              Smart selfie verification, instant conversation starters, live location date safety, and real-time safe chat.
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {/* FEATURE 1 */}
          <ScrollReveal delay={100}>
            <div className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-saffron/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/20 text-saffron font-bold">
                  <ShieldIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">Identity Verification</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">AI Selfie Verification</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                Automated selfie verification matches profile photos against live captures, ensuring authentic user identities across the platform.
              </p>

              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 rounded-full bg-saffron animate-pulse" />
                    <span className="font-mono text-xs font-semibold text-pearl">Status: VERIFIED_IDENTITY</span>
                  </div>
                  <span className="font-mono text-[11px] text-saffron font-bold border border-saffron/40 bg-saffron/10 px-2.5 py-0.5 rounded-full">
                    Authentic Match
                  </span>
                </div>
                <div className="mt-3 text-xs font-mono text-pearl-dim bg-plum-surface/80 p-3 rounded-xl border border-plum-border/40">
                  Selfie Match Verified • Trusted Profile Badge Active
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* FEATURE 2 */}
          <ScrollReveal delay={200}>
            <div className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-saffron/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/20 text-saffron font-bold">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">AI Match Intelligence</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">Automated Icebreaker Generator</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                Upon mutual match, shared bio interests are analyzed to generate customized, fun conversation openers to spark conversation.
              </p>

              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-pearl-muted mb-2.5">
                  Select 2 Profile Keywords:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SIMULATOR_INTERESTS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleInterestTag(tag)}
                        className={`rounded-full px-3 py-1.5 font-mono text-xs transition-all ${
                          isSelected
                            ? 'bg-saffron text-pearl shadow-saffron-glow font-bold scale-105'
                            : 'bg-plum-surface border border-plum-border text-pearl-dim hover:text-pearl'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-plum-border/40">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-gold font-bold mb-1.5 flex items-center gap-1.5">
                    <span>AI Icebreaker Output:</span>
                  </p>
                  <p className="font-sans text-sm text-pearl bg-plum-surface/80 p-3 rounded-xl border border-gold/30">
                    "{generatedIcebreaker}"
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* FEATURE 3 */}
          <ScrollReveal delay={300}>
            <div id="safety" className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-gold/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold font-bold">
                  <LocationIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold">Safety & Security</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">Live Location Date Safety Link</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                Generate a temporary private link for emergency contacts during dates. Location tracking automatically purges when the date finishes.
              </p>

              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className={`absolute inline-flex h-full w-full rounded-full ${locationShared ? 'bg-gold animate-ping' : 'bg-pearl-muted'}`} />
                      <span className={`relative inline-flex h-3 w-3 rounded-full ${locationShared ? 'bg-gold' : 'bg-pearl-muted'}`} />
                    </span>
                    <span className="font-mono text-xs font-semibold text-pearl">
                      {locationShared ? 'Safety Session Active' : 'Session Terminated'}
                    </span>
                  </div>
                  <button
                    onClick={() => setLocationShared(!locationShared)}
                    className="rounded-full bg-plum-surface px-3 py-1 font-mono text-[11px] text-gold border border-gold/40 hover:bg-gold/10 transition-colors"
                  >
                    {locationShared ? 'End Session' : 'Start Session'}
                  </button>
                </div>

                <div className="mt-4 rounded-xl bg-plum-surface/90 p-3.5 border border-plum-border/50">
                  <div className="flex items-center justify-between text-xs text-pearl-dim font-mono">
                    <span>Emergency Contact: Active</span>
                    <span className="text-gold font-bold">Auto-Purge: 2h 30m</span>
                  </div>
                  <div className="mt-2 text-xs text-pearl-muted truncate font-mono">
                    https://melodis.in/location?token=9f82a1c0d4...
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* FEATURE 4 */}
          <ScrollReveal delay={400}>
            <div className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-saffron/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/20 text-saffron font-bold">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">Realtime Chat</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">Real-Time Messaging & Voice Bios</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                Enjoy instant messaging, typing indicators, read receipts, and voice introductions for authentic conversation before meeting up.
              </p>

              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <div className="flex items-center justify-between pb-2 border-b border-plum-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-saffron" />
                    <span className="font-mono text-xs font-bold text-pearl">Chat Status: Online</span>
                  </div>
                  <span className="font-mono text-[10px] text-pearl-muted">Instant Sync</span>
                </div>
                <div className="mt-3 flex flex-col gap-2 font-sans text-xs">
                  <div className="self-start bg-plum-surface p-2.5 rounded-xl text-pearl-dim max-w-[80%] border border-plum-border/50">
                    Hey! Loved your bio about filter coffee and road trips!
                  </div>
                  <div className="self-end bg-saffron-gradient p-2.5 rounded-xl text-pearl font-semibold max-w-[80%] shadow-saffron-glow">
                    Haha thanks! Best coffee spot in town on me?
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
