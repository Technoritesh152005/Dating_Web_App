'use client';

const TICKER_ITEMS = [
  '⚡ 100% Selfie-Verified Profiles',
  '🫖 Zero Rishta Pressure',
  '🤖 AI Icebreakers — No More Dry "Hey"',
  '🛡️ 1-Click Date-Safe Live Share',
  '☕ Chai & Filter Coffee Compatibility',
  '🔒 Encrypted & Screenshot Protected',
  '✨ Vibe Vector Match Score',
  '🥟 Late Night Maggi & Momo Debates',
];

export function TickerBar() {
  return (
    <div className="relative w-full overflow-hidden border-y border-plum-border/40 bg-plum-night/60 py-4 backdrop-blur-md">
      <div className="flex w-[200%] animate-infinite-ticker">
        {/* First Loop */}
        <div className="flex w-1/2 items-center justify-around gap-8">
          {TICKER_ITEMS.map((item, index) => (
            <div
              key={`a-${index}`}
              className="flex items-center gap-3 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-pearl-dim"
            >
              <span className="text-saffron font-bold">•</span>
              <span className="hover:text-gold transition-colors">{item}</span>
            </div>
          ))}
        </div>

        {/* Second Identical Loop for seamless infinite marquee */}
        <div className="flex w-1/2 items-center justify-around gap-8">
          {TICKER_ITEMS.map((item, index) => (
            <div
              key={`b-${index}`}
              className="flex items-center gap-3 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-pearl-dim"
            >
              <span className="text-saffron font-bold">•</span>
              <span className="hover:text-gold transition-colors">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
