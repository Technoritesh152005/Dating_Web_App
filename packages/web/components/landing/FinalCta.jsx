import Link from 'next/link';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/Button';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-cream/8 px-6 py-28 text-center sm:px-10">
      <div aria-hidden="true" className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[32rem] w-[32rem] rounded-full bg-bloom-soft blur-3xl" />
      </div>

      <ScrollReveal>
        <h2 className="mx-auto max-w-md font-display text-3xl text-cream sm:text-4xl">
          Your evenings are about to get better.
        </h2>
        <div className="mt-8">
          <Link href="/signup">
            <Button variant="primary" showBloom>
              Create your profile
            </Button>
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
