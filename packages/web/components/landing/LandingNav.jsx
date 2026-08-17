import Link from 'next/link';

export function LandingNav() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
      <span className="font-display text-xl text-cream">Melodis</span>
      <Link href="/login" className="font-mono text-[12px] uppercase tracking-wide text-cream-dim hover:text-cream">
        Log in
      </Link>
    </header>
  );
}
