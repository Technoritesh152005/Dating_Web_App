import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { TickerBar } from '@/components/landing/TickerBar';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { Testimonials } from '@/components/landing/Testimonials';
import { FinalCta } from '@/components/landing/FinalCta';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-plum-night text-pearl selection:bg-saffron selection:text-pearl overflow-x-hidden">
      <LandingNav />
      <Hero />
      <TickerBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FinalCta />
      <Footer />
    </main>
  );
}

