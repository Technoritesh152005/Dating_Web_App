'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldIcon } from '@/components/user_interface/Icons';

const LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/explore', label: 'Explore' },
  { href: '/matches', label: 'Matches' },
  { href: '/profile', label: 'Profile' },
  { href: '/search', label: 'Search' },
];

export function NavBar({ onOpenLocationShare }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-plum-border/50 bg-plum-night/90 px-6 py-3.5 backdrop-blur-xl transition-all sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left Brand Logo */}
        <Link href="/discover" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-gradient text-pearl font-bold font-display text-lg shadow-saffron-glow transition-transform group-hover:scale-105">
            M
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-pearl">
            Melodis<span className="text-saffron">.</span>
          </span>
        </Link>

        {/* Center Navigation Pills */}
        <nav className="flex items-center gap-1 rounded-full border border-plum-border/60 bg-plum-surface/80 p-1 shadow-inner backdrop-blur-md">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
                  active
                    ? 'bg-saffron-gradient text-pearl font-bold shadow-saffron-glow'
                    : 'text-pearl-dim hover:text-pearl hover:bg-plum-night/50'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Safety Shortcut Button */}
        <div className="flex items-center gap-3">
          {onOpenLocationShare && (
            <button
              onClick={onOpenLocationShare}
              className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-gold shadow-gold-glow transition-all hover:bg-gold/20 hover:scale-105"
            >
              <ShieldIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Location Safety</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
