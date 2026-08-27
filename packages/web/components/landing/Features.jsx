'use client';

import { useState } from 'react';
import { ScrollReveal } from '@/components/ScrollReveal';

// Interest tags for AI Icebreaker Simulator
const SIMULATOR_INTERESTS = [
  'Filter Coffee ☕',
  'Late Night Maggi 🍜',
  'Kathak & Techno 💃',
  'Goa Roadtrips 🚗',
  'Delhi Momos 🥟',
  'Stand-up Comedy 🎙️',
];

const ICEBREAKER_OUTPUTS = {
  'Filter Coffee ☕+Late Night Maggi 🍜': 'So... 2 AM Maggi paired with South Indian filter coffee: culinary genius or sheer chaotic vibe?',
  'Kathak & Techno 💃+Goa Roadtrips 🚗': 'Imagine blasting techno while practicing Kathak mudras on the road to Goa. Are we booking the car yet?',
  'Delhi Momos 🥟+Stand-up Comedy 🎙️': 'I will judge you strictly by your favorite momo chutney and your worst joke. Deal?',
};

export function Features() {
  // AI Icebreaker Simulator State
  const [selectedTags, setSelectedTags] = useState(['Filter Coffee ☕', 'Late Night Maggi 🍜']);
  const [generatedIcebreaker, setGeneratedIcebreaker] = useState(
    'So... 2 AM Maggi paired with South Indian filter coffee: culinary genius or sheer chaotic vibe?'
  );

  // Date Safe Simulator State
  const [locationShared, setLocationShared] = useState(true);

  // Audio Prompt State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Cultural Vibe Tags State
  const [activeFilter, setActiveFilter] = useState('Veg / Foodie');

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
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <ScrollReveal>
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-saffron">
              Engineered for Real Desi Dating
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-pearl sm:text-5xl">
              Dating features built for how you <span className="text-gold italic font-normal">actually</span> connect.
            </h2>
            <p className="mt-4 text-base text-pearl-dim sm:text-lg">
              No dry silences, no sketchy profiles, and zero awkward family rishta interrogations.
            </p>
          </ScrollReveal>
        </div>

        {/* Feature Grid with Interactive Live Widgets */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {/* FEATURE 1: AI Icebreaker Generator */}
          <ScrollReveal delay={100}>
            <div className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-saffron/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/20 text-saffron font-bold text-lg">
                  🤖
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">AI Match Assistant</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">Goodbye to Dry "Hey"</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                When you match, our AI analyzes shared bio vibes and instantly suggests hilarious, personalized openers. Try it live:
              </p>

              {/* Live Interactive Simulator */}
              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-pearl-muted mb-2.5">
                  Step 1: Pick 2 vibe tags below
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

                <div className="mt-5 pt-4 border-t border-plum-border/40">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-gold font-bold mb-1.5 flex items-center gap-1.5">
                    <span>⚡ AI Generated Icebreaker Output:</span>
                  </p>
                  <p className="font-sans text-sm italic text-pearl bg-plum-surface/80 p-3 rounded-xl border border-gold/30 shadow-inner">
                    "{generatedIcebreaker}"
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* FEATURE 2: 1-Click Date-Safe Live Location */}
          <ScrollReveal delay={200}>
            <div id="safety" className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-gold/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold font-bold text-lg">
                  🛡️
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold">Safety & Peace of Mind</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">Date Safe, Party Free</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                Heading out for a first date? Share an encrypted, time-boxed live location token link with your bestie or roommate — <em className="text-pearl font-normal">no app download required for them</em>.
              </p>

              {/* Live Interactive Location Widget */}
              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className={`absolute inline-flex h-full w-full rounded-full ${locationShared ? 'bg-mehendi animate-ping' : 'bg-pearl-muted'}`} />
                      <span className={`relative inline-flex h-3 w-3 rounded-full ${locationShared ? 'bg-mehendi' : 'bg-pearl-muted'}`} />
                    </span>
                    <span className="font-mono text-xs font-semibold text-pearl">
                      {locationShared ? 'Live Location Token Active' : 'Location Share Paused'}
                    </span>
                  </div>
                  <button
                    onClick={() => setLocationShared(!locationShared)}
                    className="rounded-full bg-plum-surface px-3 py-1 font-mono text-[11px] text-gold border border-gold/40 hover:bg-gold/10 transition-colors"
                  >
                    {locationShared ? 'Simulate Stop' : 'Simulate Share'}
                  </button>
                </div>

                <div className="mt-4 rounded-xl bg-plum-surface/90 p-3.5 border border-plum-border/50">
                  <div className="flex items-center justify-between text-xs text-pearl-dim font-mono">
                    <span>Contact: Sneha (Bestie)</span>
                    <span className="text-gold font-bold">Auto-expires in 2h 30m</span>
                  </div>
                  <div className="mt-2 text-xs text-pearl-muted truncate font-mono">
                    🔒 melo.dis/safety?token=9f82a1c0d4e3...
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* FEATURE 3: Cultural Vibe Filters */}
          <ScrollReveal delay={300}>
            <div className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-saffron/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/20 text-saffron font-bold text-lg">
                  🏮
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">Cultural Harmony</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">Your Values, Your Rules</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                Filter by what matters to you without awkward questions. Dietary preferences (Pure Veg/Jain), mother tongue, relocation flex, or opt-in traditional roots.
              </p>

              {/* Interactive Filter Demo */}
              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-pearl-muted mb-3">
                  Sample Opt-In Filter Tags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Veg / Foodie', 'Hindi & Punjabi', 'Tech / Creative', 'Weekend Traveler', 'Jain Food Opt-In'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveFilter(tag)}
                      className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-all ${
                        activeFilter === tag
                          ? 'bg-gold-gradient text-plum-night font-bold shadow-gold-glow scale-105'
                          : 'bg-plum-surface border border-plum-border text-pearl-dim hover:text-pearl'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* FEATURE 4: Audio Vibes & Voice Prompts */}
          <ScrollReveal delay={400}>
            <div className="group relative overflow-hidden rounded-[2.2rem] border border-plum-border bg-plum-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-mehendi/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mehendi/20 text-mehendi font-bold text-lg">
                  🎙️
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-mehendi-light">Voice Prompts</span>
                  <h3 className="font-display text-2xl font-bold text-pearl">Hear the Real Chemistry</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-pearl-dim leading-relaxed">
                Photos lie, voice clips don't. Hear 15-second audio snippets on profiles to catch accent vibes, humor, and natural warmth before swiping.
              </p>

              {/* Interactive Audio Player Mock */}
              <div className="mt-6 rounded-2xl border border-plum-border/60 bg-plum-night/90 p-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron-gradient text-pearl shadow-saffron-glow transition-transform hover:scale-105 active:scale-95"
                  >
                    {isPlayingAudio ? '❚❚' : '▶'}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-mono text-pearl">"My worst date story involving a monkey in Shimla..."</p>
                    {/* Sound Wave Animation */}
                    <div className="mt-2.5 flex items-center gap-1">
                      {[40, 75, 30, 90, 50, 85, 35, 95, 60, 40, 80, 55, 30].map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-300 ${
                            isPlayingAudio ? 'bg-saffron animate-pulse' : 'bg-plum-border'
                          }`}
                          style={{ height: isPlayingAudio ? `${h * 0.3}px` : '8px' }}
                        />
                      ))}
                    </div>
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

