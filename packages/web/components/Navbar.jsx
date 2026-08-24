'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/explore', label: 'Explore' },
  { href: '/matches', label: 'Matches' },
  { href: '/profile', label: 'Profile' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="flex w-full max-w-sm items-center justify-between">
      <span className="font-display text-xl text-cream">Melodis</span>
      <nav className="flex gap-1 rounded-full border border-cream/10 bg-dusk p-1">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-4 py-1.5 font-mono text-[12px] uppercase tracking-wide transition-colors ${
                active ? 'bg-gradient-to-r from-sindoor to-marigold text-ink' : 'text-cream-dim hover:text-cream'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
