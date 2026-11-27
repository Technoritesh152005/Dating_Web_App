import Link from 'next/link';
import { GithubIcon } from '@/components/user_interface/Icons';

export function Footer() {
  return (
    <footer className="border-t border-sand bg-linen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          {/* Brand */}
          <div>
            <Link href="/" className="font-display text-2xl font-medium tracking-[-0.03em] text-espresso">
              Melodis<span className="text-rosewood">.</span>
            </Link>
            <p className="mt-1.5 text-xs text-taupe">
              Verified profiles, real conversations, and date safety built in.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer" className="flex flex-wrap gap-6 text-xs text-taupe">
            <a href="#features" className="transition-colors hover:text-espresso">
              Features
            </a>
            <a href="#explore" className="transition-colors hover:text-espresso">
              Explore
            </a>
            <a href="#journey" className="transition-colors hover:text-espresso">
              Journey
            </a>
            <Link href="/login" className="transition-colors hover:text-espresso">
              Log in
            </Link>
            <Link href="/signup" className="transition-colors hover:text-espresso">
              Sign up
            </Link>
          </nav>

          {/* Credits */}
          <div className="flex flex-col gap-1.5 text-xs text-taupe md:items-end">
            <a
              href="https://github.com/Technoritesh152005"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-espresso"
            >
              <GithubIcon className="h-4 w-4" fill="currentColor" />
              <span>github.com/Technoritesh152005</span>
            </a>
            <p className="text-[11px] text-taupe/80">Made by Ritesh Khilari</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
