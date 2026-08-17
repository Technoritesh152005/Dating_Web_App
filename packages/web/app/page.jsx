import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { FinalCta } from '@/components/landing/FinalCta';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <FinalCta />
      <Footer />
    </>
  );
}
