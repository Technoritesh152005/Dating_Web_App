import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { UseCases } from '@/components/landing/UseCases';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FinalCta } from '@/components/landing/FinalCta';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-linen text-espresso selection:bg-rosewood selection:text-linen overflow-x-hidden">
      <LandingNav />
      <Hero />
      <Features />
      <UseCases />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  );
}
