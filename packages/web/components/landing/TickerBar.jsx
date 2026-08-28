'use client';

const HIGHLIGHT_ITEMS = [
  { label: 'Facial Identity Check', tech: 'AWS Rekognition' },
  { label: 'Tokenized Date Safety', tech: 'Live Encryption' },
  { label: 'Icebreaker Pipeline', tech: 'Automated Workers' },
  { label: 'Bio Compatibility', tech: '768-Dim Vector Embeddings' },
  { label: 'Anti-Scam Protection', tech: 'S3 Presigned Media' },
  { label: 'Real-Time Chat Engine', tech: 'WebSockets & Redis' },
];

export function TickerBar() {
  return (
    <div className="relative w-full border-y border-plum-border/40 bg-plum-night/80 py-6 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {HIGHLIGHT_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center rounded-xl border border-plum-border/50 bg-plum-surface/40 p-3.5 text-center transition-all hover:border-gold/40"
            >
              <span className="font-mono text-xs font-bold text-pearl">{item.label}</span>
              <span className="mt-1 font-mono text-[11px] text-gold">{item.tech}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
