import Link from 'next/link';
import { Button } from '@/components/user_interface/Button';

export function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 pt-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-bloom-soft blur-3xl animate-float-slow" />
        <div
          className="absolute -right-32 bottom-10 h-[28rem] w-[28rem] rounded-full bg-bloom-soft blur-3xl animate-float-slow"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-mehendi/10 blur-3xl animate-float-slow"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="w-full max-w-xl text-center">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">
          Built for how India actually dates
        </p>

        <h1 className="font-display text-[2.75rem] leading-[1.1] text-cream sm:text-6xl">
          Meet someone worth the <em className="font-normal italic text-marigold">chai break</em>.
        </h1>

        <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-cream-dim">
          Verified profiles, real conversations, and matches ranked by compatibility — not just photos.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button variant="primary" className="w-full sm:w-auto">
              Create your profile
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">I already have an account</Button>
          </Link>
        </div>

        <p className="mt-14 font-mono text-[11px] uppercase tracking-[0.15em] text-cream-dim/70">
          Scroll to see how it works ↓
        </p>
      </div>
    </section>
  );
}
