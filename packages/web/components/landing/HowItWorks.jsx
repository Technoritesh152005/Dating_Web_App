'use client';

import { ScrollReveal } from '@/components/ScrollReveal';

const JOURNEY_STEPS = [
  {
    number: '01',
    label: 'Verify',
    title: 'Confirm it’s really you',
    description:
      'Take a quick live selfie when you join. It is matched against your profile photos so everyone starts from real trust.',
  },
  {
    number: '02',
    label: 'Choose',
    title: 'Set your pace',
    description:
      'Pick what you are genuinely looking for—long-term, serious, casual, or coffee—and hear voice intros before you swipe.',
  },
  {
    number: '03',
    label: 'Connect',
    title: 'Skip the awkward opener',
    description:
      'Once you match, jump straight into real-time chat with thoughtful prompts tailored to the interests you share.',
  },
  {
    number: '04',
    label: 'Meet',
    title: 'Go out with peace of mind',
    description:
      'Tap once to share an expiring live location link with a trusted friend or sibling before heading to your first date.',
  },
];

export function HowItWorks() {
  return (
    <section id="journey" className="border-t border-sand bg-linen px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-taupe">
              Your journey
            </p>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.12] tracking-[-0.02em] text-espresso sm:text-5xl">
              Four calm steps from{' '}
              <span className="italic text-rosewood">first hello</span> to first date.
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-10 border-t border-sand pt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {JOURNEY_STEPS.map((step, idx) => (
            <ScrollReveal key={step.number} delay={idx * 70}>
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-sand pb-4">
                    <span className="font-mono text-xs font-medium text-rosewood">
                      {step.number}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-taupe">
                      {step.label}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-espresso">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-taupe">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
