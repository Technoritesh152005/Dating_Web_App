export function Footer() {
  return (
    <footer className="border-t border-plum-border/40 bg-plum-night/90 px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-pearl">
              Melodis<span className="text-saffron font-bold">.</span>
            </span>
            <span className="font-mono text-xs text-pearl-muted">• Made with ♥ for Indian Dating</span>
          </div>

          {/* Center Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 font-mono text-xs text-pearl-dim">
            <a href="#safety" className="hover:text-gold transition-colors">Date Safety Center</a>
            <a href="#features" className="hover:text-saffron transition-colors">AI Icebreakers</a>
            <a href="#how-it-works" className="hover:text-saffron transition-colors">Verification</a>
            <a href="/login" className="hover:text-pearl transition-colors">Account Login</a>
          </div>

          {/* Right Copyright */}
          <p className="font-mono text-xs text-pearl-muted">
            © {new Date().getFullYear()} Melodis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

