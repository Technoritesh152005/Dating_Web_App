import Link from 'next/link';

export function AuthScreen({ eyebrow, title, subtitle, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-plum-night px-6 py-16 text-pearl selection:bg-saffron selection:text-pearl">
      {/* Background Animated Radial Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-10 h-[30rem] w-[30rem] rounded-full bg-saffron/20 blur-[140px] animate-pulse-glow" />
        <div
          className="absolute -right-32 bottom-10 h-[32rem] w-[32rem] rounded-full bg-plum/40 blur-[150px] animate-float-slow"
          style={{ animationDelay: '2.5s' }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Back to Home Link & Brand Badge */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 font-mono text-xs text-pearl-muted transition-colors hover:text-pearl"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-gradient text-pearl font-bold font-display text-xs shadow-saffron-glow">
              M
            </div>
            <span className="font-display text-lg font-bold text-pearl">
              Melodis<span className="text-saffron">.</span>
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8 text-center">
          {eyebrow && (
            <span className="inline-block rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-gold mb-3">
              {eyebrow}
            </span>
          )}
          <h1 className="font-display text-3xl font-bold text-pearl sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-pearl-dim">{subtitle}</p>}
        </div>

        {/* Main Glassmorphic Card Container */}
        <div className="rounded-[2.2rem] border border-plum-border/70 bg-plum-surface/85 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-saffron/40">
          {children}
        </div>
      </div>
    </main>
  );
}

export function Divider({ children }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-plum-border/60" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-pearl-muted">{children}</span>
      <span className="h-px flex-1 bg-plum-border/60" />
    </div>
  );
}

