'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/ScrollReveal';

export function FinalCta() {
  return (
    <section className="border-t border-sand bg-oat/55 px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <div className="rounded-[24px] border border-sand bg-paper px-8 py-14 text-center sm:px-14 sm:py-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-taupe">
              Live on web · Google Play coming soon
            </p>

            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-normal leading-[1.12] tracking-[-0.02em] text-espresso sm:text-5xl">
              Ready to meet someone worth{' '}
              <span className="italic text-rosewood">showing up for?</span>
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-taupe sm:text-base">
              Create your verified profile in a couple of minutes and start meeting people at your own pace.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 rounded-full bg-espresso px-8 py-3.5 text-sm font-medium text-linen transition-colors duration-200 hover:bg-rosewood"
              >
                <span>Create free profile</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-sand bg-linen px-7 py-3.5 text-sm font-medium text-espresso transition-colors duration-200 hover:border-espresso/40"
              >
                Log in
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
