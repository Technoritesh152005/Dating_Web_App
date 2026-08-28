import { GithubIcon } from '@/components/user_interface/Icons';

export function Footer() {
  return (
    <footer className="border-t border-plum-border/40 bg-plum-night/90 px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          {/* Left Brand */}
          <div className="flex flex-col items-center gap-1 md:items-start">
            <span className="font-display text-2xl font-bold text-pearl">
              Melodis<span className="text-saffron font-bold">.</span>
            </span>
            <span className="font-mono text-xs text-pearl-muted">
              Authentic Relationships & Intelligent Compatibility
            </span>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap justify-center gap-6 font-mono text-xs text-pearl-dim">
            <a href="#safety" className="hover:text-gold transition-colors">Date Safety Center</a>
            <a href="#features" className="hover:text-saffron transition-colors">AI Icebreakers</a>
            <a href="#how-it-works" className="hover:text-saffron transition-colors">Verification</a>
            <a href="/login" className="hover:text-pearl transition-colors">Account Login</a>
          </div>

          {/* Right Credits & GitHub Link */}
          <div className="flex flex-col items-center gap-2 md:items-end font-mono text-xs">
            <a
              href="https://github.com/Technoritesh152005"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-pearl-dim hover:text-gold transition-colors"
            >
              <GithubIcon className="h-4 w-4" fill="currentColor" />
              <span>https://github.com/Technoritesh152005</span>
            </a>
            <p className="text-pearl-muted font-medium">
              Made by Ritesh Khilari
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
