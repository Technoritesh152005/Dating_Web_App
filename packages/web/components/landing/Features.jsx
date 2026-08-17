import { ScrollReveal } from '@/components/ScrollReveal';

const FEATURES = [
  {
    title: 'Verified, always',
    description: 'Every profile passes a live selfie check before it ever reaches your feed.',
    accent: 'mehendi',
  },
  {
    title: 'Matches tuned to you',
    description: 'Compatibility reads your bio and interests, not just your filters — this is where the name comes from.',
    accent: 'marigold',
  },
  {
    title: 'Safety, built in',
    description: 'Report, block, or share your live location with someone you trust, right from the conversation.',
    accent: 'sindoor',
  },
  {
    title: 'Real conversations',
    description: "A suggested opener when you're stuck, and read receipts that actually mean something.",
    accent: 'marigold',
  },
];

const ACCENT_CLASSES = {
  mehendi: 'bg-mehendi/15 text-mehendi-light',
  marigold: 'bg-marigold/15 text-marigold',
  sindoor: 'bg-sindoor/15 text-sindoor-light',
};

export function Features() {
  return (
    <section className="border-t border-cream/8 px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">Why Melodis</p>
          <h2 className="mt-3 max-w-md font-display text-3xl text-cream sm:text-4xl">
            The details that make a match worth trusting.
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 80} className={i % 2 === 1 ? 'sm:mt-14' : ''}>
              <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full font-mono text-[13px] ${ACCENT_CLASSES[feature.accent]}`}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="font-display text-xl text-cream">{feature.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-cream-dim">{feature.description}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
