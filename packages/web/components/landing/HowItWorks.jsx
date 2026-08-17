import { ScrollReveal } from '@/components/ScrollReveal';

const STEPS = [
  {
    number: '01',
    title: 'Verify',
    description: 'A live selfie, matched against your photos in seconds — so who you meet is who you actually see.',
  },
  {
    number: '02',
    title: 'Discover',
    description: "A feed ranked by compatibility, not just who's nearby or who swiped first.",
  },
  {
    number: '03',
    title: 'Connect',
    description: "Real-time conversation, with a suggested opener if you're not sure where to start.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">How it works</p>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Three steps, no guesswork.</h2>
        </ScrollReveal>

        <div className="relative mt-16">
          <div className="absolute bottom-4 left-6 top-4 w-px bg-gradient-to-b from-marigold/60 via-sindoor/40 to-transparent sm:left-8" />

          <div className="flex flex-col gap-14">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 100}>
                <div className="relative flex gap-6 pl-16 sm:gap-8 sm:pl-20">
                  <span className="absolute left-0 font-mono text-[13px] text-marigold sm:text-[14px]">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl text-cream">{step.title}</h3>
                    <p className="mt-2 max-w-md text-[15px] leading-relaxed text-cream-dim">{step.description}</p>
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
